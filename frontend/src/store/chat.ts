import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type Conversation = {
  id: string;
  name: string | null;
  isGroup: boolean;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type ChatState = {
  socket: Socket | null;
  userId: string;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeId: string | null;
  init: () => void;
  fetchConversations: () => Promise<void>;
  joinConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function getOrCreateAnonId(): string {
  const k = 'tnv_anon_uid';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  userId: getOrCreateAnonId(),
  conversations: [],
  messages: {},
  activeId: null,

  init: () => {
    if (get().socket) return;
    const socket = io(API_BASE, { withCredentials: true });
    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err?.message || err);
    });
    socket.on('message:new', (msg: Message) => {
      const convId = msg.conversationId;
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: [...(s.messages[convId] || []), msg],
        },
        // Optionally bump conversation order on new message:
        conversations: s.conversations
          .map((c) => (c.id === convId ? { ...c, updatedAt: msg.createdAt } : c))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }));
    });
    // typing event is available; implement UI if needed
    set({ socket });
  },

  fetchConversations: async () => {
    const userId = get().userId;
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ conversations: data.items || [] });
    } catch (e) {
      console.warn('Failed to load conversations. Is the backend running on 3000?', e);
      set({ conversations: [] });
    }
  },

  joinConversation: async (id: string) => {
    const socket = get().socket;
    if (!socket) get().init();
    (get().socket || socket)?.emit('conversation:join', { conversationId: id, userId: get().userId });
    set({ activeId: id });
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages?conversationId=${encodeURIComponent(id)}&limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ messages: { ...s.messages, [id]: data.items || [] } }));
    } catch (e) {
      console.warn('Failed to load messages. Is the backend running on 3000?', e);
      set((s) => ({ messages: { ...s.messages, [id]: [] } }));
    }
  },

  sendMessage: (text: string) => {
    const socket = get().socket;
    const conversationId = get().activeId;
    const senderId = get().userId;
    if (!socket || !conversationId || !text.trim()) return;
    socket.emit('message:send', { conversationId, senderId, text: text.trim() });
  },
}));
