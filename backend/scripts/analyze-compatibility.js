#!/usr/bin/env node
/* Minimal Node 18+ script. Requires deps: mongodb, dotenv */
/* Usage:
   node backend/scripts/analyze-compatibility.js
   node backend/scripts/analyze-compatibility.js --db technova
   node backend/scripts/analyze-compatibility.js --ids <id1>,<id2>
*/
import path from 'node:path';
import fs from 'node:fs';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure fetch exists on Node < 18 fallback
const fetch = globalThis.fetch ?? (await import('node-fetch')).default;

// Load .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Simple args
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.findIndex(a => a === name);
  if (i >= 0 && i < args.length - 1) return args[i + 1];
  const pref = `${name}=`;
  const kv = args.find(a => a.startsWith(pref));
  return kv ? kv.slice(pref.length) : undefined;
};
const DB_NAME = getArg('--db') || process.env.MONGODB_DB || 'technova';
const idsArg = getArg('--ids'); // comma-separated _id strings

if (!MONGO_URI) {
  console.error('Missing MONGO_URI (or MONGODB_URI) in backend/.env');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in backend/.env');
  process.exit(1);
}

function redactUri(u) {
  return String(u).replace(/(mongodb(\+srv)?:\/\/[^:@/]+):[^@/]+@/i, '$1:***@');
}

async function fetchUsers(db) {
  const col = db.collection('users');
  if (idsArg) {
    const ids = idsArg.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        try { return new ObjectId(s); } catch { return s; }
      });
    const cursor = col.find(
      { _id: { $in: ids } },
      { projection: { username: 1, name: 1, vibeTags: 1 } }
    );
    const docs = await cursor.toArray();
    return docs;
  }
  const cursor = col.find(
    { vibeTags: { $exists: true } },
    { projection: { username: 1, name: 1, vibeTags: 1 } }
  ).limit(10);
  const docs = (await cursor.toArray()).filter(u => Array.isArray(u.vibeTags) && u.vibeTags.length > 0);
  return docs.slice(0, 2);
}

function userLabel(u, label) {
  const name = u.name || u.username || '';
  const id = u._id ? ` (${u._id})` : '';
  const nm = name ? ` - ${name}` : '';
  return `${label}${nm}${id}`;
}

function buildPrompt(u1, u2) {
  return [
    'You are a concise match analyst for cooperative gaming partners.',
    'Given two users with arrays of vibeTags (qualities/preferences), assess their compatibility.',
    'Return:',
    '- A single numeric Compatibility Score from 0 to 100.',
    '- 2-3 bullet points on key overlaps and differences.',
    '- One-sentence summary.',
    'Keep it brief and actionable.',
    '',
    `${userLabel(u1, 'User A')}:`,
    `vibeTags: ${JSON.stringify(u1.vibeTags)}`,
    '',
    `${userLabel(u2, 'User B')}:`,
    `vibeTags: ${JSON.stringify(u2.vibeTags)}`,
  ].join('\n');
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': GEMINI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  // Try common fields across Gemini responses
  const text =
    data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n').trim() ||
    data.candidates?.[0]?.output_text?.trim() ||
    '';
  return text || JSON.stringify(data, null, 2);
}

async function main() {
  console.log(`[compat] Connecting to MongoDB: ${redactUri(MONGO_URI)} db=${DB_NAME}`);
  const client = new MongoClient(MONGO_URI, { retryWrites: true, w: 'majority' });
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const users = await fetchUsers(db);
    if (!users || users.length < 2) {
      console.error('Need at least 2 users with non-empty vibeTags (or provide exactly two via --ids)');
      process.exitCode = 2;
      return;
    }
    const [u1, u2] = users.slice(0, 2);
    console.log(`[compat] Comparing: ${userLabel(u1, 'A')} vs ${userLabel(u2, 'B')}`);

    const prompt = buildPrompt(u1, u2);
    const output = await callGemini(prompt);

    console.log('\n=== Compatibility Analysis ===');
    console.log(output);
    console.log('==============================\n');
  } catch (err) {
    console.error('[compat] Error:', err?.message || err);
    process.exitCode = 1;
  } finally {
    try { await client.close(); } catch {}
  }
}

main();
