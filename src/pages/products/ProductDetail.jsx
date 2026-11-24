import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { formatUsd } from "../../utils/formatUsd.js";
import { confirmAction } from "../../utils/swalConfirm.js";
import {
  approvalStatusLabel,
  isApprovalTransitionAllowed,
} from "../../utils/approvalStatus.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/products/${id}`);
      setPayload(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const product = payload?.product;
  const vendor_name = payload?.vendor_name;
  const category_title = payload?.category_title;
  const sub_category_title = payload?.sub_category_title;
  const variants = payload?.variants ?? [];
  const productImages = payload?.rawImages ?? [];

  const submitApprove = async () => {
    if (!product) return;
    if (!isApprovalTransitionAllowed(product.approval_status, 1)) return;
    try {
      const res = await axiosInstance.patch(`/admin/products/${id}/approval`, {
        approval_status: 1,
      });
      unwrap(res);
      toast.success("Approved");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitReject = async () => {
    if (!product) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }
    if (!isApprovalTransitionAllowed(product.approval_status, 2)) return;
    try {
      const res = await axiosInstance.patch(`/admin/products/${id}/approval`, {
        approval_status: 2,
        rejection_reason: reason,
      });
      unwrap(res);
      toast.success("Rejected");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const moderation = async (action) => {
    try {
      const res = await axiosInstance.patch(
        `/admin/products/${id}/moderation`,
        {
          action,
        },
      );
      unwrap(res);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    if (!(await confirmAction({ title: "Delete product?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/products/${id}`);
      unwrap(res);
      toast.success("Deleted");
      navigate("/products");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!product) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div
        className="rowflex"
        style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}
      >
        <button
          type="button"
          className="btn"
          title="Return to the previous admin screen"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <Link className="btn primary" to={`/products/${id}/ratings`}>
          View Ratings
        </Link>
      </div>
      <h2 style={{ marginTop: "1rem" }}>{product.title}</h2>
      <p className="muted">SKU {product.sku}</p>
      <p>
        <strong>Vendor:</strong> {vendor_name || "—"}
      </p>
      <p>
        <strong>Category:</strong> {category_title || "—"}
      </p>
      <p>
        <strong>Sub category:</strong> {sub_category_title || "—"}
      </p>
      <p>
        <strong>Status:</strong> {product.status}
      </p>
      <p>
        <strong>Default Price:</strong> {formatUsd(product.price)}
      </p>
      <p>
        <strong>Stock:</strong> {product.stock}
      </p>
      <p>
        <strong>Suspended:</strong> {product.is_suspended ? "yes" : "no"}
      </p>
      {product.rejection_reason ? (
        <p>
          <strong>Rejection reason:</strong> {product.rejection_reason}
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <button
          type="button"
          className="btn"
          title="Mark listing inactive without deleting"
          onClick={() => moderation("hide")}
        >
          Hide (inactive)
        </button>
        <button
          type="button"
          className="btn"
          title="Flag product as suspended for policy review"
          onClick={() => moderation("suspend")}
        >
          Suspend
        </button>
        <button
          type="button"
          className="btn"
          title="Clear suspension so the vendor can sell again"
          onClick={() => moderation("unsuspend")}
        >
          Unsuspend
        </button>
      </div>
      <div className="field">
        <span className="field-label">Approval</span>
        <p style={{ margin: "0.25rem 0" }}>
          <strong title="Current catalog approval state">
            {approvalStatusLabel(product.approval_status)}
          </strong>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {isApprovalTransitionAllowed(product.approval_status, 1) ? (
            <button
              type="button"
              className="btn primary"
              title="Approve this product so it can appear in the storefront"
              onClick={submitApprove}
            >
              Approve
            </button>
          ) : null}
          {isApprovalTransitionAllowed(product.approval_status, 2) ? (
            <button
              type="button"
              className="btn"
              title="Reject the listing; you will be asked for a reason"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </button>
          ) : null}
        </div>
        <span
          className="muted"
          style={{
            fontSize: "0.85rem",
            display: "block",
            marginTop: "0.25rem",
          }}
        >
          Pending → approved or rejected. Approved ↔ rejected only (cannot
          return to pending).
        </span>
      </div>
      {rejectOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: "100%" }}>
            <h3 style={{ marginTop: 0 }}>Reject product</h3>
            <label className="field">
              <span className="field-label">Reason (shown to vendor)</span>
              <textarea
                className="input"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </label>
            <div
              className="rowflex"
              style={{ gap: "0.5rem", marginTop: "0.75rem" }}
            >
              <button
                type="button"
                className="btn primary"
                onClick={submitReject}
              >
                Confirm reject
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <p className="field-label" style={{ marginTop: "1rem" }}>
        Description
      </p>
      <div
        className="cms-editor"
        style={{
          marginTop: "0.35rem",
          padding: "0.75rem",
          borderRadius: 8,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {product.description ? (
          <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <p className="muted">—</p>
        )}
      </div>

      {productImages.length > 0 && (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>Product Images</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {productImages.map((img) => (
              <div
                key={img.id}
                style={{
                  border: img.is_main
                    ? "2px solid var(--brand)"
                    : "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={mediaUrl(img.images)}
                  alt="Product"
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {img.is_main && (
                  <div
                    style={{
                      padding: "0.35rem",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--brand)",
                    }}
                  >
                    Main Image
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {variants.length > 0 && (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>Variants</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Stock</th>
                  <th>Unit Cost ($)</th>
                  <th>Reduction ($)</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={i}>
                    <td>{v.color ?? "—"}</td>
                    <td>{v.stock ?? "—"}</td>
                    <td>
                      {v.unit_cost && v.unit_cost > 0.0 ? v.unit_cost : "—"}
                    </td>
                    <td>
                      {v.reduction && v.reduction > 0.0 ? v.reduction : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: "1rem" }}>Sizes</h3>
          {variants.some((v) => (v.sizes || []).length > 0) ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Stock</th>
                    <th>Unit Cost ($)</th>
                    <th>Reduction ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.flatMap((v, vi) =>
                    (v.sizes || []).length === 0
                      ? []
                      : (v.sizes || []).map((s, si) => (
                          <tr key={`${vi}-${si}`}>
                            <td>{v.color ?? "—"}</td>
                            <td>{s.size ?? "—"}</td>
                            <td>{s.stock ?? "—"}</td>
                            <td>{s.unit_cost ?? "—"}</td>
                            <td>{s.reduction ?? "—"}</td>
                          </tr>
                        )),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No variant sizes.</p>
          )}
        </>
      )}

      <div
        className="rowflex"
        style={{ gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}
      >
        <button type="button" className="btn danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
