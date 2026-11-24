import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";
import { approvalStatusLabel } from "../../utils/approvalStatus.js";

const AP = [
  { value: "", label: "Approval (any)" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Approved" },
  { value: "2", label: "Rejected" },
];

export default function ProductList({ fixedVendorId } = {}) {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const p = Object.fromEntries(sp.entries());
    if (fixedVendorId) p.vendor_id = String(fixedVendorId);
    return p;
  }, [sp, fixedVendorId]);

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
        const res = await axiosInstance.get("/admin/products", {
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

  const reload = async () => {
    const res = await axiosInstance.get("/admin/products", {
      params: buildParams(),
    });
    setData(unwrap(res));
  };

  const remove = async (row) => {
    if (!(await confirmAction({ title: "Delete product permanently?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/products/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "title", label: "Title" },
        ]}
      >
        <select
          className="input"
          style={{ width: 160 }}
          value={sp.get("approval_status") || ""}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            const v = e.target.value;
            if (v) next.set("approval_status", v);
            else next.delete("approval_status");
            next.set("page", "1");
            if (fixedVendorId) next.set("vendor_id", String(fixedVendorId));
            setSp(next, { replace: true });
          }}
        >
          {AP.map((o) => (
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
                <th>Product</th>
                <th>Vendor name</th>
                <th>Stock</th>
                <th title="good / low / out">Inventory</th>
                <th title="Vendor approval state (change only on product detail)">Approval</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.vendor_name?.trim() ? p.vendor_name : "—"}</td>
                  <td>{p.stock ?? "—"}</td>
                  <td>
                    <span
                      title={`Threshold: ${p.low_stock_threshold ?? 10}`}
                      className={
                        p.stock == 0
                          ? "badge danger"
                          : p.stock <10
                            ? "badge warn"
                            : "badge ok"
                      }
                      style={{
                        padding: "0.15rem 0.45rem",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        background:
                          p.stock == 0
                            ? "#fee2e2"
                            : p.stock < 10
                              ? "#fef9c3"
                              : "#dcfce7",
                        color: "#111",
                      }}
                    >
                      {(p.stock==0?"Out of stock":p.stock<10?"Low stock":"Good stock") || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="muted"
                      title="Open product detail to approve or reject"
                    >
                      {approvalStatusLabel(p.approval_status)}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" title="Open product detail" to={`/products/${p.id}`}>
                      View
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      title="Permanently delete this product"
                      onClick={() => remove(p)}
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
