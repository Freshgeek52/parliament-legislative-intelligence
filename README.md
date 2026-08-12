# Parliament AI System: Legislative Intelligence

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Status:** Working prototype, real backend integrated (no longer mock-only)

An AI assistant built on top of the parliamentary knowledge base, supporting research, drafting,
and quality checks on Rwanda's law-making, with Kinyarwanda support and a path to on-prem
deployment. Source: Project 3 of MINICT's 2026 AI Projects Portfolio.

## What's in this folder

| Path | What it is |
|---|---|
| [`docs/`](docs/) | Full planning pack: project brief, requirements, architecture, data & integrations, security & compliance, roadmap & team, risk register. Start with `docs/01-project-brief.md`. |
| [`user-journey/`](user-journey/) | A visual walkthrough of how three personas, an MP/legal drafter, a committee researcher, and the legislative oversight unit, each move through the system. |
| [`ui-prototype/`](ui-prototype/) | A clickable, self-contained prototype of the product: dashboard, research assistant chat, duplication detection, gap/inconsistency analysis, comparative legislation, and an audit trail, with a working Kinyarwanda/English/French switch. No install required, open `ui-prototype/index.html` directly. |
| [`frontend/`](frontend/) | A real Next.js + TypeScript + Tailwind codebase implementing the same screens, now wired to the backend (mock imports replaced with `lib/api.ts` fetches). See `frontend/README.md`. |
| [`backend/`](backend/) | **Built.** FastAPI ingestion pipeline + RAG-style retrieval + the four component APIs, grounded in **real Rwandan legislation scraped from amategeko.gov.rw** (1,479 laws in force; 220 with full trilingual text). See [`backend/README.md`](backend/README.md). |
| [`docs/08-model-selection.md`](docs/08-model-selection.md) | Which open-source model is used for which task and **why**, from the fair-forward/languagebench evaluation. |

## The four key components

1. **Research & drafting assistant**, document analysis, summarisation, translation, report
   drafting, and template filling over the parliamentary knowledge base.
2. **Duplication detection**, flags overlapping, contradictory, or repeated provisions across
   existing laws and draft bills.
3. **Gap, inconsistency & intent alignment**, flags missing coverage, vague phrasing, loopholes,
   or misaligned wording in a bill.
4. **Comparative legislation & Kinyarwanda**, benchmarks against other countries' laws; the
   system supports Kinyarwanda throughout, not just as an add-on.

Every AI suggestion is exactly that, a suggestion. Nothing edits a bill's legal text without a
human explicitly accepting it, and every accept/reject decision is logged. See
`docs/01-project-brief.md` §6 for the full scope boundaries.

## Where to start

- **To understand the project:** read `docs/01-project-brief.md`, then `docs/03-architecture.md`.
- **To show someone what this looks like:** open `user-journey/index.html` for the human story,
  then `ui-prototype/index.html` for the working screens.
- **To start building:** `frontend/README.md` for the codebase; `docs/06-roadmap-and-team.md`
  for phasing and team composition.
- **To run the integrated system:** start the backend (`backend/README.md`), then the frontend
  with `NEXT_PUBLIC_API_BASE_URL` pointed at it. The dashboard, assistant, duplication, gaps,
  comparative and audit screens all render live data from the real legislation corpus.
