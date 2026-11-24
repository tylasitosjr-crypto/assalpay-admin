import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";
import { profileImageSrc } from "../../utils/profileImageSrc.js";
import { approvalStatusLabel } from "../../utils/approvalStatus.js";

const APPROVAL_OPTS = [
  { value: "", label: "Approval (any)" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Approved" },
  { value: "2", label: "Rejected" },
];

export default function VendorList() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/vendors", {
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

  const setAccountStatus = async (row, next) => {
    const wantInactive = next === "inactive";
    if (wantInactive && row.status !== "blocked") {
      const ok = await confirmAction({
        title: "Deactivate vendor?",
        text: row.email,
      });
      if (!ok) return;
    }
    if (!wantInactive && row.status === "blocked") {
      const ok = await confirmAction({
        title: "Activate vendor?",
        text: row.email,
      });
      if (!ok) return;
    }
    try {
      await axiosInstance.patch(`/admin/vendors/${row.id}/status`, {
        status: wantInactive ? "inactive" : "active",
      });
      toast.success("Account status updated");
      const res = await axiosInstance.get("/admin/vendors", {
        params: Object.fromEntries(sp.entries()),
      });
      setData(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <p style={{ margin: "0 0 0.75rem" }}>
        <Link to="/vendors">All vendors</Link>
        {" · "}
        <Link to="/vendors?banned=1">Banned</Link>
      </p>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "name", label: "Name" },
          { value: "email", label: "Email" },
        ]}
      >
        <select
          className="input"
          style={{ width: 170 }}
          value={sp.get("approval_status") || ""}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            const v = e.target.value;
            if (v) next.set("approval_status", v);
            else next.delete("approval_status");
            next.set("page", "1");
            setSp(next, { replace: true });
          }}
        >
          {APPROVAL_OPTS.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </TableToolbar>
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
                <th>Business</th>
                <th title="Account verification state (change only on vendor detail)">Approval</th>
                <th>Account</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((v) => {
                const biz = v.business_details;
                return (
                  <tr key={v.id}>
                    <td>
                      <img
                        alt=""
                        src={profileImageSrc(v.profile_image)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td>{v.name}</td>
                    <td>{v.email}</td>
                    <td>{biz?.business_name || "—"}</td>
                    <td>
                      <span
                        className="muted"
                        title="Open vendor detail to approve or reject"
                      >
                        {approvalStatusLabel(v.approval_status)}
                      </span>
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ width: 120, minWidth: 0 }}
                        title="Activate or deactivate this vendor account"
                        value={v.status === "blocked" ? "inactive" : "active"}
                        onChange={(e) => setAccountStatus(v, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link className="btn" title="Open vendor profile" to={`/vendors/${v.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </>
  );
}
