import './admin.css';

export default function WardManagerPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Ward Manager Dashboard</h1>
          <p className="admin-description">Manage ward-level activities, support local schools, and approve school requests.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Ward metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">13</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">480</span>
              <span className="admin-metric-label">Students</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Events</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">3</span>
              <span className="admin-metric-label">Action items</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Approve school requests</li>
            <li>Review ward results</li>
            <li>Support local schools</li>
            <li>Send announcements</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>New club registered in Ward 4</li>
            <li>School event scheduled for next week</li>
            <li>Pending approval for parent accounts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
