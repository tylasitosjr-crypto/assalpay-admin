import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { formatUsd } from "../../utils/formatUsd.js";

export default function WithdrawalList() {
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/withdrawals", {
          params: { status: status || undefined },
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
      <h2>Vendor withdrawals</h2>
      <label className="field" style={{ marginTop: "0.75rem", maxWidth: 240 }}>
        <span className="field-label">Status</span>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="requested">Requested</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Balance snapshot</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data.list || []).map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.withdrawal_vendor?.name ?? r.vendor_user_id}</td>
                <td>{formatUsd(r.requested_amount)}</td>
                <td>{formatUsd(r.available_balance_snapshot)}</td>
                <td>{r.status}</td>
                <td>
                  <Link className="btn" to={`/withdrawals/${r.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
