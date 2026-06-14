import AppBar from '../components/AppBar';
import './admin.css';

export default function TalentAdminPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <AppBar
        userName="Talent Admin"
        onLogout={onLogout}
        onProfile={() => {
          window.alert('Profile action not implemented yet.');
        }}
        onChangePassword={() => {
          window.alert('Change password action not implemented yet.');
        }}
      />

      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome, Talent Administrator</p>
          <h1 className="admin-title">Talent Admin Dashboard</h1>
          <p className="admin-description">
            Oversee talent management, competitions, and user activity across all regions.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Talent Overview</p>
          <h2>System activity</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">256</span>
              <span className="admin-metric-label">Registered talents</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">45</span>
              <span className="admin-metric-label">Active competitions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">89</span>
              <span className="admin-metric-label">Pending reviews</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">12</span>
              <span className="admin-metric-label">Alerts</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Management Tasks</p>
          <ul className="admin-actions">
            <li>Review talent submissions</li>
            <li>Manage competition schedules</li>
            <li>Oversee regional managers</li>
            <li>Monitor result submissions</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">System alerts</p>
          <ul className="admin-activity">
            <li>High talent registration spike in Dar region</li>
            <li>Competition deadline approaching in 2 days</li>
            <li>Results pending approval from 3 districts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
