// StatusMessage displays user feedback banners (loading, success, error) with accessibility and retry support
function StatusMessage({ type = "info", message = "", onDismiss, onRetry }) {
  if (!message) return null;

  // Error messages are assertive (role="alert"); loading/info are polite (role="status")
  const role = type === "error" ? "alert" : "status";

  return (
    <div className={`status-banner status-${type}`} role={role} aria-live="polite">
      <div className="status-content">
        <span className="status-icon" aria-hidden="true">
          {type === "error" && "⚠️"}
          {type === "success" && "✅"}
          {type === "loading" && "⏳"}
          {type === "info" && "ℹ️"}
        </span>
        <span className="status-text">{message}</span>
      </div>

      <div className="status-actions">
        {onRetry && (
          <button
            type="button"
            className="status-retry-btn"
            onClick={onRetry}
            aria-label="Retry operation"
          >
            🔄 Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="status-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default StatusMessage;
