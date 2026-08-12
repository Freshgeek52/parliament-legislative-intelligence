# Security and Compliance: Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Document:** 5 of 7, Security and Compliance

This document sets out the security and compliance posture required for a system that touches the confidentiality of unpublished legislation, the integrity of legal text, and the data sovereignty expectations of a national legislature. It should be read alongside `02-requirements.md` (NFR-1, NFR-5, NFR-6) and `04-data-and-integrations.md` (data classification).

## 1. Confidentiality of draft and unpublished bills

Draft bills, in-preparation committee reports, and not-yet-released current-session Hansard records are, until tabled or officially released, sensitive institutional material, premature disclosure can affect political negotiation, give improper advance notice of legislative intent, or simply be inappropriate ahead of the constitutionally/procedurally correct disclosure point. The system must treat this as a hard confidentiality boundary, not merely a display preference:

- Every embargoed document is access-scoped as described in `04-data-and-integrations.md`, Section 4, with enforcement at the retrieval layer.
- Component services (research assistant, duplication detector, gap analyzer, comparative engine) must not expose embargoed content to a requester who is not authorized for that specific document, even indirectly through summarization, cross-referencing, or a duplication/contradiction flag.
- Where a shared underlying model layer (Neural Bridge, per `03-architecture.md` Section 7) is used, any prompt or context sent to that layer containing embargoed content must be handled under a data-handling agreement that guarantees no retention or reuse beyond the immediate request, and no cross-tenant exposure to other MINICT/RISA projects sharing the same infrastructure.
- Declassification from embargoed to public status occurs only through a deliberate, logged action tied to the actual tabling/release event (Section 4 of `04-data-and-integrations.md`), never automatically by elapsed time or inferred status.

## 2. Integrity of legal text

The system must guarantee that AI involvement in the legislative process never silently changes what a bill says:

- The AI **never writes directly to the authoritative text of a bill.** All AI-generated or AI-modified content (draft language, accepted duplication-resolution edits, etc.) is written to a suggestion/review queue, as described in `03-architecture.md` Section 2.
- A change becomes part of a bill's authoritative version **only** when an authorized human (legal drafter or oversight unit member, per the role model in Section 4 below) performs an explicit accept action.
- Every accepted change is captured in the bill's version history (FR-C4 in `02-requirements.md`), recording the prior text, the new text, the originating AI suggestion (if any), and the accepting user and timestamp, so the provenance of every word in a bill's history can be reconstructed.
- Rejected, modified, or ignored suggestions never alter the underlying document; they remain visible in the audit trail (Section 3) for institutional review but have no effect on the bill's text.

## 3. Audit logging

Full audit logging is a structural requirement, not an add-on:

- **What is logged:** every query submitted to any component service; every AI-generated suggestion (research answer, draft text, duplication flag, gap/inconsistency flag, comparative note) with its source citations; every accept, reject, or modify-then-accept action taken on a suggestion; every access to embargoed content; and every administrative action affecting access control or document classification.
- **Who / what / when:** each log entry captures the acting user (or system component), the specific action, the object acted on (document, clause, suggestion ID), and a timestamp, sufficient to answer "who asked what, what the AI suggested, who accepted or rejected it, and when" for any item in the system.
- **Tamper-evidence:** the audit log is append-only from the perspective of application users, no role, including administrative roles used for day-to-day operation, can edit or delete historical audit entries through the application; any legitimate retention-driven deletion is a separately governed, logged operational process, not an application feature.
- **Accessibility for review:** the oversight unit and designated Parliament administrators can query the audit trail (e.g., "show me every AI suggestion accepted into Bill X," "show me every access to this embargoed draft") to support institutional review and, where required, external audit.

## 4. Access control model

Four baseline roles are enforced throughout the system, consistent with the target users defined in `01-project-brief.md` and the RBAC requirement (NFR-6) in `02-requirements.md`:

| Role | Represents | Typical permissions |
|---|---|---|
| **MP** | Members of Parliament | Query research/comparative capabilities; view public content and any embargoed content specifically shared with them (e.g., their own committee's draft); cannot directly accept AI suggestions into a bill's authoritative text unless also acting as a drafter of record |
| **Legal drafter** | Staff drafting bill text | Full use of research, drafting, duplication, and gap-analysis capabilities on bills they are authorized to work on; can accept suggestions into the authoritative text of those bills |
| **Research / committee staff** | Parliamentary research and committee staff | Research, summarization, translation, and comparative-legislation capabilities; template-filling for reports; access scoped to documents relevant to their committee assignment; cannot accept changes into bill text |
| **Oversight unit** | Legislative quality and oversight staff | Cross-cutting read access for duplication/gap review across bills, including across drafting teams where needed for conflict review (per `04-data-and-integrations.md` Section 4); can accept resolution actions on duplication/gap flags; access to audit trail reporting |

Additional considerations:

- Role assignment and any per-document access grants (e.g., an MP granted access to a specific committee's embargoed draft) are administered through a defined process owned jointly by Parliament's administration and the MINICT/RISA engineering team, not ad hoc.
- Permissions are enforced consistently at the retrieval layer and the suggestion-acceptance layer (`03-architecture.md` Sections 2 and 4), not only in the UI.
- Role and permission changes are themselves audit-logged (Section 3).

## 5. Data sovereignty and the on-prem roadmap

Consistent with the portfolio direction that this system is "cloud first" with "on-prem deployment thereafter," data sovereignty is a driving compliance requirement, not an afterthought:

- All parliamentary data (structured documents, embeddings, version history, audit logs, suggestion queues) must ultimately reside on Rwandan government infrastructure (NFR-1 in `02-requirements.md`).
- During the cloud-hosted phase, hosting arrangements must be governed by a data processing agreement that constrains where data is stored/processed, prohibits use of parliamentary content to train or improve any third-party model, and defines data deletion guarantees on migration or contract termination.
- The architecture (`03-architecture.md`, Section 5) is built so that this migration is a redeployment, not a rewrite: containerized services, no cloud-vendor-locked APIs, self-hostable model options.
- The on-prem migration itself (Phase 5 in `06-roadmap-and-team.md`) is treated as a security-relevant program of work with its own review, not just an infrastructure task.

## 6. On-prem network isolation

Once deployed on-prem, the system is expected to operate within a network boundary isolated from the public internet and from other ministries' cloud-hosted environments, at a level of strictness appropriate to Parliament's confidentiality needs:

- Only narrowly scoped, monitored, and justified exceptions are permitted (for example, a controlled outbound path to fetch updates to the public Official Gazette feed or public comparative foreign-law sources described in `04-data-and-integrations.md` Section 3), each individually reviewed and logged.
- Model inference must be servable inside the isolated network boundary (self-hosted models via the Neural Bridge on-prem profile, per `03-architecture.md` Section 8), since a design that requires calling out to a public cloud model API would defeat the purpose of network isolation.
- Administrative and support access (e.g., MINICT/RISA engineers performing maintenance) to the on-prem environment must go through an audited access path consistent with the access control model in Section 4, rather than informal remote access.

## 7. Related documents

- `02-requirements.md`, NFR-1 (data sovereignty), NFR-5 (auditability), NFR-6 (RBAC) that this document expands on
- `03-architecture.md`, the technical implementation of the access control, suggestion-queue, and on-prem architecture described here
- `04-data-and-integrations.md`, data classification rules this security model enforces
- `07-risks.md`, confidentiality and compliance risks and their mitigations
