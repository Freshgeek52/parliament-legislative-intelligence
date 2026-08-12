# Roadmap and Team — Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Document:** 6 of 7 — Roadmap and Team

This document lays out a phased delivery roadmap and a proposed team composition. Phase names introduced here are used consistently across this pack.

## 1. Sequencing logic

The roadmap is ordered around one central dependency: **the four component services described in `03-architecture.md` all consume the same knowledge store and retrieval layer.** Analytical features (duplication detection, gap/inconsistency analysis, comparative legislation) are only as good as the corpus and retrieval quality underneath them — running a duplication check against an incomplete or badly structured knowledge base produces false confidence, which is worse than no tool at all. This is why:

- The knowledge base and retrieval layer are built and validated **before** any analytical component, starting with the research/drafting assistant, which is both the highest-value single capability and the best forcing function for getting retrieval quality and citation accuracy right, since every one of its outputs is directly checked by a human against the source document in normal use.
- Duplication detection comes next because it depends on broad corpus coverage (it needs most of existing law ingested to be useful) but is conceptually the simplest analytical layer on top of retrieval — a semantic similarity/contradiction check.
- Gap/inconsistency analysis and comparative legislation follow because they depend on more nuanced reasoning over the same retrieval layer, and because comparative legislation additionally depends on a second corpus (foreign law references, per `04-data-and-integrations.md`) being onboarded.
- Kinyarwanda parity is scoped as its own phase rather than folded silently into Phase 1, because the source material specifies Kinyarwanda support as a named capability in its own right ("Comparative legislation & Kinyarwanda") and because doing it properly — not as an afterthought translation layer — takes dedicated NLP work, per `03-architecture.md` Section 6.
- On-prem migration is last because it depends on the system, the data pipeline, and the operating model all being proven in production first; migrating a system that is still changing shape would multiply the migration's cost and risk.

## 2. Phased roadmap

### Phase 0 — Discovery and data access
**Goal:** Establish ground truth on what data exists, in what condition, and who can authorize access to it, before committing to a build plan.

- Inventory the parliamentary knowledge base: what exists, in what format (digital vs. scanned vs. paper-only), and its rough completeness by era and document type.
- Confirm data ownership, access rights, and classification rules with Parliament (see `04-data-and-integrations.md`), including which committees/teams own which embargoed material.
- Confirm identity/authentication approach and the four-role access model (`05-security-compliance.md`, Section 4) with Parliament's administration.
- Validate assumptions in this documentation pack (especially the format assumptions in `04-data-and-integrations.md`, Section 1) against the actual archive.
- Produce a scoped ingestion plan and a confirmed Phase 1 backlog.

### Phase 1 — Knowledge base + research/drafting assistant MVP
**Goal:** Get a trustworthy, cited retrieval layer live, with the research & drafting assistant as its first real consumer.

- Build the ingestion pipeline (intake, OCR, structuring) for a first tranche of the corpus — prioritizing currently in-force law and recent Hansard/committee material, since that has the highest immediate research value.
- Stand up the structured document store, vector index, and citation resolver (`03-architecture.md`, Section 4).
- Deliver the research & drafting assistant: research Q&A, summarization, translation (initial language pair coverage — see Phase 4 for full Kinyarwanda parity), and template filling, all cited.
- Deliver the suggestion/review queue and version history mechanics (`05-security-compliance.md`, Section 2) since these are shared infrastructure every later component depends on.
- Deliver audit logging (`05-security-compliance.md`, Section 3) from the start, not retrofitted later.

### Phase 2 — Duplication detection
**Goal:** Add the first analytical layer once corpus coverage and retrieval quality from Phase 1 are validated as trustworthy.

- Extend corpus ingestion toward broader completeness across existing law (a duplication check is only as good as what has been ingested).
- Build the duplication/contradiction detection service and its review workflow (flag → drafter or oversight review → resolve/dismiss with recorded reason).
- Validate flag precision with legal domain experts before wide rollout, given the cost of false positives (drafter distrust) and false negatives (missed conflicts).

### Phase 3 — Gap/inconsistency analysis + comparative legislation
**Goal:** Add the more reasoning-intensive analytical capabilities.

- Build gap, inconsistency, and intent-alignment flagging, including the plain-language rationale requirement (`02-requirements.md`, Section 3).
- Onboard the comparative/foreign-law reference corpus (`04-data-and-integrations.md`, Section 3) and build the comparative legislation engine.
- These two are grouped in one phase because both depend on more nuanced grounded reasoning over the same retrieval layer and can share evaluation work with legal domain experts.

### Phase 4 — Kinyarwanda parity
**Goal:** Bring all four components to full functional parity in Kinyarwanda, not just partial/best-effort translation.

- Expand the Kinyarwanda NLP/translation layer (`03-architecture.md`, Section 6) to cover legal-domain terminology across all four components.
- Validate retrieval and generation quality in Kinyarwanda specifically, since general-purpose translation quality does not guarantee legal-domain accuracy (see `07-risks.md` for the associated risk).
- Extend UI, audit logging, and citation display to be equally usable in Kinyarwanda as in English/French (FR-C1 in `02-requirements.md`).

*Note: basic Kinyarwanda support begins in Phase 1 per the requirements in `02-requirements.md`; Phase 4 is where full parity across all analytical components is completed and formally validated, rather than Kinyarwanda being absent until this point.*

### Phase 5 — On-prem migration
**Goal:** Move the system, per the committed roadmap, onto Rwandan government on-premises infrastructure.

- Stand up the on-prem environment (compute, storage, self-hosted model serving via the Neural Bridge on-prem profile) per `03-architecture.md` Section 8 and `05-security-compliance.md` Section 6.
- Migrate data with verified integrity (structured documents, vector index, version history, audit logs) and cut over.
- Establish on-prem operations, network isolation, and the audited access path for ongoing MINICT/RISA support.
- Run a defined parallel/verification period before fully decommissioning the cloud environment, with a clear data-deletion step from the cloud side once cutover is confirmed.

## 3. Team composition

| Role | Responsibility | Engagement pattern |
|---|---|---|
| **Product owner (Parliament side)** | Represents Parliament's institutional priorities; owns requirements trade-offs; approves what ships to MPs and staff | Ongoing, throughout all phases |
| **MINICT/RISA engineering lead** | Owns overall technical delivery and the interface to shared MINICT/RISA infrastructure (Neural Bridge, shared auth/infra patterns) | Ongoing, throughout all phases |
| **Backend / AI engineers** | Build the ingestion pipeline, document store, retrieval layer, and the four component services | Heavy from Phase 1 onward; team size can flex down slightly after Phase 3 as components stabilize |
| **Frontend engineer** | Builds the user-facing application: role-based views, suggestion/review queue UI, audit log viewer, multilingual UI | Ongoing from Phase 1; steady load through all phases as new components need UI surfaces |
| **NLP / Kinyarwanda specialist** | Owns the Kinyarwanda NLP/translation layer and legal-domain terminology quality | Present from Phase 1 (baseline support) with heavy, concentrated involvement in Phase 4; lighter touch in between |
| **Legal domain expert / legislative counsel** (subject-matter reviewer) | Validates retrieval and citation accuracy, reviews duplication/gap/comparative flag quality, defines what "correct" looks like for legal outputs | Heavy and continuous — every phase's outputs need domain sign-off before rollout; this role does not taper off |
| **Data / ingestion engineer** | Owns OCR quality, document structuring, and corpus completeness tracking | Very heavy in Phase 0–1 (initial backfill), then ongoing at lower intensity to ingest new material as it is produced |
| **Security reviewer** | Reviews access control implementation, audit logging completeness, confidentiality handling of embargoed material, and the eventual on-prem network isolation design | Engaged at each phase gate, with concentrated involvement in Phase 0 (access model design), Phase 1 (initial audit/RBAC build), and Phase 5 (on-prem security review) |

**One-time / heavy-early roles:** data/ingestion engineer (historical backfill is front-loaded), NLP/Kinyarwanda specialist (concentrated in Phase 4), security reviewer (concentrated at phase gates rather than continuous day-to-day).

**Ongoing roles for the life of the system:** product owner, MINICT/RISA engineering lead, backend/AI engineers, frontend engineer, and — notably — the legal domain expert/legislative counsel, whose review is required on an ongoing basis for as long as the system produces outputs that affect legal text, not just during initial build.

## 4. Related documents

- `03-architecture.md` — the components this roadmap sequences
- `02-requirements.md` — the requirements each phase is scoped to satisfy
- `05-security-compliance.md` — security work referenced in Phase 0, Phase 1, and Phase 5
- `07-risks.md` — risks that inform sequencing decisions, particularly around corpus quality and Kinyarwanda NLP maturity
