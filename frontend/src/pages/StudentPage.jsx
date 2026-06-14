import './admin.css';

export default function StudentPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Student Dashboard</h1>
          <p className="admin-description">Review your competitions, talents, and the latest announcements.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Student metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">3</span>
              <span className="admin-metric-label">Talents</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">2</span>
              <span className="admin-metric-label">Competitions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">5</span>
              <span className="admin-metric-label">Results</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">Awards</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>View competition schedules</li>
            <li>Check result details</li>
            <li>Update your profile</li>
            <li>See announcements</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>Competition results published</li>
            <li>New talent event announced</li>
            <li>Club meeting scheduled tomorrow</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
