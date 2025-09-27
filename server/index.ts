import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-pro';

const app = express();
app.use(cors());
app.use(express.json());

const SERVER_STARTED_AT = new Date().toISOString();

// After you create the Express app (or before listen), add a one-time boot log:
const aiConfigured = !!process.env.GEMINI_API_KEY;
const aiEnvModel = process.env.GEMINI_MODEL || '(unset)';
console.log(
  `[AI] configured=${aiConfigured} model(env)=${aiEnvModel} default=gemini-1.5-pro cwd=${process.cwd()}`
);

// Track last AI error/model for diagnostics
let LAST_AI_ERROR: string | null = null;
let LAST_MODEL_USED: string | null = null;

// Minimal types (keep server self-contained)
type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  areas: string[];
  goals: string;
  experienceLevel: string;
  bio: string;
  location: string;
  createdAt: string;
};

type ProfileAnalysis = {
  strengths: string[];
  interests: string[];
  suggestedRoles: string[];
  matchCriteria: string[];
  summary: string;
};

type MatchScore = { score: number; reasons: string[] };

function ensureArray(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  if (typeof x === 'string') return x.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function fallbackAnalysis(user: User): ProfileAnalysis {
  const words = new Set<string>();
  (user.areas || []).forEach(a => words.add(a.toLowerCase()));
  (user.bio || '').split(/[\s,;.]+/).forEach(w => { if (w.length > 3) words.add(w.toLowerCase()); });

  const strengths = Array.from(new Set([user.experienceLevel || 'beginner', ...(user.areas || [])])).slice(0, 5);
  const areasText = (user.areas && user.areas.length) ? user.areas.join(', ') : 'a variety of areas';
  const parts: string[] = [];
  parts.push(`${user.firstName} (@${user.username}) ${user.location ? `in ${user.location}` : 'in an unspecified location'}.`);
  parts.push(`Interests include ${areasText}.`);
  if (user.goals) parts.push(`Goals: ${user.goals}.`);
  if (user.experienceLevel) parts.push(`Experience level: ${user.experienceLevel}.`);
  return {
    strengths,
    interests: Array.from(words).slice(0, 8),
    suggestedRoles: ['mentor', 'mentee', 'teammate'],
    matchCriteria: Array.from(new Set([...(user.areas || []), user.goals || ''])).filter(Boolean).slice(0, 6),
    summary: parts.join(' ')
  };
}

function toPrompt(user: User): string {
  return [
    'You assist with matching compatible users.',
    'Return a JSON with fields: strengths, interests, suggestedRoles, matchCriteria, summary.',
    'The "summary" must be a single paragraph (2-4 sentences) in natural language; no bullet points, no markdown.',
    'Base your output only on provided fields.',
    '',
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
    }, null, 2)
  ].join('\n');
}

function tryParseJsonLoose(text: string): any | null {
  if (!text) return null;
  const cleaned = String(text).replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function analyze(user: User, opts?: { modelHint?: string; debug?: boolean }): Promise<ProfileAnalysis & { _meta?: any }> {
  const modelToUse = (opts?.modelHint && String(opts.modelHint).trim()) || MODEL_ID;
  LAST_MODEL_USED = modelToUse;

  const dbg = !!opts?.debug;
  if (!GEMINI_API_KEY) {
    const fb = fallbackAnalysis(user);
    if (dbg) console.log(`[AI] fallback(no_api_key) model=${modelToUse} user=${user.username}`);
    return { ...fb, _meta: { usedFallback: true, reason: 'no_api_key', model: modelToUse, configured: false } };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const prompt = toPrompt(user);
    if (dbg) console.log(`[AI] analyze request model=${modelToUse} user=${user.username} promptChars=${prompt.length}`);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800, responseMimeType: 'application/json' }
    });
    const text = result.response.text().trim();
    if (dbg) console.log(`[AI] raw(len=${text.length}) ${text.slice(0, 200).replace(/\n/g, ' ')}${text.length > 200 ? '…' : ''}`);
    const parsed = tryParseJsonLoose(text);
    if (!parsed) throw new Error('AI returned non-JSON payload');

    const out: ProfileAnalysis = {
      strengths: ensureArray(parsed.strengths),
      interests: ensureArray(parsed.interests),
      suggestedRoles: ensureArray(parsed.suggestedRoles),
      matchCriteria: ensureArray(parsed.matchCriteria),
      summary: typeof parsed.summary === 'string' ? parsed.summary : ''
    };
    const fb = fallbackAnalysis(user);
    const merged: ProfileAnalysis = {
      strengths: out.strengths.length ? out.strengths : fb.strengths,
      interests: out.interests.length ? out.interests : fb.interests,
      suggestedRoles: out.suggestedRoles.length ? out.suggestedRoles : fb.suggestedRoles,
      matchCriteria: out.matchCriteria.length ? out.matchCriteria : fb.matchCriteria,
      summary: out.summary || fb.summary
    };
    const usedFallback = !out.summary;
    if (dbg) console.log(`[AI] analyze ok model=${modelToUse} usedFallback=${usedFallback}`);
    return { ...merged, _meta: { usedFallback, reason: usedFallback ? 'empty_ai_summary' : null, model: modelToUse, configured: true } };
  } catch (err: any) {
    LAST_AI_ERROR = err?.message || String(err);
    console.error('[AI] analyze error:', LAST_AI_ERROR);
    const fb = fallbackAnalysis(user);
    return { ...fb, _meta: { usedFallback: true, reason: 'upstream_error', error: LAST_AI_ERROR, model: modelToUse, configured: true } };
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

app.post('/api/ai/analyze', async (req, res) => {
  const user: User = req.body?.user;
  const modelHint: string | undefined = req.body?.modelHint;
  const debugFlag = req.query?.debug === '1' || req.headers['x-debug'] === '1';
  if (!user || !user.id || !user.username) return res.status(400).json({ error: 'Invalid user payload' });
  const analysis = await analyze(user, { modelHint, debug: !!debugFlag });
  // Expose quick diagnostics via headers
  res.set('X-AI-Model', (analysis as any)?._meta?.model || MODEL_ID);
  res.set('X-AI-Used-Fallback', String((analysis as any)?._meta?.usedFallback === true));
  res.json(analysis);
});

app.post('/api/ai/score', async (req, res) => {
  const a: User = req.body?.a;
  const b: User = req.body?.b;
  if (!a || !b) return res.status(400).json({ error: 'Invalid payload' });
  const [pa, pb] = await Promise.all([analyze(a), analyze(b)]);
  const score = Math.min(1, (jaccard(a.areas || [], b.areas || []) * 0.4)
    + (jaccard(pa.interests, pb.interests) * 0.35)
    + (jaccard(pa.matchCriteria, pb.matchCriteria) * 0.25));
  const reasons: string[] = [];
  if (jaccard(a.areas || [], b.areas || []) > 0) reasons.push('Area overlap');
  if (jaccard(pa.interests, pb.interests) > 0) reasons.push('Interest similarity');
  if (jaccard(pa.matchCriteria, pb.matchCriteria) > 0) reasons.push('Criteria alignment');
  res.json({ score, reasons } as MatchScore);
});

// Reusable status handler for GET/HEAD
const statusHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    configured: Boolean(GEMINI_API_KEY),
    model: MODEL_ID,
    envModel: process.env.GEMINI_MODEL ?? null,
    defaultUsed: !process.env.GEMINI_MODEL,
    cwd: process.cwd(),
    startedAt: SERVER_STARTED_AT,
    lastError: LAST_AI_ERROR,
    lastModelUsed: LAST_MODEL_USED,
  });
};

app.get('/api/ai/status', statusHandler);
app.head('/api/ai/status', statusHandler);

// Optional: explicitly expose boot info identical to the console log for curl
app.get('/api/ai/boot', (_req, res) => {
  res.json({
    configured: Boolean(GEMINI_API_KEY),
    envModel: process.env.GEMINI_MODEL ?? null,
    modelConst: MODEL_ID,
    cwd: process.cwd(),
    startedAt: SERVER_STARTED_AT
  });
});

// Route introspection for debugging
function listRoutes(): { method: string; path: string }[] {
  const out: { method: string; path: string }[] = [];
  const stack = (app as any)._router?.stack || [];
  for (const layer of stack) {
    if (layer.route?.path && layer.route?.methods) {
      const methods = Object.keys(layer.route.methods);
      for (const m of methods) out.push({ method: m.toUpperCase(), path: layer.route.path });
    }
  }
  return out;
}

app.get('/api/debug/routes', (_req, res) => {
  res.json({ routes: listRoutes() });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// JSON 404 for /api to avoid HTML error page and show known routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path, routes: listRoutes() });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log('[server] routes:', listRoutes());
  console.log(`[AI] tip: curl http://localhost:${PORT}/api/ai/boot to see env vs. resolved model and cwd`);
});
