// Mock legislative corpus for the Parliament AI System demo.
// All titles, article numbers and excerpt text below are illustrative and
// written for demonstration purposes only - they are NOT verified citations
// of real, currently gazetted Rwandan law.

import { Bill, BillArticle } from '../lib/types';

export const bills: Bill[] = [
  {
    id: 'law-data-protection',
    title: 'Law on the Protection of Personal Data and Privacy',
    kind: 'law',
    status: 'enacted',
    lastUpdated: '2022-03-14',
    summary:
      'Establishes general obligations for data controllers and processors, lawful bases for processing, and the rights of data subjects, including breach notification duties.',
    articles: [
      {
        id: 'law-data-protection-3',
        number: '3',
        heading: 'Definitions',
        text: "For the purposes of this Law, 'personal data' means any information relating to an identified or identifiable natural person, and 'processing' means any operation performed on personal data, whether automated or not.",
      },
      {
        id: 'law-data-protection-9',
        number: '9',
        heading: 'Lawful basis for processing',
        text: 'A data controller shall process personal data only where the data subject has given consent, where processing is necessary for the performance of a contract, or where processing is required to comply with a legal obligation.',
      },
      {
        id: 'law-data-protection-22',
        number: '22',
        heading: 'Notification of a data breach',
        text: 'Where a personal data breach is likely to result in a risk to the rights of a data subject, the controller shall notify the supervisory authority without undue delay and, where feasible, within seventy-two hours of becoming aware of the breach.',
      },
      {
        id: 'law-data-protection-31',
        number: '31',
        heading: 'Cross-border transfer of personal data',
        text: 'Personal data may be transferred to a third country only where that country ensures an adequate level of protection, or where appropriate contractual safeguards have been put in place by the controller.',
      },
    ],
  },
  {
    id: 'law-electronic-transactions',
    title: 'Law Governing Electronic Transactions and Electronic Signatures',
    kind: 'law',
    status: 'enacted',
    lastUpdated: '2021-11-02',
    summary:
      'Recognises the legal validity of electronic documents, electronic signatures and electronic contracts, and sets minimum reliability standards for signature creation data.',
    articles: [
      {
        id: 'law-electronic-transactions-5',
        number: '5',
        heading: 'Legal recognition of electronic documents',
        text: 'Information shall not be denied legal effect solely on the grounds that it is in electronic form.',
      },
      {
        id: 'law-electronic-transactions-8',
        number: '8',
        heading: 'Electronic signatures',
        text: 'An electronic signature satisfies a requirement for a signature where the signature creation data is, within the context in which it is used, linked to the signatory and to no other person, and any subsequent change to the signed data is detectable.',
      },
      {
        id: 'law-electronic-transactions-14',
        number: '14',
        heading: 'Consent to electronic contracting',
        text: 'A party shall not be bound by an electronic contract unless that party has expressly or by conduct consented to conduct the transaction by electronic means.',
      },
    ],
  },
  {
    id: 'law-local-administrative-entities',
    title: 'Law Determining the Organisation and Functioning of Local Administrative Entities',
    kind: 'law',
    status: 'enacted',
    lastUpdated: '2020-06-18',
    summary:
      'Sets out the structure, competences and reporting lines of local administrative entities, including their role in coordinating digital service delivery at district level.',
    articles: [
      {
        id: 'law-local-administrative-entities-12',
        number: '12',
        heading: 'Digital service delivery coordination',
        text: 'Each district shall designate a focal point responsible for coordinating the delivery of digital public services within its jurisdiction, in liaison with the relevant national authority.',
      },
      {
        id: 'law-local-administrative-entities-19',
        number: '19',
        heading: 'Record keeping',
        text: 'Local administrative entities shall maintain records of decisions and administrative acts in a manner that allows for their retrieval for a minimum of ten years.',
      },
    ],
  },
  {
    id: 'bill-digital-governance',
    title: 'Draft Law on Digital Governance and Data Protection',
    kind: 'bill',
    status: 'in_committee',
    committee: 'Committee on ICT, Innovation and Digital Economy',
    sponsor: 'Ministry of ICT and Innovation (MINICT)',
    lastUpdated: '2026-07-10',
    summary:
      'Consolidates data protection, breach notification and cross-border data transfer rules for public and private data controllers, and establishes a Digital Governance Authority to supervise compliance.',
    articles: [
      {
        id: 'bill-digital-governance-1',
        number: '1',
        heading: 'Purpose and scope',
        text: 'This Law governs the collection, processing, storage and transfer of digital and personal data by public institutions and private entities operating within the national digital ecosystem.',
      },
      {
        id: 'bill-digital-governance-5',
        number: '5',
        heading: 'Consent for electronic data collection',
        text: 'A data controller collecting personal data through a digital service shall obtain the free, specific and informed consent of the data subject prior to processing, except where another lawful basis under this Law applies.',
      },
      {
        id: 'bill-digital-governance-6',
        number: '6',
        heading: 'Digital Governance Authority',
        text: 'There is hereby established a Digital Governance Authority responsible for supervising compliance with this Law, issuing implementing guidelines, and receiving complaints from data subjects.',
      },
      {
        id: 'bill-digital-governance-9',
        number: '9',
        heading: 'Definitions',
        text: "In this Law, 'personal data' means any information relating to an identified or identifiable natural person, whether held in digital or physical form.",
      },
      {
        id: 'bill-digital-governance-14',
        number: '14',
        heading: 'Notification of a data breach',
        text: 'A data controller shall notify the Digital Governance Authority within seventy-two hours of becoming aware of a personal data breach, and shall notify affected data subjects without undue delay where the breach is likely to result in a high risk to their rights.',
      },
      {
        id: 'bill-digital-governance-21',
        number: '21',
        heading: 'Cross-border data transfer',
        text: 'Personal data may be transferred outside Rwanda only where the receiving country has been recognised as providing an adequate level of protection, or where the controller has adopted standard contractual clauses approved by the Digital Governance Authority.',
      },
    ],
  },
  {
    id: 'bill-ai-governance',
    title: 'Draft Law on Artificial Intelligence Governance and Accountability',
    kind: 'bill',
    status: 'first_reading',
    committee: 'Committee on ICT, Innovation and Digital Economy',
    sponsor: 'Ministry of ICT and Innovation (MINICT)',
    lastUpdated: '2026-06-28',
    summary:
      'Sets accountability, transparency and human-review requirements for the design, deployment and procurement of automated decision-making and artificial intelligence systems by public institutions.',
    articles: [
      {
        id: 'bill-ai-governance-4',
        number: '4',
        heading: 'Definitions',
        text: "For the purposes of this Law, 'automated decision' means a decision produced wholly or in significant part by an artificial intelligence system without meaningful human input at the point of decision.",
      },
      {
        id: 'bill-ai-governance-7',
        number: '7',
        heading: 'Human review of automated decisions',
        text: 'A public institution shall not rely solely on an automated decision that produces legal or similarly significant effects on an individual unless a documented human review step is available to that individual on request.',
      },
      {
        id: 'bill-ai-governance-11',
        number: '11',
        heading: 'Cross-border AI training data',
        text: 'Where an artificial intelligence system is trained using personal data sourced outside Rwanda, the deploying institution shall verify that the data was obtained in accordance with the data protection standards of the country of origin and shall document that verification.',
      },
      {
        id: 'bill-ai-governance-15',
        number: '15',
        heading: 'AI Accountability Officer',
        text: 'Each public institution deploying a high-impact artificial intelligence system shall designate an AI Accountability Officer responsible for monitoring compliance with this Law.',
      },
    ],
  },
  {
    id: 'bill-drafting-office',
    title: 'Draft Law Establishing the Legislative Drafting and Quality Assurance Office',
    kind: 'bill',
    status: 'draft',
    committee: 'Committee on Political Affairs and Governance',
    sponsor: "Office of the Clerk, Chamber of Deputies",
    lastUpdated: '2026-07-02',
    summary:
      'Creates a standing legislative drafting and quality assurance office responsible for pre-tabling review of bills, including duplication checks, gap analysis, and comparative legislation research.',
    articles: [
      {
        id: 'bill-drafting-office-2',
        number: '2',
        heading: 'Establishment',
        text: 'There is hereby established, within the Parliamentary Service, a Legislative Drafting and Quality Assurance Office.',
      },
      {
        id: 'bill-drafting-office-3',
        number: '3',
        heading: 'Functions of the Office',
        text: 'The Office shall review every bill referred to committee for internal consistency, duplication with existing law, and alignment with its stated policy intent, prior to first reading.',
      },
      {
        id: 'bill-drafting-office-6',
        number: '6',
        heading: 'Use of decision-support tools',
        text: 'The Office may use automated decision-support tools to assist its review, provided that any finding produced by such a tool is presented to a member of the Office for human confirmation before being reported to a committee.',
      },
    ],
  },
];

export function getBill(billId: string): Bill | undefined {
  return bills.find((b) => b.id === billId);
}

export function getArticle(billId: string, articleNumber: string): BillArticle | undefined {
  return getBill(billId)?.articles.find((a) => a.number === articleNumber);
}

export const draftBills = bills.filter((b) => b.kind === 'bill');
export const enactedLaws = bills.filter((b) => b.kind === 'law');
