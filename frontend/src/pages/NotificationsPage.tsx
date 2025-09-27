import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

type Message = { id: string; from: string; text: string; at: number };
type Thread = { id: string; name: string; type: 'dm' | 'group'; last?: string };

// Seed data (replace with API later)
const seedDMs: Thread[] = [
  { id: 'u1', name: 'Alex', type: 'dm', last: 'Hey!' },
  { id: 'u2', name: 'Sam', type: 'dm', last: 'Can you review my PR?' },
];
const seedGroups: Thread[] = [
  { id: 'g1', name: 'Valorant Queens', type: 'group', last: 'Scrim tonight?' },
  { id: 'g2', name: 'Indie Dev Jams', type: 'group', last: 'Theme ideas?' },
];

export default function NotificationsPage() {
  const user = useUserStore(s => s.user);
  const [tab, setTab] = useState<'dm' | 'group'>('dm');
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    u1: [
      { id: 'm1', from: 'Alex', text: 'Hey!', at: Date.now() - 1000 * 60 * 20 },
      { id: 'm2', from: user?.firstName || 'You', text: 'What’s up?', at: Date.now() - 1000 * 60 * 19 },
    ],
    u2: [{ id: 'm3', from: 'Sam', text: 'Can you review my PR?', at: Date.now() - 1000 * 60 * 60 }],
    g1: [{ id: 'm4', from: 'Maya', text: 'Scrim tonight?', at: Date.now() - 1000 * 60 * 5 }],
    g2: [{ id: 'm5', from: 'Lena', text: 'Theme ideas?', at: Date.now() - 1000 * 60 * 45 }],
  });
  const [draft, setDraft] = useState('');

  const threads = tab === 'dm' ? seedDMs : seedGroups;

  const handleSend = () => {
    if (!selected || !draft.trim()) return;
    const id = crypto.randomUUID?.() ?? String(Math.random());
    const from = user?.firstName || 'You';
    setMessages(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), { id, from, text: draft.trim(), at: Date.now() }],
    }));
    setDraft('');
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <header className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Messages & Notifications</h2>
          <p style={{ margin: 0 }}>DMs and group chats</p>
        </div>
        <Link to="/"><button>Home</button></Link>
      </header>

      <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: '1rem' }}>
        <aside className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid var(--border,#eee)' }}>
            <button onClick={() => setTab('dm')} className={tab === 'dm' ? 'primary' : ''}>DMs</button>
            <button onClick={() => setTab('group')} className={tab === 'group' ? 'primary' : ''}>Groups</button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {threads.map(t => (
              <li key={t.id}>
                <button
                  style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', background: selected?.id === t.id ? 'var(--surface-2,#f6f6f6)' : 'transparent' }}
                  onClick={() => setSelected(t)}
                >
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  {t.last && <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{t.last}</div>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ opacity: 0.7, textAlign: 'center', margin: '4rem 0' }}>Select a conversation to start chatting.</div>
          ) : (
            <>
              <div style={{ borderBottom: '1px solid var(--border,#eee)', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{selected.name}</h3>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{selected.type === 'dm' ? 'Direct Message' : 'Group Chat'}</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(messages[selected.id] || []).map(m => (
                  <div key={m.id} style={{ alignSelf: m.from === (user?.firstName || 'You') ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div className="card" style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{m.from}</div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  style={{ flex: 1 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button onClick={handleSend}>Send</button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
