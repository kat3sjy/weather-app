import dotenv from 'dotenv';
dotenv.config(); // backend/.env
dotenv.config({ path: new URL('../.env', import.meta.url).pathname }); // repo root .env

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!apiKey) {
  console.error(JSON.stringify({ ok: false, error: 'Missing GEMINI_API_KEY/GOOGLE_API_KEY' }, null, 2));
  process.exit(1);
}

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Reply with the single word: pong');
    const text = result.response.text();
    console.log(JSON.stringify({ ok: true, model: modelName, text }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
    process.exit(1);
  }
}

main();
