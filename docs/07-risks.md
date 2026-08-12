# Risk Register: Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Document:** 7 of 7, Risk Register

This register should be reviewed and updated at each phase gate defined in `06-roadmap-and-team.md`. Likelihood and Impact are rated High / Medium / Low based on judgment at planning time; they should be revisited as real data becomes available (e.g., once corpus completeness and OCR quality are actually measured in Phase 0).

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI hallucination on legal text produces incorrect drafting suggestions | Medium | High | Enforce grounded retrieval-only generation for anything touching legal text (NFR-3, `02-requirements.md`); require citations on every claim (FR-C3); block ungrounded output from any workflow that can affect a bill's text; mandatory human acceptance before any suggestion becomes authoritative text (`05-security-compliance.md`, Section 2). |
| Incomplete or poorly-digitized historical legal corpus limits retrieval quality | High | High | Phase 0 corpus inventory and completeness assessment before build commitments (`06-roadmap-and-team.md`, Phase 0); OCR confidence thresholds with human-review gate for low-confidence output (`03-architecture.md`, Section 3); prioritize ingestion of currently in-force law first; make corpus coverage visible to users so gaps are known, not silently assumed to be complete. |
| Draft bill confidentiality breach (embargoed material exposed to unauthorized users) | Medium | High | Access control enforced at the retrieval layer, not just the UI (`04-data-and-integrations.md`, Section 4; `05-security-compliance.md`, Section 4); cross-bill duplication/gap checks routed through authorized reviewers rather than direct drafter-to-drafter exposure; full audit logging of all access to embargoed content; data-handling constraints on the shared Neural Bridge layer to prevent retention or cross-tenant exposure. |
| Over-reliance by drafters reduces human legal scrutiny | Medium | High | Every AI output is presented and logged as a suggestion, never an authoritative statement; UI design should make ungrounded/low-confidence output visually distinct from cited, grounded output; legal domain expert review built into every phase's rollout (`06-roadmap-and-team.md`, Section 3); periodic sampling audits of accepted suggestions to check drafter scrutiny is actually happening, not just nominally required. |
| Kinyarwanda NLP quality gaps versus English/French | High | Medium | Dedicated Kinyarwanda parity phase (Phase 4, `06-roadmap-and-team.md`) with a named NLP/Kinyarwanda specialist role; baseline Kinyarwanda support validated from Phase 1 rather than deferred entirely; legal-domain terminology validation specifically for Kinyarwanda, not assumed to follow from general translation quality; user feedback channel to surface quality gaps post-launch. |
| Political sensitivity of an AI system touching law-making (perception/trust risk among MPs) | Medium | High | Explicit, communicated scope boundaries (`01-project-brief.md`, Section 6): the system never votes, never replaces legal judgment, never auto-publishes, and never edits bill text without explicit human acceptance; transparency features (citations, audit trail, visible suggestion-vs-accepted distinction) designed to build trust through verifiability rather than asking for blind trust; phased rollout starting with the lowest-risk capability (research assistance) before analytical/judgment-adjacent features. |
| On-prem migration complexity/timeline slip | Medium | Medium | Cloud-side architecture built for portability from day one, containerized services, no cloud-vendor-locked APIs, self-hostable model options (`03-architecture.md`, Section 8), so migration is a redeployment, not a rewrite; migration treated as its own phase with a defined parallel/verification period before cloud decommissioning (`06-roadmap-and-team.md`, Phase 5); security reviewer engaged specifically at this phase gate. |
| Data residency/compliance risk while still cloud-hosted in early phases | Medium | High | Data processing agreement in place before any parliamentary content is stored in the cloud environment, constraining storage location, prohibiting third-party model training/reuse of content, and defining deletion guarantees on migration or termination (`05-security-compliance.md`, Section 5); classification and access control enforced identically in the cloud phase as planned for on-prem, so the compliance model does not need to be redesigned at migration time. |

## Related documents

- `01-project-brief.md`, scope boundaries referenced in the political sensitivity mitigation
- `02-requirements.md`, the accuracy, audit, and access-control requirements underlying several mitigations
- `03-architecture.md`, the grounded-generation and portability architecture underlying several mitigations
- `04-data-and-integrations.md`, corpus and classification detail underlying the corpus-quality and confidentiality risks
- `05-security-compliance.md`, the security controls this register relies on
- `06-roadmap-and-team.md`, the phasing and team roles this register's mitigations are scheduled against
