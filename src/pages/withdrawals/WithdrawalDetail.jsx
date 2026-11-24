import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { formatUsd } from "../../utils/formatUsd.js";

const NEXT = {
  requested: [
    { v: "under_review", label: "Under review" },
    { v: "rejected", label: "Reject" },
  ],
  under_review: [
    { v: "approved", label: "Approve" },
    { v: "rejected", label: "Reject" },
  ],
  approved: [
    { v: "paid", label: "Mark paid" },
    { v: "rejected", label: "Reject" },
  ],
};

export default function WithdrawalDetail() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/withdrawals/${id}`);
      setRow(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async () => {
    if (!nextStatus) {
      toast.error("Choose next status");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/admin/withdrawals/${id}/status`, {
        status: nextStatus,
        rejection_reason:
          nextStatus === "rejected" ? rejectionReason.trim() : undefined,
      });
      unwrap(res);
      toast.success("Saved");
      setRejectionReason("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  const options = NEXT[row.status] || [];

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <Link className="btn" to="/withdrawals">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>Withdrawal #{row.id}</h2>
      <p>
        <strong>Vendor:</strong> {row.withdrawal_vendor?.name}
      </p>
      <p>
        <strong>Requested:</strong> {formatUsd(row.requested_amount)}
      </p>
      <p>
        <strong>Snapshot balance:</strong> {formatUsd(row.available_balance_snapshot)}
      </p>
      <p>
        <strong>Status:</strong> {row.status}
      </p>
      <p style={{ whiteSpace: "pre-wrap" }}>
        <strong>Bank details:</strong> {row.bank_details}
      </p>
      {options.length > 0 && (
        <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
          <label className="field">
            <span className="field-label">Next status</span>
            <select
              className="input"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
            >
              <option value="">—</option>
              {options.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {nextStatus === "rejected" && (
            <label className="field">
              <span className="field-label">Rejection reason</span>
              <textarea
                className="input"
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </label>
          )}
          <button type="button" className="btn primary" onClick={save}>
            Update status
          </button>
        </div>
      )}
    </div>
  );
}
