import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function CouponList() {
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/coupons");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Coupons</h2>
        <Link className="btn primary" title="Create a new coupon" to="/coupons/new">
          New
        </Link>
      </div>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Scope</th>
              <th title="How many successful checkouts used this code">Redeemed</th>
              <th title="Sum of discount amounts recorded at redemption">Discount given</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data.list || []).map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.discount_type}</td>
                <td>{c.value}</td>
                <td>{c.scope}</td>
                <td>{c.total_redeemed ?? 0}</td>
                <td>{Number(c.total_discount_given ?? 0).toFixed(2)}</td>
                <td>{c.is_active ? "yes" : "no"}</td>
                <td>
                  <Link className="btn" title="Edit coupon" to={`/coupons/${c.id}`}>
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
