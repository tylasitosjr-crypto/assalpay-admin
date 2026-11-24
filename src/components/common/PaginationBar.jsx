import { useSearchParams } from "react-router-dom";

export default function PaginationBar({ meta }) {
  const [sp, setSp] = useSearchParams();
  if (!meta) return null;

  const page = meta.currentPage || 1;
  const limit = Number(sp.get("limit") || meta.limit || 10);

  const setPage = (p) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(p));
    setSp(next, { replace: true });
  };

  const setLimit = (lim) => {
    const next = new URLSearchParams(sp);
    next.set("limit", String(lim));
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  const showNav = meta.totalPages > 1;

  return (
    <div
      className="rowflex"
      style={{
        justifyContent: "space-between",
        marginTop: "0.75rem",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <span className="muted">
        Page {page} of {meta.totalPages || 1} · {meta.total ?? 0} total
      </span>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <label className="rowflex muted" style={{ gap: "0.35rem", alignItems: "center" }}>
          Rows
          <select
            className="input"
            style={{ width: 76 }}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {showNav && (
          <>
            <button
              type="button"
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </>
        )}
      </div>
    </div>
  );
}
