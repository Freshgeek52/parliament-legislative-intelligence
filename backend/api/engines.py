"""Analysis engines for the four component services.

Every engine is GROUNDED in the real scraped corpus and degrades gracefully:
if the Neural Bridge (LLM) is unavailable it returns an extractive /
rule-based result built purely from retrieval, so the platform never
fabricates ungrounded legal text (NFR-3, and docs/03-architecture.md §4's
"ungrounded output is blocked" constraint).
"""
from __future__ import annotations

import re

from .neural_bridge import BridgeUnavailable, available, chat, chat_json
from .store import Store

# ---------------------------------------------------------------- Assistant


ASSISTANT_SYSTEM = (
    "You are a legislative research assistant for the Parliament of Rwanda. "
    "Answer ONLY from the provided excerpts of Rwandan law. Every factual "
    "claim must be traceable to an excerpt. If the excerpts do not contain "
    "the answer, say so plainly. Be concise and neutral. Do not invent "
    "article numbers or laws. Answer in the same language as the question "
    "(English, French or Kinyarwanda)."
)


def _excerpt(text: str, limit: int = 240) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + " ..."


# Greetings / small talk in the three system languages. A legal-research
# retriever has nothing to cite for "hi", so we answer conversationally
# instead of returning a misleading "no provision found".
GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|good\s*(morning|afternoon|evening)|thanks?|thank you|"
    r"ok|okay|test|bye|"
    r"muraho|mwaramutse|mwiriwe|bite|amakuru|murakoze|"
    r"salut|bonjour|bonsoir|merci|coucou)\b[\s!.?]*$",
    re.IGNORECASE)

GREETING_REPLY = {
    "en": ("Hello. I am the Parliament research assistant. Ask me about any Rwandan "
           "law in force and I will answer with citations to the specific law and "
           "article, sourced from amategeko.gov.rw. For example: "
           "\"What are the obligations when there is a personal data breach?\""),
    "fr": ("Bonjour. Je suis l'assistant de recherche du Parlement. Posez-moi une "
           "question sur une loi rwandaise en vigueur et je repondrai en citant la loi "
           "et l'article precis, a partir de amategeko.gov.rw. Par "
           "exemple : \"Quelles sont les obligations en cas de violation de donnees ?\""),
    "rw": ("Muraho. Ndi umufasha mu bushakashatsi bw'Inteko. Mumbaze ku itegeko iryo "
           "ari ryo ryose rikurikizwa mu Rwanda, nzabasubiza nerekana itegeko n'ingingo "
           "bijyanye, bikomoka kuri amategeko.gov.rw. Urugero: "
           "\"Ni izihe nshingano iyo habaye ihungabana ry'amakuru bwite?\""),
}


def assistant_answer(store: Store, query: str, lang: str = "en",
                     law_ids: set[int] | None = None) -> dict:
    if GREETING_RE.match(query or ""):
        return {
            "text": GREETING_REPLY.get(lang, GREETING_REPLY["en"]),
            "citations": [],
            "grounded": True,
            "model": "assistant",
        }

    hits = store.search(query, k=6, lang=lang, law_ids=law_ids,
                        kinds=("article",)) or store.search(query, k=6, law_ids=law_ids)
    citations = [
        {
            "billId": store.law_frontend_id(h["law_id"]),
            "billTitle": h["law_title"],
            "articleNumber": h["article"] or "—",
            "excerpt": _excerpt(h["text"]),
        }
        for h in hits[:4] if h["kind"] == "article"
    ]

    if not hits:
        no_hit = {
            "en": ("I could not find a matching provision in the indexed Rwandan laws "
                   "in force. Try rephrasing with the legal terms you are looking for "
                   "(for example \"data breach\", \"electronic signature\", "
                   "\"cyber security\"), or widen the knowledge-base selection on the left."),
            "fr": ("Je n'ai pas trouve de disposition correspondante dans les lois "
                   "rwandaises en vigueur indexees. Reformulez avec les termes juridiques "
                   "recherches (par exemple \"violation de donnees\", \"signature "
                   "electronique\", \"cybersecurite\"), ou elargissez la selection a gauche."),
            "rw": ("Sinabashije kubona ingingo ihuye mu mategeko y'u Rwanda akurikizwa "
                   "yanditse. Gerageza guhindura amagambo ukoresheje amagambo y'amategeko "
                   "(urugero \"ihungabana ry'amakuru\", \"umukono w'ikoranabuhanga\", "
                   "\"umutekano w'ikoranabuhanga\"), cyangwa wagure ibyatoranyijwe ibumoso."),
        }
        return {
            "text": no_hit.get(lang, no_hit["en"]),
            "citations": [],
            "grounded": True,
            "model": "retrieval-only",
        }

    if available():
        context = "\n\n".join(
            f"[{i+1}] {h['law_title']} — Article {h['article']}: {_excerpt(h['text'], 600)}"
            for i, h in enumerate(hits[:6])
        )
        user = f"Question: {query}\n\nExcerpts from Rwandan law:\n{context}\n\nAnswer, citing [n]."
        try:
            res = chat(
                [{"role": "system", "content": ASSISTANT_SYSTEM},
                 {"role": "user", "content": user}],
                task="chat", max_tokens=700,
            )
            return {"text": res.text.strip(), "citations": citations,
                    "grounded": True, "model": res.model}
        except BridgeUnavailable:
            pass

    # Extractive fallback: stitch the top passages into a grounded answer.
    top = hits[0]
    lead = {
        "en": "Based on the laws currently in force, the most relevant provision is",
        "fr": "D'après les lois en vigueur, la disposition la plus pertinente est",
        "rw": "Dushingiye ku mategeko akurikizwa, ingingo ijyanye cyane ni",
    }.get(lang, "Based on the laws currently in force, the most relevant provision is")
    body = (f"{lead} Article {top['article']} of {top['law_title']}: "
            f"\"{_excerpt(top['text'], 400)}\"")
    if len(citations) > 1:
        body += ("\n\nRelated provisions were also found in "
                 + "; ".join(f"{c['billTitle']} (Art. {c['articleNumber']})"
                             for c in citations[1:]) + ".")
    return {"text": body, "citations": citations, "grounded": True,
            "model": "retrieval-only (no LLM configured)"}


# --------------------------------------------------------------- Duplication

OVERLAP_BANDS = [
    (0.75, "duplicate", "Near-identical provision already exists in force."),
    (0.55, "overlapping", "Substantial overlap with an existing provision."),
    (0.40, "redundant", "Existing law already covers much of this ground."),
    (0.0, "contradictory", "Related provision exists; check for divergent wording."),
]


def _classify(sim: float) -> tuple[str, str]:
    for thr, kind, note in OVERLAP_BANDS:
        if sim >= thr:
            return kind, note
    return "overlapping", ""


def duplication_for_draft(store: Store, draft: dict, threshold: float = 0.30,
                          per_article: int = 1) -> list[dict]:
    results: list[dict] = []
    counter = 0
    for art in draft["articles"]:
        query = f"{art['heading']} {art['text']}"
        hits = store.search(query, k=25, lang="en", kinds=("article",))
        scored = []
        for h in hits:
            sim = store.cosine(query, f"{h['heading']} {h['text']}")
            if sim >= threshold:
                scored.append((sim, h))
        scored.sort(key=lambda x: -x[0])
        for sim, h in scored[:per_article]:
            counter += 1
            kind, note = _classify(sim)
            results.append({
                "id": f"dup-{draft['id']}-{counter}",
                "draftBillId": draft["id"],
                "draftBillTitle": draft["title"],
                "draftArticleNumber": art["number"],
                "draftArticleHeading": art["heading"],
                "draftArticleText": art["text"],
                "matchedBillId": store.law_frontend_id(h["law_id"]),
                "matchedArticleNumber": h["article"] or "—",
                "matchedLawTitle": h["law_title"],
                "matchedArticleText": h["text"],
                "matchedExcerpt": _excerpt(h["text"], 220),
                "similarity": round(sim * 100),
                "overlapType": kind,
                "summary": (f"Draft Article {art['number']} (\"{art['heading']}\") closely "
                            f"matches Article {h['article']} of \"{h['law_title']}\". {note}"),
            })
    results.sort(key=lambda r: -r["similarity"])
    return results


# ------------------------------------------------------------------- Gaps

GAP_SYSTEM = (
    "You are a legislative quality-assurance reviewer for the Parliament of "
    "Rwanda. Given a draft article and related provisions from laws in force, "
    "identify at most one concrete drafting gap: vague phrasing, missing "
    "coverage, a loophole, or misalignment with existing law. Respond as JSON: "
    '{\"has_issue\": bool, \"severity\": \"critical|moderate|minor\", '
    '\"category\": str, \"title\": str, \"description\": str, \"suggestedFix\": str}. '
    "Only report a real, specific issue; otherwise has_issue=false."
)

VAGUE_TERMS = re.compile(
    r"\b(appropriate|reasonable|as soon as possible|without undue delay|"
    r"adequate|sufficient|from time to time|as necessary|relevant authority|"
    r"may|where feasible|as applicable|other measures)\b", re.IGNORECASE)


def _rule_based_gap(store: Store, draft: dict, art: dict) -> dict | None:
    text = art["text"]
    vague = VAGUE_TERMS.findall(text)
    defines = re.search(r"\b(shall|must)\b", text, re.IGNORECASE)
    if vague:
        term = vague[0]
        return {
            "severity": "moderate",
            "category": "Vague Phrasing",
            "title": f"Undefined discretionary term “{term}”",
            "description": (f"Article {art['number']} relies on the open-ended term "
                            f"“{term}” without an objective standard, leaving its "
                            "application to interpretation."),
            "suggestedFix": (f"Define “{term}” or replace it with a measurable "
                             "criterion (a time limit, threshold, or named authority)."),
        }
    if not defines and len(text) > 0:
        return {
            "severity": "minor",
            "category": "Missing Coverage",
            "title": "No binding obligation stated",
            "description": (f"Article {art['number']} describes a matter but sets no clear "
                            "obligation (“shall”/“must”), which may weaken "
                            "enforceability."),
            "suggestedFix": "State explicitly who is bound and what action is required.",
        }
    return None


def gaps_for_draft(store: Store, draft: dict) -> dict:
    paragraphs: list[dict] = []
    issues: list[dict] = []
    use_llm = available()
    counter = 0

    # preamble paragraph
    paragraphs.append({"id": f"{draft['id']}-p0",
                       "text": draft.get("summary", draft["title"]), "issueIds": []})

    for art in draft["articles"]:
        pid = f"{draft['id']}-p-{art['number']}"
        para_text = f"Article {art['number']} — {art['heading']}: {art['text']}"
        issue_ids: list[str] = []

        related = store.search(f"{art['heading']} {art['text']}", k=3, lang="en",
                               kinds=("article",))
        issue = None
        if use_llm:
            ctx = "\n".join(f"- {h['law_title']} Art {h['article']}: {_excerpt(h['text'],300)}"
                            for h in related)
            user = (f"Draft Article {art['number']} ({art['heading']}): {art['text']}\n\n"
                    f"Related provisions in force:\n{ctx or '(none found)'}")
            try:
                obj, _ = chat_json(GAP_SYSTEM, user, max_tokens=500)
                if obj.get("has_issue"):
                    issue = obj
            except (BridgeUnavailable, ValueError):
                issue = _rule_based_gap(store, draft, art)
        else:
            issue = _rule_based_gap(store, draft, art)

        if issue:
            counter += 1
            gid = f"gap-{draft['id']}-{counter}"
            issue_ids.append(gid)
            issues.append({
                "id": gid,
                "billId": draft["id"],
                "paragraphId": pid,
                "articleRef": f"Article {art['number']}",
                "severity": issue.get("severity", "minor"),
                "category": issue.get("category", "Drafting"),
                "title": issue.get("title", "Potential issue"),
                "description": issue.get("description", ""),
                "suggestedFix": issue.get("suggestedFix", ""),
                "status": "pending",
            })
        paragraphs.append({"id": pid, "text": para_text, "issueIds": issue_ids})

    return {
        "annotated": {"billId": draft["id"], "paragraphs": paragraphs},
        "issues": issues,
        "model": "llm" if use_llm else "rule-based (no LLM configured)",
    }
