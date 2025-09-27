import express from "express";
import { createUser, updateUser, upsertUserByUsername, findUserById, listUsers } from "../models/User.js";

const router = express.Router();

// POST /api/profile
// If body has id -> update by id
// Else if username exists -> upsert by username
// Else -> create
router.post("/", async (req, res) => {
  try {
    const { id, username, ...rest } = req.body || {};
    let result;

    if (id) {
      result = await updateUser(id, { username, ...rest });
    } else if (username) {
      result = await upsertUserByUsername(username, rest);
    } else {
      result = await createUser(rest);
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to save profile" });
  }
});

// GET /api/profile?limit=50
router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const users = await listUsers(limit);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to list profiles" });
  }
});

// GET /api/profile/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to fetch profile" });
  }
});

export default router;
