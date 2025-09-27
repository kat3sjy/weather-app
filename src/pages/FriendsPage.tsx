import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

// Friends are just accepted connections (semantic alias)
export default function FriendsPage() {
  const { user, users, removeConnection } = useUserStore(s => ({
    user: s.user,
    users: s.users,
    removeConnection: (s as any).removeConnection
  })) as any;

  if (!user) {
    return <div className="card"><p>Please sign in to view friends.</p></div>;
  }

  const friendUsers = (user.connections || [])
    .map((id: string) => users.find((u: any) => u.id === id))
    .filter(Boolean);

  return (
    <div className="grid" style={{gap:'1.25rem'}}>
      <header style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h2>Friends ({friendUsers.length})</h2>
        <Link to="/explore"><button>Find People</button></Link>
      </header>
      {friendUsers.length === 0 && (
        <div className="card"><p>No friends yet. Head to <Link to="/explore">Explore</Link> to connect.</p></div>
      )}
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'1rem'}}>
        {friendUsers.map((f: any) => (
          <div key={f.id} className="card" style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
            <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
              <img
                src={f.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(f.username)}`}
                alt={f.username}
                style={{width:48, height:48, borderRadius:'50%', objectFit:'cover'}}
              />
              <div>
                <Link to={`/profile/${f.username}`} style={{textDecoration:'none'}}><strong>@{f.username}</strong></Link>
                <p style={{margin:0, fontSize:'.6rem', opacity:.6}}>{f.firstName} {f.lastName}</p>
              </div>
            </div>
            <p style={{margin:0, fontSize:'.65rem', opacity:.65}}>{f.bio?.slice(0,70) || 'No bio yet.'}{(f.bio||'').length>70?'…':''}</p>
            <div style={{display:'flex', flexWrap:'wrap', gap:'.25rem'}}>
              {(f.areas||[]).slice(0,3).map((a: string) => <span key={a} className="badge" style={{fontSize:'.5rem'}}>{a}</span>)}
            </div>
            <div style={{marginTop:'auto', display:'flex', justifyContent:'space-between', gap:'.5rem'}}>
              <Link to={`/profile/${f.username}`}><button style={{flex:1}}>View</button></Link>
              <button style={{background:'#2a3140'}} onClick={() => removeConnection(f.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
