import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { hashPassword, getStoredCredentials } from '../utils/password';
import "./home-style.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore() as any;
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to profile
  if (user) {
    navigate(`/profile/${user.username}`);
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const storedCreds = getStoredCredentials();
      
      if (!storedCreds) {
        setError('No account found. Please create an account first.');
        setIsLoading(false);
        return;
      }

      const enteredUsername = form.username.trim().toLowerCase();
      if (enteredUsername !== storedCreds.username) {
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      const enteredPasswordHash = await hashPassword(form.password);
      if (enteredPasswordHash !== storedCreds.passwordHash) {
        setError('Invalid username or password.');
        setIsLoading(false);
        return;
      }

      // Login successful - retrieve user data from localStorage
      const userKey = 'technova_user_v1';
      const userData = localStorage.getItem(userKey);
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        navigate('/explore');
      } else {
        setError('User profile not found. Please complete onboarding.');
      }
      
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    
    setIsLoading(false);
  }

  const handleBack = () => {
    navigate('/');
  };

  const handleNext = async () => {
    // Use existing login logic
    const event = { preventDefault: () => {} } as React.FormEvent;
    await handleLogin(event);
  };

  const handleHome = () => {
    navigate('/');
  };

  const handleConnections = () => {
    navigate('/explore');
  };

  const handleFriends = () => {
    navigate('/friends');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleProfile = () => {
    if (user) {
      navigate(`/profile/${user.username}`);
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="home-page">
      {/* Auth Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Sign In
          </h1>
          <p className="hero-description">
            Welcome back to Ctrl+Femme! Sign in to connect with your community and continue building meaningful relationships.
          </p>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username*</label>
              <input
                type="text"
                className="form-input"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                required
                disabled={isLoading}
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password*</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
                disabled={isLoading}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <Link to="/" className="hero-btn secondary">
                Back to Home
              </Link>
              <button 
                type="submit"
                className="hero-btn primary"
                disabled={isLoading || !form.username.trim() || !form.password}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="auth-switch">
              <p>Don't have an account? <Link to="/signup" className="auth-link">Create one here</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}