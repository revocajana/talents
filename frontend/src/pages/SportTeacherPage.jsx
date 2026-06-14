import './admin.css';

export default function SportTeacherPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Sport Teacher Dashboard</h1>
          <p className="admin-description">Register students, upload results, and track talent performance.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Talent metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">120</span>
              <span className="admin-metric-label">Students</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">4</span>
              <span className="admin-metric-label">Competitions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">85</span>
              <span className="admin-metric-label">Results</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">2</span>
              <span className="admin-metric-label">Pending reviews</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Register competition participants</li>
            <li>Upload student scores</li>
            <li>Manage club activities</li>
            <li>View upcoming events</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>Score uploads completed for School Talent Day</li>
            <li>Club roster updated</li>
            <li>New student talent profile added</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
