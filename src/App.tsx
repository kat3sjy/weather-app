import React from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import { UserStoreProvider } from './store/userStore';
import NotificationsPage from './pages/NotificationsPage';
import FriendsPage from './pages/FriendsPage';
import AIDemoPage from './pages/AIDemoPage';

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
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/ai-demo" element={<AIDemoPage />} />
            </Routes>
          </div>
          <footer>© {new Date().getFullYear()} Technova Networking • Empowering connection across gaming, tech, and sports</footer>
        </div>
      </ErrorBoundary>
    </UserStoreProvider>
  );
}

function NavBar() {
  const user = useUserStore(s => s.user);
  const logout = useUserStore(s => s.logout);
  const navigate = useNavigate();
  const links = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/friends', label: 'Friends' },
    { to: '/onboarding', label: 'Onboarding' },
    { to: '/settings', label: 'Settings' }
  ];
  return (
    <nav>
      <strong style={{marginRight:'1rem'}}>Technova</strong>
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}
        >
          {l.label}
        </NavLink>
      ))}
      {user && (
        <button
          style={{marginLeft:'auto', background:'#222a35', color:'#fff'}}
          onClick={() => { logout(); navigate('/'); }}
        >Logout</button>
      )}
    </nav>
  );
}
