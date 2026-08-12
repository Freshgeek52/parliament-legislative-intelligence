import Cookies from 'js-cookie';
import { Role } from './types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  mp: 'Member of Parliament',
  legal_drafter: 'Legal Drafter',
  research_staff: 'Research & Committee Staff',
  oversight_unit: 'Legislative Oversight Unit',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  mp: 'Sponsors and reviews bills, requests drafting support, and signs off on committee findings.',
  legal_drafter: 'Drafts and edits bill text, resolves flagged issues, and prepares clauses for committee.',
  research_staff: 'Researches the knowledge base, prepares briefs, and flags issues for drafter review.',
  oversight_unit: 'Monitors AI-assisted drafting quality and audits accept/reject decisions across bills.',
};

// Mock, role-scoped identities. There is no real backend - selecting a role
// simply signs in as a pre-defined demo user with that role.
const ROLE_USERS: Record<Role, AuthUser> = {
  mp: {
    id: 'u-mp-01',
    name: 'Hon. Aline Uwase',
    email: 'a.uwase@parliament.gov.rw',
    role: 'mp',
  },
  legal_drafter: {
    id: 'u-ld-01',
    name: 'Jean de Dieu Habimana',
    email: 'jd.habimana@parliament.gov.rw',
    role: 'legal_drafter',
  },
  research_staff: {
    id: 'u-rs-01',
    name: 'Claudine Mukamana',
    email: 'c.mukamana@parliament.gov.rw',
    role: 'research_staff',
  },
  oversight_unit: {
    id: 'u-ou-01',
    name: 'Eric Bimenyimana',
    email: 'e.bimenyimana@parliament.gov.rw',
    role: 'oversight_unit',
  },
};

const COOKIE_NAME = 'pai-auth';
const SESSION_HOURS = 24;

export const login = async (role: Role): Promise<{ success: boolean; user: AuthUser }> => {
  // Simulate network latency for a realistic mock sign-in.
  await new Promise((resolve) => setTimeout(resolve, 500));
  const user = ROLE_USERS[role];
  const payload = { ...user, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 };
  Cookies.set(COOKIE_NAME, JSON.stringify(payload), { expires: 1 });
  return { success: true, user };
};

export const logout = (): void => {
  Cookies.remove(COOKIE_NAME);
};

export const getCurrentUser = (): AuthUser | null => {
  const raw = Cookies.get(COOKIE_NAME);
  if (!raw) return null;
  try {
    const decoded = JSON.parse(raw);
    if (!decoded.exp || decoded.exp < Date.now()) {
      logout();
      return null;
    }
    const { exp, ...user } = decoded;
    return user as AuthUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => getCurrentUser() !== null;

// Superficial, per-role permissions used to gate human-in-the-loop actions
// across the demo (e.g. accepting/rejecting AI suggestions).
export const canModifySuggestions = (role: Role): boolean =>
  role === 'legal_drafter' || role === 'mp';

export const canDraftText = (role: Role): boolean => role === 'legal_drafter';

export const isOversight = (role: Role): boolean => role === 'oversight_unit';
