import { useState } from 'react';
import './auth.css';
import logo from '../assets/images/logo.jpg';

export default function AuthPage({ onLogin }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const tokenRes = await fetch('/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => null);
        setError(data?.detail || 'Invalid username or password.');
        return;
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access;
      const refreshToken = tokenData.refresh;

      const userRes = await fetch('/api/users/current/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userRes.ok) {
        setError('Unable to load user profile after login.');
        return;
      }

      const userData = await userRes.json();
      if (!userData.role) {
        setError('Authenticated user has no role defined.');
        return;
      }

      onLogin({
        role: userData.role,
        username: userData.username,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      setError('Login service is unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div>
            <p className="auth-system-name">Talent management system</p>
            <img src={logo} alt="Conture Talent Management Logo" className="auth-logo" />
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="username">
              User name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="auth-input"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-row">
            <label className="auth-checkbox">
              <input type="checkbox" />
              Remember me
            </label>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p className="auth-note">
            Need help? Contact your administrator or reset your password.
          </p>
        </div>
      </div>
    </div>
  );
}
