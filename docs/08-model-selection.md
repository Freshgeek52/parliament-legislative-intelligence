# 08: Model Selection & Rationale

This document explains **which open-source models the platform uses for which
task, and why**, with every choice traced to evidence, so the decision is
auditable rather than a matter of taste. It closes the open question left in
`03-architecture.md §7` ("no vendor, endpoint or model is specified for Neural
Bridge").

## 1. Evidence base

All model scores below come from the **fair-forward / languagebench**
evaluation (https://huggingface.co/spaces/fair-forward/languagebench), pulled
directly from the benchmark's published result files:

| File | What it holds |
|---|---|
| `results/results.json` | 103,994 rows: `(model, language, task, metric, score)` |
| `results/models.json` | 92 models with `type` (open-source / commercial), size, license |
| `results/languages.json` | 677 languages; our three (`rw`, `en`, `fr`) are all `in_benchmark` |

The benchmark scores each model on seven tasks per language:
`translation_from`, `translation_to`, `classification`, `mmlu` (knowledge),
`arc` (reasoning), `truthfulqa`, `mgsm` (math). Kinyarwanda (`rw`) is the
binding constraint, English and French are well served by almost every model,
so the platform's model choice is effectively decided by **Kinyarwanda
performance among open-source models**.

**Method.** I filtered `models.json` to `type == "open-source"` (49 of 92
models), then averaged each model's per-task scores for `rw`, `en` and `fr`.
Ranking open-source models by overall Kinyarwanda score:

| Rank | Model | rw (overall) | en | fr | Size | License |
|---|---|---|---|---|---|---|
| 1 | **google/gemma-4-31b-it** | **0.690** | 0.872 | 0.807 | 33 B | Apache-2.0 |
| 2 | deepseek/deepseek-v4-flash | 0.672 | 0.858 | 0.843 | 158 B | MIT |
| 3 | openai/gpt-oss-120b | 0.620 | 0.706 | 0.772 | 120 B | Apache-2.0 |
| 4 | deepseek/deepseek-chat-v3.1 | 0.606 | 0.853 | 0.810 | 685 B | MIT |
| 5 | **google/gemma-3-27b-it** | 0.584 | 0.687 | 0.807 | 27 B | Gemma |
| … | qwen3-next-80b | 0.393 | 0.857 | 0.809 | 81 B | Apache-2.0 |
| … | mistral-small-3.2-24b | 0.377 | 0.825 | 0.785 | 24 B | Apache-2.0 |
| … | llama-3.3-70b-instruct | 0.415 | 0.739 | 0.706 | 71 B | Llama-3.3 |

The gap is decisive: the **Gemma family and DeepSeek** are in a different
class on Kinyarwanda than the more familiar Llama / Qwen / Mistral models,
which score 0.38–0.42 despite strong English. This is the single most
important finding, picking a model on its English reputation (Llama, Mistral)
would roughly **halve** Kinyarwanda quality.

## 2. Decisions (task → model)

The requirement explicitly permits **different models for different tasks**.
Two tasks in this system have different failure profiles, so they get
different models.

### 2.1 General assistant, gap analysis, summarisation → **Gemma 3 27B → Gemma 4 31B**

- **Env:** `MODEL_CHAT` (default `google/gemma-3-27b-it`; set to
  `google/gemma-4-31b-it` where available).
- **Why:** These tasks require *understanding* Kinyarwanda/French/English
  legal text and *reasoning* over it (knowledge + reasoning + comprehension),
  not primarily translation. Gemma leads exactly those Kinyarwanda sub-scores:

  | rw task | Gemma-4-31B | Gemma-3-27B | best non-Gemma open-source |
  |---|---|---|---|
  | MMLU (knowledge) | **1.00** | 0.80 | 1.00 (deepseek-chat) |
  | ARC (reasoning) | **1.00** | 0.90 | 0.90 (deepseek-v4) |
  | classification | 1.00 | **1.00** | 1.00 (several) |
  | mgsm (math) | **0.667** | - | 0.667 (deepseek-v4) |

- **Why not the bigger models?** DeepSeek-v4-flash (158 B) and gpt-oss-120b
  (120 B) score marginally lower on rw overall AND are 4–5× the parameter
  count. For a **self-hostable, data-sovereign** deployment (NFR-1, §8's
  on-prem requirement) a **27–33 B** model that runs on a single modern GPU is
  the difference between "deployable inside Parliament" and "not." Gemma wins
  quality *and* deployability.
- **Why Gemma 3 as the default, Gemma 4 as the upgrade:** Gemma-4-31B is the
  #1 model but is newer and less universally hosted; Gemma-3-27B is the
  proven, widely-available checkpoint (`ollama pull gemma3:27b`) that is still
  **rank 5 overall and tied #1 on rw classification**. The Neural Bridge lets
  us swap one env var (`MODEL_CHAT`) the day Gemma-4 is available on the chosen
  host, no code change. License matters too: **Gemma-4 is Apache-2.0**, the
  cleanest license for government use.

### 2.2 Translation (Kinyarwanda ⇄ EN/FR NLP layer, §6) → **DeepSeek-v4-flash**

- **Env:** `MODEL_TRANSLATE` (default `deepseek/deepseek-v4-flash`).
- **Why a *different* model here:** translation is scored separately and the
  ranking changes. For **English/French → Kinyarwanda** (`translation_to`,
  the hard direction, and the one the trilingual UI needs to render Kinyarwanda
  for Kinyarwanda-first users), DeepSeek-v4-flash is **#1 among open-source
  models (0.357)**, ahead of gpt-oss-120b (0.345) and Gemma-3 (0.306):

  | direction | best open-source | score |
  |---|---|---|
  | rw → en/fr (`translation_from`) | gemma-4-31B | 0.399 |
  | en/fr → rw (`translation_to`) | **deepseek-v4-flash** | **0.357** |

- **Interpretation:** Gemma is the best *reader/reasoner* of Kinyarwanda;
  DeepSeek is the best *writer* of Kinyarwanda. Because the NLP layer's job is
  to **produce** Kinyarwanda output (translate an English law summary into
  Kinyarwanda for display), the writing model wins that task. MIT-licensed and
  mid-sized (158 B, used via a hosted endpoint for translation, where latency
  matters less than the interactive assistant).
- **Honest caveat:** all Kinyarwanda translation scores are low in absolute
  terms (0.30–0.40 on the benchmark's BLEU-family proxy). Kinyarwanda machine
  translation is genuinely hard. This is *why* the architecture keeps citations
  pointing at the **original-language source** and flags machine-translated
  text (`03-architecture.md §6`) rather than trusting translation blindly.

### 2.3 Embeddings / retrieval → **BM25 now, BGE-M3 later**

- The benchmark covers **generation**, not embeddings, so it does not name an
  embedding model. Rather than pick one unevidenced, the retrieval layer today
  is **BM25** (lexical, `api/store.py`), zero-dependency, fully self-hostable,
  and language-agnostic, so it works across all three languages immediately.
- The `Store.search` interface is deliberately provider-agnostic. When an
  embedding model is added, the natural choice is **BAAI/BGE-M3**: it is
  multilingual (100+ languages incl. Kinyarwanda), open (MIT), and designed for
  hybrid lexical+dense retrieval, it slots behind the same interface without
  touching route code. This is the documented next step, not a silent gap.

## 3. Why open-source at all (beyond the requirement)

The requirement asked for open-source; the architecture *needs* it:
`NFR-1` forbids parliamentary data being used to train third-party models, and
`§8` requires an on-prem path with no vendor lock-in. Open-weight models behind
the Neural Bridge abstraction satisfy both, the same Gemma/DeepSeek
checkpoints can run on OpenRouter today (fast demo) and on a Parliament-owned
GPU tomorrow (`ollama`), selected by one env var, with **identical model
behaviour** either way.

## 4. How to configure (Neural Bridge)

`api/neural_bridge.py` reads:

```
NEURAL_BRIDGE_PROVIDER = openrouter | ollama | none
MODEL_CHAT            = google/gemma-3-27b-it      # → gemma-4-31b-it when available
MODEL_TRANSLATE      = deepseek/deepseek-v4-flash
OPENROUTER_API_KEY   = ...        # if provider=openrouter
OLLAMA_MODEL_CHAT    = gemma3:27b # if provider=ollama (self-hosted)
```

With `provider=none` (default, no key required) every engine falls back to a
**grounded, retrieval-only** result, extractive assistant answers, rule-based
gap flags, TF-IDF duplication, so the platform is fully functional and
demonstrable **without any model API**, and only gets *better* (not
*different*) when a model is configured. This directly honours the "ungrounded
output is blocked" constraint: generation is an enhancement layered on top of
retrieval, never a substitute for it.

## 5. Summary table

| Task | Model | Env var | Why this one |
|---|---|---|---|
| Assistant / gaps / summarise | Gemma 3 27B → Gemma 4 31B | `MODEL_CHAT` | #1 open-source on rw knowledge+reasoning; 27–33 B = self-hostable; Apache-2.0 |
| EN/FR → Kinyarwanda translation | DeepSeek-v4-flash | `MODEL_TRANSLATE` | #1 open-source at *writing* Kinyarwanda; MIT |
| Retrieval / embeddings | BM25 → BGE-M3 | - | benchmark doesn't score embeddings; BM25 self-hostable now, BGE-M3 multilingual next |
