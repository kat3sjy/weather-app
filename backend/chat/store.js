import { v4 as uuidv4 } from 'uuid';

const conversations = new Map(); // id -> { id, name, isGroup, participantIds, createdAt, updatedAt }
const messages = new Map(); // conversationId -> Message[]
const sharedByKey = new Map(); // key -> conversationId

const now = () => new Date().toISOString();

function createConversation({ participantIds, name }) {
  const id = uuidv4();
  const convo = {
    id,
    name: name || null,
    isGroup: (participantIds?.length ?? 0) > 2,
    participantIds: [...new Set(participantIds || [])],
    createdAt: now(),
    updatedAt: now(),
  };
  conversations.set(id, convo);
  messages.set(id, []);
  return convo;
}

function listConversations(userId) {
  if (!userId) return [];
  return [...conversations.values()]
    .filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getMessages(conversationId, limit = 50) {
  const arr = messages.get(conversationId) || [];
  if (!limit || limit <= 0) return arr;
  return arr.slice(-limit);
}

function addMessage({ conversationId, senderId, text }) {
  if (!conversations.has(conversationId)) {
    throw new Error('Conversation not found');
  }
  const msg = {
    id: uuidv4(),
    conversationId,
    senderId,
    text,
    createdAt: now(),
  };
  const arr = messages.get(conversationId) || [];
  arr.push(msg);
  messages.set(conversationId, arr);
  const convo = conversations.get(conversationId);
  convo.updatedAt = msg.createdAt;
  conversations.set(conversationId, convo);
  return msg;
}

// NEW: ensure a user is a participant
function addParticipant(conversationId, userId) {
  const convo = conversations.get(conversationId);
  if (!convo) throw new Error('Conversation not found');
  if (userId && !convo.participantIds.includes(userId)) {
    convo.participantIds.push(userId);
    convo.updatedAt = now();
    conversations.set(conversationId, convo);
  }
  return convo;
}

// NEW: upsert a shared conversation by key and add user
function upsertSharedConversation({ key = 'shared-demo', name = 'Shared Demo', userId } = {}) {
  let convoId = sharedByKey.get(key);
  let convo;
  if (convoId && conversations.has(convoId)) {
    convo = conversations.get(convoId);
  } else {
    convo = createConversation({ participantIds: userId ? [userId] : [], name });
    sharedByKey.set(key, convo.id);
  }
  if (userId) addParticipant(convo.id, userId);
  return conversations.get(convo.id);
}

export const chatStore = {
  createConversation,
  listConversations,
  getMessages,
  addMessage,
  // NEW exports
  addParticipant,
  upsertSharedConversation,
};
