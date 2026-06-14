import './admin.css';

export default function ParentPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Parent Dashboard</h1>
          <p className="admin-description">Monitor your child’s performance, announcements, and upcoming competitions.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Parent metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">2</span>
              <span className="admin-metric-label">Children</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">3</span>
              <span className="admin-metric-label">Events</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">6</span>
              <span className="admin-metric-label">Results</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">Messages</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>View child results</li>
            <li>Check announcements</li>
            <li>Contact teachers</li>
            <li>Review upcoming competitions</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>New announcement posted for parents</li>
            <li>Child score updated for zone event</li>
            <li>Parent meeting scheduled next week</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
