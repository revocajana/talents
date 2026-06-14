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

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <h2>Overview</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Sport Teachers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">District Managers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">Head Teachers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Ward Managers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">Admins</span>
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
