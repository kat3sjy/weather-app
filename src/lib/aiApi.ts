import type { Profile, ProfileAnalysis, MatchScore } from '../types/ai';
import type { User } from '../store/userStore';

const API_BASE = '/api/ai';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error || `Request failed: ${res.status}`);
    } catch {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function profileToUser(p: Profile) {
  const name = p.name || '';
  const [firstName, ...rest] = String(name).split(/\s+/).filter(Boolean);
  return {
    id: p.id || `p-${Math.random().toString(36).slice(2, 8)}`,
    username: slugify(`${name || 'profile'}-${p.id || ''}`) || `profile-${Date.now()}`,
    firstName: firstName || name || 'User',
    lastName: rest.join(' ') || '',
    bio: p.bio || '',
    areas: Array.isArray(p.interests) ? p.interests : [],
    goals: '',
    experienceLevel: 'unknown',
    location: '',
    createdAt: new Date().toISOString(),
  };
}

export type ProfileAnalysis = {
  strengths: string[];
  interests: string[];
  suggestedRoles: string[];
  matchCriteria: string[];
  summary: string;
};

export type AIStatus = {
  configured: boolean;
  model?: string;
  startedAt?: string;
  envModel?: string | null;
  defaultUsed?: boolean;
  cwd?: string;
  lastError?: string | null;
  lastModelUsed?: string | null;
};

export async function getAIStatus(): Promise<AIStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json() as Promise<AIStatus>;
}

function normalizeSummary(payload: any): string {
  const raw =
    payload?.summary ??
    payload?.paragraph ??
    payload?.text ??
    payload?.analysis?.summary ??
    '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

// Heuristic: fallback strings are short and lack sentence punctuation.
export function isLikelyFallbackSummary(s: string): boolean {
  const text = (s || '').trim();
  if (!text) return true;
  const hasPeriod = /[.!?]/.test(text);
  return text.length < 100 || !hasPeriod;
}

export async function analyzeProfile(profile: Profile): Promise<ProfileAnalysis> {
  const modelHint = (import.meta?.env as any)?.VITE_GEMINI_MODEL || undefined;
  const debug = (import.meta?.env as any)?.VITE_AI_DEBUG === '1';
  const path = debug ? '/analyze?debug=1' : '/analyze';
  const data = await postJson<unknown>(path, {
    user: profileToUser(profile),
    modelHint,
  });
  const normalized: ProfileAnalysis = {
    ...(data as any),
    summary: normalizeSummary(data),
  };
  return normalized;
}

export async function scoreCompatibility(a: Profile, b: Profile): Promise<MatchScore> {
  return postJson<MatchScore>('/score', { a: profileToUser(a), b: profileToUser(b) });
}
