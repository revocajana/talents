import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import * as apiService from '../services/apiService';
import '../styles/login.css';
import logo from '../assets/Logo1.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter password in both fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err?.response?.data?.detail || err?.message || 'Failed to reset password';
      setError(errorMsg);
      if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
        setInvalidToken(true);
      }
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

        {invalidToken ? (
          <div style={{ textAlign: 'center', color: '#991b1b', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✕</div>
            <p style={{ fontSize: '0.95rem', margin: '0' }}>
              This password reset link is invalid or has expired.
            </p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/forgot-password" className="primary-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Request New Reset Link
              </Link>
            </div>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', color: '#065f46', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
            <p style={{ fontSize: '0.95rem', margin: '0' }}>
              Password reset successfully!
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px' }}>
              Redirecting to login in 2 seconds...
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
              <h3 style={{ textAlign: 'center', color: '#0f172a', marginBottom: '20px', marginTop: '0' }}>
                Create New Password
              </h3>

              <div className="field-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength="8"
                />
              </div>

              <div className="field-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  minLength="8"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Resetting password...' : 'Reset Password'}
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
