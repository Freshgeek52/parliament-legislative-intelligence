// Very small, deterministic mock "AI" responder used by the Research &
// Drafting Assistant page. No model call is made - this simply pattern
// matches on the user's text and returns a canned answer with citations
// drawn from the mock bill corpus, so every answer can show a source chip.

import { Citation } from './types';
import { getArticle } from '../data/bills';

interface MockAnswer {
  keywords: string[];
  text: string;
  citations: Citation[];
}

function citation(billId: string, billTitle: string, articleNumber: string): Citation {
  const article = getArticle(billId, articleNumber);
  return {
    billId,
    billTitle,
    articleNumber,
    excerpt: article?.text ?? '',
  };
}

const ANSWERS: MockAnswer[] = [
  {
    keywords: ['data protection', 'personal data', 'privacy'],
    text:
      "The Draft Law on Digital Governance and Data Protection defines personal data broadly and requires data controllers to notify affected individuals within 72 hours of a confirmed breach. This mirrors, and in places tightens, the notification window already set out in the Law on the Protection of Personal Data and Privacy.",
    citations: [
      citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '14'),
      citation('law-data-protection', 'Law on the Protection of Personal Data and Privacy', '22'),
    ],
  },
  {
    keywords: ['breach', 'notification'],
    text:
      "Breach notification is addressed in Article 14 of the digital governance bill: controllers must notify the supervisory authority within 72 hours and affected data subjects 'without undue delay' where the breach is likely to result in high risk.",
    citations: [citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '14')],
  },
  {
    keywords: ['artificial intelligence', 'ai governance', 'automated decision'],
    text:
      "The Draft Law on Artificial Intelligence Governance and Accountability requires a documented human review step before any automated decision that produces legal or similarly significant effects on an individual, and assigns oversight to a designated AI accountability officer within each public institution.",
    citations: [
      citation('bill-ai-governance', 'Draft Law on Artificial Intelligence Governance and Accountability', '7'),
      citation('bill-ai-governance', 'Draft Law on Artificial Intelligence Governance and Accountability', '4'),
    ],
  },
  {
    keywords: ['cross-border', 'cross border', 'transfer'],
    text:
      "Cross-border data transfer conditions appear in Article 21 of the digital governance bill (adequacy decision or contractual safeguards) and, separately, in Article 11 of the AI governance bill for AI training data flows. Committee staff have flagged a possible inconsistency between the two thresholds worth reconciling before first reading.",
    citations: [
      citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '21'),
      citation('bill-ai-governance', 'Draft Law on Artificial Intelligence Governance and Accountability', '11'),
    ],
  },
  {
    keywords: ['electronic signature', 'electronic transaction', 'e-signature'],
    text:
      "Electronic signatures are recognised as legally equivalent to handwritten signatures under Article 8 of the Law Governing Electronic Transactions and Electronic Signatures, provided the signature creation data is uniquely linked to the signatory.",
    citations: [citation('law-electronic-transactions', 'Law Governing Electronic Transactions and Electronic Signatures', '8')],
  },
  {
    keywords: ['drafting office', 'quality assurance', 'legislative drafting'],
    text:
      "The Draft Law Establishing the Legislative Drafting and Quality Assurance Office proposes a standing unit responsible for pre-tabling quality checks, including duplication and gap analysis, on every bill referred to committee.",
    citations: [citation('bill-drafting-office', 'Draft Law Establishing the Legislative Drafting and Quality Assurance Office', '3')],
  },
  {
    keywords: ['summarise', 'summarize', 'summary'],
    text:
      "Here is a short summary: the Draft Law on Digital Governance and Data Protection consolidates data protection, breach notification and cross-border transfer rules for both public and private data controllers, and creates a new Digital Governance Authority to supervise compliance.",
    citations: [
      citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '1'),
      citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '6'),
    ],
  },
];

const FALLBACK: MockAnswer = {
  keywords: [],
  text:
    "I found related material in the knowledge base. The Draft Law on Digital Governance and Data Protection is the closest match: its early articles set out scope and key definitions, and later articles cover breach notification and cross-border transfers. Try asking about a specific article or topic for a more targeted answer.",
  citations: [citation('bill-digital-governance', 'Draft Law on Digital Governance and Data Protection', '1')],
};

export function generateMockResponse(userText: string): { text: string; citations: Citation[] } {
  const lower = userText.toLowerCase();
  const match = ANSWERS.find((answer) => answer.keywords.some((kw) => lower.includes(kw)));
  const chosen = match ?? FALLBACK;
  return { text: chosen.text, citations: chosen.citations };
}
