import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';
import logo from '../assets/Logo1.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting login attempt...');
      const userData = await login(username, password);
      console.log('Login completed, redirecting to dashboard for role:', userData.role);
      // Navigate to the appropriate dashboard for the user's role
      navigate(`/dashboard/${userData.role.replace('_', '-')}`);
    } catch (err) {
      console.error('Login error caught in component:', err);
      const errorMessage = err?.message || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="welcome-label">Talent Management System</p>
          <img className="brand-logo" src={logo} alt="Conturel Education Networking Initiative" />
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-action-row">
            <a href="#register-school" className="register-school-link" onClick={(event) => event.preventDefault()}>
              Register school
            </a>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
