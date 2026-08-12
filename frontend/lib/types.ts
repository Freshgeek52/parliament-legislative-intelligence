// Shared domain types for the Parliament AI System demo frontend.
// All data conforming to these types (see /data) is illustrative mock content
// created for demonstration purposes only.

export type Role = 'mp' | 'legal_drafter' | 'research_staff' | 'oversight_unit';

export type BillStatus = 'draft' | 'in_committee' | 'first_reading' | 'enacted';
export type BillKind = 'law' | 'bill';

export interface BillArticle {
  id: string;
  number: string;
  heading: string;
  text: string;
}

export interface Bill {
  id: string;
  title: string;
  kind: BillKind;
  status: BillStatus;
  committee?: string;
  sponsor?: string;
  lastUpdated: string; // ISO date
  summary: string;
  articles: BillArticle[];
}

export interface KBDocument {
  id: string;
  title: string;
  type: 'law' | 'bill' | 'hansard' | 'committee_report';
  refId?: string;
  date?: string;
  excerpt?: string;
}

export interface KBCollection {
  id: string;
  name: string;
  documents: KBDocument[];
}

export interface Citation {
  billId: string;
  billTitle: string;
  articleNumber: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  timestamp: string; // ISO date
}

export type OverlapType = 'duplicate' | 'contradictory' | 'redundant' | 'overlapping';

export interface DuplicationOverlap {
  id: string;
  draftBillId: string;
  draftArticleNumber: string;
  matchedBillId: string;
  matchedArticleNumber: string;
  similarity: number; // 0-100
  overlapType: OverlapType;
  summary: string;
}

export type GapSeverity = 'critical' | 'moderate' | 'minor';
export type GapStatus = 'pending' | 'accepted' | 'rejected';

export interface GapParagraph {
  id: string;
  text: string;
  issueIds: string[];
}

export interface AnnotatedBill {
  billId: string;
  paragraphs: GapParagraph[];
}

export interface GapIssue {
  id: string;
  billId: string;
  paragraphId: string;
  articleRef: string;
  severity: GapSeverity;
  category: string;
  title: string;
  description: string;
  suggestedFix: string;
  status: GapStatus;
}

export interface CountryComparison {
  country: string;
  countryCode: string;
  instrument: string;
  provisionSummary: string;
  approachNote: string;
}

export interface ComparativeTopic {
  id: string;
  name: string;
  relatedBillId: string;
  description: string;
  countries: CountryComparison[];
  aiTakeaway: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO date
  actorName: string;
  actorRole: Role;
  module: string;
  action: string;
  target: string;
  details?: string;
}
