# Data and Integrations: Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Document:** 4 of 7, Data and Integrations

This document describes the data sources that feed the Parliament AI System, the likely format they arrive in, the ingestion and structuring approach, plausible external integrations, and how the system must handle the distinction between public legal text and confidential, embargoed draft material.

## 1. Data sources

| Source | Description | Likely format (assumption) | Sensitivity |
|---|---|---|---|
| Official Gazette / published laws | The authoritative published text of enacted Rwandan law | Mix of born-digital PDF (recent) and scanned PDF/paper (older) | Public |
| Draft bills in progress | Bills currently being drafted, reviewed, or moving through committee, not yet tabled/enacted | Word documents, PDF exports, tracked-changes drafts | Confidential / embargoed until tabled |
| Hansard / parliamentary session transcripts | Records of plenary and committee session proceedings | Scanned PDF for older sessions, born-digital text/PDF for recent sessions; possibly audio/video for source recordings | Mostly public once published, but current-session records may be embargoed until officially released |
| Committee reports | Analysis and recommendations produced by parliamentary committees | Word documents, PDF | Mixed, public once tabled, internal/confidential while in preparation |
| Prior comparative-law research | Any existing internal research comparing Rwandan law to other jurisdictions' law | Word documents, PDF, possibly informal notes | Internal, treated as a Parliament work product |
| Comparative / foreign legislation references | Public law text from other countries used for benchmarking | External public legislation portals/databases, format varies by source jurisdiction | Public (subject to the terms of the external source) |

**Assumption, clearly labeled:** The source material for this project does not specify the exact current format of the parliamentary archive. Based on how legislatures of comparable size and digitization maturity typically hold this material, this pack assumes a substantial share of the historical corpus (older Gazette issues, older Hansard, older committee reports) exists as scanned PDF or paper, while more recent material is increasingly born-digital. The ingestion pipeline in `03-architecture.md` (Section 3) is designed around this mixed-format assumption, including an OCR step with a human-review gate for low-confidence output.

## 2. Ingestion and structuring approach

1. **Intake**, documents are collected from whatever internal systems, shared drives, or physical archives currently hold them; a defined intake process (owned jointly by Parliament's records staff and the MINICT/RISA project team) establishes what has been ingested and what remains outstanding, since a partial or unknown-coverage corpus directly limits retrieval quality (see `07-risks.md`).
2. **Format normalization and OCR**, scanned/image documents go through OCR; born-digital documents are parsed directly. OCR output below a defined confidence threshold is routed to human review before entering the authoritative store, because uncorrected OCR errors on legal text (a missed "not," a misread cross-reference number) are not an acceptable quality bar for a system whose outputs are cited as authoritative.
3. **Document structuring**, each document is broken into addressable units (for a law: chapter → article → clause/paragraph; for Hansard: session → agenda item → speaker turn; for a committee report: section → finding/recommendation) with structured metadata: instrument type, date, status (in force / repealed / amended / draft / tabled / embargoed), language, and, critically, a classification tag (see Section 4).
4. **Language alignment**, where a document exists in more than one official language version, the versions are linked as aligned representations of the same legal text rather than treated as independent documents, so retrieval and citation work consistently regardless of which language a user queries in.
5. **Ongoing ingestion**, beyond the historical backfill, the pipeline runs continuously as new bills are drafted, new Hansard records are produced, and new committee reports are finalized, so the knowledge base does not go stale relative to the current legislative session.

## 3. External integrations (plausible, to be confirmed during Phase 0)

The following integrations are plausible extensions consistent with the project's scope, but none are assumed to exist yet, each would need to be confirmed and scoped during the discovery phase (`06-roadmap-and-team.md`, Phase 0):

- **Public legislation portal**, if Rwanda maintains (or MINICT/RISA operates) a public-facing portal for published laws or the Official Gazette, that portal could serve as an authoritative source feed for public law text, reducing duplicate manual entry.
- **Other East African / Commonwealth parliaments' public law databases**, for the comparative legislation engine (`03-architecture.md`, Section 5), integration with publicly accessible legislative databases of other jurisdictions (for example, other East African Community member states or other Commonwealth legislatures that publish law online) would supply the reference corpus for benchmarking. These are read-only, public-data integrations; no Rwandan parliamentary data is shared outward through them.
- **MINICT/RISA shared infrastructure (Neural Bridge)**, as described in `03-architecture.md` Section 7, this is not an external integration in the usual sense but a shared internal platform dependency for LLM inference and embeddings.
- **Identity/authentication**, integration with whatever identity provider Parliament or MINICT/RISA standardizes on for government staff authentication, to support the role-based access control described in `02-requirements.md` (NFR-6) and `05-security-compliance.md`.

Any integration that would send parliamentary content (especially embargoed draft bill text) to an external system must go through the classification and access-control handling described in Section 4 before it is enabled.

## 4. Data classification and confidentiality handling

Two broad classes of content coexist in the same knowledge base, and the system must treat them very differently:

- **Public law text**, enacted laws, the published Official Gazette, tabled and publicly released Hansard records, and finalized/released committee reports. This content can be retrieved and cited freely by any authorized system user (subject to normal role-based access, not confidentiality restrictions).
- **In-progress / confidential material**, draft bills that have not yet been tabled, committee reports still in preparation, and current-session Hansard records not yet officially released. This content is **embargoed**: it exists in the knowledge base to support the drafting and research work described in `02-requirements.md`, but it must not be retrievable by, or leak into outputs served to, any user or role not authorized to see that specific embargoed item.

Handling requirements:

- **Classification at ingestion**, every document is tagged with a classification (public / embargoed / internal) and, where relevant, an owning committee or drafting team, at the point it enters the structured document store (`03-architecture.md`, Section 4).
- **Enforcement at retrieval, not just display**, access control is enforced in the retrieval layer itself (the grounded retriever never returns a passage from an embargoed document to a user or component call not authorized for it), not only as a UI-level filter, so that an embargoed draft cannot leak indirectly through a summarization, duplication-check, or comparative-legislation result that happens to draw on it.
- **No cross-bill leakage**, the duplication detection and gap/inconsistency components (`03-architecture.md`, Section 5) inherently compare a draft bill against the rest of the corpus, including other embargoed drafts; this comparison must be possible for authorized reviewers without exposing the *content* of one team's embargoed draft to a different team's drafters who are not authorized to see it. In practice this means duplication/contradiction flags between two embargoed drafts owned by different teams should be routed to a role authorized to see both (e.g., the oversight unit) rather than shown directly to either drafting team, unless both teams are authorized for both documents.
- **Automatic declassification on tabling**, when a bill is formally tabled or a Hansard record/committee report is officially released, its classification is updated from embargoed to public, changing its retrieval scope going forward. This transition should be a deliberate, logged action tied to the institution's actual tabling/release process, not an automatic time-based expiry, since tabling dates can move.
- **Audit logging of access to embargoed content**, every retrieval of embargoed content is captured in the audit trail described in `05-security-compliance.md`, so that access to sensitive draft material is fully traceable.

## 5. Related documents

- `03-architecture.md`, ingestion pipeline, document store, and retrieval layer that implement the handling described here
- `05-security-compliance.md`, access control model, audit logging, and confidentiality controls in full detail
- `07-risks.md`, risks related to corpus completeness/quality and draft bill confidentiality
