import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chat';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function ChatPage() {
  const { init, fetchConversations, joinConversation, sendMessage, conversations, messages, activeId, userId } =
    useChatStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    init();
    fetchConversations();
  }, [init, fetchConversations]);

  const createDemoDM = async () => {
    const res = await fetch(`${API_BASE}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantIds: [userId, 'demo-bot'],
        name: 'Demo DM',
      }),
    });
    if (!res.ok) return;
    const convo = await res.json();
    await fetchConversations();
    await joinConversation(convo.id);
  };

  const joinShared = async () => {
    // First try POST
    let res = await fetch(`${API_BASE}/api/chat/rooms/shared`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'shared-demo', name: 'Shared Demo', userId }),
    });

    // Fallback to GET if POST route isn’t available yet
    if (res.status === 404) {
      const url = new URL(`${API_BASE}/api/chat/rooms/shared`);
      url.searchParams.set('key', 'shared-demo');
      url.searchParams.set('name', 'Shared Demo');
      url.searchParams.set('userId', userId);
      res = await fetch(url.toString());
    }

    if (!res.ok) return;
    const convo = await res.json();
    await fetchConversations();
    await joinConversation(convo.id);
  };

  const msgs = activeId ? messages[activeId] || [] : [];

  return (
    <div style={{ display: 'flex', height: '100%', gap: 12, padding: 12 }}>
      <aside style={{ width: 280, borderRight: '1px solid #333' }}>
        <h3>Conversations</h3>
        <button onClick={createDemoDM} style={{ width: '100%', marginBottom: 8 }}>
          Start Demo DM
        </button>
        <button onClick={joinShared} style={{ width: '100%', marginBottom: 8 }}>
          Join Shared Demo Room
        </button>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => joinConversation(c.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 8,
                  background: activeId === c.id ? '#222' : 'transparent',
                  color: 'inherit',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {c.name || (c.isGroup ? 'Group chat' : 'DM')}
                <div style={{ fontSize: 12, opacity: 0.6 }}>Updated: {new Date(c.updatedAt).toLocaleString()}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, borderBottom: '1px solid #333' }}>
          {!activeId && <div>Select a conversation</div>}
          {msgs.map((m) => (
            <div key={m.id} style={{ margin: '6px 0', display: 'flex', justifyContent: m.senderId === userId ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: '#1f2937', padding: '6px 10px', borderRadius: 8, maxWidth: '70%' }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{m.senderId === userId ? 'You' : m.senderId}</div>
                <div>{m.text}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage(input);
            setInput('');
          }}
          style={{ display: 'flex', gap: 8, padding: 8 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeId ? 'Type a message...' : 'Select a conversation first'}
            disabled={!activeId}
            style={{ flex: 1, padding: 8, background: '#111', color: 'inherit', border: '1px solid #333', borderRadius: 6 }}
          />
          <button type="submit" disabled={!activeId || !input.trim()} style={{ padding: '8px 12px' }}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
