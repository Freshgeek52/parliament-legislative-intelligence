// Illustrative comparative summaries for demonstration purposes only.
// These are simplified, AI-generated-style descriptions of how other
// countries have approached similar policy areas - they are not a
// substitute for verified primary legal sources and should not be cited
// as such.

import { ComparativeTopic } from '../lib/types';

export const comparativeTopics: ComparativeTopic[] = [
  {
    id: 'topic-data-protection',
    name: 'Data Protection & Breach Notification',
    relatedBillId: 'bill-digital-governance',
    description:
      'How the seventy-two hour breach notification standard and cross-border transfer conditions in the Draft Law on Digital Governance and Data Protection compare with equivalent regimes elsewhere.',
    countries: [
      {
        country: 'Kenya',
        countryCode: 'KE',
        instrument: "Kenya's national data protection framework",
        provisionSummary: 'Requires notification to the data protection authority within 72 hours and to affected data subjects "as soon as practicable" once risk is confirmed.',
        approachNote: 'Similar notification window to the draft bill, but places more discretion on the controller to assess subject-facing timing.',
      },
      {
        country: 'Mauritius',
        countryCode: 'MU',
        instrument: "Mauritius's data protection framework",
        provisionSummary: 'Notification to the supervisory authority "without delay" with no fixed hour count, supplemented by sector-specific guidance for financial services.',
        approachNote: 'Less prescriptive than a fixed 72-hour rule; relies on regulator guidance to fill in operational detail.',
      },
      {
        country: 'Estonia',
        countryCode: 'EE',
        instrument: "Estonia's data protection framework (EU-aligned)",
        provisionSummary: 'Mirrors the EU GDPR 72-hour notification standard, with a unified single supervisory authority for both public and private controllers.',
        approachNote: 'Closest structural match to the draft bill\'s timeline, but avoids splitting notification duties across two regulators.',
      },
      {
        country: 'South Korea',
        countryCode: 'KR',
        instrument: "South Korea's personal information protection framework",
        provisionSummary: 'Requires notification within 24 hours for large-scale breaches involving a defined threshold of affected individuals, with tiered timelines below that threshold.',
        approachNote: 'A stricter, risk-tiered timeline; the draft bill could consider a shorter window for large-scale breaches specifically.',
      },
    ],
    aiTakeaway:
      'The draft bill\'s flat 72-hour window is broadly consistent with international practice, but most comparator jurisdictions route notification through a single supervisory authority rather than a newly created, separate body — worth resolving given the existing data protection law already assigns this role elsewhere.',
  },
  {
    id: 'topic-ai-governance',
    name: 'AI Governance & Automated Decisions',
    relatedBillId: 'bill-ai-governance',
    description:
      'How the human-review requirement in the Draft Law on Artificial Intelligence Governance and Accountability compares with automated decision-making safeguards elsewhere.',
    countries: [
      {
        country: 'Kenya',
        countryCode: 'KE',
        instrument: 'Draft AI policy and automated-decision guidance',
        provisionSummary: 'Proposed guidance recommends impact assessments for high-risk AI use in public services, with no binding human-review right yet in force.',
        approachNote: 'Less mature than the draft bill; the draft bill\'s binding human-review right is comparatively stronger on paper.',
      },
      {
        country: 'Mauritius',
        countryCode: 'MU',
        instrument: 'National AI strategy and sectoral guidance',
        provisionSummary: 'Strategy-level commitments to "human oversight" of AI in financial and public services, implemented through sector regulators rather than a single law.',
        approachNote: 'Oversight is distributed by sector rather than centralised, unlike the single Accountability Officer model proposed here.',
      },
      {
        country: 'Estonia',
        countryCode: 'EE',
        instrument: "Estonia's AI governance approach (EU-aligned)",
        provisionSummary: 'Risk-tiered obligations under an EU-aligned framework, with proactive human oversight required for "high-risk" systems rather than review only on request.',
        approachNote: 'Proactive review for high-risk systems contrasts with the draft bill\'s on-request model flagged in the Gap Analysis module.',
      },
      {
        country: 'South Korea',
        countryCode: 'KR',
        instrument: 'AI framework legislation',
        provisionSummary: 'Requires operators of high-impact AI systems to conduct and document human oversight, with government audit powers over deployment records.',
        approachNote: 'Combines a documentation duty similar to Article 15 with government audit rights not currently present in the draft bill.',
      },
    ],
    aiTakeaway:
      'Comparator frameworks increasingly require proactive human oversight for high-risk automated decisions rather than an on-request right — this is consistent with the critical gap already flagged against Article 7 in the Gap & Intent Alignment module.',
  },
  {
    id: 'topic-electronic-transactions',
    name: 'Electronic Transactions & Digital Signatures',
    relatedBillId: 'law-electronic-transactions',
    description:
      'How Rwanda\'s existing electronic signature recognition standard compares with equivalent rules used elsewhere, relevant to consent mechanisms referenced in the digital governance bill.',
    countries: [
      {
        country: 'Kenya',
        countryCode: 'KE',
        instrument: "Kenya's electronic transactions framework",
        provisionSummary: 'Recognises electronic signatures with a tiered reliability standard: a higher evidentiary bar applies to signatures used in government transactions.',
        approachNote: 'A tiered reliability model that the current law does not distinguish by transaction type.',
      },
      {
        country: 'Mauritius',
        countryCode: 'MU',
        instrument: "Mauritius's electronic transactions framework",
        provisionSummary: 'Broadly equivalent recognition standard, with a licensed certification authority regime for qualified electronic signatures.',
        approachNote: 'Adds a licensing layer for higher-assurance signatures not currently present in the domestic framework.',
      },
      {
        country: 'Estonia',
        countryCode: 'EE',
        instrument: "Estonia's digital identity and e-signature framework",
        provisionSummary: 'Signatures tied to a national digital identity scheme, giving qualified electronic signatures the same legal weight as handwritten ones by default.',
        approachNote: 'Often cited as a reference model; relies on a national digital ID infrastructure investment.',
      },
      {
        country: 'South Korea',
        countryCode: 'KR',
        instrument: "South Korea's electronic signature framework",
        provisionSummary: 'Distinguishes "accredited" and general electronic signatures, with accredited signatures carrying a stronger legal presumption of authenticity.',
        approachNote: 'A two-tier model that could inform how the digital governance bill treats consent-related signatures.',
      },
    ],
    aiTakeaway:
      'A number of comparator jurisdictions distinguish between general and higher-assurance ("qualified" or "accredited") electronic signatures, which could offer a model for tightening consent evidentiary standards referenced in Article 5 of the digital governance bill.',
  },
];

export function getComparativeTopic(topicId: string): ComparativeTopic | undefined {
  return comparativeTopics.find((t) => t.id === topicId);
}
