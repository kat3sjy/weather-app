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
          <footer>© {new Date().getFullYear()} Technova Networking • Empowering connection across gaming, tech, and sports</footer>
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
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/connections', label: `Connections${incomingCount ? ` (${incomingCount})` : ''}` },
    { to: '/friends', label: 'Friends' },
    { to: '/settings', label: 'Settings' }
  ];
  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/login', label: 'Sign In' },
    { to: '/signup', label: 'Join Now' }
  ];
  const links = user ? authedLinks : publicLinks;
  return (
    <nav aria-label="Main navigation" style={{display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap'}}>
      <strong style={{marginRight:'1rem', fontSize:'1.05rem'}}>Technova</strong>
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
        <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
          <NavLink to={`/profile/${user.username}`} className={({isActive}:{isActive:boolean})=> isActive? 'active' : ''}>
            @{user.username}
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{background:'#222a35', color:'#fff'}}
            aria-label="Log out"
          >Logout</button>
        </div>
      )}
    </nav>
  );
}
