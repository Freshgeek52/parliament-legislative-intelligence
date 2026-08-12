# Requirements — Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Document:** 2 of 7 — Requirements

This document defines functional requirements organized by the four key components of the Parliament AI System, followed by cross-cutting functional requirements and non-functional requirements. Requirements are written in user-story form (`As a <role>, I can <capability>, so that <benefit>`) so they map cleanly to backlog items. Roles referenced throughout: **MP** (Member of Parliament), **legal drafter**, **research/committee staff**, **oversight unit** (legislative quality and oversight staff). See `01-project-brief.md` for the target-user definitions these roles are drawn from.

---

## 1. Research & drafting assistant

- As a **research/committee staffer**, I can ask a natural-language question about existing Rwandan law in Kinyarwanda, English, or French, so that I can quickly find relevant provisions without manually searching scattered documents.
- As a **legal drafter**, I can request a summary of a long law, Hansard record, or committee report, so that I can understand its content without reading the full source document.
- As a **legal drafter**, I can request a translation of a document or passage between Kinyarwanda, English, and French, so that I can work across languages without depending on a separate manual translation step.
- As a **legal drafter**, I can generate a first-draft section of a bill from a structured prompt (subject, intent, related existing law), so that I have a grounded starting point instead of starting from a blank page.
- As a **research/committee staffer**, I can fill a standard report or briefing template automatically from source material in the knowledge base, so that routine document preparation takes minutes instead of hours.
- As an **MP**, I can ask the assistant to explain what a bill or clause means in plain language, so that I can prepare for committee or plenary discussion without relying solely on staff availability.
- As any authorized user, every answer, summary, translation, or draft returned by the assistant includes a citation back to the specific source law, article, or document it was derived from, so that I can verify the claim myself before relying on it.

## 2. Duplication detection

- As a **legal drafter**, I can submit a draft bill or clause and receive a list of existing laws or other draft bills that contain overlapping or repeated provisions, so that I can avoid creating redundant law.
- As a **legal drafter**, I can submit a draft bill or clause and receive a list of existing provisions it appears to contradict, so that I can resolve the conflict before the bill advances.
- As an **oversight unit** member, I can run a duplication/contradiction check across an entire bill (not just a single clause) before it goes to committee, so that systemic conflicts are caught early rather than discovered after enactment.
- As a **legal drafter**, for every duplication or contradiction flag, I can see the specific matching passage and its source citation side-by-side with my draft text, so that I can judge for myself whether it is a genuine conflict.
- As an **oversight unit** member, I can mark a duplication/contradiction flag as resolved, false-positive, or needing further review, so that the review workload is tracked and not repeated.

## 3. Gap, inconsistency & intent alignment

- As a **legal drafter**, I can submit a draft bill and receive flags on clauses with vague phrasing, undefined terms, or wording likely to create loopholes, so that I can tighten the language before submission.
- As a **legal drafter**, I can state the intended purpose of a clause and have the assistant flag wording in the clause that appears misaligned with that stated intent, so that I can catch drafting errors that change the practical effect of the law.
- As an **oversight unit** member, I can request a gap analysis of a bill against a defined policy area (e.g., "does this bill fully address enforcement mechanisms?"), so that missing coverage is identified before the bill is finalized.
- As a **legal drafter**, every gap or inconsistency flag includes a plain-language explanation of why it was raised, so that I can understand and act on it without needing to interpret a raw model output.
- As a **legal drafter**, I can dismiss a flag with a recorded reason, so that reviewers later understand why a flagged issue was not addressed.

## 4. Comparative legislation & Kinyarwanda

- As a **legal drafter**, I can request a comparison of how other countries have legislated on the same subject as my draft clause, so that I can benchmark Rwanda's approach against relevant precedent.
- As a **research/committee staffer**, I can request a summary of comparative legislative approaches across a defined set of reference countries, so that I can include international context in a committee briefing.
- As an **MP**, I can request comparative legislation research in Kinyarwanda, so that language is not a barrier to using this capability.
- As any authorized user, every comparative legislation result includes a citation to the specific foreign law or provision referenced, so that the source can be independently verified.
- As any authorized user, every capability in this system — research, drafting, duplication detection, gap analysis, and comparative legislation — is available in Kinyarwanda with the same functional depth as in English and French, so that Kinyarwanda-first users are not second-class users of the system.

---

## 5. Cross-cutting functional requirements

These requirements apply across all four components above.

- **FR-C1 — Bilingual/trilingual UI:** The system's interface and all user-facing outputs (summaries, drafts, flags, comparative notes) are available in Kinyarwanda, English, and French. Users can set a default working language and switch per-session without losing context.
- **FR-C2 — Audit trail of AI suggestions:** Every AI-generated suggestion (draft text, duplication flag, gap/inconsistency flag, comparative note) is logged with a unique identifier, the input that produced it, the source citations used, and its eventual disposition — accepted, rejected, modified-then-accepted, or left unreviewed.
- **FR-C3 — Source citation on every claim:** Any AI output that makes a factual claim about the content of a law, bill, Hansard record, or foreign legislation must include a citation to the specific document and, where applicable, article/section/clause it is drawn from. Outputs that cannot be grounded in a citable source are marked as ungrounded and are not permitted for legal-text-affecting suggestions (see NFR-3).
- **FR-C4 — Version history on bills:** Every draft bill tracked in the system maintains a version history showing each edit, who made it (human or AI-suggested-then-accepted), and when, so that the evolution of the bill's text can be reconstructed at any point.
- **FR-C5 — Human acceptance required for legal text changes:** No AI-suggested change becomes part of a bill's authoritative text without an explicit accept action from an authorized human user. Rejected or unreviewed suggestions never alter the underlying document.
- **FR-C6 — Role-aware output:** The same query can return role-appropriate detail — for example, an MP-facing summary may be shorter and more plain-language than a drafter-facing analytical breakdown — configurable per user role (see NFR-6).

---

## 6. Non-functional requirements

- **NFR-1 — Data sovereignty & residency:** All parliamentary knowledge base content, draft bills, and derived data must ultimately reside on Rwandan government infrastructure. The system is cloud-first at launch but must be architected from day one so that data storage, model inference, and application services can migrate to an on-premises environment without a rewrite (see `03-architecture.md`, Section 5). No parliamentary data may be used to train or fine-tune any third-party model outside of an agreement that guarantees data is not retained or reused by the provider.
- **NFR-2 — Availability during parliamentary sessions:** The system must meet a higher availability target during scheduled parliamentary sessions (plenary and committee sittings) than during non-session periods, with degraded-but-usable read-only access (search and retrieval of already-ingested content) as a minimum fallback if generative components are unavailable.
- **NFR-3 — Accuracy and hallucination controls:** All generative output that touches legal text must be produced through grounded retrieval against the parliamentary knowledge base (retrieval-augmented generation) rather than open-ended generation. The system must refuse or clearly flag as "ungrounded — verify independently" any request it cannot answer with a citable source. No component may present an ungrounded claim with the same visual confidence as a grounded, cited one.
- **NFR-4 — Accessibility:** The interface must meet a recognized accessibility standard (e.g., WCAG 2.1 AA or equivalent) to be usable by MPs and staff with visual, motor, or cognitive access needs, across the system's supported languages.
- **NFR-5 — Auditability:** Every user action that queries, generates, accepts, or rejects AI content is logged in a tamper-evident audit trail (see `05-security-compliance.md`) that is retrievable for institutional review, including by oversight units and, where legally required, external auditors of Parliament.
- **NFR-6 — Role-based access control:** The system enforces distinct permission levels for at least four role classes — MP, legal drafter, research/committee staff, and oversight unit — governing what data each role can view (including embargoed draft bills, see `04-data-and-integrations.md`), what actions each role can take (e.g., only drafters and oversight unit members can accept a suggestion into an authoritative bill version), and what administrative functions are available.
- **NFR-7 — Performance:** Interactive queries (research questions, duplication checks on a single clause) should return usable results within a time frame suitable for live use in committee and drafting sessions; full-bill analysis (duplication/gap scan across an entire bill) may run asynchronously with progress visibility.
- **NFR-8 — Portability / no vendor lock-in:** Application services must not depend on cloud-vendor-proprietary APIs that have no on-premises or self-hostable equivalent, consistent with the committed on-prem migration path (see `03-architecture.md`, Section 5).
