import './admin.css';

export default function ZoneManagerPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Zone Manager Dashboard</h1>
          <p className="admin-description">Oversee district activity, coordinate ward performance, and review zone-level progress.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Zone metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">5</span>
              <span className="admin-metric-label">Zones</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">22</span>
              <span className="admin-metric-label">Districts</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">62</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">6</span>
              <span className="admin-metric-label">Pending reviews</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Approve district competitions</li>
            <li>Review zonal summaries</li>
            <li>Monitor school participation</li>
            <li>Export zone reports</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>Zonal leaderboard updated for Tanganyika</li>
            <li>District result upload completed</li>
            <li>School participation gap detected</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
