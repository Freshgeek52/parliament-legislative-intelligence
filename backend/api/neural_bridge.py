"""Neural Bridge - the model-inference abstraction layer.

docs/03-architecture.md §7 requires all LLM calls to go through a shared
abstraction ("Neural Bridge") with self-hostable model options and no vendor
lock-in. This module implements that seam.

Model selection is driven by the fair-forward/languagebench evaluation
(https://huggingface.co/spaces/fair-forward/languagebench) restricted to
OPEN-SOURCE models on the three system languages (rw / en / fr).
Full rationale: docs/08-model-selection.md. Summary of the defaults:

  MODEL_CHAT      google/gemma-3-27b-it (self-host: ollama gemma3:27b)
                  -> upgrade to google/gemma-4-31b-it where available:
                  #1 open-source model on Kinyarwanda overall (0.690),
                  best rw->en translation, top MMLU/ARC in rw, Apache-2.0.
  MODEL_TRANSLATE deepseek/deepseek-v4-flash
                  -> best open-source en->rw translation (BLEU-proxy 0.357),
                  MIT license. Used only for the translation task.

Providers (env NEURAL_BRIDGE_PROVIDER):
  openrouter - hosted inference of the SAME open-source checkpoints (fastest
               path to a working demo; models remain swappable/self-hostable)
  ollama     - fully local/self-hosted inference (data-sovereign deployment)
  none       - no LLM configured: callers fall back to extractive,
               retrieval-only answers (grounded, no generation)
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass

import requests

PROVIDER = os.getenv("NEURAL_BRIDGE_PROVIDER", "none").lower()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")

MODEL_CHAT = os.getenv("MODEL_CHAT", "google/gemma-3-27b-it")
MODEL_TRANSLATE = os.getenv("MODEL_TRANSLATE", "deepseek/deepseek-v4-flash")
OLLAMA_MODEL_CHAT = os.getenv("OLLAMA_MODEL_CHAT", "gemma3:27b")

TIMEOUT = int(os.getenv("LLM_TIMEOUT_S", "120"))


@dataclass
class BridgeResult:
    text: str
    model: str
    provider: str


class BridgeUnavailable(Exception):
    """No LLM provider configured/reachable - caller should use its fallback."""


def available() -> bool:
    if PROVIDER == "openrouter":
        return bool(OPENROUTER_API_KEY)
    if PROVIDER == "ollama":
        try:
            return requests.get(f"{OLLAMA_BASE}/api/tags", timeout=3).ok
        except requests.RequestException:
            return False
    return False


def chat(messages: list[dict], task: str = "chat", temperature: float = 0.2,
         max_tokens: int = 1200) -> BridgeResult:
    """messages: [{role, content}] like the OpenAI chat format."""
    if PROVIDER == "openrouter" and OPENROUTER_API_KEY:
        model = MODEL_TRANSLATE if task == "translate" else MODEL_CHAT
        resp = requests.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        return BridgeResult(
            text=data["choices"][0]["message"]["content"],
            model=model,
            provider="openrouter",
        )

    if PROVIDER == "ollama":
        model = OLLAMA_MODEL_CHAT
        try:
            resp = requests.post(
                f"{OLLAMA_BASE}/api/chat",
                json={"model": model, "messages": messages, "stream": False,
                      "options": {"temperature": temperature, "num_predict": max_tokens}},
                timeout=TIMEOUT,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise BridgeUnavailable(str(exc)) from exc
        return BridgeResult(
            text=resp.json()["message"]["content"],
            model=model,
            provider="ollama",
        )

    raise BridgeUnavailable(f"provider '{PROVIDER}' not configured")


def chat_json(system: str, user: str, task: str = "chat", max_tokens: int = 1600):
    """Chat expecting a JSON object back; tolerant of code fences."""
    res = chat(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        task=task, max_tokens=max_tokens,
    )
    text = res.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text[4:] if text.startswith("json") else text
    start, end = text.find("{"), text.rfind("}")
    if start == -1:
        start, end = text.find("["), text.rfind("]")
    return json.loads(text[start:end + 1]), res
