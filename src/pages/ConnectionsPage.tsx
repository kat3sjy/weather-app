import React from 'react';
import { useUserStore } from '../store/userStore';
import { Link } from 'react-router-dom';

export default function ConnectionsPage() {
  const { user, users } = useUserStore(s => ({ user: s.user, users: s.users })) as any;

  if (!user) {
    return <div className="card"><p>Please sign in to view connections.</p></div>;
  }

  const connections = (user.connections || []).map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);

  function mutualCount(other: any) {
    if (!other) return 0;
    const otherConnections = new Set(other.connections || []);
    return (user.connections || []).filter((c: string) => otherConnections.has(c)).length;
  }

  function mutualList(other: any) {
    if (!other) return [];
    const otherConnections = new Set(other.connections || []);
    return (user.connections || []).filter((c: string) => otherConnections.has(c));
  }

  return (
    <div className="grid" style={{gap:'1.5rem'}}>
      <h2>Your Connections ({connections.length})</h2>
      {connections.length === 0 && (
        <div className="card"><p>No connections yet. Visit <Link to="/explore">Explore</Link> to send requests.</p></div>
      )}
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem'}}>
        {connections.map((c: any) => {
          const mutualIds = mutualList(c);
          const mutualUsers = mutualIds.map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
          return (
            <div key={c.id} className="card" style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
                <img
                  src={c.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(c.username)}`}
                  alt={c.username}
                  style={{width:48, height:48, borderRadius:'50%', objectFit:'cover'}}
                />
                <div>
                  <Link to={`/profile/${c.username}`} style={{textDecoration:'none', color:'#fff'}}><strong>@{c.username}</strong></Link>
                  <p style={{margin:0, fontSize:'.65rem', opacity:.6}}>{c.firstName} {c.lastName}</p>
                </div>
              </div>
              <p style={{margin:0, fontSize:'.7rem', opacity:.7}}>{c.location}</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:'.25rem'}}>
                {(c.areas||[]).slice(0,3).map((a: string) => <span key={a} className="badge" style={{fontSize:'.55rem'}}>{a}</span>)}
              </div>
              <p style={{margin:0, fontSize:'.65rem', opacity:.55, flexGrow:1}}>{c.bio?.slice(0,80) || 'No bio yet.'}{(c.bio||'').length>80?'…':''}</p>
              <div style={{fontSize:'.6rem', opacity:.75}}>
                Mutual Connections: {mutualCount(c)}
                {mutualUsers.length > 0 && (
                  <div style={{marginTop:'.25rem', display:'flex', flexWrap:'wrap', gap:'.25rem'}}>
                    {mutualUsers.slice(0,4).map((m: any) => (
                      <Link key={m.id} to={`/profile/${m.username}`} className="badge" style={{fontSize:'.5rem', textDecoration:'none'}}>@{m.username}</Link>
                    ))}
                    {mutualUsers.length > 4 && <span style={{fontSize:'.5rem', opacity:.6}}>+{mutualUsers.length-4} more</span>}
                  </div>
                )}
              </div>
              <div style={{fontSize:'.6rem', background:'#1e2936', padding:'.35rem .5rem', borderRadius:4}}>
                Contact: <span style={{opacity:.85}}>{c.contact || 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
