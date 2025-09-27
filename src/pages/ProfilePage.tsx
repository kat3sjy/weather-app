import { useParams } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import ProfileCard from '../components/ProfileCard';

export default function ProfilePage() {
  const { username } = useParams();
  const current = useUserStore(s => s.user);
  const getUserByUsername = useUserStore(s => s.getUserByUsername);
  const target = username ? getUserByUsername(username) : null;

  if (!target) {
    return <div className="card"><p>User profile not found.</p></div>;
  }

  // If not logged in and trying to view someone (including self) require auth first
  if (!current) {
    return (
      <div className="card" style={{maxWidth:500}}>
        <h2>Sign in to view profiles</h2>
        <p style={{fontSize:'.8rem', opacity:.75}}>Create an account or sign in to view member profiles and connect.</p>
        <div style={{display:'flex', gap:'.75rem', marginTop:'1rem'}}>
          <a href="/login"><button>Sign In</button></a>
          <a href="/onboarding"><button>Create Account</button></a>
        </div>
      </div>
    );
  }

  const isSelf = current && current.id === target.id;
  const connected = !!(current && target && current.connections?.includes(target.id));

  return (
    <div className="grid" style={{gap:'1.5rem'}}>
      <ProfileCard user={target} />
      {!isSelf && !connected && (
        <div className="card" style={{fontSize:'.75rem', opacity:.75}}>
          Connection required to view contact details. Send a request from Explore.
        </div>
      )}
      {isSelf && (
        <div className="card" style={{fontSize:'.7rem', opacity:.6}}>
          This is your profile. Share your handle: @{target.username}
        </div>
      )}
      {connected && !isSelf && (
        <div className="card" style={{fontSize:'.75rem'}}>
          Contact: <strong>{target.contact}</strong>
        </div>
      )}
    </div>
  );
}
