import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// load env from common locations (first one that exists wins for each key)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
for (const p of [
  path.resolve(__dirname, '../.env'),          // backend/.env
  path.resolve(__dirname, '../../server/.env'),// server/.env (legacy)
  path.resolve(__dirname, '../../.env'),       // repo root .env
]) {
  dotenv.config({ path: p, override: false });
}

// Prefer explicit env, otherwise allow local dev fallback (not in production)
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGO_URI || // accept legacy key
  (process.env.NODE_ENV !== 'production' ? 'mongodb://127.0.0.1:27017/technova' : undefined);

// Use your existing client/connection code with mongoUri
if (mongoUri) {
  // ...existing connection code, but pass `mongoUri` instead of reading the env directly...
} else {
  console.warn('No MONGODB_URI set and no local fallback. Skipping MongoDB connection (dev chat mode).');
}
