import './admin.css';

export default function RegionManagerPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Region Manager Dashboard</h1>
          <p className="admin-description">Monitor regional progress, approve district updates, and track zone performance.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Regional metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">8</span>
              <span className="admin-metric-label">Regions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">98</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">12</span>
              <span className="admin-metric-label">Events</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Pending requests</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Review district reports</li>
            <li>Approve event requests</li>
            <li>Track regional competitions</li>
            <li>View school performance</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>District approval pending in Geita</li>
            <li>Regional competition results submitted</li>
            <li>New school added to the zone roster</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
