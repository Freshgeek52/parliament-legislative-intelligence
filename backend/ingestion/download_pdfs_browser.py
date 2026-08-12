"""Download law PDFs via the real viewer flow (Playwright).

Why a browser: amategeko.gov.rw stores older laws in a MinIO/S3 bucket
(files.amategeko.gov.rw) behind PRESIGNED urls whose signature is generated
client-side. Only the newest (2026) laws are still on the simple tmp/ path
that the plain POST /files/download endpoint serves. To get real full text
for a representative multi-year corpus we therefore drive the actual viewer:

  for each law:
    document_id (catalog) + fileId (catalog 'id')  ->
    goto /view/toc/doc/{document_id}/{fileId}       ->
    the SPA fetches files.amategeko.gov.rw/...<presigned>...  ->
    we intercept that response and save its bytes.

Prioritization identical to download_pdfs.py (ICT/digital keywords, then
fundamental laws, then most-recent). Re-runnable; existing files skipped.
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "data"
CATALOG = ROOT / "catalog" / "laws_in_force.json"
RAW = ROOT / "catalog" / "laws_in_force_raw.json"
PDF_DIR = ROOT / "pdfs"

CAP = int(sys.argv[1]) if len(sys.argv) > 1 else 220

ICT = re.compile(
    r"data protection|privacy|cyber|electronic|e-commerce|information and communication"
    r"|telecommunication|technolog|media|broadcast|innovation|science|startup|ict"
    r"|intellectual property|copyright|digital|internet|computer|artificial intelligence"
    r"|access to information|statistics|communication|governance|e-government", re.IGNORECASE)
FUND = re.compile(r"constitution|fundamental", re.IGNORECASE)


def prioritize(laws, doc_ids):
    def key(l):
        return l.get("date") or "0000-00-00"
    kw = [l for l in laws if ICT.search(l["title"] or "")]
    fund = [l for l in laws if FUND.search(l["title"] or "") or l.get("category") == "Fundamental"]
    rest = sorted(laws, key=key, reverse=True)
    out, seen = [], set()
    for group in (kw, fund, rest):
        for l in group:
            if l["id"] in seen or l["id"] not in doc_ids:
                continue
            out.append(l)
            seen.add(l["id"])
            if len(out) >= CAP:
                return out
    return out


def main():
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    laws = json.loads(CATALOG.read_text(encoding="utf-8"))
    raw = {r["_source"]["id"]: r["_source"] for r in json.loads(RAW.read_text(encoding="utf-8"))}
    doc_ids = {i: raw[i]["document_id"] for i in raw}
    selected = prioritize(laws, doc_ids)
    print(f"selected {len(selected)} laws", flush=True)

    manifest, failed = [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_page()
        for i, law in enumerate(selected, 1):
            dest = PDF_DIR / f"{law['id']}.pdf"
            if dest.exists() and dest.stat().st_size > 1000:
                manifest.append({**law, "pdf_file": dest.name})
                continue

            did = doc_ids[law["id"]]
            fid = law["id"]
            holder = {"data": None}

            def on_response(resp, holder=holder):
                if "files.amategeko.gov.rw" in resp.url and resp.status == 200:
                    try:
                        holder["data"] = resp.body()
                    except Exception:
                        pass

            ctx.on("response", on_response)
            url = f"https://www.amategeko.gov.rw/view/toc/doc/{did}/{fid}"
            try:
                ctx.goto(url, wait_until="commit", timeout=60000)
                for _ in range(30):  # poll up to ~15s for the pdf response
                    if holder["data"]:
                        break
                    ctx.wait_for_timeout(500)
            except Exception as exc:
                print(f"  nav error id={law['id']}: {exc}", flush=True)
            ctx.remove_listener("response", on_response)

            if holder["data"] and holder["data"][:4] == b"%PDF":
                dest.write_bytes(holder["data"])
                manifest.append({**law, "pdf_file": dest.name})
            else:
                failed.append(law["id"])

            if i % 10 == 0:
                print(f"  {i}/{len(selected)} ok={len(manifest)} failed={len(failed)}", flush=True)
        browser.close()

    (PDF_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"DONE: {len(manifest)} pdfs, {len(failed)} failed: {failed[:15]}", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
