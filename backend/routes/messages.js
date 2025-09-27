import express from "express";
import { saveMessage, getMessages } from "../models/Message.js";

const router = express.Router();

// POST /api/messages
router.post("/", async (req, res) => {
  try {
    const { roomId, senderId, text } = req.body || {};
    if (!roomId || !senderId || !text) {
      return res.status(400).json({ error: "roomId, senderId, and text are required" });
    }
    const saved = await saveMessage({ roomId, senderId, text });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to send message" });
  }
});

// GET /api/messages/:roomId?limit=10
router.get("/:roomId", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const messages = await getMessages(req.params.roomId, limit);
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err?.message || "Failed to fetch messages" });
  }
});

export default router;
