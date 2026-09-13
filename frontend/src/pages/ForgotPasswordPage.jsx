import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import '../styles/login.css';
import logo from '../assets/Logo1.png';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username && !email) {
      setError('Please enter either username or email');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.requestPasswordReset({ username, email });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="welcome-label">Talanta Management System</p>
          <img className="brand-logo" src={logo} alt="Talanta logo" />
        </div>

        {success ? (
          <div style={{ textAlign: 'center', color: '#065f46', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
            <p style={{ fontSize: '0.95rem', margin: '0' }}>
              If an account exists with the provided information, a password reset link will be sent to the registered email.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>
              Redirecting to login in 3 seconds...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert error">
                <strong>{error}</strong>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              <div style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                OR
              </div>

              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/login" style={{ fontSize: '0.9rem', color: '#0E1DB6', textDecoration: 'underline' }}>
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
