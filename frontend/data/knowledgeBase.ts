import { KBCollection } from '../lib/types';
import { bills } from './bills';

const lawDocs = bills
  .filter((b) => b.kind === 'law')
  .map((b) => ({
    id: `kb-${b.id}`,
    title: b.title,
    type: 'law' as const,
    refId: b.id,
    date: b.lastUpdated,
    excerpt: b.summary,
  }));

const billDocs = bills
  .filter((b) => b.kind === 'bill')
  .map((b) => ({
    id: `kb-${b.id}`,
    title: b.title,
    type: 'bill' as const,
    refId: b.id,
    date: b.lastUpdated,
    excerpt: b.summary,
  }));

export const knowledgeBase: KBCollection[] = [
  {
    id: 'kb-laws',
    name: 'Laws in Force',
    documents: lawDocs,
  },
  {
    id: 'kb-bills',
    name: 'Draft Bills',
    documents: billDocs,
  },
  {
    id: 'kb-hansard',
    name: 'Hansard Records',
    documents: [
      {
        id: 'hansard-2026-07-08',
        title: 'Plenary Sitting — Second Reading Debate, 08 July 2026',
        type: 'hansard',
        date: '2026-07-08',
        excerpt: 'Debate on the Draft Law on Digital Governance and Data Protection, focusing on breach notification timelines.',
      },
      {
        id: 'hansard-2026-06-20',
        title: 'Plenary Sitting — Committee Referral, 20 June 2026',
        type: 'hansard',
        date: '2026-06-20',
        excerpt: 'Referral of the Draft Law on Artificial Intelligence Governance and Accountability to the ICT Committee.',
      },
    ],
  },
  {
    id: 'kb-committee-reports',
    name: 'Committee Reports',
    documents: [
      {
        id: 'report-ict-2026-05',
        title: 'ICT Committee Interim Report on Digital Governance Bill',
        type: 'committee_report',
        date: '2026-05-30',
        excerpt: 'Interim findings on consistency between the digital governance bill and the existing data protection law.',
      },
      {
        id: 'report-oversight-2026-06',
        title: 'Oversight Unit Quality Note — AI Governance Bill',
        type: 'committee_report',
        date: '2026-06-15',
        excerpt: 'Quality assurance note flagging vague phrasing in the human-review provisions of the AI governance bill.',
      },
    ],
  },
];
