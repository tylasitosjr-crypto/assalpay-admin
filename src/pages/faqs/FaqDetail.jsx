import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function FaqDetail() {
  const { id } = useParams();
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/faqs/${id}`);
        if (!cancelled) setRow(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <Link className="btn" to="/faqs">
        ← FAQ list
      </Link>
      <h2 style={{ marginTop: "1rem" }}>{row.question}</h2>
      <p className="muted">Status: {row.status === 1 ? "Active" : "Inactive"}</p>
      <div style={{ whiteSpace: "pre-wrap" }}>{row.answer}</div>
      <Link className="btn primary" to={`/faqs/${id}/edit`} style={{ marginTop: "1rem", display: "inline-block" }}>
        Edit
      </Link>
    </div>
  );
}
