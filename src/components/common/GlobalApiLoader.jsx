import { useApiPending } from "../../context/ApiLoadingContext.jsx";

export default function GlobalApiLoader() {
  const pending = useApiPending();
  if (pending <= 0) return null;

  return (
    <div className="api-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="api-loading-panel">
        <span className="api-loading-spinner" aria-hidden />
        <span className="api-loading-label">Loading…</span>
      </div>
    </div>
  );
}
