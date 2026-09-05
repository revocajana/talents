export default function DashboardSkeleton({ label = 'Loading dashboard' }) {
  return (
    <div className="dashboard-skeleton" aria-label={label} aria-busy="true">
      <div className="dashboard-skeleton-heading">
        <div className="dashboard-skeleton-block dashboard-skeleton-title" />
        <div className="dashboard-skeleton-block dashboard-skeleton-subtitle" />
      </div>
      <div className="dashboard-skeleton-stats">
        {[1, 2, 3, 4].map((item) => (
          <div className="dashboard-skeleton-card" key={item}>
            <div className="dashboard-skeleton-block dashboard-skeleton-label" />
            <div className="dashboard-skeleton-block dashboard-skeleton-number" />
          </div>
        ))}
      </div>
      <div className="dashboard-skeleton-card dashboard-skeleton-actions">
        <div className="dashboard-skeleton-block dashboard-skeleton-section-title" />
        <div className="dashboard-skeleton-action-row">
          {[1, 2, 3].map((item) => <div className="dashboard-skeleton-block dashboard-skeleton-action" key={item} />)}
        </div>
      </div>
      <div className="dashboard-skeleton-panels">
        {[1, 2].map((panel) => (
          <div className="dashboard-skeleton-card dashboard-skeleton-panel" key={panel}>
            <div className="dashboard-skeleton-panel-heading">
              <div className="dashboard-skeleton-block dashboard-skeleton-section-title" />
              <div className="dashboard-skeleton-block dashboard-skeleton-count" />
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div className="dashboard-skeleton-table-row" key={row}>
                <div className="dashboard-skeleton-block dashboard-skeleton-row-main" />
                <div className="dashboard-skeleton-block dashboard-skeleton-row-secondary" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
