"""Legislative Intelligence API - FastAPI backend for the Parliament platform.

Serves the four component services (Research Assistant, Duplication Detection,
Gap & Intent Alignment, Comparative Legislation) plus bills/laws, knowledge
base, auth and audit - all grounded in the REAL corpus scraped from
amategeko.gov.rw. Response shapes match frontend/lib/types.ts exactly so the
frontend swaps mock imports for fetch() with no shape changes.

Run:  uvicorn api.app:app --reload --port 8000   (from backend/)
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .engines import assistant_answer, duplication_for_draft, gaps_for_draft
from .neural_bridge import MODEL_CHAT, MODEL_TRANSLATE, PROVIDER, available
from .store import get_store

app = FastAPI(title="Parliament Legislative Intelligence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo; restrict to the web app origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA = Path(__file__).resolve().parent.parent / "data"
AUDIT_FILE = DATA / "audit" / "audit_log.jsonl"
COMPARATIVE = json.loads((DATA / "comparative" / "topics.json").read_text(encoding="utf-8"))["topics"]

DEMO_USERS = {
    "mp": {"id": "u-mp", "name": "Hon. A. Uwase", "email": "a.uwase@parliament.gov.rw", "role": "mp"},
    "legal_drafter": {"id": "u-ld", "name": "J. Mugenzi", "email": "j.mugenzi@parliament.gov.rw", "role": "legal_drafter"},
    "research_staff": {"id": "u-rs", "name": "C. Ingabire", "email": "c.ingabire@parliament.gov.rw", "role": "research_staff"},
    "oversight_unit": {"id": "u-ou", "name": "P. Habimana", "email": "p.habimana@parliament.gov.rw", "role": "oversight_unit"},
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ------------------------------------------------------------------ health

@app.get("/api/health")
def health():
    store = get_store()
    return {
        "status": "ok",
        "laws_in_force": len(store.catalog),
        "full_text_laws": len(store.corpus),
        "index_chunks": len(store.chunks),
        "drafts": len(store.drafts),
        "llm": {"provider": PROVIDER, "available": available(),
                "model_chat": MODEL_CHAT, "model_translate": MODEL_TRANSLATE},
    }


# ------------------------------------------------------------------- bills

@app.get("/api/bills")
def list_bills(kind: str | None = None):
    """Drafts (internal) + optionally laws. Default: drafts only, to match the
    frontend's `draftBills` usage cheaply. Use /api/laws for the full corpus."""
    store = get_store()
    drafts = store.drafts
    if kind == "law":
        return {"bills": [store.law_to_bill(l, with_articles=False) for l in store.catalog[:200]]}
    return {"bills": drafts}


@app.get("/api/laws")
def list_laws(q: str | None = None, category: str | None = None,
              limit: int = Query(50, le=500), offset: int = 0):
    store = get_store()
    laws = store.catalog
    if category:
        laws = [l for l in laws if l.get("category") == category]
    if q:
        ql = q.lower()
        laws = [l for l in laws if ql in (l["title"] or "").lower()]
    total = len(laws)
    page = laws[offset:offset + limit]
    return {"total": total, "limit": limit, "offset": offset,
            "laws": [store.law_to_bill(l, with_articles=False) for l in page]}


@app.get("/api/bills/{bill_id}")
def get_bill(bill_id: str, lang: str = "en"):
    store = get_store()
    bill = store.get_bill(bill_id, lang=lang)
    if not bill:
        raise HTTPException(404, f"Bill/law '{bill_id}' not found")
    return bill


# --------------------------------------------------------- knowledge base

@app.get("/api/knowledge-base")
def knowledge_base():
    """KB collections built from the real corpus + drafts."""
    store = get_store()
    laws_docs = [{
        "id": f"kb-law-{l['id']}", "title": l["title"], "type": "law",
        "refId": store.law_frontend_id(l["id"]), "date": l.get("date"),
        "excerpt": l.get("category"),
    } for l in store.catalog[:400]]
    bills_docs = [{
        "id": f"kb-{d['id']}", "title": d["title"], "type": "bill",
        "refId": d["id"], "date": d.get("lastUpdated"), "excerpt": d.get("summary"),
    } for d in store.drafts]
    return {"collections": [
        {"id": "kb-laws", "name": "Laws in force (amategeko.gov.rw)", "documents": laws_docs},
        {"id": "kb-bills", "name": "Draft bills", "documents": bills_docs},
    ]}


# ------------------------------------------------------------- assistant

class ChatRequest(BaseModel):
    message: str
    lang: str = "en"
    lawIds: list[str] | None = None  # frontend law-XXXX ids to scope retrieval


@app.post("/api/assistant/chat")
def assistant_chat(req: ChatRequest):
    store = get_store()
    law_ids = None
    if req.lawIds:
        law_ids = {i for i in (store.parse_frontend_id(x) for x in req.lawIds) if i}
    result = assistant_answer(store, req.message, lang=req.lang, law_ids=law_ids)
    _audit("Research & Drafting Assistant", "query",
           req.message[:80], actor_role="research_staff",
           details=f"model={result['model']}; {len(result['citations'])} citations")
    return {
        "id": f"a-{int(datetime.now().timestamp()*1000)}",
        "role": "assistant",
        "text": result["text"],
        "citations": result["citations"],
        "timestamp": now_iso(),
        "grounded": result["grounded"],
        "model": result["model"],
    }


# ---------------------------------------------------------- duplication

@app.get("/api/duplication/{bill_id}")
def duplication(bill_id: str, threshold: float = 0.30):
    store = get_store()
    draft = store.drafts_by_id.get(bill_id) or store.get_bill(bill_id)
    if not draft:
        raise HTTPException(404, f"Bill '{bill_id}' not found")
    overlaps = duplication_for_draft(store, draft, threshold=threshold)
    _audit("Duplication Detection", "scan", draft["title"][:60],
           actor_role="legal_drafter", details=f"{len(overlaps)} overlaps ≥{int(threshold*100)}%")
    return {"billId": bill_id, "overlaps": overlaps}


# ----------------------------------------------------------------- gaps

@app.get("/api/gaps/{bill_id}")
def gaps(bill_id: str):
    store = get_store()
    draft = store.drafts_by_id.get(bill_id) or store.get_bill(bill_id)
    if not draft:
        raise HTTPException(404, f"Bill '{bill_id}' not found")
    result = gaps_for_draft(store, draft)
    _audit("Gap & Intent Alignment", "analyze", draft["title"][:60],
           actor_role="research_staff",
           details=f"model={result['model']}; {len(result['issues'])} issues")
    return result


# --------------------------------------------------------- comparative

@app.get("/api/comparative")
def comparative_list():
    return {"topics": [{"id": t["id"], "name": t["name"],
                        "relatedBillId": t["relatedBillId"],
                        "description": t["description"]} for t in COMPARATIVE]}


@app.get("/api/comparative/{topic_id}")
def comparative_topic(topic_id: str):
    topic = next((t for t in COMPARATIVE if t["id"] == topic_id), None)
    if not topic:
        raise HTTPException(404, f"Topic '{topic_id}' not found")
    return topic


# ----------------------------------------------------------------- auth

class LoginRequest(BaseModel):
    role: str


@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = DEMO_USERS.get(req.role)
    if not user:
        raise HTTPException(400, f"Unknown role '{req.role}'")
    _audit("Authentication", "login", user["name"], actor_role=req.role)
    return {"user": user, "token": f"demo-{req.role}"}


# ---------------------------------------------------------------- audit

def _audit(module: str, action: str, target: str, actor_role: str = "research_staff",
           details: str = "") -> None:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "id": f"a-{int(datetime.now().timestamp()*1000)}-{action}",
        "timestamp": now_iso(),
        "actorName": DEMO_USERS.get(actor_role, {}).get("name", "System"),
        "actorRole": actor_role,
        "module": module, "action": action, "target": target, "details": details,
    }
    with AUDIT_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


@app.get("/api/audit")
def audit_log(limit: int = 100):
    if not AUDIT_FILE.exists():
        return {"entries": []}
    lines = AUDIT_FILE.read_text(encoding="utf-8").splitlines()
    entries = [json.loads(l) for l in lines if l.strip()]
    entries.reverse()
    return {"entries": entries[:limit]}


class AuditPost(BaseModel):
    module: str
    action: str
    target: str
    actorRole: str = "research_staff"
    details: str = ""


@app.post("/api/audit")
def audit_post(req: AuditPost):
    _audit(req.module, req.action, req.target, actor_role=req.actorRole, details=req.details)
    return {"ok": True}
