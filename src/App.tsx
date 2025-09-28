import React from 'react';
import { NavLink, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ConnectionsPage from './pages/ConnectionsPage';
import { UserStoreProvider } from './store/userStore';
import NotificationsPage from './pages/NotificationsPage';
import FriendsPage from './pages/FriendsPage';
import AIDemoPage from './pages/AIDemoPage';
import ChatPage from './pages/Chat';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.error('App error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <UserStoreProvider>
      <ErrorBoundary>
        <div>
          <NavBar />
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/ai-demo" element={<AIDemoPage />} />
              <Route path="/chat" element={<ChatPage />} />
              {/* Redirect legacy /messages -> /chat */}
              <Route path="/messages" element={<Navigate to="/chat" replace />} />
            </Routes>
          </div>
          <footer>© {new Date().getFullYear()} Ctrl+Femme • Empowering connection across gaming, tech, and sports</footer>
        </div>
      </ErrorBoundary>
    </UserStoreProvider>
  );
}

function NavBar() {
  const { user, logout } = useUserStore((s: any) => ({ user: s.user, logout: s.logout }));
  const navigate = useNavigate();
  const incomingCount = user?.incomingRequests?.length || 0;
  const authedLinks = [
    { to: '/', label: 'HOME' },
    { to: '/connections', label: `CONNECTIONS${incomingCount ? ` (${incomingCount})` : ''}` },
    { to: '/friends', label: 'FRIENDS' },
    { to: '/settings', label: 'SETTINGS' }
  ];
  const publicLinks = [
    { to: '/', label: 'HOME' },
    { to: '/login', label: 'SIGN IN' },
    { to: '/signup', label: 'JOIN NOW' }
  ];
  const links = user ? authedLinks : publicLinks;
  return (
    <nav aria-label="Main navigation" style={{display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap'}}>
      <strong style={{marginRight:'2rem', fontSize:'1.2rem', fontWeight:'700', color:'#ffffff'}}>Ctrl+Femme</strong>
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }: { isActive: boolean }) => isActive ? 'active' : ''}
          style={{ position:'relative' }}
        >
          {l.label}
        </NavLink>
      ))}
      <span style={{flex:1}} />
      {user && (
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          <NavLink to="/notifications" className={({isActive}:{isActive:boolean})=> isActive? 'active' : ''} title="Notifications">
            🔔
          </NavLink>
          <NavLink to={`/profile/${user.username}`} className={({isActive}:{isActive:boolean})=> isActive? 'active' : ''} style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff4fa3, #ff9bd2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '700',
            fontSize: '0.8rem',
            textDecoration: 'none'
          }} title={`Profile: @${user.username}`}>
            {user.firstName?.charAt(0) || user.username?.charAt(0) || '?'}
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', fontSize:'0.8rem', padding:'0.5rem 1rem'}}
            aria-label="Log out"
          >Logout</button>
        </div>
      )}
    </nav>
  );
}
