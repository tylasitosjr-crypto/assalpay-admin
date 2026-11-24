import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function CommissionVendorDetail() {
  const { vendorId } = useParams();
  const [payload, setPayload] = useState(null);
  const [edits, setEdits] = useState({});

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/commissions/vendors/${vendorId}`);
      setPayload(unwrap(res));
      setEdits({});
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [vendorId]);

  const saveRow = async (categoryId, pctRaw) => {
    try {
      const res = await axiosInstance.put(
        `/admin/commissions/vendors/${vendorId}/category`,
        {
          category_id: parseInt(categoryId, 10),
          commission_percentage: parseFloat(String(pctRaw).replace(",", ".")),
        },
      );
      unwrap(res);
      toast.success("Saved");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!payload) return <p className="muted">Loading…</p>;

  const { vendor, category_rows: rows, change_logs: logs } = payload;

  return (
    <div className="card" style={{ maxWidth: 880 }}>
      <Link className="btn" title="Back to vendor commission list" to="/commissions/vendors">
        ← Vendors
      </Link>
      <h2 style={{ marginTop: "1rem" }}>
        {vendor.name} <span className="muted">#{vendor.id}</span>
      </h2>
      <p className="muted">
        Default commission (used when a category has no override):{" "}
        {vendor.commission_percentage}%
      </p>

      <h3 style={{ marginTop: "1.25rem" }}>Commission by category</h3>
      <p className="muted" style={{ fontSize: "0.88rem", marginTop: 0 }}>
        Every category is listed. Saving sets a per-category override, or aligns with the vendor
        default until you save a custom percentage.
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Source</th>
              <th>%</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((c) => {
              const key = String(c.category_id);
              const displayPct =
                edits[key] !== undefined ? edits[key] : String(c.commission_percentage ?? "");
              return (
                <tr key={c.category_id}>
                  <td>{c.title}</td>
                  <td>
                    <span
                      className="badge"
                      title={
                        c.uses_vendor_default
                          ? "Uses the vendor default rate until you save an override"
                          : "Per-category override is stored"
                      }
                      style={{
                        fontSize: "0.8rem",
                        background: c.uses_vendor_default ? "#e0f2fe" : "#fef3c7",
                        color: "#111",
                        padding: "0.15rem 0.45rem",
                        borderRadius: 6,
                      }}
                    >
                      {c.uses_vendor_default ? "Default" : "Override"}
                    </span>
                  </td>
                  <td style={{ maxWidth: 120 }}>
                    <input
                      className="input"
                      title="Commission percentage for this category (0–100)"
                      value={displayPct}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn primary"
                      title="Save this commission % for the category"
                      onClick={() => saveRow(c.category_id, displayPct)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: "1.25rem" }}>Change log</h3>
      <ul className="muted" style={{ fontSize: "0.88rem" }}>
        {(logs || []).map((l) => (
          <li key={l.id}>
            {l.old_rate}% → {l.new_rate}% · {l.ccl_category?.title ?? `cat ${l.category_id}`} · by{" "}
            {l.ccl_admin?.name ?? l.changed_by_admin_id} ·{" "}
            {new Date(l.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
