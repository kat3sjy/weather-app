import express from "express";
import User from "../models/User.js";
import { analyzeCompatibility } from "../services/geminiMatchService.js";

const router = express.Router();

// Add a local helper to replace the missing import
async function findMatches(userId, { limit = 10, candidateFields } = {}) {
  const me = await User.findById(userId).lean();
  if (!me) throw new Error('user_not_found');

  const others = await User.find({ _id: { $ne: me._id } })
    .limit(Math.max(1, Math.min(50, limit)))
    .lean();

  const scored = await Promise.all(
    others.map(async (u) => {
      const r = await analyzeCompatibility({ userA: me, userB: u, candidateFields, UserModel: User });
      return { userId: String(u._id), score: r.score, reasons: r.reasons, fieldsUsed: r.fieldsUsed };
    })
  );

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// GET /api/matches/:userId?limit=10
router.get("/:userId", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const results = await findMatches(req.params.userId, { limit });
    res.json(results);
  } catch (err) {
    const code = /not found/i.test(err?.message) ? 404 : 400;
    res.status(code).json({ error: err?.message || "Failed to fetch matches" });
  }
});

export default router;
