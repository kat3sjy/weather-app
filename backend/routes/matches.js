import express from "express";
import { findMatches } from "../models/User.js";

const router = express.Router();

// GET /api/matches/:userId?limit=10
router.get("/:userId", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const results = await findMatches(req.params.userId, limit);
    res.json(results);
  } catch (err) {
    const code = /not found/i.test(err?.message) ? 404 : 400;
    res.status(code).json({ error: err?.message || "Failed to fetch matches" });
  }
});

export default router;
