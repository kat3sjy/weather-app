import { useEffect, useMemo, useRef, useState } from 'react';
import { useChatStore } from '../store/chat';

export default function ChatPage() {
  const {
    userId,
    ensureSocket,
    joinSharedRoom,
    startDemoDM,
    sendMessage,
    conversations,
    activeConversationId,
    setActiveConversation,
    connecting,
    error
  } = useChatStore();

  const convo = useMemo(() => (activeConversationId ? conversations[activeConversationId] : undefined), [conversations, activeConversationId]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureSocket();
  }, [ensureSocket]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [convo?.messages?.length]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1>Chat</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => joinSharedRoom()} disabled={connecting}>Join Shared Demo Room</button>
        <button onClick={() => startDemoDM()} disabled={connecting}>Start Demo DM</button>
      </div>
      {error && <div style={{ color: 'tomato' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16 }}>
        <aside style={{ width: 240 }}>
          <h3>Conversations</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.values(conversations).map(c => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveConversation(c.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: c.id === activeConversationId ? '#222' : '#111',
                    color: 'white',
                    padding: 8,
                    border: '1px solid #333',
                    borderRadius: 6,
                    marginBottom: 6
                  }}
                >
                  {c.name || c.id}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main style={{ flex: 1 }}>
          {!convo ? (
            <div>Select or create a conversation.</div>
          ) : (
            <>
              <div style={{ border: '1px solid #333', borderRadius: 6, padding: 8, height: 360, overflowY: 'auto' }} ref={listRef}>
                {(convo.messages || []).map(m => (
                  <div key={m.id} style={{ marginBottom: 8 }}>
                    <strong style={{ color: m.userId === userId ? '#8ef' : '#fea' }}>{m.userId}</strong>: {m.text}
                  </div>
                ))}
              </div>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const t = text.trim();
                  if (!t) return;
                  await sendMessage(t);
                  setText('');
                }}
                style={{ display: 'flex', gap: 8, marginTop: 8 }}
              >
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: 8 }}
                />
                <button type="submit">Send</button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
