import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";

export default function GlobalSearchBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    try {
      const body = unwrap(
        await axiosInstance.get("/admin/search", { params: { q: term } }),
      );
      const qs = new URLSearchParams(body.query || {}).toString();
      navigate(`${body.path}${qs ? `?${qs}` : ""}`);
      setQ("");
    } catch (err) {
      toast.error(err.message || "Search failed");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="admin-global-search"
      style={{ marginLeft: "auto", display: "flex", gap: "0.35rem" }}
    >
      <input
        className="input"
        placeholder="Search orders, users, vendors, products…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "min(280px, 36vw)", maxWidth: 360 }}
        aria-label="Global search"
      />
      <button type="submit" className="btn">
        Search
      </button>
      <style>{`
        @media (max-width: 700px) {
          .admin-global-search { display: none !important; }
        }
      `}</style>
    </form>
  );
}
