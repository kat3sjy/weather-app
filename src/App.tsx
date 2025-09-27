import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import OnboardingPage from './pages/OnboardingPage';
import SettingsPage from './pages/SettingsPage';
import { UserStoreProvider } from './store/userStore';

export default function App() {
  return (
    <UserStoreProvider>
      <div>
        <NavBar />
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
        <footer>© {new Date().getFullYear()} Technova Networking • Empowering connection across gaming, tech, and sports</footer>
      </div>
    </UserStoreProvider>
  );
}

function NavBar() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/onboarding', label: 'Onboarding' },
    { to: '/settings', label: 'Settings' }
  ];
  return (
    <nav>
      <strong style={{marginRight:'1rem'}}>Technova</strong>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} className={({isActive}) => isActive ? 'active' : ''}>{l.label}</NavLink>
      ))}
    </nav>
  );
}
