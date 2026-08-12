"""Harvest the full metadata catalog of Rwandan legislation from amategeko.gov.rw.

The portal (Rwanda Law Reform Commission) is a React SPA backed by a public
read-only REST API at https://apis.amategeko.gov.rw/v1/site/. Documents are
organised in sections:
    1.1  Laws in force        1.2  Laws not in force (repealed)
    2.x  Case law (courts)    -- not harvested here

Endpoint used:
    GET /documents/table?start=<offset>&length=<page>&section=<section>
returns Elasticsearch hits with rich metadata per document (title, number,
date, category, institution, PDF file path, available languages, cross
references). PDFs are fetched separately by download_pdfs.py via
    POST /files/download  (form field: path)

Output: backend/data/catalog/laws_in_force.json and laws_repealed.json
        (normalized records) plus *_raw.json (untouched API payloads).
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests

BASE = "https://apis.amategeko.gov.rw/v1/site"
HEADERS = {
    "User-Agent": "MINICT-Parliament-Legislative-Intelligence/0.1 (government research; contact: gharintwari@minict.gov.rw)",
    "Accept": "application/json",
}
PAGE = 100
DELAY_S = 0.6  # be polite to the public API

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "catalog"

SECTIONS = {
    "1.1": "laws_in_force",
    "1.2": "laws_repealed",
}


def normalize(hit: dict) -> dict:
    src = hit["_source"]
    file_info = src.get("file_info") or {}
    return {
        "id": src["id"],
        "document_id": src.get("document_id"),
        "title": (src.get("document_name") or "").strip(),
        "number": src.get("document_no"),
        "section": src.get("document_section"),
        "date": src.get("document_date"),
        "category": src.get("document_category_name"),
        "category_rw": src.get("document_category_name_rw"),
        "category_fr": src.get("document_category_name_fr"),
        "sub_category": src.get("document_sub_category_name"),
        "institution": src.get("document_institution_name"),
        "languages": [s.strip() for s in (src.get("file_languages") or "").split(",") if s.strip()],
        "pdf_path": file_info.get("path"),
        "pdf_name": file_info.get("name"),
        "pdf_size": file_info.get("size"),
        "references": [s.strip() for s in (src.get("file_references") or "").split(",") if s.strip()],
        "published_at": src.get("document_published_at"),
        "updated_at": src.get("document_updated_at"),
        "source_url": f"https://www.amategeko.gov.rw/laws/in-force/1?child={src.get('document_section')}",
    }


def harvest_section(session: requests.Session, section: str) -> tuple[list[dict], list[dict]]:
    raw_hits: list[dict] = []
    start = 0
    total = None
    while total is None or start < total:
        url = f"{BASE}/documents/table"
        params = {"start": start, "length": PAGE, "section": section}
        for attempt in range(4):
            try:
                resp = session.get(url, params=params, headers=HEADERS, timeout=60)
                resp.raise_for_status()
                payload = resp.json()
                break
            except Exception as exc:  # noqa: BLE001
                wait = 2 ** (attempt + 1)
                print(f"  retry {attempt + 1} after error: {exc} (waiting {wait}s)", flush=True)
                time.sleep(wait)
        else:
            raise RuntimeError(f"giving up on {url} start={start}")

        block = payload["data"]
        total = block["recordsTotal"]
        hits = block["data"]
        raw_hits.extend(hits)
        start += len(hits)
        print(f"  section {section}: {start}/{total}", flush=True)
        if not hits:
            break
        time.sleep(DELAY_S)

    normalized = [normalize(h) for h in raw_hits]
    return raw_hits, normalized


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    summary = {}
    for section, name in SECTIONS.items():
        print(f"Harvesting section {section} ({name}) ...", flush=True)
        raw, norm = harvest_section(session, section)
        (DATA_DIR / f"{name}_raw.json").write_text(
            json.dumps(raw, ensure_ascii=False), encoding="utf-8"
        )
        (DATA_DIR / f"{name}.json").write_text(
            json.dumps(norm, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        summary[name] = len(norm)
        print(f"  wrote {len(norm)} records -> {name}.json", flush=True)

    (DATA_DIR / "harvest_summary.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    print("DONE", summary, flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
