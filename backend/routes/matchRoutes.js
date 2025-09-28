import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { analyzeCompatibility } from '../services/geminiMatchService.js';

const router = express.Router();

function collectFieldsFromDoc(doc, { max = 100 } = {}) {
	const fields = [];
	function walk(obj, base = '') {
		if (!obj || typeof obj !== 'object') return;
		for (const [k, v] of Object.entries(obj)) {
			if (k === '_id' || k === '__v' || k === 'password') continue;
			const path = base ? `${base}.${k}` : k;
			const t =
				Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
			fields.push({ path, type: t });
			if (fields.length >= max) return;
			if (v && typeof v === 'object' && !Array.isArray(v)) {
				walk(v, path);
			}
		}
	}
	walk(doc);
	// Deduplicate by path
	const map = new Map();
	for (const f of fields) {
		if (!map.has(f.path)) map.set(f.path, f);
	}
	return Array.from(map.values());
}

// GET /api/users/fields -> discover attribute names from sample user docs
router.get('/users/fields', async (req, res) => {
	try {
		const samples = await User.find().limit(2).lean();
		if (!samples.length) return res.json({ fields: [] });
		const set = new Map();
		for (const doc of samples) {
			for (const f of collectFieldsFromDoc(doc)) {
				set.set(f.path, f);
			}
		}
		res.json({ fields: Array.from(set.values()) });
	} catch (e) {
		res.status(500).json({ error: 'failed_to_list_fields', details: e.message });
	}
});

// POST /api/match/preview { userAId, userBId, candidateFields?: string[] }
router.post('/match/preview', async (req, res) => {
	try {
		const { userAId, userBId, candidateFields } = req.body || {};
		if (!userAId || !userBId) return res.status(400).json({ error: 'missing_user_ids' });

		const [userA, userB] = await Promise.all([
			User.findById(new mongoose.Types.ObjectId(userAId)).lean(),
			User.findById(new mongoose.Types.ObjectId(userBId)).lean(),
		]);

		if (!userA || !userB) return res.status(404).json({ error: 'user_not_found' });

		const result = await analyzeCompatibility({ userA, userB, candidateFields });
		res.json({ ok: true, ...result, userAId, userBId });
	} catch (e) {
		res.status(500).json({ error: 'match_failed', details: e.message });
	}
});

// POST /api/match/batch { userId, limit?: number, candidateFields?: string[] }
router.post('/match/batch', async (req, res) => {
	try {
		 const { userId, limit = 10, candidateFields } = req.body || {};
		 if (!userId) return res.status(400).json({ error: 'missing_user_id' });

		 const me = await User.findById(new mongoose.Types.ObjectId(userId)).lean();
		 if (!me) return res.status(404).json({ error: 'user_not_found' });

		 const others = await User.find({ _id: { $ne: me._id } })
			 .limit(Math.max(1, Math.min(50, limit)))
			 .lean();

		 const results = await Promise.all(
			 others.map(async (u) => {
				 const r = await analyzeCompatibility({ userA: me, userB: u, candidateFields });
				 return { userId: u._id, score: r.score, reasons: r.reasons, fieldsUsed: r.fieldsUsed };
			 })
		 );

		 results.sort((a, b) => b.score - a.score);
		 res.json({ ok: true, userId, matches: results });
	} catch (e) {
		 res.status(500).json({ error: 'batch_failed', details: e.message });
	}
});

export default router;
