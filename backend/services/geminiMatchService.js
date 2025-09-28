const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let _modelInstance = null;
async function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  if (!_modelInstance) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _modelInstance = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
  }
  return _modelInstance;
}

function isStringArray(val) {
  return Array.isArray(val) && val.every(v => typeof v === 'string');
}

function isLikelyText(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function collectFieldPaths(obj, prefix = '') {
  const paths = [];
  if (!obj || typeof obj !== 'object') return paths;

  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' || key === '__v' || key.toLowerCase().includes('password')) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isStringArray(value) || isLikelyText(value)) {
      paths.push(path);
    } else if (Array.isArray(value)) {
      if (value.length && typeof value[0] === 'object') {
        paths.push(...collectFieldPaths(value[0], path + '[].'));
      }
    } else if (value && typeof value === 'object') {
      paths.push(...collectFieldPaths(value, path));
    }
  }
  return paths;
}

function rankCandidatePaths(paths) {
  const preferred = ['interests', 'skills', 'hobbies', 'tags', 'bio', 'about', 'summary', 'description', 'profile'];
  const score = p => {
    const lower = p.toLowerCase();
    let s = 0;
    for (const k of preferred) if (lower.includes(k)) s += 2;
    if (lower.includes('password') || lower.includes('token')) s -= 100;
    if (lower.includes('_id')) s -= 2;
    return s;
  };
  return [...new Set(paths)].sort((a, b) => score(b) - score(a));
}

async function discoverUserTextFields(UserModel, { sampleLimit = 50 } = {}) {
  const samples = await UserModel.find({}).limit(sampleLimit).lean();
  const allPaths = new Set();
  for (const doc of samples) collectFieldPaths(doc).forEach(p => allPaths.add(p));
  return rankCandidatePaths([...allPaths]);
}

function getValueByPath(doc, path) {
  const parts = path.split('.').flatMap(p => (p.endsWith('[]') ? [p.slice(0, -2), '[]'] : [p]));
  const out = [];
  function traverse(obj, idx) {
    if (idx >= parts.length) {
      if (typeof obj === 'string') out.push(obj);
      else if (Array.isArray(obj)) out.push(...obj.filter(x => typeof x === 'string'));
      return;
    }
    const key = parts[idx];
    if (key === '[]') {
      if (Array.isArray(obj)) for (const item of obj) traverse(item, idx + 1);
      return;
    }
    if (obj && typeof obj === 'object' && key in obj) traverse(obj[key], idx + 1);
  }
  traverse(doc, 0);
  return out;
}

function buildProfileText(user, fields) {
  if (!fields || !fields.length) return JSON.stringify(user);
  const collected = [];
  for (const f of fields) {
    const vals = getValueByPath(user, f);
    if (vals && vals.length) collected.push(`${f}: ${Array.isArray(vals) ? vals.join(', ') : String(vals)}`);
  }
  return collected.length ? collected.join('\n') : JSON.stringify(user);
}

async function scorePair({ userA, userB, fields }) {
  const model = await getModel();
  const aText = buildProfileText(userA, fields);
  const bText = buildProfileText(userB, fields);

  const prompt = [
    'You are a concise matchmaking scorer.',
    'Given two user profiles as raw text, return a JSON object of the form:',
    '{ "score": number 0-100, "reasons": string[] }',
    'Be strict JSON, no markdown, no extra text.',
    'Consider topical overlap, complementary interests, goals, and potential conversation starters.',
    'Penalize mismatches and incompatibilities.',
    `Profile A:\n${aText}\n`,
    `Profile B:\n${bText}\n`,
    'JSON only:'
  ].join('\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 256,
      responseMimeType: 'application/json'
    }
  });

  const text = result.response.text();
  let parsed = { score: 0, reasons: ['Model did not return valid JSON'] };
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.trim().replace(/^```json|^```|```$/g, '');
    try { parsed = JSON.parse(cleaned); } catch {}
  }

  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.map(String).slice(0, 8) : ['No reasons provided'];

  return { score, reasons, model: DEFAULT_MODEL };
}

async function batchMatch({ anchorUser, candidates, fields }) {
  const results = [];
  for (const candidate of candidates) {
    const { score, reasons } = await scorePair({ userA: anchorUser, userB: candidate, fields });
    results.push({ userId: String(candidate._id || candidate.id), score, reasons, candidatePreview: candidate });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

// High-level API expected by routes/matchRoutes.js
async function analyzeCompatibility({ userA, userB, candidateFields, UserModel }) {
  let fieldsUsed = Array.isArray(candidateFields) && candidateFields.length ? candidateFields : undefined;
  if (!fieldsUsed && UserModel) {
    try {
      const ranked = await discoverUserTextFields(UserModel, { sampleLimit: 50 });
      fieldsUsed = ranked.slice(0, 8);
    } catch {
      // Fallback: local discovery from the two docs
      const local = rankCandidatePaths([
        ...collectFieldPaths(userA),
        ...collectFieldPaths(userB),
      ]);
      fieldsUsed = local.slice(0, 8);
    }
  } else if (!fieldsUsed) {
    const local = rankCandidatePaths([
      ...collectFieldPaths(userA),
      ...collectFieldPaths(userB),
    ]);
    fieldsUsed = local.slice(0, 8);
  }

  const { score, reasons } = await scorePair({ userA, userB, fields: fieldsUsed });
  return { score, reasons, fieldsUsed };
}

export {
  discoverUserTextFields,
  scorePair,
  batchMatch,
  analyzeCompatibility
};
