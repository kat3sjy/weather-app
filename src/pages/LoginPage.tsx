import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { hashPassword, getStoredCredentials } from '../utils/password';
import "./style.css";

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
    <div className="login" data-model-id="1:2">
      <div className="main-container">
        <div className="group">
          <div className="rectangle" />

          <div className="navigation-container">
            <button className="nav-button" onClick={handleHome}>
              <div className="nav-text">HOME</div>
              <div className="nav-box" />
            </button>
            <button className="nav-button" onClick={() => navigate('/login')}>
              <div className="nav-text">SIGN IN</div>
              <div className="nav-box" />
            </button>
            <button className="nav-button" onClick={() => navigate('/onboarding')}>
              <div className="nav-text">JOIN NOW</div>
              <div className="nav-box" />
            </button>
          </div>

          <button className="bell-button" onClick={handleNotifications}>
            <img
              className="image"
              alt="Notifications"
              src="https://c.animaapp.com/tyFZdqrz/img/image-1@2x.png"
            />
          </button>

          <button className="profile-button" onClick={handleProfile}>
            <div className="div" />
          </button>
        </div>

        <div className="rectangle-2" />

        <div className="text-wrapper">LOGIN</div>

        <div className="username-label">username*</div>
        <div className="rectangle-3">
          <input
            type="text"
            className="username-input"
            value={form.username}
            onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
            required
            disabled={isLoading}
          />
        </div>

        <div className="password-label">password*</div>
        <div className="rectangle-4">
          <input
            type="password"
            className="password-input"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        <button className="back-button" onClick={handleBack} disabled={isLoading}>
          <div className="rectangle-5" />
          <div className="text-wrapper-2">back</div>
        </button>

        <button 
          className="next-button" 
          onClick={handleNext}
          disabled={isLoading || !form.username.trim() || !form.password}
        >
          <div className="rectangle-6" />
          <div className="text-wrapper-3">{isLoading ? 'signing in...' : 'next'}</div>
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        
      </div>
    </div>
  );
}