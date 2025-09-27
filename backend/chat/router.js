import express from 'express';
import { chatStore } from './store.js';

const router = express.Router();
router.use(express.json());

// List conversations for a user
router.get('/conversations', (req, res) => {
  const userId = String(req.query.userId || '');
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  const items = chatStore.listConversations(userId);
  res.json({ items });
});

// Create conversation
router.post('/conversations', (req, res) => {
  const { participantIds, name } = req.body || {};
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    return res.status(400).json({ error: 'participantIds (>=2) required' });
  }
  const convo = chatStore.createConversation({ participantIds, name });
  res.status(201).json(convo);
});

// List messages
router.get('/messages', (req, res) => {
  const conversationId = String(req.query.conversationId || '');
  const limit = Number(req.query.limit || 50);
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
  const items = chatStore.getMessages(conversationId, limit);
  res.json({ items });
});

// Send message
router.post('/messages', (req, res) => {
  const { conversationId, senderId, text } = req.body || {};
  if (!conversationId || !senderId || !text) {
    return res.status(400).json({ error: 'conversationId, senderId, text required' });
  }
  try {
    const msg = chatStore.addMessage({ conversationId, senderId, text });
    res.status(201).json(msg);
  } catch (e) {
    res.status(404).json({ error: 'Conversation not found' });
  }
});

// NEW: create or join a shared demo room
router.post('/rooms/shared', (req, res) => {
  const { key = 'shared-demo', name = 'Shared Demo', userId } = req.body || {};
  const convo = chatStore.upsertSharedConversation({ key, name, userId });
  res.json(convo);
});

// NEW: GET variant to create or join a shared demo room (handy for quick tests)
router.get('/rooms/shared', (req, res) => {
  const key = String(req.query.key || 'shared-demo');
  const name = String(req.query.name || 'Shared Demo');
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const convo = chatStore.upsertSharedConversation({ key, name, userId });
  res.json(convo);
});

export default router;
