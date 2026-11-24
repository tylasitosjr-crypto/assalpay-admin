import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../../api/axiosInstance.js";
import { confirmDelete, confirmAction } from "../../../utils/swalConfirm.js";
import { profileImageSrc } from "../../../utils/profileImageSrc.js";
import { formatAdminSubtypeLine } from "../../../utils/adminTypeLabels.js";

export default function AdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/management/admins/${id}`);
      setRow(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const setAccountStatus = async (next) => {
    if (!row) return;
    const wantInactive = next === "inactive";
    const isInactive = row.status === "blocked";
    if (wantInactive === isInactive) return;
    if (wantInactive && !isInactive) {
      if (!(await confirmAction({ title: "Deactivate admin?" }))) return;
    }
    if (!wantInactive && isInactive) {
      if (!(await confirmAction({ title: "Activate admin?" }))) return;
    }
    try {
      const res = await axiosInstance.patch(`/admin/management/admins/${id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      unwrap(res);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    if (!(await confirmDelete())) return;
    try {
      const res = await axiosInstance.delete(`/admin/management/admins/${id}`);
      unwrap(res);
      toast.success("Deleted");
      navigate("/management/admins");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <Link
        className="btn"
        to="/management/admins"
        data-tooltip-id="assal-admin-tip"
        data-tooltip-content="Back to the searchable list of staff admins."
      >
        ← List
      </Link>
      <div className="rowflex" style={{ gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
        <img
          src={profileImageSrc(row.profile_image)}
          alt=""
          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
        />
        <div>
          <h2 style={{ margin: 0 }}>{row.name}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Role: {row.role}
          </p>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Type: {formatAdminSubtypeLine(row)}
          </p>
        </div>
      </div>
      <p>
        <strong>Email:</strong> {row.email}
      </p>
      <p>
        <strong>Phone:</strong>{" "}
        {[row.country_code, row.phone].filter(Boolean).join(" ") || "—"}
      </p>
      <label className="field">
        <span className="field-label">Account status</span>
        <select
          className="input"
          style={{ maxWidth: 220 }}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Active: can sign in. Inactive: blocked from signing in until set back to Active."
          value={row.status === "blocked" ? "inactive" : "active"}
          onChange={(e) => setAccountStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <Link
          className="btn primary"
          to={`/management/admins/${id}/edit`}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Edit name, contact, password, admin type, or assigned custom role."
        >
          Edit
        </Link>
        <button
          type="button"
          className="btn danger"
          onClick={remove}
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Permanently delete this admin. You cannot remove your own account."
        >
          Delete
        </button>
      </div>
    </div>
  );
}
