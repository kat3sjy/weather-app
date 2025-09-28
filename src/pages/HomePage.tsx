import { useUserStore } from '../store/userStore';
import { Link } from 'react-router-dom';
import './home-style.css';

export default function HomePage() {
  const user = useUserStore(s => s.user);
  
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            🎉 WELCOME 🎉
          </h1>
          <p className="hero-description">
            Ctrl+Femme is a safe space for underrepresented groups to connect with 
            others in gaming, tech conventions, and sports. Join a community built by diversity. 
            Ctrl+Femme is where lifelong friendships begin!
          </p>
          
          <div className="hero-actions">
            {!user ? (
              <>
                <Link to="/login" className="hero-btn primary">
                  sign in
                </Link>
                <span className="hero-divider">or</span>
                <Link to="/signup" className="hero-btn secondary">
                  create account
                </Link>
              </>
            ) : (
              <>
                <Link to={`/profile/${user.username}`} className="hero-btn primary">
                  Your Profile
                </Link>
                <span className="hero-divider">or</span>
                <Link to="/explore" className="hero-btn secondary">
                  explore community
                </Link>
              </>
            )}
          </div>
<<<<<<< HEAD
        )}
        {user && <Link to={`/profile/${user.username}`}><button>Your Profile</button></Link>}
        <span style={{ marginLeft: 8 }} />
        <Link to="/chat"><button>Messages</button></Link>
        <div style={{ marginTop: 12 }}>
          <Link to="/ai-demo">Try the AI Demo</Link>
=======
>>>>>>> b7d5e9e (commit)
        </div>
      </div>

      {/* Illustration Section */}
      <div className="illustration-section">
        <div className="illustration-container">
          <img 
            src="/Group_2.png" 
            alt="Ctrl+Femme Community Illustration" 
            className="community-illustration"
          />
        </div>
<<<<<<< HEAD
        <div className="card">
          <h3>Messages</h3>
          <p>DM friends or chat with your groups.</p>
          <Link to="/chat"><button>Open</button></Link>
        </div>
        {user ? (
          <div className="card">
            <h3>Messages</h3>
            <p>DM friends or chat with your groups.</p>
            <Link to="/chat"><button>Open</button></Link>
=======
        
        <div className="community-text">
          <p>
            Ctrl+Femme's goals are simple: to create a safe, supportive, and fun space where 
            underrepresented groups in gaming, tech, and sports can connect, team up, and thrive.
          </p>
          <p>
            We know it isn't always easy to find others who share both your interests 
            and your experiences, so we built a fun community where these connections come first!
          </p>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="info-grid">
        <div className="info-card">
          <div className="card-icon">
            <img src="/HP_Character_Active.png" alt="HP Character" className="card-icon-img" />
>>>>>>> b7d5e9e (commit)
          </div>
          <h3>What is Ctrl+Femme?</h3>
          <p>
            Ctrl+Femme is a free social networking platform specifically 
            made for underrepresented groups in gaming, tech, and sports to find and 
            connect with each other.
          </p>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <img src="/HP_Character_Active.png" alt="HP Character" className="card-icon-img" />
          </div>
          <h3>How can I make friends?</h3>
          <p>
            Ctrl+Femme helps you find other community members to connect with 
            based on preferences, skill level, similar interests, and region.
          </p>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <img src="/HP_Character_Active.png" alt="HP Character" className="card-icon-img" />
          </div>
          <h3>Why was Ctrl+Femme made for diversity?</h3>
          <p>
            As smaller groups within the gaming, tech, and sports worlds, underrepresented 
            people often find it difficult to make friends of similar backgrounds. 
            We want to help people feel included in these fields and encourage 
            growth in a safe environment.
          </p>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <img src="/HP_Character_Active.png" alt="HP Character" className="card-icon-img" />
          </div>
          <h3>How can I find connections?</h3>
          <p>
            Ctrl+Femme helps you find other community members to connect with 
            based on preferences, skill level, similar interests, and region.
          </p>
        </div>
      </div>
    </div>
  );
}
