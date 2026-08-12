"""Extract trilingual structured text from Rwandan Official Gazette law PDFs.

Gazette layout: the law body is set in THREE parallel columns per page --
conventionally Kinyarwanda | English | French. Naive text extraction
interleaves the columns into gibberish, so we:

 1. Detect column boundaries per page from the character-occupancy histogram
    (the two widest horizontal gaps with no glyphs). Falls back to thirds.
    Pages without two clear gaps (covers, signature pages) are treated as
    single-column front/back matter.
 2. Extract each column with pypdfium2's rectangle-bounded text extraction.
 3. Identify each column's language by stop-word scoring (never assume the
    conventional order -- some gazettes swap columns).
 4. Segment each language stream into articles:  "Ingingo ya N" (rw),
    "Article N" (en/fr). Laws print every article twice -- once in the
    table of contents, once in the body -- so for duplicate article numbers
    we keep the occurrence with the longest body text.

Output: backend/data/corpus/<id>.json
  { id, title, number, date, category, languages: {rw|en|fr: {
      article_count, articles: [{number, heading, text}], full_text_chars }},
    pages, extraction: {three_column_pages, fallback} }
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent / "data"
PDF_DIR = ROOT / "pdfs"
OUT_DIR = ROOT / "corpus"

MIN_GAP_PT = 6  # a column gutter must be at least this wide

STOPWORDS = {
    "rw": {"ya", "wa", "cyangwa", "iyo", "kandi", "mu", "ku", "ni", "igihe", "ingingo",
           "itegeko", "kugira", "ngo", "buri", "nk", "ry", "bw", "cy", "n'"},
    "en": {"the", "of", "and", "to", "in", "for", "shall", "is", "by", "this",
           "article", "law", "with", "or", "be", "that", "as"},
    "fr": {"le", "la", "les", "de", "des", "du", "et", "en", "un", "une", "est",
           "pour", "par", "qui", "dans", "sur", "au", "aux", "ou", "être"},
}

ARTICLE_RE = {
    "rw": re.compile(r"(?:^|\n)\s*Ingingo ya (mbere|\d+)\s*[:\.]?", re.IGNORECASE),
    "en": re.compile(r"(?:^|\n)\s*Article (One|\d+)\s*[:\.]?", re.IGNORECASE),
    "fr": re.compile(r"(?:^|\n)\s*Article (premier|\d+)\s*[:\.]?", re.IGNORECASE),
}
FIRST_WORDS = {"mbere": "1", "one": "1", "premier": "1"}


def column_gaps(tp, width: float, height: float) -> list[float]:
    """Return x-centres of the two widest glyph-free vertical gutters."""
    n = tp.count_chars()
    if n < 50:
        return []
    occ = bytearray(int(width) + 2)
    for i in range(0, n, 2):  # sampling every 2nd char is enough
        l, b, r, t = tp.get_charbox(i)
        # ignore running headers/footers which often span oddly
        if t > height * 0.97 or b < height * 0.03:
            continue
        for x in range(max(int(l), 0), min(int(r) + 1, len(occ) - 1)):
            occ[x] = 1
    gaps = []
    start = None
    lo, hi = int(width * 0.18), int(width * 0.85)
    for x in range(lo, hi):
        if occ[x] == 0:
            if start is None:
                start = x
        elif start is not None:
            if x - start >= MIN_GAP_PT:
                gaps.append((start, x))
            start = None
    if start is not None and hi - start >= MIN_GAP_PT:
        gaps.append((start, hi))
    gaps.sort(key=lambda g: -(g[1] - g[0]))
    return sorted((g[0] + g[1]) / 2 for g in gaps[:2])


def lang_score(text: str) -> dict[str, int]:
    words = re.findall(r"[a-zà-ÿ']+", text.lower())
    return {lang: sum(1 for w in words if w in sw) for lang, sw in STOPWORDS.items()}


def extract_columns(pdf) -> tuple[list[list[str]], int]:
    """Per page, return [col_left, col_mid, col_right] texts (or [full] for 1-col)."""
    pages_cols: list[list[str]] = []
    three_col = 0
    for page in pdf:
        tp = page.get_textpage()
        w, h = page.get_width(), page.get_height()
        cuts = column_gaps(tp, w, h)
        if len(cuts) == 2:
            b1, b2 = cuts
            cols = [
                tp.get_text_bounded(left=0, bottom=0, right=b1, top=h),
                tp.get_text_bounded(left=b1, bottom=0, right=b2, top=h),
                tp.get_text_bounded(left=b2, bottom=0, right=w, top=h),
            ]
            three_col += 1
        else:
            cols = [tp.get_text_bounded(left=0, bottom=0, right=w, top=h)]
        pages_cols.append(cols)
    return pages_cols, three_col


def assign_languages(pages_cols: list[list[str]]) -> dict[str, str]:
    """Concatenate column streams and map each to a language by stopword vote."""
    streams = {0: [], 1: [], 2: []}
    for cols in pages_cols:
        if len(cols) == 3:
            for i, c in enumerate(cols):
                streams[i].append(c)
    joined = {i: "\n".join(s) for i, s in streams.items() if s}
    if not joined:  # single-column document
        full = "\n".join(c for cols in pages_cols for c in cols)
        scores = lang_score(full)
        best = max(scores, key=scores.get) if any(scores.values()) else "en"
        return {best: full}

    result: dict[str, str] = {}
    taken: set[str] = set()
    # greedy: strongest signal first
    ranked = []
    for i, text in joined.items():
        for lang, score in lang_score(text).items():
            ranked.append((score, i, lang))
    ranked.sort(reverse=True)
    assigned_cols: set[int] = set()
    for score, i, lang in ranked:
        if i in assigned_cols or lang in taken or score == 0:
            continue
        result[lang] = joined[i]
        assigned_cols.add(i)
        taken.add(lang)
    return result


def segment_articles(text: str, lang: str) -> list[dict]:
    rx = ARTICLE_RE.get(lang)
    if not rx:
        return []
    matches = list(rx.finditer(text))
    if not matches:
        return []
    raw: list[dict] = []
    for k, m in enumerate(matches):
        num = m.group(1).lower()
        num = FIRST_WORDS.get(num, num)
        end = matches[k + 1].start() if k + 1 < len(matches) else len(text)
        body = text[m.end():end].strip()
        # first line(s) up to a blank-ish break = heading
        lines = [ln.strip() for ln in body.split("\n")]
        heading_parts, rest_idx = [], 0
        for j, ln in enumerate(lines[:4]):
            heading_parts.append(ln)
            rest_idx = j + 1
            if ln.endswith((".", ":")) or len(" ".join(heading_parts)) > 90:
                break
        heading = re.sub(r"\s+", " ", " ".join(heading_parts)).strip(" :.")
        rest = "\n".join(lines[rest_idx:]).strip()
        raw.append({"number": num, "heading": heading[:160], "text": rest})
    # TOC dedup: keep longest body per article number, preserve body order
    best: dict[str, dict] = {}
    order: list[str] = []
    for art in raw:
        n = art["number"]
        if n not in best:
            order.append(n)
        if n not in best or len(art["text"]) > len(best[n]["text"]):
            best[n] = art
    # prefer numeric ordering when sane
    try:
        order = sorted(set(order), key=lambda s: int(s))
    except ValueError:
        pass
    return [best[n] for n in order]


def process_pdf(pdf_path: Path, meta: dict) -> dict:
    pdf = pdfium.PdfDocument(str(pdf_path))
    pages_cols, three_col = extract_columns(pdf)
    lang_streams = assign_languages(pages_cols)
    languages = {}
    for lang, text in lang_streams.items():
        text = re.sub(r"Official Gazette[^\n]*\n?", "", text)
        articles = segment_articles(text, lang)
        languages[lang] = {
            "article_count": len(articles),
            "articles": articles,
            "full_text_chars": len(text),
        }
    return {
        **{k: meta.get(k) for k in ("id", "title", "number", "date", "category",
                                     "sub_category", "institution", "pdf_name",
                                     "references", "source_url")},
        "declared_languages": meta.get("languages", []),
        "pages": len(pdf),
        "extraction": {
            "three_column_pages": three_col,
            "single_column": three_col == 0,
        },
        "languages": languages,
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((PDF_DIR / "manifest.json").read_text(encoding="utf-8"))
    done = failed = skipped = 0
    for i, meta in enumerate(manifest, 1):
        out = OUT_DIR / f"{meta['id']}.json"
        if out.exists():
            skipped += 1
            continue
        pdf_path = PDF_DIR / meta["pdf_file"]
        if not pdf_path.exists():
            continue
        try:
            doc = process_pdf(pdf_path, meta)
            out.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
            done += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED {meta['id']} ({meta['title'][:60]}): {exc}", flush=True)
            failed += 1
        if i % 20 == 0:
            print(f"  {i}/{len(manifest)} (ok={done} failed={failed} cached={skipped})", flush=True)
    print(f"DONE extract: ok={done} failed={failed} cached={skipped}", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
