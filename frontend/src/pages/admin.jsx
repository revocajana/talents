import AppBar from '../components/AppBar';
import './admin.css';

export default function AdminPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <AppBar
        userName="Administrator"
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
          <p className="admin-welcome">Welcome back, Administrator</p>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-description">
            Manage users, schools, competitions, and review the latest activity from here.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>System metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">34</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">128</span>
              <span className="admin-metric-label">Users</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">19</span>
              <span className="admin-metric-label">Competitions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">7</span>
              <span className="admin-metric-label">Pending approvals</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Manage school registrations</li>
            <li>Review competition entries</li>
            <li>Approve new users</li>
            <li>View parent/student reports</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>New head teacher registered in Mwanza</li>
            <li>Competition schedule updated for March</li>
            <li>Parent account created for Grace Mbala</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
