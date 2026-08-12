import { AnnotatedBill, GapIssue } from '../lib/types';

export const annotatedBills: AnnotatedBill[] = [
  {
    billId: 'bill-digital-governance',
    paragraphs: [
      {
        id: 'dgb-p1',
        text: 'A Bill entitled the Draft Law on Digital Governance and Data Protection, tabled to govern the collection, processing, storage and transfer of digital and personal data by public institutions and private entities.',
        issueIds: [],
      },
      {
        id: 'dgb-p2',
        text: 'Article 1 (Purpose and scope): This Law governs the collection, processing, storage and transfer of digital and personal data by public institutions and private entities operating within the national digital ecosystem.',
        issueIds: ['gap-1'],
      },
      {
        id: 'dgb-p3',
        text: "Article 9 (Definitions): In this Law, 'personal data' means any information relating to an identified or identifiable natural person, whether held in digital or physical form.",
        issueIds: ['gap-2'],
      },
      {
        id: 'dgb-p4',
        text: 'Article 5 (Consent for electronic data collection): A data controller collecting personal data through a digital service shall obtain the free, specific and informed consent of the data subject prior to processing, except where another lawful basis under this Law applies.',
        issueIds: ['gap-3'],
      },
      {
        id: 'dgb-p5',
        text: 'Article 6 (Digital Governance Authority): There is hereby established a Digital Governance Authority responsible for supervising compliance with this Law, issuing implementing guidelines, and receiving complaints from data subjects.',
        issueIds: ['gap-4'],
      },
      {
        id: 'dgb-p6',
        text: 'Article 14 (Notification of a data breach): A data controller shall notify the Digital Governance Authority within seventy-two hours of becoming aware of a personal data breach, and shall notify affected data subjects without undue delay where the breach is likely to result in a high risk to their rights.',
        issueIds: ['gap-5'],
      },
      {
        id: 'dgb-p7',
        text: 'Article 21 (Cross-border data transfer): Personal data may be transferred outside Rwanda only where the receiving country has been recognised as providing an adequate level of protection, or where the controller has adopted standard contractual clauses approved by the Digital Governance Authority.',
        issueIds: ['gap-6'],
      },
    ],
  },
  {
    billId: 'bill-ai-governance',
    paragraphs: [
      {
        id: 'aig-p1',
        text: 'A Bill entitled the Draft Law on Artificial Intelligence Governance and Accountability, tabled to set accountability, transparency and human-review requirements for automated decision-making systems used by public institutions.',
        issueIds: [],
      },
      {
        id: 'aig-p2',
        text: "Article 4 (Definitions): For the purposes of this Law, 'automated decision' means a decision produced wholly or in significant part by an artificial intelligence system without meaningful human input at the point of decision.",
        issueIds: ['gap-7'],
      },
      {
        id: 'aig-p3',
        text: 'Article 7 (Human review of automated decisions): A public institution shall not rely solely on an automated decision that produces legal or similarly significant effects on an individual unless a documented human review step is available to that individual on request.',
        issueIds: ['gap-8'],
      },
      {
        id: 'aig-p4',
        text: 'Article 11 (Cross-border AI training data): Where an artificial intelligence system is trained using personal data sourced outside Rwanda, the deploying institution shall verify that the data was obtained in accordance with the data protection standards of the country of origin and shall document that verification.',
        issueIds: ['gap-9'],
      },
      {
        id: 'aig-p5',
        text: 'Article 15 (AI Accountability Officer): Each public institution deploying a high-impact artificial intelligence system shall designate an AI Accountability Officer responsible for monitoring compliance with this Law.',
        issueIds: ['gap-10'],
      },
    ],
  },
];

export const gapIssues: GapIssue[] = [
  {
    id: 'gap-1',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p2',
    articleRef: 'Article 1',
    severity: 'moderate',
    category: 'Vague Phrasing',
    title: "Undefined term 'national digital ecosystem'",
    description:
      "The scope clause relies on 'national digital ecosystem', a term not defined anywhere in the Bill, leaving the boundary of covered entities open to interpretation.",
    suggestedFix: "Add a definition of 'national digital ecosystem' in Article 9, or replace the phrase with an enumerated list of covered sectors.",
    status: 'pending',
  },
  {
    id: 'gap-2',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p3',
    articleRef: 'Article 9',
    severity: 'critical',
    category: 'Missing Coverage',
    title: "No distinct category for 'sensitive personal data'",
    description:
      'Unlike comparable data protection instruments, the Bill does not create a heightened protection category for sensitive data such as health, biometric, or genetic data, which normally require explicit consent and additional safeguards.',
    suggestedFix: "Introduce a 'sensitive personal data' definition and a corresponding Article requiring explicit consent and additional security measures for its processing.",
    status: 'pending',
  },
  {
    id: 'gap-3',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p4',
    articleRef: 'Article 5',
    severity: 'moderate',
    category: 'Vague Phrasing',
    title: "'Specific and informed consent' lacks a mechanism",
    description:
      'The Article requires consent to be free, specific and informed but does not specify how consent must be captured or evidenced (e.g. affirmative action, record-keeping), creating enforcement ambiguity.',
    suggestedFix: 'Specify that consent must be recorded through an affirmative action and that controllers must retain evidence of consent for a minimum retention period.',
    status: 'accepted',
  },
  {
    id: 'gap-4',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p5',
    articleRef: 'Article 6',
    severity: 'minor',
    category: 'Vague Phrasing',
    title: 'Appointment process for the Authority is unstated',
    description: 'The Article establishes the Digital Governance Authority but does not specify how its leadership is appointed or to whom it reports.',
    suggestedFix: 'Add a sub-article on appointment, tenure and reporting lines for the head of the Authority.',
    status: 'pending',
  },
  {
    id: 'gap-5',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p6',
    articleRef: 'Article 14',
    severity: 'critical',
    category: 'Loophole',
    title: 'No penalty specified for late or missed breach notification',
    description:
      'The seventy-two hour notification duty carries no stated consequence for non-compliance, which risks the obligation being unenforceable in practice.',
    suggestedFix: 'Cross-reference the penalties chapter to attach a specific administrative fine for failure to notify within the required window.',
    status: 'pending',
  },
  {
    id: 'gap-6',
    billId: 'bill-digital-governance',
    paragraphId: 'dgb-p7',
    articleRef: 'Article 21',
    severity: 'moderate',
    category: 'Misaligned Intent',
    title: 'Cross-border transfer threshold inconsistent with AI governance bill',
    description:
      'This Article requires an adequacy decision or approved contractual clauses for any cross-border transfer, while Article 11 of the AI governance bill only requires the deploying institution to self-verify the source country\'s standards for AI training data - a lower bar for what is functionally the same transfer risk.',
    suggestedFix: 'Align the cross-border transfer standard applied to AI training data with Article 21, or explicitly carve out and justify the exception.',
    status: 'rejected',
  },
  {
    id: 'gap-7',
    billId: 'bill-ai-governance',
    paragraphId: 'aig-p2',
    articleRef: 'Article 4',
    severity: 'moderate',
    category: 'Vague Phrasing',
    title: "'Significant part' is not quantified",
    description: "The definition of 'automated decision' turns on whether an AI system contributed 'in significant part', without guidance on how significance is assessed.",
    suggestedFix: 'Provide illustrative criteria (e.g. decision-weight, ability of a human reviewer to override the output) to operationalise the significance test.',
    status: 'pending',
  },
  {
    id: 'gap-8',
    billId: 'bill-ai-governance',
    paragraphId: 'aig-p3',
    articleRef: 'Article 7',
    severity: 'critical',
    category: 'Loophole',
    title: "Human review is available 'on request' only",
    description:
      'Making human review available only on request places the burden on the affected individual to know their rights and to ask, rather than requiring proactive review for higher-risk automated decisions.',
    suggestedFix: 'Require proactive human review for decisions above a defined risk threshold, reserving the on-request pathway for lower-risk decisions.',
    status: 'pending',
  },
  {
    id: 'gap-9',
    billId: 'bill-ai-governance',
    paragraphId: 'aig-p4',
    articleRef: 'Article 11',
    severity: 'critical',
    category: 'Missing Coverage',
    title: 'Self-verification standard weaker than the general data protection regime',
    description:
      'The Bill asks institutions to "verify and document" a foreign source\'s standards without requiring an adequacy decision or standard contractual clauses, unlike the general cross-border transfer rule in the digital governance bill.',
    suggestedFix: 'Require the same adequacy/contractual-safeguards standard as the digital governance bill for any personal data used in AI training.',
    status: 'accepted',
  },
  {
    id: 'gap-10',
    billId: 'bill-ai-governance',
    paragraphId: 'aig-p5',
    articleRef: 'Article 15',
    severity: 'minor',
    category: 'Vague Phrasing',
    title: "'High-impact' AI system is undefined",
    description: 'The obligation to designate an AI Accountability Officer applies only to "high-impact" systems, a threshold that is not defined anywhere in the Bill.',
    suggestedFix: 'Define "high-impact artificial intelligence system" with reference to the scale of individuals affected or the sensitivity of the decision domain.',
    status: 'pending',
  },
];

export function getAnnotatedBill(billId: string): AnnotatedBill | undefined {
  return annotatedBills.find((a) => a.billId === billId);
}

export function issuesForBill(billId: string): GapIssue[] {
  return gapIssues.filter((i) => i.billId === billId);
}
