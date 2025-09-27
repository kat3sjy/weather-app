import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { hashPassword, getStoredCredentials } from '../utils/password';

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

  return (
    <div className="grid" style={{ gap: '1.25rem', maxWidth: 480, margin: '2rem auto' }}>
      <div className="card">
        <h2>Welcome Back</h2>
        <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
          Sign in to your Technova account
        </p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{ color: '#ff9bd2', fontSize: '.8rem', margin: '0' }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !form.username.trim() || !form.password}
            style={{ marginTop: '.5rem' }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #333' 
        }}>
          <p style={{ fontSize: '.8rem', opacity: 0.7, marginBottom: '.5rem' }}>
            Don't have an account?
          </p>
          <button 
            type="button"
            onClick={() => navigate('/onboarding')}
            style={{ 
              background: '#222a35', 
              color: '#fff',
              fontSize: '.8rem'
            }}
          >
            Create Account
          </button>
        </div>
      </div>
      
      <p style={{ 
        fontSize: '.65rem', 
        opacity: 0.6, 
        textAlign: 'center',
        margin: 0 
      }}>
        Prototype authentication - credentials stored locally only
      </p>
    </div>
  );
}