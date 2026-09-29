export default function GroomersLoading() {
  return (
    <div className="dashboard-shell">
      <div className="loading-stack" aria-busy="true" aria-live="polite">
        <div className="loading-block title" />
        <div className="loading-block copy" />
        <div className="groomer-admin-grid">
          <div className="loading-panel" />
          <div className="loading-panel" />
        </div>
      </div>
    </div>
  );
}
