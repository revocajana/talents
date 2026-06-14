import './admin.css';

export default function HeadTeacherPage({ onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">Head Teacher Dashboard</h1>
          <p className="admin-description">Manage your school, teachers, and student participation from a single place.</p>
        </div>
        <button className="admin-logout" type="button" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>School metrics</h2>
          <div className="admin-metrics">
            <div className="admin-metric">
              <span className="admin-metric-value">12</span>
              <span className="admin-metric-label">Teachers</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">310</span>
              <span className="admin-metric-label">Students</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">5</span>
              <span className="admin-metric-label">Competitions</span>
            </div>
            <div className="admin-metric">
              <span className="admin-metric-value">1</span>
              <span className="admin-metric-label">Approvals</span>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            <li>Register new students</li>
            <li>Review teacher requests</li>
            <li>Track school talent entries</li>
            <li>View student progress</li>
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            <li>Sport teacher uploaded competition results</li>
            <li>Student registration completed</li>
            <li>School announcement published</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
