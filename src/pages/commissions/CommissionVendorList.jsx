import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function CommissionVendorList() {
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/commissions/vendors");
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
  }, []);

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="card">
      <h2>Commissions · Vendors</h2>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Default %</th>
              <th>Categories in use</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data.list || []).map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.email}</td>
                <td>{v.default_commission}</td>
                <td>{(v.categories_used || []).map((c) => c.title).join(", ") || "—"}</td>
                <td>
                  <Link className="btn" to={`/commissions/vendors/${v.id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
