import React from 'react';
import { User } from '../store/userStore';

export default function ProfileCard({user}:{user:User}) {
  const displaySeed = user.username || `${user.firstName} ${user.lastName}`;
  return (
    <div className="card" style={{display:'flex', gap:'1.25rem'}}>
      <div>
        <img className="avatar" src={user.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displaySeed)}`} alt="avatar" />
      </div>
      <div style={{flex:1}}>
        <h2 style={{margin:'0 0 .25rem'}}>@{user.username}</h2>
  <p style={{margin:'0 0 .75rem', fontSize:'.7rem', opacity:0.65}}>({user.firstName} {user.lastName})</p>
        <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.5rem'}}>
          {user.areas.map(a => <span key={a} className="badge">{a}</span>)}
        </div>
        <p style={{marginTop:0, opacity:.8, fontSize:'.9rem'}}>{user.bio || 'No bio yet.'}</p>
        <p style={{marginTop:'.5rem', fontSize:'.75rem', opacity:.6}}>Experience: {user.experienceLevel} • {user.location}</p>
        <p style={{marginTop:'.25rem', fontSize:'.7rem', opacity:.5}}>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
