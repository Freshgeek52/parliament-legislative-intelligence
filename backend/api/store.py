"""In-memory data store for the Legislative Intelligence API.

Loads at startup:
  * catalog  - all 1,479 laws in force (metadata scraped from amategeko.gov.rw)
  * corpus   - full trilingual text + articles for the extracted subset
  * index    - BM25 inverted index over article-level chunks (build_index.py)
  * drafts   - internal draft bills (workflow inputs, not public documents)

Retrieval is BM25 (lexical). The interface (Store.search) is deliberately
provider-agnostic so a vector index can be added behind it later without
touching route code -- see docs/08-model-selection.md.
"""
from __future__ import annotations

import json
import math
import re
import unicodedata
from collections import Counter
from functools import lru_cache
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

TOKEN_RE = re.compile(r"[\w']+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", text.lower())
    return [t for t in TOKEN_RE.findall(text) if len(t) > 1 and not t.isdigit()]


class Store:
    def __init__(self) -> None:
        self.catalog: list[dict] = json.loads(
            (DATA / "catalog" / "laws_in_force.json").read_text(encoding="utf-8")
        )
        self.catalog_by_id = {l["id"]: l for l in self.catalog}

        self.corpus: dict[int, dict] = {}
        corpus_dir = DATA / "corpus"
        if corpus_dir.exists():
            for p in corpus_dir.glob("*.json"):
                doc = json.loads(p.read_text(encoding="utf-8"))
                self.corpus[doc["id"]] = doc

        idx_dir = DATA / "index"
        self.chunks: list[dict] = []
        self.bm25: dict = {}
        if (idx_dir / "chunks.json").exists():
            self.chunks = json.loads((idx_dir / "chunks.json").read_text(encoding="utf-8"))
            self.bm25 = json.loads((idx_dir / "bm25.json").read_text(encoding="utf-8"))

        drafts_file = DATA / "drafts" / "drafts.json"
        self.drafts: list[dict] = json.loads(drafts_file.read_text(encoding="utf-8"))["drafts"]
        self.drafts_by_id = {d["id"]: d for d in self.drafts}

    # ---------- law <-> Bill mapping ----------

    @staticmethod
    def law_frontend_id(law_id: int) -> str:
        return f"law-{law_id}"

    @staticmethod
    def parse_frontend_id(fid: str) -> int | None:
        m = re.fullmatch(r"law-(\d+)", fid)
        return int(m.group(1)) if m else None

    def law_to_bill(self, law: dict, lang: str = "en", with_articles: bool = True) -> dict:
        """Map a scraped law to the frontend Bill shape."""
        doc = self.corpus.get(law["id"])
        articles = []
        summary = law.get("category") or ""
        if doc and with_articles:
            stream = doc["languages"].get(lang) or doc["languages"].get("en") \
                or next(iter(doc["languages"].values()), None)
            if stream:
                articles = [
                    {
                        "id": f"law-{law['id']}-{a['number']}",
                        "number": a["number"],
                        "heading": a["heading"],
                        "text": a["text"],
                    }
                    for a in stream["articles"]
                ]
        parts = [p for p in (law.get("category"), law.get("sub_category"),
                             f"{len(articles)} articles extracted" if articles else "metadata only") if p]
        summary = " · ".join(parts)
        return {
            "id": self.law_frontend_id(law["id"]),
            "title": law["title"],
            "kind": "law",
            "status": "enacted",
            "committee": law.get("institution"),
            "sponsor": None,
            "lastUpdated": law.get("date") or "",
            "summary": summary,
            "articles": articles,
            "sourceUrl": law.get("source_url"),
            "languages": law.get("languages", []),
            "hasFullText": law["id"] in self.corpus,
        }

    def get_bill(self, fid: str, lang: str = "en") -> dict | None:
        if fid in self.drafts_by_id:
            return self.drafts_by_id[fid]
        law_id = self.parse_frontend_id(fid)
        if law_id and law_id in self.catalog_by_id:
            return self.law_to_bill(self.catalog_by_id[law_id], lang=lang)
        return None

    # ---------- BM25 search ----------

    def search(self, query: str, k: int = 8, lang: str | None = None,
               law_ids: set[int] | None = None, kinds: tuple[str, ...] = ("article", "title")) -> list[dict]:
        if not self.bm25:
            return []
        idf = self.bm25["idf"]
        postings = self.bm25["postings"]
        doc_len = self.bm25["doc_len"]
        avgdl = self.bm25["avgdl"] or 1.0
        k1, b = 1.5, 0.75

        scores: Counter = Counter()
        for term in set(tokenize(query)):
            if term not in postings:
                continue
            w = idf.get(term, 0.0)
            for chunk_idx, tf in postings[term]:
                dl = doc_len[chunk_idx]
                scores[chunk_idx] += w * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / avgdl))

        results = []
        for idx, score in scores.most_common(k * 8):
            ch = self.chunks[idx]
            if ch["kind"] not in kinds:
                continue
            if lang and ch["lang"] != lang and ch["kind"] == "article":
                continue
            if law_ids is not None and ch["law_id"] not in law_ids:
                continue
            results.append({**ch, "score": round(score, 3)})
            if len(results) >= k:
                break
        return results

    # ---------- TF-IDF cosine similarity (duplication detection) ----------

    @lru_cache(maxsize=4096)
    def _tfidf_vec(self, text: str) -> dict[str, float]:
        idf = self.bm25.get("idf", {})
        tf = Counter(tokenize(text))
        vec = {t: (1 + math.log(c)) * idf.get(t, 0.0) for t, c in tf.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {t: v / norm for t, v in vec.items()}

    def cosine(self, a: str, b: str) -> float:
        va, vb = self._tfidf_vec(a), self._tfidf_vec(b)
        if len(vb) < len(va):
            va, vb = vb, va
        return sum(v * vb.get(t, 0.0) for t, v in va.items())


_store: Store | None = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store
