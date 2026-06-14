import './admin.css';

export default function RoleDashboard({ title, subtitle, metrics, actions, activity, onLogout }) {
  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="admin-welcome">Welcome back</p>
          <h1 className="admin-title">{title}</h1>
          <p className="admin-description">{subtitle}</p>
        </div>
        {onLogout && (
          <button className="admin-logout" type="button" onClick={onLogout}>
            Sign out
          </button>
        )}
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card-large">
          <p className="admin-card-label">Overview</p>
          <h2>Key metrics</h2>
          <div className="admin-metrics">
            {(metrics || []).map((metric) => (
              <div key={metric.label} className="admin-metric">
                <span className="admin-metric-value">{metric.value}</span>
                <span className="admin-metric-label">{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Quick actions</p>
          <ul className="admin-actions">
            {(actions || []).map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <p className="admin-card-label">Recent activity</p>
          <ul className="admin-activity">
            {(activity || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
