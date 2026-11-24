import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { formatUsd } from "../../utils/formatUsd.js";

const DEFAULT_LIMIT = 10;

function MiniTable({ title, rows, cols }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.k}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.id}>
                {cols.map((c) => (
                  <td key={c.k}>
                    {c.fmt ? c.fmt(r[c.k], r) : r[c.k] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function HomepageSections() {
  const [sec, setSec] = useState(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/homepage/sections", {
        params: {
          limit,
          offset,
          featured_limit: 500,
        },
      });
      setSec(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !sec) return <p className="muted">Loading…</p>;
  if (!sec) return <p className="muted">No data.</p>;

  const meta = sec.meta || {};
  const page = Math.floor((meta.offset ?? offset) / (meta.limit ?? limit)) + 1;

  return (
    <div className="card">
      <h2>Homepage sections (preview)</h2>
      <p className="muted">
        Lists use active, approved, non-suspended products from active approved vendors. Most visited excludes{" "}
        <code>user_visited = 0</code>. Trending includes only products with units sold &gt; 0. Featured vendors come
        from <code>featured_vendors</code> (active, approved vendors only).
      </p>
      <div
        className="rowflex"
        style={{
          flexWrap: "wrap",
          gap: "0.75rem",
          marginTop: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <label className="field" style={{ maxWidth: 120 }}>
          <span className="field-label">Per-section limit</span>
          <input
            className="input"
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(e) => {
              setOffset(0);
              setLimit(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || DEFAULT_LIMIT)));
            }}
          />
        </label>
        <div className="rowflex" style={{ gap: "0.35rem" }}>
          <button
            type="button"
            className="btn"
            title="Previous page (product sections)"
            disabled={offset <= 0 || loading}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn"
            title="Next page (product sections)"
            disabled={loading || (sec.most_visited || []).length < limit}
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </button>
          <button type="button" className="btn" disabled={loading} onClick={() => load()}>
            Refresh
          </button>
        </div>
        <span className="muted" style={{ fontSize: "0.88rem" }}>
          Page {page} · offset {meta.offset ?? offset} · limit {meta.limit ?? limit} · featured cap{" "}
          {meta.featured_limit ?? "—"}
        </span>
      </div>

      {loading ? <p className="muted">Updating…</p> : null}

      <MiniTable
        title="Most visited (user_visited &gt; 0)"
        rows={sec.most_visited}
        cols={[
          { k: "id", label: "ID" },
          { k: "title", label: "Title" },
          { k: "user_visited", label: "Visits" },
          { k: "price", label: "Price", fmt: (v) => formatUsd(v) },
        ]}
      />
      <MiniTable
        title="Cheapest (lowest price)"
        rows={sec.cheapest}
        cols={[
          { k: "id", label: "ID" },
          { k: "title", label: "Title" },
          { k: "price", label: "Price", fmt: (v) => formatUsd(v) },
        ]}
      />
      <MiniTable
        title="Trending (units sold, &gt; 0 only)"
        rows={sec.trending}
        cols={[
          { k: "id", label: "ID" },
          { k: "title", label: "Title" },
          { k: "units_sold", label: "Units" },
        ]}
      />
      <MiniTable
        title="Best sellers (rating, then reviews)"
        rows={sec.best_sellers}
        cols={[
          { k: "id", label: "ID" },
          { k: "title", label: "Title" },
          { k: "rating", label: "Rating" },
          { k: "total_reviews", label: "Reviews" },
        ]}
      />
      <MiniTable
        title="New arrivals (latest)"
        rows={sec.new_arrivals}
        cols={[
          { k: "id", label: "ID" },
          { k: "title", label: "Title" },
          {
            k: "createdAt",
            label: "Created",
            fmt: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
          },
        ]}
      />
      <MiniTable
        title="Featured vendors (Featured manager)"
        rows={sec.featured_vendors}
        cols={[
          { k: "sort_order", label: "Sort" },
          { k: "id", label: "Vendor ID" },
          { k: "name", label: "Name" },
          { k: "email", label: "Email" },
        ]}
      />
    </div>
  );
}
