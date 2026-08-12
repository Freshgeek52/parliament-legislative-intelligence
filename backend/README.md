# Backend: Legislative Intelligence API

Real-data backend for the Parliament platform. Replaces the frontend's mock
data with (a) the **actual corpus of Rwandan laws in force** scraped from
amategeko.gov.rw and (b) four grounded analysis services behind a
model-agnostic **Neural Bridge**.

## What's real now

| Before (mock) | After (this backend) |
|---|---|
| 6 hand-written laws in `frontend/data/bills.ts` | **1,479 laws in force** (metadata) + **220 with full trilingual text** |
| `generateMockResponse()` string-matcher | Grounded retrieval over **20,790 article chunks** (rw/en/fr) |
| Hard-coded duplication overlaps | **TF-IDF cosine** of draft articles vs the real corpus |
| Hard-coded gap issues | Rule-based (or LLM) gap analysis grounded in retrieved law |
| `localStorage` audit log | File-backed audit trail logging every AI action |

Draft bills remain illustrative samples (draft bills are internal pre-tabling
documents, not published on amategeko.gov.rw), but every analysis runs them
against the **real** law corpus.

## Layout

```
backend/
  ingestion/           # the scraping + processing pipeline (run in order)
    harvest_catalog.py    # 1. all laws-in-force metadata  -> data/catalog/
    download_pdfs_browser.py  # 2. law PDFs via the real viewer (Playwright) -> data/pdfs/
    extract_text.py       # 3. trilingual column-split + article segmentation -> data/corpus/
    build_index.py        # 4. BM25 index over article chunks -> data/index/
  api/
    store.py             # in-memory store + BM25 search + TF-IDF cosine
    neural_bridge.py     # model abstraction (openrouter | ollama | none)
    engines.py           # assistant / duplication / gaps logic
    app.py               # FastAPI routes
  data/                  # generated artifacts (catalog, pdfs, corpus, index, drafts, comparative, audit)
```

## Setup & run

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install requests pdfplumber pypdfium2 fastapi "uvicorn[standard]" playwright
.venv/Scripts/python -m playwright install chromium   # only needed to re-scrape PDFs

# (data/ is already populated; re-run the pipeline only to refresh it)
.venv/Scripts/python ingestion/harvest_catalog.py
.venv/Scripts/python ingestion/download_pdfs_browser.py 220
.venv/Scripts/python ingestion/extract_text.py
.venv/Scripts/python ingestion/build_index.py

# serve
.venv/Scripts/python -m uvicorn api.app:app --port 8000
```

Then point the frontend at it: copy `frontend/.env.local.example` to
`frontend/.env.local` (`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`) and
`npm run dev`.

## Enabling the LLM (optional)

Everything works with **no model** (grounded retrieval-only fallback). To turn
on generation, set env vars (see `docs/08-model-selection.md` for the why):

```bash
# hosted open-source inference
NEURAL_BRIDGE_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-...
MODEL_CHAT=google/gemma-3-27b-it        # → google/gemma-4-31b-it when available
MODEL_TRANSLATE=deepseek/deepseek-v4-flash

# OR fully self-hosted / data-sovereign
NEURAL_BRIDGE_PROVIDER=ollama
OLLAMA_MODEL_CHAT=gemma3:27b
```

## How the amategeko.gov.rw scrape works

The portal is a React SPA backed by a public read-only API at
`https://apis.amategeko.gov.rw/v1/site`. Key findings (reverse-engineered from
the site's JS bundle and network traffic):

- `GET /documents/table?start=&length=&section=1.1`, paginates all laws in
  force (section 1.1). Rich metadata per law: title, number, date, category,
  institution, available languages, cross-references.
- PDFs: recent (2026) laws are served by `POST /files/download` (form field
  `path`), but **older laws are migrated to a MinIO bucket
  (`files.amategeko.gov.rw`) behind client-side presigned URLs**. So
  `download_pdfs_browser.py` drives the real viewer with Playwright
  (`/view/toc/doc/{document_id}/{fileId}`) and intercepts the signed PDF
  response, this is what makes a multi-year corpus reachable.
- Gazette PDFs are **three parallel columns** (Kinyarwanda | English | French).
  `extract_text.py` detects column gutters from the glyph-occupancy histogram,
  extracts each column separately, identifies its language by stop-word
  scoring, then segments articles (`Ingingo ya N` / `Article N`), de-duplicating
  the table-of-contents copy against the body copy.

## API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | corpus/index/LLM status |
| GET | `/api/laws?q=&category=&limit=&offset=` | search all 1,479 laws |
| GET | `/api/bills` / `/api/bills/{id}?lang=` | draft bills / a bill or law with articles |
| GET | `/api/knowledge-base` | KB collections (laws + drafts) |
| POST | `/api/assistant/chat` | grounded, cited answer (`{message, lang, lawIds}`) |
| GET | `/api/duplication/{billId}` | overlaps vs the real corpus |
| GET | `/api/gaps/{billId}` | annotated bill + gap issues |
| GET | `/api/comparative` / `/api/comparative/{id}` | comparative topics |
| GET/POST | `/api/audit` | tamper-evident action log |
| POST | `/api/auth/login` | demo role sign-in |

All response shapes match `frontend/lib/types.ts`.
