"""Build the retrieval index over the extracted legislation corpus.

Index design (deliberately dependency-free and self-hostable, per
docs/03-architecture.md "no vendor-locked APIs"):

 * Chunk = one article of one law in one language (long articles split at
   ~1400 chars on sentence boundaries). Article-level chunking means every
   retrieved chunk is inherently CITABLE: law + article number.
 * Retrieval = BM25 (k1=1.5, b=0.75) over a simple multilingual tokenizer
   (lowercase, unicode word split). BM25 is the lexical baseline; a vector
   index (e.g. BGE-M3 embeddings) can be layered on later behind the same
   search interface -- see docs/08-model-selection.md.
 * Laws whose PDFs were not selected for full-text extraction still get one
   title/metadata chunk each, so /search covers ALL laws in force.

Output: backend/data/index/chunks.json  (list of chunk records)
        backend/data/index/bm25.json    (inverted index + stats)
"""
from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "data"
CORPUS = ROOT / "corpus"
CATALOG = ROOT / "catalog" / "laws_in_force.json"
OUT = ROOT / "index"

MAX_CHUNK = 1400

TOKEN_RE = re.compile(r"[\w']+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", text.lower())
    return [t for t in TOKEN_RE.findall(text) if len(t) > 1 and not t.isdigit()]


def split_long(text: str, limit: int = MAX_CHUNK) -> list[str]:
    if len(text) <= limit:
        return [text]
    parts, cur = [], ""
    for sentence in re.split(r"(?<=[.;:])\s+", text):
        if len(cur) + len(sentence) > limit and cur:
            parts.append(cur.strip())
            cur = sentence
        else:
            cur = f"{cur} {sentence}".strip()
    if cur:
        parts.append(cur.strip())
    return parts


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    chunks: list[dict] = []

    extracted_ids = set()
    for path in sorted(CORPUS.glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        extracted_ids.add(doc["id"])
        for lang, stream in doc.get("languages", {}).items():
            for art in stream.get("articles", []):
                pieces = split_long(art["text"])
                for pi, piece in enumerate(pieces):
                    if len(piece) < 40:
                        continue
                    chunks.append({
                        "law_id": doc["id"],
                        "law_title": doc["title"],
                        "date": doc.get("date"),
                        "category": doc.get("category"),
                        "lang": lang,
                        "article": art["number"],
                        "heading": art["heading"],
                        "part": pi,
                        "text": piece,
                        "kind": "article",
                    })

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    for law in catalog:
        if law["id"] in extracted_ids:
            continue
        chunks.append({
            "law_id": law["id"],
            "law_title": law["title"],
            "date": law.get("date"),
            "category": law.get("category"),
            "lang": "en",
            "article": None,
            "heading": law.get("category") or "",
            "part": 0,
            "text": law["title"],
            "kind": "title",
        })

    # BM25 stats
    df: Counter = Counter()
    postings: dict[str, list[tuple[int, int]]] = defaultdict(list)
    lens = []
    for idx, ch in enumerate(chunks):
        toks = tokenize(f"{ch['law_title']} {ch['heading'] or ''} {ch['text']}")
        lens.append(len(toks))
        tf = Counter(toks)
        for term, count in tf.items():
            df[term] += 1
            postings[term].append((idx, count))

    n = len(chunks)
    avgdl = sum(lens) / max(n, 1)
    idf = {t: math.log(1 + (n - d + 0.5) / (d + 0.5)) for t, d in df.items()}

    (OUT / "chunks.json").write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
    (OUT / "bm25.json").write_text(json.dumps({
        "n": n, "avgdl": avgdl, "doc_len": lens,
        "idf": idf,
        "postings": {t: p for t, p in postings.items()},
    }, ensure_ascii=False), encoding="utf-8")

    from collections import Counter as C
    kinds = C(c["kind"] for c in chunks)
    langs = C(c["lang"] for c in chunks)
    print(f"DONE index: {n} chunks ({dict(kinds)}), langs={dict(langs)}, "
          f"{len(extracted_ids)} full-text laws, vocab={len(df)}", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
