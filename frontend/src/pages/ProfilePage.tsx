import { useParams } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import ProfileCard from '../components/ProfileCard';

export default function ProfilePage() {
  const { username } = useParams();
  const user = useUserStore(s => s.user);

  if (!user || user.username !== username) {
    return <div className="card"><p>Profile not found or not yours yet. Complete onboarding.</p></div>;
  }
  return (
    <div className="grid" style={{gap:'1.5rem'}}>
      <ProfileCard user={user} />
    </div>
  );
}
