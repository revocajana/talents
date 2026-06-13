import './auth.css';
import logo from '../assets/images/logo.jpg';

export default function AuthPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div>
            <p className="auth-system-name">Talent management system</p>
            <img src={logo} alt="Conture Talent Management Logo" className="auth-logo" />
          </div>
        </div>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <label className="auth-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="auth-input"
            required
          />

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

          <div className="auth-row">
            <label className="auth-checkbox">
              <input type="checkbox" />
              Remember me
            </label>
            <button type="submit" className="auth-submit">
              Log in
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
