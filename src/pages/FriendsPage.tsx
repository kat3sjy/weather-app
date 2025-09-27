import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

export default function FriendsPage() {
  const user = useUserStore(s => s.user);
  const friends = useUserStore(s => s.friends);
  const addFriend = useUserStore(s => s.addFriend);
  const removeFriend = useUserStore(s => s.removeFriend);

  const [username, setUsername] = useState('');

  const handleAdd = () => {
    if (!username.trim()) return;
    addFriend(username);
    setUsername('');
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <header className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Friends</h2>
          <p style={{ margin: 0 }}>{user ? `Signed in as @${user.username}` : 'Not signed in'}</p>
        </div>
        <Link to="/"><button>Home</button></Link>
      </header>

      <section className="card">
        <h3>Add a friend</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Enter username (e.g. alex)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button onClick={handleAdd}>Add</button>
        </div>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
          Tip: You can also add/remove from a user’s profile.
        </p>
      </section>

      <section className="card">
        <h3>Your friends</h3>
        {friends.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No friends yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {friends.map(f => (
              <li key={f} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to={`/profile/${f}`} style={{ textDecoration: 'none' }}>
                  @{f}
                </Link>
                <button onClick={() => removeFriend(f)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
