import express from 'express';
import { MongoClient } from 'mongodb';
import { analyzeCompatibility } from '../scripts/analyze-compatibility.js';

const router = express.Router();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'technova';

let client;
async function getClient() {
  if (client && client.topology && client.topology.isConnected()) return client;
  client = new MongoClient(MONGO_URI, { retryWrites: true, w: 'majority' });
  await client.connect();
  return client;
}

router.post('/api/compat/analyze', async (req, res) => {
  try {
    if (!MONGO_URI) return res.status(500).json({ error: 'Missing MONGO_URI' });
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.join(',') : (req.body?.ids || '');
    const cli = await getClient();
    const db = cli.db(DB_NAME);

    const { users, output } = await analyzeCompatibility(db, ids || undefined);
    res.json({
      ok: true,
      users: users.map(u => ({
        _id: u._id,
        username: u.username || u.name || '',
        vibeTags: Array.isArray(u.vibeTags) ? u.vibeTags : [],
      })),
      resultText: output,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default router;
