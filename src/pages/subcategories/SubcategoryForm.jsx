import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function SubcategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !!useMatch({ path: "/sub-categories/new", end: true });
  const [cats, setCats] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/categories", {
          params: { limit: 200, page: 1 },
        });
        const body = unwrap(res);
        if (!cancelled) setCats(body.list || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/sub-categories/${id}`);
        const row = unwrap(res);
        if (!cancelled) {
          setCategoryId(String(row.category_id || ""));
          setTitle(row.title || "");
          setDescription(row.description || "");
          setStatus(row.status === "inactive" ? "inactive" : "active");
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const tErr = title && title.trim().length < 2 ? "Min 2 characters" : "";

  const submit = async (e) => {
    e.preventDefault();
    if (tErr || !title.trim() || !categoryId) {
      toast.error("Category and title required");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("category_id", categoryId);
      fd.append("title", title.trim());
      fd.append("description", description || "");
      fd.append("status", status);

      if (isCreate) {
        const res = await axiosInstance.post("/admin/sub-categories", fd);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/sub-categories/${row.id}`);
      } else {
        const res = await axiosInstance.put(`/admin/sub-categories/${id}`, fd);
        unwrap(res);
        toast.success("Saved");
        navigate(`/sub-categories/${id}`);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Link className="btn" to="/sub-categories">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>
        {isCreate ? "New sub category" : "Edit sub category"}
      </h2>
      <form className="stack" style={{ gap: "1rem", marginTop: "1rem" }} onSubmit={submit}>
        <label className="field">
          <span className="field-label">Category</span>
          <select
            className="input"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select…</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          {tErr && <span className="field-error">{tErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <textarea
            className="input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input"
            style={{ maxWidth: 200 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button type="submit" className="btn primary">
          Save
        </button>
      </form>
    </div>
  );
}
