// Client-side persistence layer for the audit trail demo. Real accept /
// reject / comment actions taken while clicking through Duplication
// Detection and Gap & Intent Alignment are appended here (via
// localStorage) so they show up on the Audit Trail page across
// navigations, without needing a real backend.

import { AuditEntry, Role } from './types';
import { seedAuditLog } from '../data/audit';

const STORAGE_KEY = 'pai-audit-log';

function readLocalEntries(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function getAuditLog(): AuditEntry[] {
  const local = readLocalEntries();
  return [...local, ...seedAuditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function appendAuditEntry(entry: {
  actorName: string;
  actorRole: Role;
  module: string;
  action: string;
  target: string;
  details?: string;
}): void {
  if (typeof window === 'undefined') return;
  const local = readLocalEntries();
  const newEntry: AuditEntry = {
    ...entry,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([newEntry, ...local]));
  } catch {
    // ignore write failures (e.g. storage disabled)
  }
}
