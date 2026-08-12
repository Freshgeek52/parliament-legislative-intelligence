"""Browser smoke test: load each page, wait for network, capture any console
errors and a screenshot, and confirm real backend data rendered."""
import json
import sys
import urllib.parse
from playwright.sync_api import sync_playwright

PAGES = ["dashboard", "assistant", "duplication", "gaps", "comparative", "audit"]
_payload = {
    "id": "u-ld-01", "name": "J. Mugenzi",
    "email": "j.mugenzi@parliament.gov.rw", "role": "legal_drafter",
    "exp": 4102444800000,  # far-future expiry
}
COOKIE = {"name": "pai-auth", "value": urllib.parse.quote(json.dumps(_payload)),
          "domain": "localhost", "path": "/"}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context()
    ctx.add_cookies([COOKIE])
    for name in PAGES:
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        try:
            page.goto(f"http://localhost:3007/{name}", wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(3500)
            body = page.inner_text("body")
            page.screenshot(path=f"smoke_{name}.png", full_page=False)
            lines = [l for l in body.split("\n") if l.strip()]
            # skip the shared nav/header chrome to show page-specific content
            snippet = " | ".join(lines[10:])[:260]
            print(f"[{name}] errors={len(errors)} :: {snippet}")
            if errors:
                for e in errors[:3]:
                    print(f"    ERR: {e[:160]}")
        except Exception as exc:
            print(f"[{name}] FAILED: {exc}")
        page.close()
    browser.close()
