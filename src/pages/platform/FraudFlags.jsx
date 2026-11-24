import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import {
  FLAG_TYPE_DESCRIPTIONS,
  FLAG_TYPE_LABELS,
  STATUS_LABELS,
  formatFlagDetails,
  severityClass,
  statusClass,
} from "../../utils/fraudFlagLabels.js";

const DETECTION_RULES = [
  {
    key: "failed_payments",
    label: FLAG_TYPE_LABELS.failed_payments,
    description: FLAG_TYPE_DESCRIPTIONS.failed_payments,
  },
  {
    key: "shared_device_token",
    label: FLAG_TYPE_LABELS.shared_device_token,
    description: FLAG_TYPE_DESCRIPTIONS.shared_device_token,
  },
  {
    key: "refund_spike",
    label: FLAG_TYPE_LABELS.refund_spike,
    description: FLAG_TYPE_DESCRIPTIONS.refund_spike,
  },
];

function StatCard({ label, value, sub, active, onClick }) {
  return (
    <button
      type="button"
      className="dashboard-stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        border: active ? "2px solid var(--primary, #166534)" : undefined,
        width: "100%",
      }}
    >
      <div className="dashboard-stat-card__body">
        <div className="dashboard-stat-card__label">{label}</div>
        <div className="dashboard-stat-card__value">{value ?? 0}</div>
        {sub ? <div className="dashboard-stat-card__sub">{sub}</div> : null}
      </div>
    </button>
  );
}

export default function FraudFlags() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null, summary: null, source: null });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [dbCheck, setDbCheck] = useState(null);

  const status = sp.get("status") || "";
  const flagType = sp.get("flag_type") || "";
  const severity = sp.get("severity") || "";
  const queue = sp.get("queue") || "";

  const load = useCallback(async () => {
    setLoading(true);
    setData({ list: [], meta: null, summary: null, source: null });
    try {
      const params = Object.fromEntries(sp.entries());
      params._ = String(Date.now());
      const [listRes, checkRes] = await Promise.all([
        axiosInstance.get("/admin/fraud-flags", {
          params,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }),
        axiosInstance.get("/admin/fraud-flags/db-check", {
          params: { _: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }),
      ]);
      const body = unwrap(listRes);
      const check = unwrap(checkRes);
      setDbCheck(check);

      const activeRows = Number(check?.active_rows ?? body.source?.active_rows ?? 0);
      if (activeRows === 0) {
        body.list = [];
        if (body.meta) body.meta = { ...body.meta, total: 0, totalPages: 1, currentPage: 1 };
        if (body.summary) {
          body.summary = {
            ...body.summary,
            open: 0,
            under_review: 0,
            pending_review: 0,
            by_type: {
              failed_payments: 0,
              shared_device_token: 0,
              refund_spike: 0,
            },
          };
        }
      }
      setData(body);
    } catch (e) {
      toast.error(e.message);
      setData({ list: [], meta: null, summary: null, source: null });
      setDbCheck(null);
    } finally {
      setLoading(false);
    }
  }, [sp]);

  useEffect(() => {
    load();
  }, [load]);

  const patchFilter = (updates) => {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  const scan = async () => {
    setScanning(true);
    try {
      const res = await axiosInstance.post("/admin/fraud/scan");
      const body = unwrap(res);
      let msg;
      if ((body.new_flags ?? 0) > 0) {
        msg = `Scan complete — ${body.new_flags} new flag(s) added`;
      } else if ((body.closed_duplicates ?? 0) > 0) {
        msg = `Scan complete — no new flags; ${body.closed_duplicates} duplicate open item(s) auto-closed`;
      } else if ((body.skipped_reviewed ?? 0) > 0) {
        msg = "Scan complete — no new flags (already reviewed)";
      } else {
        msg = "Scan complete — no new flags";
      }
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setScanning(false);
    }
  };

  const review = async (row, decision) => {
    const titles = {
      dismiss: "Dismiss this flag?",
      confirm: "Confirm as fraud / risk?",
      escalate: "Escalate for further review?",
    };
    const { isConfirmed, value: notes } = await Swal.fire({
      icon: decision === "confirm" ? "warning" : "question",
      title: titles[decision] ?? "Review flag?",
      input: "textarea",
      inputLabel: "Notes (optional)",
      inputPlaceholder: "Reason for this decision…",
      showCancelButton: true,
      confirmButtonText: decision.charAt(0).toUpperCase() + decision.slice(1),
      confirmButtonColor: decision === "confirm" ? "#b91c1c" : "#166534",
    });
    if (!isConfirmed) return;

    try {
      const res = await axiosInstance.post(`/admin/fraud-flags/${row.id}/review`, {
        decision,
        notes: notes?.trim() || "",
      });
      unwrap(res);
      toast.success("Review saved");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const summary = data.summary || {};
  const isPendingQueue = queue === "pending" && !status;
  const dbInfo = dbCheck || data.source;
  const activeDbRows = Number(dbInfo?.active_rows ?? 0);

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      {dbInfo ? (
        <div
          className="card"
          style={{
            padding: "0.75rem 1rem",
            borderLeft: `4px solid ${activeDbRows > 0 ? "#166534" : "#6b7280"}`,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            Live database:{" "}
            <code>
              {dbInfo.host ?? "?"}:{dbInfo.port ?? 3306}/{dbInfo.database ?? "?"}.fraud_flags
            </code>
          </div>
          <div className="muted" style={{ fontSize: "0.88rem", marginTop: "0.25rem" }}>
            {activeDbRows} row(s) in table right now
            {dbInfo.checked_at || dbInfo.fetched_at
              ? ` · checked ${new Date(dbInfo.checked_at || dbInfo.fetched_at).toLocaleString()}`
              : ""}
          </div>
          {activeDbRows === 0 && data.list.length > 0 ? (
            <div style={{ color: "#b91c1c", marginTop: "0.35rem", fontSize: "0.88rem" }}>
              Stale browser data was cleared — the table is empty in MySQL.
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className="rowflex"
        style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Fraud &amp; risk monitoring</h2>
          <p className="muted" style={{ margin: "0.35rem 0 0", maxWidth: 720 }}>
            Suspicious activity is flagged automatically for admin review. Run a scan to
            detect multiple failed payments, shared-device multi-accounts, and refund spikes.
            Items in the review queue stay open until you dismiss or confirm them.
          </p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={scan}
          disabled={scanning}
        >
          {scanning ? "Scanning…" : "Run fraud scan"}
        </button>
      </div>

      <div
        className="rowflex"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <StatCard
          label="Review queue"
          value={summary.pending_review}
          sub="Open + under review"
          active={isPendingQueue && !flagType}
          onClick={() => patchFilter({ queue: "pending", status: "", flag_type: "" })}
        />
        <StatCard
          label="Failed payments"
          value={summary.by_type?.failed_payments}
          sub="Pending review"
          active={flagType === "failed_payments"}
          onClick={() =>
            patchFilter({ queue: "pending", status: "", flag_type: "failed_payments" })
          }
        />
        <StatCard
          label="Shared device"
          value={summary.by_type?.shared_device_token}
          sub="Pending review"
          active={flagType === "shared_device_token"}
          onClick={() =>
            patchFilter({ queue: "pending", status: "", flag_type: "shared_device_token" })
          }
        />
        <StatCard
          label="Refund spikes"
          value={summary.by_type?.refund_spike}
          sub="Pending review"
          active={flagType === "refund_spike"}
          onClick={() =>
            patchFilter({ queue: "pending", status: "", flag_type: "refund_spike" })
          }
        />
      </div>

      <div className="card" style={{ padding: "0.85rem 1rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Detection rules</div>
        <ul style={{ margin: 0, paddingLeft: "1.15rem" }} className="muted">
          {DETECTION_RULES.map((r) => (
            <li key={r.key} style={{ marginBottom: "0.25rem" }}>
              <strong style={{ color: "var(--text)" }}>{r.label}</strong> — {r.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div className="rowflex" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <label className="field" style={{ margin: 0, minWidth: 160 }}>
            <span className="field-label">Status</span>
            <select
              className="input"
              value={status}
              onChange={(e) => patchFilter({ status: e.target.value })}
            >
              <option value="">Any</option>
              <option value="open">Open</option>
              <option value="under_review">Under review</option>
              <option value="dismissed">Dismissed</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </label>
          <label className="field" style={{ margin: 0, minWidth: 200 }}>
            <span className="field-label">Flag type</span>
            <select
              className="input"
              value={flagType}
              onChange={(e) => patchFilter({ flag_type: e.target.value })}
            >
              <option value="">All types</option>
              {DETECTION_RULES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ margin: 0, minWidth: 130 }}>
            <span className="field-label">Severity</span>
            <select
              className="input"
              value={severity}
              onChange={(e) => patchFilter({ severity: e.target.value })}
            >
              <option value="">Any</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : data.list.length === 0 ? (
          <p className="muted" style={{ padding: "1rem" }}>
            No flagged items match these filters. Run a fraud scan to detect suspicious
            activity, or change the filters above.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Flagged</th>
                <th>Detection</th>
                <th>Evidence</th>
                <th>Severity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => {
                const pending = r.status === "open" || r.status === "under_review";
                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td>
                      <div>{FLAG_TYPE_LABELS[r.flag_type] || r.flag_type}</div>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {FLAG_TYPE_DESCRIPTIONS[r.flag_type] || ""}
                      </div>
                    </td>
                    <td>
                      {formatFlagDetails(r)}
                      {r.related_users?.length > 0 ? (
                        <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
                          {r.related_users.map((u) => (
                            <span key={u.id} style={{ marginRight: "0.5rem" }}>
                              <Link to={`/users/${u.id}`}>
                                {u.name || u.email || `#${u.id}`}
                              </Link>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={severityClass(r.severity)}>{r.severity}</span>
                    </td>
                    <td>
                      <span className={statusClass(r.status)}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {pending ? (
                        <>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => review(r, "dismiss")}
                          >
                            Dismiss
                          </button>{" "}
                          <button
                            type="button"
                            className="btn"
                            onClick={() => review(r, "escalate")}
                          >
                            Escalate
                          </button>{" "}
                          <button
                            type="button"
                            className="btn danger"
                            onClick={() => review(r, "confirm")}
                          >
                            Confirm
                          </button>
                        </>
                      ) : (
                        <span className="muted">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
      {dbInfo ? (
        <p className="muted" style={{ fontSize: "0.82rem", marginTop: "0.25rem" }}>
          List is loaded only from{" "}
          <code>
            {dbInfo.host ?? "?"}:{dbInfo.port ?? 3306}/{dbInfo.database ?? "?"}.fraud_flags
          </code>
          {data.meta?.total != null ? ` · ${data.meta.total} shown with current filters` : ""}
        </p>
      ) : null}
    </div>
  );
}
