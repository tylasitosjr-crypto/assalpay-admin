import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../../api/axiosInstance.js";

export default function RoleList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/management/roles");
        if (!cancelled) setRows(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <h2>Admin roles</h2>
      <p className="muted">Database-driven role → permission mapping (assign via admin user record).</p>
      {(rows || []).map((r) => (
        <div key={r.id} className="card" style={{ marginTop: "0.75rem", padding: "0.75rem" }}>
          <strong>{r.name}</strong> <span className="muted">({r.slug})</span>
          <p style={{ fontSize: "0.88rem", margin: "0.35rem 0" }}>{r.description}</p>
          <p style={{ fontSize: "0.85rem" }}>
            {(r.permissions || []).map((p) => p.perm_key).join(", ") || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
