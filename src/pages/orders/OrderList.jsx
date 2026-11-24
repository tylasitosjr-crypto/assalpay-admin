import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatUsd } from "../../utils/formatUsd.js";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";

const STATUSES = [
  "",
  "pending",
  "accepted",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderList({ fixedUserId, fixedVendorId } = {}) {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const p = Object.fromEntries(sp.entries());
    if (fixedUserId) p.user_id = String(fixedUserId);
    if (fixedVendorId) p.vendor_id = String(fixedVendorId);
    return p;
  }, [sp, fixedUserId, fixedVendorId]);

  useEffect(() => {
    if (!fixedUserId) return;
    if (sp.get("user_id") !== String(fixedUserId)) {
      const next = new URLSearchParams(sp);
      next.set("user_id", String(fixedUserId));
      setSp(next, { replace: true });
    }
  }, [fixedUserId, sp, setSp]);

  useEffect(() => {
    if (!fixedVendorId) return;
    if (sp.get("vendor_id") !== String(fixedVendorId)) {
      const next = new URLSearchParams(sp);
      next.set("vendor_id", String(fixedVendorId));
      setSp(next, { replace: true });
    }
  }, [fixedVendorId, sp, setSp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/orders", {
          params: buildParams(),
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
  }, [buildParams]);

  const patch = (updates) => {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    next.set("page", "1");
    if (fixedUserId) next.set("user_id", String(fixedUserId));
    if (fixedVendorId) next.set("vendor_id", String(fixedVendorId));
    setSp(next, { replace: true });
  };

  return (
    <>
      <TableToolbar
        showStatus={false}
        showSort
        sortOptions={[
          { value: "createdAt", label: "Order date" },
          { value: "updatedAt", label: "Order Updated" },
        ]}
      >
        <select
          className="input"
          style={{ width: 190 }}
          value={sp.get("order_status") || ""}
          onChange={(e) => patch({ order_status: e.target.value })}
        >
          <option value="">Order status (any)</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label
          className="rowflex muted"
          style={{ gap: "0.35rem", alignItems: "center" }}
        >
          From
          <input
            type="date"
            className="input"
            value={sp.get("date_from") || ""}
            onChange={(e) => patch({ date_from: e.target.value })}
          />
        </label>
        <label
          className="rowflex muted"
          style={{ gap: "0.35rem", alignItems: "center" }}
        >
          To
          <input
            type="date"
            className="input"
            value={sp.get("date_to") || ""}
            onChange={(e) => patch({ date_to: e.target.value })}
          />
        </label>
      </TableToolbar>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Buyer</th>
                <th>Vendor</th>
                {/* <th>Amount</th> */}
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}</td>
                  <td>
                    <div>{o.buyer_name}</div>
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {o.buyer_email}
                    </span>
                  </td>
                  <td>{o.vendor_name?.trim() ? o.vendor_name : "—"}</td>
                  {/* <td>{formatUsd(o.total_amount)}</td> */}
                  <td>{o.order_status}</td>
                  <td>
                    <Link className="btn" to={`/orders/${o.id}`}>
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
