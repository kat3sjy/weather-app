import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { validatePassword, hashPassword, storeCredentials, getStoredCredentials } from '../utils/password';
import "./signup-style.css";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { users, registerUser } = useUserStore() as any;
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!form.username.trim()) {
        setError('Username is required.');
        setIsLoading(false);
        return;
      }

      if (!form.password) {
        setError('Password is required.');
        setIsLoading(false);
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }

      // Validate password strength
      const passwordIssues = validatePassword(form.password);
      if (passwordIssues.length > 0) {
        setError(`Password requirements: ${passwordIssues.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Check if username already exists
      const existingCreds = getStoredCredentials();
      if (existingCreds && existingCreds.username === form.username.trim().toLowerCase()) {
        setError('Username already exists. Please choose a different one.');
        setIsLoading(false);
        return;
      }

      // Check if user exists in users array
      const existingUser = users?.find((u: any) => u.username === form.username.trim().toLowerCase());
      if (existingUser) {
        setError('Username already exists. Please choose a different one.');
        setIsLoading(false);
        return;
      }

      // Hash password and store credentials
      const passwordHash = await hashPassword(form.password);
      storeCredentials(form.username.trim().toLowerCase(), passwordHash);

      // Create user with basic info (they can complete profile later)
      const newUser = {
        username: form.username.trim().toLowerCase(),
        firstName: '',
        lastName: '',
        location: '',
        areas: [],
        experienceLevel: '',
        goals: '',
        bio: '',
        profilePicture: '',
        connections: [],
        incomingRequests: [],
        outgoingRequests: []
      };

      // Register user
      registerUser(newUser);

      // Navigate to onboarding to complete profile
      navigate('/onboarding');
      
    } catch (err) {
      setError('Sign up failed. Please try again.');
    }
    
    setIsLoading(false);
  }

  const handleBack = () => {
    navigate('/');
  };

  const handleNext = async () => {
    const event = { preventDefault: () => {} } as React.FormEvent;
    await handleSignUp(event);
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="signup" data-model-id="1:3">
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
            <button className="nav-button" onClick={() => navigate('/signup')}>
              <div className="nav-text">JOIN NOW</div>
              <div className="nav-box" />
            </button>
          </div>

          <button className="bell-button">
            <img
              className="image"
              alt="Notifications"
              src="https://c.animaapp.com/tyFZdqrz/img/image-1@2x.png"
            />
          </button>

          <button className="profile-button">
            <div className="div" />
          </button>
        </div>

        <div className="rectangle-2" />

        <div className="text-wrapper">SIGN UP</div>

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
            autoComplete="new-password"
          />
        </div>

        <div className="confirm-password-label">confirm password*</div>
        <div className="rectangle-5">
          <input
            type="password"
            className="confirm-password-input"
            value={form.confirmPassword}
            onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        <button className="back-button" onClick={handleBack} disabled={isLoading}>
          <div className="rectangle-back" />
          <div className="text-wrapper-2">back</div>
        </button>

        <button 
          className="next-button" 
          onClick={handleNext}
          disabled={isLoading || !form.username.trim() || !form.password || !form.confirmPassword}
        >
          <div className="rectangle-next" />
          <div className="text-wrapper-3">{isLoading ? 'creating account...' : 'next'}</div>
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