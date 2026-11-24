import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";
import { profileImageSrc } from "../../utils/profileImageSrc.js";

export default function UserList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/users", {
          params: Object.fromEntries(sp.entries()),
        });
        const body = unwrap(res);
        if (!cancelled) setData(body);
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
    const res = await axiosInstance.get("/admin/users", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const setAccountStatus = async (row, next) => {
    const wantInactive = next === "inactive";
    const isInactive = row.status === "blocked";
    if (wantInactive === isInactive) return;
    if (wantInactive && !isInactive) {
      const ok = await confirmAction({
        title: "Deactivate user?",
        text: row.email,
      });
      if (!ok) return;
    }
    if (!wantInactive && isInactive) {
      const ok = await confirmAction({
        title: "Activate user?",
        text: row.email,
      });
      if (!ok) return;
    }
    try {
      await axiosInstance.patch(`/admin/users/${row.id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      toast.success("Updated");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <p style={{ margin: "0 0 0.75rem" }}>
        <Link to="/users">All users</Link>
        {" · "}
        <Link to="/users?banned=1">Banned</Link>
      </p>
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
                <th style={{ width: 48 }} />
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <img
                      alt=""
                      src={profileImageSrc(u.profile_image)}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    />
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="input"
                      style={{ minWidth: 120 }}
                      value={u.status === "blocked" ? "inactive" : "active"}
                      onChange={(e) => setAccountStatus(u, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/users/${u.id}`}>
                      View
                    </Link>
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
