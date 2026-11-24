import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { confirmDelete } from "../../utils/swalConfirm.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function BannerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/banners/${id}`);
        if (!cancelled) setRow(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const remove = async () => {
    if (!(await confirmDelete())) return;
    try {
      const res = await axiosInstance.delete(`/admin/banners/${id}`);
      unwrap(res);
      toast.success("Deleted");
      navigate("/banners");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <Link className="btn" to="/banners">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>Banner #{row.id}</h2>
      <p className="muted">Status: {row.status}</p>
      <p>
        <strong>Clicks:</strong> {row.click_count ?? 0}
      </p>
      {/* <p>
        <strong>Link:</strong> type {row.link_type ?? "—"} · product{" "}
        {row.product_id ?? "—"} · vendor #{row.vendor_id ?? "—"} · category{" "}
        {row.category_id ?? "—"}
      </p> */}
        <p>
        <strong>Link:</strong> vendor #{row.vendor_id ?? "—"} 
      </p>
      {row.image && (
        <img
          src={mediaUrl(row.image)}
          alt=""
          style={{ width: "100%", maxWidth: 480, borderRadius: 8 }}
        />
      )}
      <p>
        <strong>Description:</strong>
        <br />
        {row.description || "—"}
      </p>

      <p>
        <strong>Start Date:</strong> {row.start_date || "—"}
      </p>

      <p>
        <strong>End Date:</strong> {row.end_date || "—"}
      </p>
      <div className="rowflex" style={{ gap: "0.5rem", marginTop: "1rem" }}>
        <Link className="btn primary" to={`/banners/${id}/edit`}>
          Edit
        </Link>
        <button type="button" className="btn danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
