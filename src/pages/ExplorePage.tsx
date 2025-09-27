import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

export default function ExplorePage() {
  const user = useUserStore(s => s.user);
  const navigate = useNavigate();

  // Redirect to onboarding if not logged in
  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <h2>Login Required</h2>
        <p>You need to be logged in to explore members and events.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button onClick={() => navigate('/onboarding')}>
            Create Account
          </button>
          <button 
            onClick={() => navigate('/')}
            style={{ background: '#222a35' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Placeholder suggested users / events
  const sample = [
    { name: 'Aisha', focus: 'Esports Shoutcasting', location: 'Remote' },
    { name: 'Naomi', focus: 'VR Dev @ Hackathons', location: 'Seattle' },
    { name: 'Priya', focus: 'Basketball Analytics', location: 'Toronto' }
  ];

  return (
    <div className="grid" style={{gap:'1rem'}}>
      <h2>Explore Members & Events</h2>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Welcome, @{user.username}! Discover your community.</p>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
        {sample.map(s => (
          <div key={s.name} className="card">
            <h3>{s.name}</h3>
            <div className="tag">{s.focus}</div>
            <p style={{opacity:.7, fontSize:'.8rem', marginTop:'.5rem'}}>{s.location}</p>
            <button style={{marginTop:'.75rem', width:'100%'}}>Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}
