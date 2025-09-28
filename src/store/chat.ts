import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid';

type Message = {
  id: string;
  conversationId: string;
  userId: string;
  text: string;
  timestamp: number;
};

type Conversation = {
  id: string;
  name?: string;
  participants?: string[];
  messages: Message[];
};

type State = {
  userId: string;
  socket?: Socket;
  conversations: Record<string, Conversation>;
  activeConversationId?: string;
  connecting: boolean;
  error?: string;
};

type Actions = {
  ensureSocket: () => void;
  joinSharedRoom: () => Promise<Conversation>;
  startDemoDM: () => Promise<Conversation>;
  sendMessage: (text: string) => Promise<void>;
  setActiveConversation: (id: string) => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Safe JSON fetch that surfaces non-JSON/error responses
async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`);
  }
}

export const useChatStore = create<State & Actions>((set, get) => ({
  userId: (() => {
    const key = 'tn_user_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `user_${nanoid(6)}`;
    localStorage.setItem(key, id);
    return id;
  })(),
  socket: undefined,
  conversations: {},
  activeConversationId: undefined,
  connecting: false,
  error: undefined,

  ensureSocket: () => {
    const { socket, userId } = get();
    if (socket) return;
    const s = io(API_BASE || '/', {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true
    });
    s.on('connect', () => {
      // no-op
    });
    s.on('disconnect', () => {
      // no-op
    });
    s.on('message:new', (msg: Message) => {
      set(state => {
        const conv = state.conversations[msg.conversationId] || { id: msg.conversationId, messages: [] };
        conv.messages = [...(conv.messages || []), msg];
        return { conversations: { ...state.conversations, [msg.conversationId]: conv } };
      });
    });
    // Optional: server can confirm join
    s.on('conversation:joined', (payload: { conversation: Conversation }) => {
      set(state => ({
        conversations: { ...state.conversations, [payload.conversation.id]: { ...payload.conversation, messages: payload.conversation.messages || [] } },
        activeConversationId: payload.conversation.id
      }));
    });
    set({ socket: s });
    // Identify (if backend expects it)
    s.emit?.('user:online', { userId });
  },

  joinSharedRoom: async () => {
    get().ensureSocket();
    set({ connecting: true, error: undefined });
    try {
      // Prefer POST; fallback to GET if server doesn't accept POST
      let convo = await fetchJSON<Conversation>(`${API_BASE}/api/chat/rooms/shared`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(async () => {
        return await fetchJSON<Conversation>(`${API_BASE}/api/chat/rooms/shared`);
      });

      const { socket, userId } = get();
      socket?.emit('conversation:join', { conversationId: convo.id, userId });

      set(state => ({
        conversations: { ...state.conversations, [convo.id]: { ...convo, messages: convo.messages || [] } },
        activeConversationId: convo.id
      }));
      return convo;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to join shared room' });
      throw e;
    } finally {
      set({ connecting: false });
    }
  },

  startDemoDM: async () => {
    get().ensureSocket();
    set({ connecting: true, error: undefined });
    try {
      // Use shared room as the demo conversation (backend DM route not present)
      let convo = await fetchJSON<Conversation>(`${API_BASE}/api/chat/rooms/shared`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(async () => {
        return await fetchJSON<Conversation>(`${API_BASE}/api/chat/rooms/shared`);
      });

      const { socket, userId } = get();
      socket?.emit('conversation:join', { conversationId: convo.id, userId });

      set(state => ({
        conversations: { ...state.conversations, [convo.id]: { ...convo, messages: convo.messages || [] } },
        activeConversationId: convo.id
      }));
      return convo;
    } catch (e: any) {
      set({ error: e?.message || 'Failed to start demo DM' });
      throw e;
    } finally {
      set({ connecting: false });
    }
  },

  sendMessage: async (text: string) => {
    const { activeConversationId, userId, socket } = get();
    if (!activeConversationId || !text.trim()) return;

    // If socket is connected, emit only (avoid duplicate REST 400s)
    if (socket?.connected) {
      socket.emit('message:send', { conversationId: activeConversationId, userId, text });
      return;
    }

    // Fallback to REST only when socket is not connected
    try {
      await fetchJSON(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId, userId, text })
      });
    } catch (e: any) {
      set({ error: e?.message || 'Failed to send message' });
      throw e;
    }
  },

  setActiveConversation: (id: string) => set({ activeConversationId: id })
}));
