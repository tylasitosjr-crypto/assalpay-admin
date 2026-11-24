import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { profileImageSrc } from "../../utils/profileImageSrc.js";
import { formatUsd } from "../../utils/formatUsd.js";
import { mediaFileKind, mediaFileUrl } from "../../utils/mediaFileKind.js";
import { confirmAction } from "../../utils/swalConfirm.js";
import {
  approvalStatusLabel,
  isApprovalTransitionAllowed,
} from "../../utils/approvalStatus.js";
import { useAuth } from "../../context/AuthContext.jsx";

function formatPhone(countryCode, phone) {
  const cc =
    countryCode != null && String(countryCode).trim()
      ? String(countryCode).trim()
      : "";
  const ph = phone != null && String(phone).trim() ? String(phone).trim() : "";
  if (cc && ph) return `${cc} ${ph}`;
  if (ph) return ph;
  if (cc) return cc;
  return "—";
}

function VendorDocumentField({ label, path }) {
  const kind = mediaFileKind(path);
  const url = mediaFileUrl(path);
  const has = path && String(path).trim() && url;

  if (!has) {
    return (
      <p>
        <strong>{label}:</strong> —
      </p>
    );
  }

  const linkLabel =
    kind === "pdf"
      ? "Open PDF"
      : kind === "image"
        ? "Open full size"
        : "Open / download";

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ marginBottom: "0.35rem" }}>
        <strong>{label}</strong>
      </div>
      <div
        className="rowflex"
        style={{ gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-start" }}
      >
        {kind === "image" ? (
          <img
            alt=""
            src={url}
            style={{
              maxWidth: 320,
              maxHeight: 220,
              objectFit: "contain",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          />
        ) : null}
        {kind === "pdf" ? (
          <iframe
            title={label}
            src={url}
            style={{
              width: "100%",
              maxWidth: 520,
              height: 400,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8,
            }}
          />
        ) : null}
        <div className="rowflex" style={{ gap: "0.35rem", flexWrap: "wrap" }}>
          <a className="btn" href={url} target="_blank" rel="noreferrer">
            {linkLabel}
          </a>
          <a
            className="btn"
            href={url}
            download
            target="_blank"
            rel="noreferrer"
          >
            Download
          </a>
        </div>
        {kind === "file" ? (
          <p className="muted" style={{ margin: 0, flex: "1 1 200px" }}>
            Preview is not available for this file type. Use open or download.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [business, setBusiness] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/vendors/${id}`);
      const body = unwrap(res);
      setVendor(body.vendor);
      setBusiness(body.business);
      setAnalytics(body.analytics ?? null);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitApprove = async () => {
    if (!vendor) return;
    if (!isApprovalTransitionAllowed(vendor.approval_status, 1)) return;
    try {
      await axiosInstance.patch(`/admin/vendors/${id}/approval`, {
        approval_status: 1,
      });
      toast.success("Approved");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitReject = async () => {
    if (!vendor) return;
    const rr = rejectReason.trim();
    if (!rr) {
      toast.error("Rejection reason is required");
      return;
    }
    if (!isApprovalTransitionAllowed(vendor.approval_status, 2)) return;
    try {
      await axiosInstance.patch(`/admin/vendors/${id}/approval`, {
        approval_status: 2,
        rejection_reason: rr,
      });
      toast.success("Rejected");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitBan = async () => {
    const reason = banReason.trim();
    if (!reason) {
      toast.error("Ban reason is required");
      return;
    }
    try {
      await axiosInstance.post(`/admin/vendors/${id}/ban`, {
        reason,
        banned_until: null,
      });
      toast.success("Banned");
      setBanOpen(false);
      setBanReason("");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const patchAccount = async (next) => {
    if (!vendor) return;
    const wantInactive = next === "inactive";
    if (wantInactive && vendor.status !== "blocked") {
      const ok = await confirmAction({
        title: "Deactivate vendor?",
        text: vendor.email,
      });
      if (!ok) return;
    }
    if (!wantInactive && vendor.status === "blocked") {
      const ok = await confirmAction({
        title: "Activate vendor?",
        text: vendor.email,
      });
      if (!ok) return;
    }
    try {
      await axiosInstance.patch(`/admin/vendors/${id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      toast.success("Account status updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const unbanVendor = async () => {
    try {
      await axiosInstance.post(`/admin/vendors/${id}/unban`);
      toast.success("Unbanned");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!vendor) return <p className="muted">Loading…</p>;

  return (
    <div className="card vendor-detail-page">
      <div
        className="rowflex"
        style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}
      >
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <Link className="btn primary" to={`/vendors/${id}/products`}>
          View products
        </Link>
        <Link className="btn primary" to={`/vendors/${id}/orders`}>
          View orders
        </Link>
      </div>

      <h2 style={{ marginTop: "1rem" }}>Vendor account</h2>
      <div
        className="rowflex"
        style={{ gap: "1rem", marginTop: "0.5rem", alignItems: "center" }}
      >
        <img
          alt=""
          src={profileImageSrc(vendor.profile_image)}
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <div>
          <div style={{ fontSize: "1.15rem", fontWeight: 600 }}>
            {vendor.name}
          </div>
          <p style={{ margin: "0.25rem 0 0" }} className="muted">
            {vendor.email}
          </p>
        </div>
      </div>

      <p>
        <strong>Phone:</strong> {formatPhone(vendor.country_code, vendor.phone)}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {vendor.location?.trim() ? vendor.location : "—"}
      </p>

      <div
        className="rowflex"
        style={{ gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}
      >
        <div style={{ width: "100%" }}>
          <p style={{ margin: "0 0 0.35rem" }}>
            <strong>Approval:</strong>{" "}
            <span title="Vendor verification status">
              {approvalStatusLabel(vendor.approval_status)}
            </span>
          </p>
          {vendor.approval_rejection_reason ? (
            <p style={{ margin: "0 0 0.35rem" }}>
              <strong>Rejection reason:</strong>{" "}
              {vendor.approval_rejection_reason}
            </p>
          ) : null}
          {can("vendors") ? (
            <div
              className="rowflex"
              style={{ gap: "0.5rem", flexWrap: "wrap" }}
            >
              {isApprovalTransitionAllowed(vendor.approval_status, 1) ? (
                <button
                  type="button"
                  className="btn primary"
                  title="Approve this vendor to sell on the marketplace"
                  onClick={submitApprove}
                >
                  Approve
                </button>
              ) : null}
              {isApprovalTransitionAllowed(vendor.approval_status, 2) ? (
                <button
                  type="button"
                  className="btn"
                  title="Reject the application; a reason is required"
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </button>
              ) : null}
            </div>
          ) : null}
          <p
            className="muted"
            style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}
          >
            Pending → approved or rejected. Rejected→ approved only .
          </p>
        </div>
        <label
          className="rowflex muted"
          style={{ gap: "0.35rem", alignItems: "center" }}
        >
          Account
          <select
            className="input"
            style={{ width: 120 }}
            title="Activate or deactivate sign-in for this vendor"
            value={vendor.status === "blocked" ? "inactive" : "active"}
            onChange={(e) => patchAccount(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <p style={{ margin: 0, width: "100%", fontSize: "0.9rem" }}>
          <strong>Banned:</strong> {vendor.is_banned ? "yes" : "no"}
          {vendor.banned_until
            ? ` (until ${new Date(vendor.banned_until).toLocaleString()})`
            : ""}
        </p>
        {can("vendors") && (
          <div
            className="rowflex"
            style={{ gap: "0.5rem", flexWrap: "wrap", width: "100%" }}
          >
            <button
              type="button"
              className="btn"
              title="Block the vendor with a reason (can be reversed with Unban)"
              onClick={() => setBanOpen(true)}
            >
              Ban
            </button>
            <button
              type="button"
              className="btn"
              title="Remove ban and restore normal access"
              onClick={unbanVendor}
            >
              Unban
            </button>
          </div>
        )}
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
            <h3 style={{ marginTop: 0 }}>Reject vendor</h3>
            <label className="field">
              <span className="field-label">Reason</span>
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

      {banOpen ? (
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
            <h3 style={{ marginTop: 0 }}>Ban vendor</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Ban is recorded with this reason. You can unban anytime from this
              page.
            </p>
            <label className="field">
              <span className="field-label">Reason</span>
              <textarea
                className="input"
                rows={4}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </label>
            <div
              className="rowflex"
              style={{ gap: "0.5rem", marginTop: "0.75rem" }}
            >
              <button type="button" className="btn primary" onClick={submitBan}>
                Ban
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setBanOpen(false);
                  setBanReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <hr style={{ margin: "1.5rem 0", borderColor: "rgba(0,0,0,0.08)" }} />

      <h2 style={{ marginTop: 0 }}>Business details</h2>
      {!business ? (
        <p className="muted">No business profile submitted.</p>
      ) : (
        <>
          <div
            className="rowflex"
            style={{ gap: "1rem", marginBottom: "1rem", alignItems: "center" }}
          >
            <img
              alt=""
              src={profileImageSrc(business.logo)}
              style={{
                width: 72,
                height: 72,
                borderRadius: 8,
                objectFit: "contain",
                border: "1px solid rgba(0,0,0,0.06)",
                background: "#fafafa",
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{business.business_name}</div>
              <p style={{ margin: "0.25rem 0 0" }} className="muted">
                {business.email}
              </p>
            </div>
          </div>
          <p>
            <strong>Business Phone no.:</strong>{" "}
            {formatPhone(business.country_code, business.phone)}
          </p>
          <p>
            <strong>Business Location:</strong> {business?.location}
          </p>
          {business?.store_description && (
            <p>
              <strong>Store Description:</strong> {business?.store_description}
            </p>
          )}
          <VendorDocumentField
            label="Business Banner"
            path={business?.panoramic_banner}
          />
          <VendorDocumentField
            label="Business license"
            path={business.business_license}
          />
          <VendorDocumentField
            label="Government ID"
            path={business.government_id}
          />
        </>
      )}

      {analytics ? (
        <section
          className="vendor-detail-analytics"
          aria-labelledby="vendor-analytics-heading"
        >
          <hr style={{ margin: "1.5rem 0", borderColor: "rgba(0,0,0,0.08)" }} />
          <h2 id="vendor-analytics-heading" style={{ marginTop: 0 }}>
            Performance analytics
          </h2>
          <p
            className="muted vendor-detail-analytics__lead"
            style={{ marginTop: 0, fontSize: "0.88rem" }}
          >
            Delivered metrics use line items on orders with status{" "}
            <strong>delivered</strong>. Order totals are vendor-scoped (
            <code className="line-chart__code">orders.vendor_id</code>).
          </p>
          <div className="vendor-detail-analytics__grid">
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Products listed
              </div>
              <div className="vendor-detail-analytics__value">
                {analytics.products_count}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">Total orders</div>
              <div className="vendor-detail-analytics__value">
                {analytics.orders_total}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Delivered orders
              </div>
              <div className="vendor-detail-analytics__value">
                {analytics.orders_delivered}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Units sold (delivered)
              </div>
              <div className="vendor-detail-analytics__value">
                {analytics.units_sold_delivered}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Gross subtotal (delivered)
              </div>
              <div className="vendor-detail-analytics__value">
                {formatUsd(analytics.delivered_gross_subtotal)}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Profile total revenue
              </div>
              <div className="vendor-detail-analytics__value">
                {formatUsd(analytics.profile_total_revenue)}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">
                Available balance
              </div>
              <div className="vendor-detail-analytics__value">
                {formatUsd(analytics.available_balance)}
              </div>
            </div>
            <div className="vendor-detail-analytics__card">
              <div className="vendor-detail-analytics__label">Rating</div>
              <div className="vendor-detail-analytics__value">
                {analytics.rating != null && !Number.isNaN(analytics.rating)
                  ? Number(analytics.rating).toFixed(1)
                  : "—"}
              </div>
              {analytics.total_reviews > 0 ? (
                <div className="vendor-detail-analytics__meta">
                  {analytics.total_reviews}{" "}
                  {analytics.total_reviews === 1 ? "review" : "reviews"}
                </div>
              ) : null}
            </div>
          </div>
          {analytics.orders_by_status?.length ? (
            <div className="vendor-detail-analytics__table-wrap">
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                Orders by status
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.orders_by_status.map((row) => (
                    <tr key={row.status}>
                      <td style={{ textTransform: "capitalize" }}>
                        {row.status}
                      </td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
