export default function DashboardLoading() {
  return (
    <div className="dashboard-shell">
      <div className="loading-stack" aria-busy="true" aria-live="polite">
        <div className="loading-block title" />
        <div className="loading-block copy" />
        <div className="loading-grid">
          <div className="loading-card" />
          <div className="loading-card" />
          <div className="loading-card" />
        </div>
        <div className="loading-panel" />
      </div>
    </div>
  );
}
