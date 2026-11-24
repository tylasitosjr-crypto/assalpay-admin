import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";

export default function AuditLogs() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/audit-logs", {
        params: Object.fromEntries(sp.entries()),
      });
      setData(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [sp]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  const exportCsvFetch = async () => {
    try {
      const res = await axiosInstance.get("/admin/audit-logs/export", {
        params: Object.fromEntries(sp.entries()),
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = "audit-logs.csv";
      a.click();
      URL.revokeObjectURL(u);
    } catch (e) {
      toast.error(e.message || "Export failed");
    }
  };

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div
        className="rowflex"
        style={{
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Audit logs</h2>
        <button
          type="button"
          className="btn"
          onClick={exportCsvFetch}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Download the current result set (same date range) as CSV, up to 5,000 rows."
        >
          Export CSV
        </button>
      </div>
      {/* <TableToolbar showStatus={false} sortOptions={[]}> */}
        <span className="muted" style={{ alignSelf: "center", marginRight: "0.25rem" }}>
          From
        </span>
        <input
          type="date"
          className="input"
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Include entries from this date (start of day) onward."
          value={sp.get("date_from") || ""}
          onChange={(e) => setFilter("date_from", e.target.value)}
        />
        <span className="muted" style={{ alignSelf: "center", marginRight: "0.25rem" }}>
          To
        </span>
        <input
          type="date"
          className="input"
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Include entries up to and including this date."
          value={sp.get("date_to") || ""}
          onChange={(e) => setFilter("date_to", e.target.value)}
        />
      {/* </TableToolbar> */}
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Module</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    {r.admin_name}{" "}
                    <span className="muted">{r.admin_email}</span>
                  </td>
                  <td>{r.action_type}</td>
                  <td>{r.module}</td>
                  <td>{r.entity_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </div>
  );
}
