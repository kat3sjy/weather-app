import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ConnectionsPage from './pages/ConnectionsPage';
import { UserStoreProvider } from './store/userStore';
import NotificationsPage from './pages/NotificationsPage';
import FriendsPage from './pages/FriendsPage';

export default function App() {
  return (
    <UserStoreProvider>
      <div>
        <NavBar />
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
          </Routes>
        </div>
        <footer>© {new Date().getFullYear()} Technova Networking • Empowering connection across gaming, tech, and sports</footer>
      </div>
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
    { to: '/onboarding', label: 'Join Now' }
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
