import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { formatUsd } from "../../utils/formatUsd.js";

export default function RefundList() {
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/refund-requests", {
          params: { status: status || undefined, page: 1, limit: 20 },
        });
        if (!cancelled) setData(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="card">
      <h2>Refund requests</h2>
      <label className="field" style={{ marginTop: "0.75rem", maxWidth: 220 }}>
        <span className="field-label">Status</span>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="more_info">More info</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order</th>
              <th>Buyer</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data.list || []).map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.order_id}</td>
                <td>{r.buyer_name ?? "—"}</td>
                <td>{r.vendor_name ?? "—"}</td>
                <td>{formatUsd(r.amount)}</td>
                <td>{r.status}</td>
                <td>
                  <Link className="btn" to={`/refund-requests/${r.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar meta={data.meta} />
    </div>
  );
}
