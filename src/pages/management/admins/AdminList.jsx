import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../../api/axiosInstance.js";
import TableToolbar from "../../../components/common/TableToolbar.jsx";
import PaginationBar from "../../../components/common/PaginationBar.jsx";
import { confirmDelete, confirmAction } from "../../../utils/swalConfirm.js";
import { profileImageSrc } from "../../../utils/profileImageSrc.js";
import { formatAdminSubtypeLine } from "../../../utils/adminTypeLabels.js";

export default function AdminList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/management/admins", {
          params: Object.fromEntries(sp.entries()),
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
  }, [sp]);

  const reload = async () => {
    const res = await axiosInstance.get("/admin/management/admins", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const setAccountStatus = async (row, next) => {
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
      const res = await axiosInstance.patch(`/admin/management/admins/${row.id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      unwrap(res);
      toast.success("Updated");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete admin?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/management/admins/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="rowflex" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>Admin management</h2>
        <Link
          className="btn primary"
          to="/management/admins/new"
          data-tooltip-id="assal-admin-tip"
          data-tooltip-content="Create a new staff admin with password and access type."
        >
          Add admin
        </Link>
      </div>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "name", label: "Name" },
          { value: "email", label: "Email" },
        ]}
      />
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Type</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((a) => (
                <tr key={a.id}>
                  <td style={{ width: 52 }}>
                    <img
                      alt=""
                      src={profileImageSrc(a.profile_image)}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    />
                  </td>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.role}</td>
                  <td>{formatAdminSubtypeLine(a)}</td>
                  <td>
                    <select
                      className="input"
                      style={{ minWidth: 120 }}
                      data-tooltip-id="assal-admin-tip"
                      data-tooltip-content="Active: can sign in. Inactive: blocked from signing in until set back to Active."
                      value={a.status === "blocked" ? "inactive" : "active"}
                      onChange={(e) => setAccountStatus(a, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link
                      className="btn"
                      to={`/management/admins/${a.id}`}
                      data-tooltip-id="assal-admin-tip"
                      data-tooltip-content="Open profile: contact info, status, and shortcuts."
                    >
                      View
                    </Link>{" "}
                    <Link
                      className="btn"
                      to={`/management/admins/${a.id}/edit`}
                      data-tooltip-id="assal-admin-tip"
                      data-tooltip-content="Edit name, contact, password, admin type, or assigned custom role."
                    >
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(a)}
                      data-tooltip-id="assal-admin-tip"
                      data-tooltip-content="Permanently delete this admin. You cannot remove your own account."
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </>
  );
}
