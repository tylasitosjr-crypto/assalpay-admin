import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { confirmAction } from "../../utils/swalConfirm.js";
import { profileImageSrc } from "../../utils/profileImageSrc.js";
import { useAuth } from "../../context/AuthContext.jsx";

function formatPhone(countryCode, phone) {
  const cc = countryCode != null && String(countryCode).trim() ? String(countryCode).trim() : "";
  const ph = phone != null && String(phone).trim() ? String(phone).trim() : "";
  if (cc && ph) return `${cc} ${ph}`;
  if (ph) return ph;
  if (cc) return cc;
  return "—";
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [payload, setPayload] = useState(null);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/users/${id}`);
      setPayload(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const row = payload?.user;
  const addresses = payload?.addresses ?? [];

  const setAccountStatus = async (next) => {
    if (!row) return;
    const wantInactive = next === "inactive";
    const isInactive = row.status === "blocked";
    if (wantInactive === isInactive) return;
    if (wantInactive && !isInactive) {
      if (!(await confirmAction({ title: "Deactivate user?" }))) return;
    }
    if (!wantInactive && isInactive) {
      if (!(await confirmAction({ title: "Activate user?" }))) return;
    }
    try {
      await axiosInstance.patch(`/admin/users/${id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitBan = async () => {
    const reason = banReason.trim();
    if (!reason) {
      toast.error("Reason required");
      return;
    }
    try {
      await axiosInstance.post(`/admin/users/${id}/ban`, {
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

  const unbanUser = async () => {
    try {
      await axiosInstance.post(`/admin/users/${id}/unban`);
      toast.success("Unbanned");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="btn"
          onClick={() => navigate(-1)}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Return to the previous page in your browser history."
        >
          ← Back
        </button>
        <Link
          className="btn primary"
          to={`/users/${id}/orders`}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="See all orders placed by this customer."
        >
          View orders
        </Link>
      </div>
      <div
        className="rowflex"
        style={{ gap: "1rem", marginTop: "1rem", alignItems: "center" }}
      >
        <img
          alt=""
          src={profileImageSrc(row.profile_image)}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <h2 style={{ margin: 0 }}>{row.name}</h2>
      </div>
      <p>
        <strong>Email:</strong> {row.email}
      </p>
      <p>
        <strong>Phone:</strong> {formatPhone(row.country_code, row.phone)}
      </p>
      <p>
        <strong>Location:</strong>{" "}
        {row.location && String(row.location).trim() ? row.location : "—"}
      </p>
      <label className="field">
        <span className="field-label">Account status</span>
        <select
          className="input"
          style={{ maxWidth: 220 }}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Active or inactive login for this account. Bans are separate—use Ban / Unban for policy blocks."
          value={row.status === "blocked" ? "inactive" : "active"}
          onChange={(e) => setAccountStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <p
        data-tooltip-id="assal-admin-tip"
        data-tooltip-content="Ban is a policy flag (reason + optional expiry). Separate from account Active/Inactive."
      >
        <strong>Banned:</strong> {row.is_banned ? "yes" : "no"}
        {row.banned_until
          ? ` (until ${new Date(row.banned_until).toLocaleString()})`
          : ""}
      </p>
      {can("users") && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            data-tooltip-id="assal-admin-tip"
            data-tooltip-content="Record a ban reason and block this customer from signing in until you Unban."
            onClick={() => setBanOpen(true)}
          >
            Ban
          </button>
          <button
            type="button"
            className="btn"
            data-tooltip-id="assal-admin-tip"
            data-tooltip-content="Clear the ban flag so the customer can sign in again if their account is Active."
            onClick={unbanUser}
          >
            Unban
          </button>
        </div>
      )}

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
            <h3 style={{ marginTop: 0 }}>Ban user</h3>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              Ban is stored with this reason. Unban anytime from this page.
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
            <div className="rowflex" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                type="button"
                className="btn primary"
                onClick={submitBan}
                data-tooltip-id="assal-admin-tip"
                data-tooltip-content="Save the ban with the reason above and block sign-in."
              >
                Ban
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setBanOpen(false);
                  setBanReason("");
                }}
                data-tooltip-id="assal-admin-tip"
                data-tooltip-content="Close this dialog without changing ban status."
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <h3 style={{ marginTop: "1.5rem" }}>Addresses</h3>
      {addresses.length === 0 ? (
        <p className="muted">No saved addresses (non–order addresses).</p>
      ) : (
        addresses.map((addr, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              marginTop: "0.75rem",
              padding: "0.85rem",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            {Object.entries(addr).map(([k, v]) => (
              <p key={k} style={{ margin: "0.2rem 0" }}>
                <strong style={{ textTransform: "capitalize" }}>
                  {k.replace(/_/g, " ")}:
                </strong>{" "}
                {v != null && String(v).trim() !== "" ? String(v) : "—"}
              </p>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
