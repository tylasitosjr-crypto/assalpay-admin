import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";

const MODULES = [
  { value: "products", label: "Products" },
  { value: "orders", label: "Orders" },
  { value: "users", label: "Users" },
  { value: "banners", label: "Banners" },
  { value: "categories", label: "Categories" },
  { value: "coupons", label: "Coupons" },
];

export default function TrashBin() {
  const [module, setModule] = useState("products");
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/trash/${module}`);
      setData(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [module]);

  const restore = async (row) => {
    if (!(await confirmAction({ title: `Restore ${module} #${row.id}?` }))) return;
    try {
      const res = await axiosInstance.post(
        `/admin/trash/${module}/${row.id}/restore`,
      );
      unwrap(res);
      toast.success("Restored");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <h2 style={{ margin: 0 }}>Deleted items</h2>
      <label className="field" style={{ maxWidth: 280 }}>
        <span className="field-label">Module</span>
        <select
          className="input"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          {MODULES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Label</th>
                <th>Deleted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.title || r.name || r.order_number || "—"}</td>
                  <td>{r.deletedAt ? new Date(r.deletedAt).toLocaleString() : "—"}</td>
                  <td>
                    <button type="button" className="btn primary" onClick={() => restore(r)}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </div>
  );
}
