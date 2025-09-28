import { GoogleGenerativeAI } from '@google/generative-ai';

function getApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

export function hasGeminiKey() {
  return !!getApiKey();
}

export function getGeminiModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
}

function getClient() {
  const key = getApiKey();
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return new GoogleGenerativeAI(key);
}

export async function analyzeText(text, opts = {}) {
  const prompt = String(text ?? '').trim();
  if (!prompt) throw new Error('invalid-text');
  const modelName = (opts.model && String(opts.model).trim()) || getGeminiModel();

  const genai = getClient();
  const model = genai.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(prompt);
  const resp = await result.response;
  return resp.text();
}
