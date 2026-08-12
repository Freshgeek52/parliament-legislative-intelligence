// API client for the Legislative Intelligence backend.
//
// Every function targets the FastAPI backend (backend/api/app.py), whose
// responses match the shapes in lib/types.ts. Base URL is configured via
// NEXT_PUBLIC_API_BASE_URL (see .env.local.example). All calls degrade
// gracefully: callers pass a fallback so pages still render if the backend
// is offline (the app was mock-only before this integration).

import {
  Bill,
  ChatMessage,
  DuplicationOverlap,
  GapIssue,
  AnnotatedBill,
  ComparativeTopic,
  AuditEntry,
  KBCollection,
  Role,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function post<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const api = {
  baseUrl: BASE,

  async health() {
    return get<{ status: string; laws_in_force?: number; full_text_laws?: number; llm?: any }>(
      '/api/health',
      { status: 'offline' }
    );
  },

  async getBill(billId: string, lang = 'en'): Promise<Bill | null> {
    return get<Bill | null>(`/api/bills/${billId}?lang=${lang}`, null);
  },

  async listDrafts(): Promise<Bill[]> {
    const r = await get<{ bills: Bill[] }>('/api/bills', { bills: [] });
    return r.bills;
  },

  async listLaws(params: { q?: string; category?: string; limit?: number; offset?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.category) qs.set('category', params.category);
    qs.set('limit', String(params.limit ?? 50));
    qs.set('offset', String(params.offset ?? 0));
    return get<{ total: number; laws: Bill[] }>(`/api/laws?${qs}`, { total: 0, laws: [] });
  },

  async knowledgeBase(): Promise<KBCollection[]> {
    const r = await get<{ collections: KBCollection[] }>('/api/knowledge-base', { collections: [] });
    return r.collections;
  },

  async chat(message: string, lang = 'en', lawIds?: string[]): Promise<ChatMessage & { grounded?: boolean; model?: string }> {
    return post(
      '/api/assistant/chat',
      { message, lang, lawIds },
      {
        id: `a-${Date.now()}`,
        role: 'assistant' as const,
        text: 'The assistant backend is not reachable right now. Please ensure the API is running.',
        citations: [],
        timestamp: new Date().toISOString(),
      }
    );
  },

  async duplication(billId: string): Promise<DuplicationOverlap[]> {
    const r = await get<{ overlaps: DuplicationOverlap[] }>(`/api/duplication/${billId}`, { overlaps: [] });
    return r.overlaps;
  },

  async gaps(billId: string): Promise<{ annotated: AnnotatedBill; issues: GapIssue[] }> {
    return get(`/api/gaps/${billId}`, { annotated: { billId, paragraphs: [] }, issues: [] });
  },

  async comparativeTopics() {
    const r = await get<{ topics: Pick<ComparativeTopic, 'id' | 'name' | 'relatedBillId' | 'description'>[] }>(
      '/api/comparative',
      { topics: [] }
    );
    return r.topics;
  },

  async comparativeTopic(topicId: string): Promise<ComparativeTopic | null> {
    return get<ComparativeTopic | null>(`/api/comparative/${topicId}`, null);
  },

  async auditLog(limit = 100): Promise<AuditEntry[]> {
    const r = await get<{ entries: AuditEntry[] }>(`/api/audit?limit=${limit}`, { entries: [] });
    return r.entries;
  },

  async postAudit(entry: { module: string; action: string; target: string; actorRole?: Role; details?: string }) {
    return post('/api/audit', entry, { ok: false });
  },

  async login(role: Role) {
    return post<{ user: { id: string; name: string; email: string; role: Role }; token: string } | null>(
      '/api/auth/login',
      { role },
      null
    );
  },
};
