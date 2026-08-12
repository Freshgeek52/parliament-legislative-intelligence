import { DuplicationOverlap } from '../lib/types';

export const duplicationOverlaps: DuplicationOverlap[] = [
  {
    id: 'dup-1',
    draftBillId: 'bill-digital-governance',
    draftArticleNumber: '14',
    matchedBillId: 'law-data-protection',
    matchedArticleNumber: '22',
    similarity: 92,
    overlapType: 'duplicate',
    summary:
      'Both articles set an identical seventy-two hour breach notification window but direct notification to different authorities, creating a duplicate obligation with two regulators.',
  },
  {
    id: 'dup-2',
    draftBillId: 'bill-digital-governance',
    draftArticleNumber: '9',
    matchedBillId: 'law-data-protection',
    matchedArticleNumber: '3',
    similarity: 78,
    overlapType: 'redundant',
    summary:
      "The bill's definition of 'personal data' closely restates the existing law's definition. Consider incorporating by reference instead of redefining.",
  },
  {
    id: 'dup-3',
    draftBillId: 'bill-digital-governance',
    draftArticleNumber: '21',
    matchedBillId: 'bill-ai-governance',
    matchedArticleNumber: '11',
    similarity: 65,
    overlapType: 'contradictory',
    summary:
      'The digital governance bill requires an adequacy decision or standard contractual clauses for any cross-border transfer, while the AI governance bill only requires the deploying institution to "verify and document" the source country\'s standards for AI training data - a materially lower bar for the same underlying data flow.',
  },
  {
    id: 'dup-4',
    draftBillId: 'bill-digital-governance',
    draftArticleNumber: '5',
    matchedBillId: 'law-electronic-transactions',
    matchedArticleNumber: '14',
    similarity: 54,
    overlapType: 'overlapping',
    summary:
      'Consent requirements for electronic data collection in the bill partially overlap with existing consent-to-contract rules for electronic transactions; scope should be clarified to avoid parallel consent regimes.',
  },
  {
    id: 'dup-5',
    draftBillId: 'bill-ai-governance',
    draftArticleNumber: '4',
    matchedBillId: 'bill-digital-governance',
    matchedArticleNumber: '9',
    similarity: 47,
    overlapType: 'overlapping',
    summary:
      "Both bills define related but distinct concepts ('automated decision' vs 'personal data') in similarly structured definition clauses; low overlap, flagged for drafting consistency only.",
  },
];

export function overlapsForBill(billId: string): DuplicationOverlap[] {
  return duplicationOverlaps
    .filter((o) => o.draftBillId === billId)
    .sort((a, b) => b.similarity - a.similarity);
}
