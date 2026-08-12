# Project Brief: Parliament AI System (Legislative Intelligence)

**Owner institution:** Parliament of Rwanda
**Technology partner:** MINICT/RISA
**Status:** Planning
**Document:** 1 of 7, Project Brief

---

## 1. Problem statement

Law-making in the Parliament of Rwanda, like in most legislatures, depends on a small number of research staff, legal drafters, and Members of Parliament (MPs) being able to quickly and accurately answer questions such as:

- What does existing Rwandan law already say about this subject, and where?
- Does this draft bill contradict, duplicate, or leave a gap relative to other laws already in force?
- Is the wording of this clause precise enough to survive implementation and judicial interpretation, or does it contain loopholes or ambiguity?
- How have other countries legislated on this same question, and what can Rwanda learn from that?
- Can this research, and the resulting drafting, happen in Kinyarwanda as well as English and French, since that is the language most MPs and constituents actually work in?

Today, this work is largely manual. The parliamentary knowledge base, laws, the Official Gazette, Hansard/session records, committee reports, and draft bills, exists across a mix of scanned PDFs, Word documents, and paper archives with no unified, searchable structure. Finding whether a provision already exists elsewhere in Rwandan law, or whether two draft clauses conflict, currently depends on the institutional memory of individual staff and manual cross-referencing. This is slow, does not scale with legislative volume, and is vulnerable to staff turnover. Comparative legislative research (checking how other jurisdictions handle a given issue) is done ad hoc, if at all, because it requires language skills and access to foreign legal databases that are not systematically available. Kinyarwanda-language legal research is particularly underserved because most legal reference tooling in the region is built for English or French.

The result: research and quality-assurance work that should take hours can take days or weeks, drafting quality depends heavily on which staff member happens to be assigned, and duplication or contradiction between laws can go undetected until after a bill is enacted.

## 2. Vision

Build an AI assistant on top of Parliament's own knowledge base that supports, but never replaces, the human judgment of MPs, legal drafters, and research staff throughout the legislative process. The system should let any authorized user ask a research question, get a grounded answer with citations to the specific law or article it comes from, draft or fill legislative document templates faster, and automatically flag duplication, gaps, and inconsistency across the corpus of Rwandan law and draft bills. It should work as fluently in Kinyarwanda as in English and French. It starts as a cloud-hosted service to get value quickly, with a committed path to on-premises deployment once the system, the data pipeline, and the institution are ready for that transition, consistent with the sensitivity of legislative material.

This is a legislative intelligence tool, not a legislative decision-maker. It never votes, never publishes on Parliament's behalf, and never finalizes legal text without a human accepting the change.

## 3. Key capabilities

The system is built around four capabilities, matching the four key components defined for this project:

1. **Research & drafting assistant**, Grounded document analysis, summarization, translation, report drafting, and template filling over the parliamentary knowledge base.
   *Why it matters:* This is the highest-frequency, highest-value use case, it turns hours of manual document search and first-draft writing into minutes, for the staff who do this work every day, and it is the foundation the other three capabilities are built on.

2. **Duplication detection**, Identifies overlapping, contradictory, or repeated provisions across existing laws and draft bills.
   *Why it matters:* Undetected duplication or contradiction between laws creates legal uncertainty and implementation risk that can persist for years; catching it during drafting is far cheaper than fixing it after enactment.

3. **Gap, inconsistency & intent alignment**, Highlights missing coverage and flags vague phrasing, loopholes, or wording that does not match the drafter's stated intent.
   *Why it matters:* Ambiguous or incomplete legal text is a recurring source of disputes and inconsistent implementation; a systematic second check on wording quality raises the floor on drafting regardless of which staff member is assigned.

4. **Comparative legislation & Kinyarwanda**, International benchmarking against other countries' laws, with Kinyarwanda support throughout the system.
   *Why it matters:* Comparative research materially improves legislative quality but is currently limited by staff time and language access; and Kinyarwanda-first support ensures the tool actually serves the majority of its target users in the language they legislate in, not just an English- or French-speaking subset.

## 4. Target users

- **Members of Parliament (MPs)** and **legal drafters**, the people who write and are accountable for the legal text.
- **Parliamentary research and committee staff**, the people who prepare briefings, background research, and committee reports.
- **Legislative quality and oversight units**, the people responsible for catching inconsistency, duplication, and drafting quality issues before a bill advances.

## 5. Success criteria

The system is "working" when:

- **For an MP:** A research question about existing law or a comparative question about how another country legislates on a topic returns a clear, cited answer in the MP's language of choice (Kinyarwanda, English, or French) fast enough to be used in live committee or plenary preparation, and the MP can see exactly which law or article each claim is drawn from.
- **For a legal drafter:** Drafting a section of a bill is measurably faster because the assistant can produce a grounded first draft, fill standard templates, and flag, before submission, any provision that duplicates, contradicts, or leaves a gap relative to existing law, with every suggestion clearly marked as a suggestion that the drafter must explicitly accept before it becomes part of the bill text.
- **For a committee/research staffer:** Preparing a research brief or committee report that used to require manually searching scattered PDFs now starts from an AI-assisted summary of the relevant knowledge base, with full source citations that the staffer can verify, cutting research turnaround time significantly.
- **Institutionally:** Every AI suggestion that was acted on is traceable in an audit log (who asked, what was suggested, who accepted or rejected it, when), no bill's legal text is ever altered without an explicit human acceptance action, and the system runs reliably during active parliamentary sessions.

## 6. Scope boundaries (what this system does NOT do)

- It does **not** vote, approve, table, or otherwise take any formal legislative action on a bill.
- It does **not** replace the legal judgment of drafters, legal counsel, MPs, or oversight units, every analytical output (duplication flag, gap flag, comparative note, draft text) is a suggestion, not a determination.
- It does **not** auto-publish or auto-submit any document, report, or bill text to any internal or external system. Publication and tabling remain deliberate human actions.
- It does **not** silently edit legal text. Human-in-the-loop acceptance is mandatory for any AI-generated or AI-modified content that becomes part of a bill, report, or official record.
- It does **not**, in its initial phases, provide legal advice to the public or to non-Parliament institutions, it is an internal tool for Parliament's MPs and staff, built and operated with MINICT/RISA as the technology partner.
- It does **not** assume network connectivity to the public internet is always available or always acceptable for sensitive draft material, see the data sovereignty and on-prem migration path in `03-architecture.md` and `05-security-compliance.md`.

## 7. Related documents in this pack

- `02-requirements.md`, functional and non-functional requirements
- `03-architecture.md`, system architecture and cloud-to-on-prem path
- `04-data-and-integrations.md`, data sources, ingestion, and integrations
- `05-security-compliance.md`, security, confidentiality, and compliance
- `06-roadmap-and-team.md`, phased roadmap and team composition
- `07-risks.md`, risk register
