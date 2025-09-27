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
