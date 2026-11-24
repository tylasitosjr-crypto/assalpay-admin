import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { confirmDelete, confirmAction } from "../../utils/swalConfirm.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function SubcategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/sub-categories/${id}`);
      setRow(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const remove = async () => {
    if (!(await confirmDelete())) return;
    try {
      const res = await axiosInstance.delete(`/admin/sub-categories/${id}`);
      unwrap(res);
      toast.success("Deleted");
      navigate("/sub-categories");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const patchStatus = async (next) => {
    if (!row || !next || next === row.status) return;
    if (!(await confirmAction({ title: `Set status to ${next}?` }))) return;
    try {
      const res = await axiosInstance.patch(`/admin/sub-categories/${id}/status`, {
        status: next,
      });
      unwrap(res);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  const catTitle = row.category?.title || row.category_id;

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <Link className="btn" to="/sub-categories">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>{row.title}</h2>
      <p className="muted">Category: {catTitle}</p>
      <label className="field">
        <span className="field-label">Status</span>
        <select
          className="input"
          style={{ maxWidth: 200 }}
          value={row.status === "inactive" ? "inactive" : "active"}
          onChange={(e) => patchStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      {row.image && (
        <img
          src={mediaUrl(row.image)}
          alt=""
          style={{ maxWidth: 240, borderRadius: 8 }}
        />
      )}
      <p style={{ whiteSpace: "pre-wrap" }}>{row.description}</p>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <Link className="btn primary" to={`/sub-categories/${id}/edit`}>
          Edit
        </Link>
        <button type="button" className="btn danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
