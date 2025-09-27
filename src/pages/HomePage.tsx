import { useUserStore } from '../store/userStore';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const user = useUserStore(s => s.user);
  return (
    <div className="grid" style={{gap:'2rem'}}>
      <section className="card">
        <h1>Welcome {user?.firstName ? user.firstName : '👋'} </h1>
        <p>Connect with others through mentorship, events, and group chats.</p>
        {!user && <Link to="/onboarding"><button>Get Started</button></Link>}
        {user && <Link to={`/profile/${user.username}`}><button>Your Profile</button></Link>}
        <span style={{ marginLeft: 8 }} />
        <Link to="/notifications"><button>Messages</button></Link>
        <div style={{ marginTop: 12 }}>
          <Link to="/ai-demo">Try the AI Demo</Link>
        </div>
      </section>
      <section className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
        <div className="card">
          <h3>Event Match</h3>
          <p>Find people going to the same conference or tournament.</p>
        </div>
        <div className="card">
          <h3>Messages</h3>
          <p>DM friends or chat with your groups.</p>
          <Link to="/notifications"><button>Open</button></Link>
        </div>
      </section>
    </div>
  );
}
