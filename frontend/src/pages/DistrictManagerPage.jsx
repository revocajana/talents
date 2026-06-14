import './admin.css';

export default function DistrictManagerPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">District Manager Dashboard</h1>
          <p className="admin-description">Supervise ward and school operations, approve talent entries, and coordinate support.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>District metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">14</span>
              <span className="admin-metric-label">Wards</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">40</span>
              <span className="admin-metric-label">Schools</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">7</span>
              <span className="admin-metric-label">Events</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">2</span>
              <span className="admin-metric-label">Pending approvals</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Review school submissions</li>
            <li>Approve talent entries</li>
            <li>Track ward performance</li>
            <li>Coordinate district support</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>School registration approved in Ward 2</li>
            <li>Talent entry review completed</li>
            <li>District meeting scheduled for Friday</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
