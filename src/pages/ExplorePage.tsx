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

  const directory = useUserStore(s => s.users);
  const sendRequest = useUserStore(s => s.sendConnectionRequest);
  const acceptReq = useUserStore(s => s.acceptConnectionRequest);
  const rejectReq = useUserStore(s => s.rejectConnectionRequest);
  const cancelReq = useUserStore(s => s.cancelConnectionRequest);

  const others = (directory || []).filter(u => u.id !== user.id);

  function connectionState(targetId: string): 'connected' | 'incoming' | 'outgoing' | 'none' {
    if (!user) return 'none';
    if (user.connections && user.connections.includes(targetId)) return 'connected';
    if (user.incomingRequests && user.incomingRequests.includes(targetId)) return 'incoming';
    if (user.outgoingRequests && user.outgoingRequests.includes(targetId)) return 'outgoing';
    return 'none';
  }

  return (
    <div className="grid" style={{gap:'1rem'}}>
      <h2>Explore Members</h2>
      <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Welcome, @{user.username}! Send connection requests to unlock contact info.</p>
      <section className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1rem'}}>
        {others.map(u => {
          const state = connectionState(u.id);
          return (
            <div key={u.id} className="card" style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
                <img
                  src={u.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(u.username)}`}
                  alt={u.username}
                  style={{width:48, height:48, borderRadius:'50%', objectFit:'cover'}}
                />
                <div>
                  <strong>@{u.username}</strong>
                  <p style={{margin:0, fontSize:'.65rem', opacity:.6}}>{u.firstName} {u.lastName}</p>
                </div>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:'.25rem'}}>
                {(u.areas||[]).slice(0,3).map(a => <span key={a} className="badge" style={{fontSize:'.55rem'}}>{a}</span>)}
              </div>
              <p style={{margin:0, fontSize:'.7rem', opacity:.7}}>{u.location}</p>
              <p style={{margin:0, fontSize:'.65rem', opacity:.55, flexGrow:1}}>{u.bio?.slice(0,90) || 'No bio yet.'}{(u.bio||'').length>90?'…':''}</p>
              {state === 'connected' && (
                <div style={{fontSize:'.65rem', background:'#1e2936', padding:'.35rem .5rem', borderRadius:4}}>
                  Contact: <span style={{opacity:.85}}>{u.contact || 'N/A'}</span>
                </div>
              )}
              <div style={{marginTop:'.25rem'}}>
                {state === 'none' && (
                  <button style={{width:'100%'}} onClick={() => sendRequest(u.id)}>Connect</button>
                )}
                {state === 'outgoing' && (
                  <button style={{width:'100%', background:'#222a35'}} onClick={() => cancelReq(u.id)}>Requested • Cancel?</button>
                )}
                {state === 'incoming' && (
                  <div style={{display:'flex', gap:'.5rem'}}>
                    <button style={{flex:1}} onClick={() => acceptReq(u.id)}>Accept</button>
                    <button style={{flex:1, background:'#222a35'}} onClick={() => rejectReq(u.id)}>Decline</button>
                  </div>
                )}
                {state === 'connected' && (
                  <button style={{width:'100%', background:'#1e4428', cursor:'default'}} disabled>Connected</button>
                )}
              </div>
            </div>
          );
        })}
      </section>
      {user.incomingRequests && user.incomingRequests.length > 0 && (
        <section style={{marginTop:'2rem'}}>
          <h3>Pending Requests</h3>
          <div className="grid" style={{gap:'.75rem'}}>
            {user.incomingRequests.map(id => {
              const reqUser = directory.find(u => u.id === id);
              if (!reqUser) return null;
              return (
                <div key={id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                    <img
                      src={reqUser.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(reqUser.username)}`}
                      alt={reqUser.username}
                      style={{width:32, height:32, borderRadius:'50%'}}
                    />
                    <span>@{reqUser.username}</span>
                  </div>
                  <div style={{display:'flex', gap:'.5rem'}}>
                    <button style={{fontSize:'.65rem'}} onClick={() => acceptReq(id)}>Accept</button>
                    <button style={{fontSize:'.65rem', background:'#222a35'}} onClick={() => rejectReq(id)}>Decline</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
