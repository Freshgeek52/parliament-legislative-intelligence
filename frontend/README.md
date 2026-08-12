# Parliament AI System (Legislative Intelligence) — Frontend

A polished, buildable **mock-data demo frontend** for the Parliament AI System, built for the Parliament of Rwanda
with MINICT/RISA as the technology partner. There is no real backend — every list, chat answer, similarity score
and audit entry is illustrative mock data intended to demonstrate the product experience.

This is a Next.js 14 (Pages Router) + TypeScript + Tailwind CSS application, matching the engineering conventions
used elsewhere in this workspace (see the Tender Monitoring Tool RISA frontend for a sibling example): mock cookie
based auth, a mock API/data layer under `data/`, Lucide icons, and a sidebar-navigation dashboard shell.

## What this demonstrates

The Parliament AI System has four core AI capabilities. Each has a dedicated page:

| Page | Route | Demonstrates |
|---|---|---|
| Dashboard | `/dashboard` | Overview: bills in progress, pending AI-flagged issues, quick links into the four modules. |
| Research & Drafting Assistant | `/assistant` | **Capability 1.** Chat-style assistant over a knowledge base of laws, draft bills, Hansard and committee reports. Every answer shows a "Sources" row of clickable citation chips linking back to the specific law and article. |
| Duplication Detection | `/duplication` | **Capability 2.** Bill selector, list of detected overlaps with similarity scores and overlap type (duplicate / contradictory / redundant / overlapping), and a side-by-side clause comparison view. |
| Gap, Inconsistency & Intent Alignment | `/gaps` | **Capability 3.** Annotated bill-text reading view with inline severity markers, plus a side panel of flagged issues (critical / moderate / minor) with Accept / Reject / Comment actions. |
| Comparative Legislation | `/comparative` | **Capability 4.** Topic/bill selector plus a comparison card grid against four other countries' equivalent provisions, with a short AI-generated takeaway. The Kinyarwanda / English / French language switcher (in the top bar, and on the login screen) is part of this same capability area and works across every page. |
| Audit Trail | `/audit` | Every accept / reject / comment action taken on the Duplication Detection and Gap & Intent Alignment pages is logged (via `localStorage`) and shown here alongside seeded historical entries — who, what module, what action, when. |

**Human-in-the-loop by design:** nothing in this demo auto-edits a bill's legal text. Accepting or rejecting an
AI-flagged issue only updates its review status and writes an audit log entry — the underlying bill text is
untouched, and a "human review required" note is shown throughout the Gap & Intent Alignment and Duplication
Detection pages.

## Tech stack

- **Next.js 14** (Pages Router) + **TypeScript** (strict mode)
- **Tailwind CSS** — deep navy/indigo brand color, warm gold accent, warm off-white page background, and dedicated
  red/orange/blue severity colors for the gap-analysis feature (see `tailwind.config.js`)
- **Lucide React** for icons
- **Recharts** for the dashboard's pending-issues-by-severity chart
- **js-cookie** for mock, cookie-based authentication (`lib/auth.ts`)
- **react-hot-toast** for lightweight action feedback
- Mock data lives entirely under `data/`; a small `lib/auditStore.ts` persists demo audit events to
  `localStorage` so accept/reject/comment actions actually show up on the Audit Trail page across navigations.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — you'll be redirected to the login screen.

## Signing in (mock auth)

There is no password. On the login screen, pick one of four roles and click **Continue**:

| Role | Demo user | Superficial effect on the UI |
|---|---|---|
| Member of Parliament | Hon. Aline Uwase | Can accept/reject AI suggestions on the Gap Analysis and Duplication pages. |
| Legal Drafter | Jean de Dieu Habimana | Full access, including accept/reject/comment on suggestions (the primary drafting persona). |
| Research & Committee Staff | Claudine Mukamana | Can browse everything, but suggestion accept/reject controls are read-only ("View only for your role"). |
| Legislative Oversight Unit | Eric Bimenyimana | Read-only across drafting modules; primary consumer of the Audit Trail page. |

The session is stored in a `pai-auth` cookie for 24 hours. Selecting a different role and continuing again simply
signs in as that role's demo user.

## Language switcher

The top bar (and the login screen) includes a working **EN / FR / RW** switcher. It is backed by a small flat
dictionary in `lib/i18n.tsx` (`LanguageProvider` / `useLanguage()`) covering the shared chrome: navigation labels,
top bar, common actions (Accept/Reject/Comment/etc.), and every page's header and key labels. Selection persists in
`localStorage`. Mock document content (bill text, chat answers, comparative notes) intentionally stays in its
source language, as it would in a real system backed by a multilingual legislative corpus.

## Project structure

```
frontend/
  components/       Shared chrome (AppShell, Sidebar, Topbar) and reusable UI (RoleBadge, SeverityBadge,
                     StatCard, CitationChip)
  data/              Mock corpus: bills.ts, knowledgeBase.ts, chat.ts, duplication.ts, gaps.ts,
                     comparative.ts, audit.ts
  lib/               auth.ts (mock auth + role permissions), i18n.tsx (language context + dictionary),
                     types.ts (shared domain types), auditStore.ts (localStorage-backed audit log),
                     mockAssistant.ts (canned chat responder), utils.ts
  pages/             _app.tsx, index.tsx, login.tsx, dashboard.tsx, assistant.tsx, duplication.tsx,
                     gaps.tsx, comparative.tsx, audit.tsx
  styles/globals.css Tailwind directives + a handful of shared component classes (.card, .btn-*, .input-field)
```

## Mock data disclaimer

Bill and law titles (e.g. *"Draft Law on Digital Governance and Data Protection"*) and their article text are
illustrative and written for this demo. They are **not** verified citations of real, currently gazetted Rwandan
legislation, and comparative-country summaries are simplified, illustrative descriptions rather than verified
primary-source citations. A small notice to this effect is shown in the footer of every page.
