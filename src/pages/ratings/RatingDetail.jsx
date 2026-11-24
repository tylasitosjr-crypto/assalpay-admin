import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import RatingStars from "../../components/common/RatingStars.jsx";

export default function RatingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/ratings/${id}`);
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
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <h2 style={{ marginTop: "1rem" }}>Rating</h2>

      <p style={{ margin: "0.75rem 0 0" }}>
        <strong>Rating:</strong> <RatingStars value={row.rating} sizePx={22} />
      </p>
      <p style={{ margin: "0.65rem 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <strong>Review:</strong> {row.review ?? "—"}
      </p>
      <p style={{ margin: "0.65rem 0 0" }}>
        <strong>Rated by name:</strong> {row.rated_by_name ?? "—"}
      </p>
      <p style={{ margin: "0.35rem 0 0" }}>
        <strong>Rated by email:</strong> {row.rated_by_email ?? "—"}
      </p>
      <p style={{ margin: "0.65rem 0 0" }}>
        <strong>Order number:</strong> {row.order_number ?? "—"}
      </p>
      <p style={{ margin: "0.35rem 0 0" }}>
        <strong>Product name:</strong> {row.product_name ?? "—"}
      </p>
    </div>
  );
}
