import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { formatUsd } from "../../utils/formatUsd.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function RefundDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const [payload, setPayload] = useState(null);
  const [reason, setReason] = useState("");
  const canAct = can("refunds");

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/refund-requests/${id}`);
      setPayload(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const act = async (action) => {
    try {
      const res = await axiosInstance.patch(`/admin/refund-requests/${id}`, {
        action,
        reason: reason.trim() || undefined,
      });
      unwrap(res);
      toast.success("Updated");
      setReason("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!payload) return <p className="muted">Loading…</p>;

  const { refund, buyer, vendor } = payload;
  const finalized =
    refund.status === "approved" || refund.status === "rejected";

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <Link className="btn" to="/refund-requests">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>Refund #{refund.id}</h2>
      <p>
        <strong>Order ID:</strong> {refund.order_id}
      </p>
       <p>
        <strong>Order Number:</strong> {refund?.refund_order?.order_number}
      </p>
      <p>
        <strong>Amount:</strong> {formatUsd(refund.amount)}
      </p>
      <p>
        <strong>Status:</strong> {refund.status}
      </p>
      <p>
        <strong>Buyer:</strong> {buyer?.name} ({buyer?.email})
      </p>
      <p>
        <strong>Vendor:</strong> {vendor?.name ?? "—"} ({vendor?.email ?? "—"})
      </p>
      <p>
        <strong>Reason:</strong> {refund.reason || "—"}
      </p>
      {refund.detailed_explanation ? (
        <p>
          <strong>Detailed Explanation:</strong> {refund.detailed_explanation}
        </p>
      ) : null}

      {[refund.image1, refund.image2, refund.image3].some(Boolean) ? (
        <div style={{ marginTop: "1rem" }}>
          <strong>Evidence Images:</strong>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            {[refund.image1, refund.image2, refund.image3]
              .filter(Boolean)
              .map((img, index) => (
                <a
                  key={index}
                  href={mediaUrl(img)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={mediaUrl(img)}
                    alt={`Evidence ${index + 1}`}
                    style={{
                      width: 140,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                    }}
                  />
                </a>
              ))}
          </div>
        </div>
      ) : null}
      {canAct && !finalized && (
        <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
          <label className="field">
            <span className="field-label">Note / reject reason</span>
            <textarea
              className="input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn primary"
              title="Credit the buyer wallet and mark this refund approved"
              onClick={() => act("approve")}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn"
              title="Decline the refund; requires a reason above"
              onClick={() => act("reject")}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn"
              title="Ask the customer for more details without approving yet"
              onClick={() => act("more_info")}
            >
              Request more info
            </button>
          </div>
        </div>
      )}
      <h3 style={{ marginTop: "1.5rem" }}>Action log</h3>
      <ul className="muted" style={{ fontSize: "0.9rem" }}>
        {(refund.action_logs || []).map((l) => (
          <li key={l.id}>
            {l.action} — {l.log_admin?.name ?? "admin"} — {l.reason || "—"} —{" "}
            {new Date(l.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
