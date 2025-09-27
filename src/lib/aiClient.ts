import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProfileAnalysis, MatchScore } from '../types/ai';
import type { User } from '../store/userStore';

const IS_DEV = import.meta?.env?.DEV ?? false;
const CLIENT_API_KEY = IS_DEV ? import.meta.env.VITE_GEMINI_API_KEY : undefined;
const CLIENT_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

let genAI: GoogleGenerativeAI | null = null;
try {
  if (CLIENT_API_KEY) genAI = new GoogleGenerativeAI(CLIENT_API_KEY);
} catch {
  genAI = null;
}

function ensureArray<T = string>(x: any): T[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean);
  if (typeof x === 'string') return x.split(',').map(s => s.trim()).filter(Boolean) as any;
  return [];
}

function fallbackAnalysis(user: User): ProfileAnalysis {
  const keywords = new Set<string>();
  user.areas?.forEach(a => keywords.add(a.toLowerCase()));
  user.bio?.split(/[\s,;.]+/).forEach(w => {
    if (w.length > 3) keywords.add(w.toLowerCase());
  });

  const strengths = Array.from(new Set([
    user.experienceLevel || 'beginner',
    ...(user.areas || []),
  ])).slice(0, 5);

  return {
    strengths,
    interests: Array.from(keywords).slice(0, 8),
    suggestedRoles: ['mentor', 'mentee', 'teammate'].slice(0, 3),
    matchCriteria: Array.from(new Set([...(user.areas || []), user.goals || ''])).filter(Boolean).slice(0, 6),
    summary: `Profile summary for @${user.username}: ${user.firstName} in ${user.location || 'unknown location'} with interests in ${user.areas?.join(', ') || 'various areas'}.`,
  };
}

export function isAIConfigured(): boolean {
  return Boolean(CLIENT_API_KEY);
}

function toPrompt(user: User): string {
  return [
    'You are assisting with matching compatible users for networking and collaboration.',
    'Given a single user profile, produce a concise JSON object with:',
    '- strengths: array of up to 5 short phrases',
    '- interests: array of up to 8 keywords',
    '- suggestedRoles: array of 2-4 short role labels',
    '- matchCriteria: array of 4-8 phrases helpful for compatibility matching',
    '- summary: 1-2 sentence human-friendly summary',
    'Focus on practical, non-personal, non-sensitive attributes from the provided fields.',
    '',
    'User Profile:',
    JSON.stringify({
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`.trim(),
      areas: user.areas,
      goals: user.goals,
      experienceLevel: user.experienceLevel,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
    }, null, 2),
    '',
    'Return only JSON with these exact fields: strengths, interests, suggestedRoles, matchCriteria, summary.',
  ].join('\n');
}

export async function analyzeProfile(user: User): Promise<ProfileAnalysis> {
  if (!genAI) return fallbackAnalysis(user);

  try {
    const model = genAI.getGenerativeModel({ model: CLIENT_MODEL });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: toPrompt(user) }]}],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text().trim();
    const parsed = JSON.parse(text);

    const analysis: ProfileAnalysis = {
      strengths: ensureArray(parsed.strengths),
      interests: ensureArray(parsed.interests),
      suggestedRoles: ensureArray(parsed.suggestedRoles),
      matchCriteria: ensureArray(parsed.matchCriteria),
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };

    // Fill any missing fields from fallback to ensure stability.
    const fb = fallbackAnalysis(user);
    return {
      strengths: analysis.strengths.length ? analysis.strengths : fb.strengths,
      interests: analysis.interests.length ? analysis.interests : fb.interests,
      suggestedRoles: analysis.suggestedRoles.length ? analysis.suggestedRoles : fb.suggestedRoles,
      matchCriteria: analysis.matchCriteria.length ? analysis.matchCriteria : fb.matchCriteria,
      summary: analysis.summary || fb.summary,
    };
  } catch {
    return fallbackAnalysis(user);
  }
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map(s => s.toLowerCase()));
  const B = new Set(b.map(s => s.toLowerCase()));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export async function scoreCompatibility(a: User, b: User): Promise<MatchScore> {
  const [pa, pb] = await Promise.all([analyzeProfile(a), analyzeProfile(b)]);
  const areasScore = jaccard(a.areas || [], b.areas || []);
  const interestsScore = jaccard(pa.interests, pb.interests);
  const criteriaScore = jaccard(pa.matchCriteria, pb.matchCriteria);

  const score = Math.min(1, (areasScore * 0.4) + (interestsScore * 0.35) + (criteriaScore * 0.25));

  const reasons: string[] = [];
  if (areasScore > 0) reasons.push(`Shared areas overlap ${(areasScore*100).toFixed(0)}%`);
  if (interestsScore > 0) reasons.push(`Interest similarity ${(interestsScore*100).toFixed(0)}%`);
  if (criteriaScore > 0) reasons.push(`Match criteria alignment ${(criteriaScore*100).toFixed(0)}%`);
  if (reasons.length === 0) reasons.push('Limited overlap inferred from profiles.');

  return { score, reasons };
}
