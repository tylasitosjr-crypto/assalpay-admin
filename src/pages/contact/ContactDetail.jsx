import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { confirmDelete } from "../../utils/swalConfirm.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/contact-us/${id}`);
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
    if (!(await confirmDelete({ title: "Delete message?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/contact-us/${id}`);
      unwrap(res);
      toast.success("Deleted");
      navigate("/contact-us");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const createTicket = async () => {
    try {
      const res = await axiosInstance.post(
        `/admin/support-tickets/from-help-center/${id}`,
      );
      const body = unwrap(res);
      toast.success("Ticket created");
      navigate(`/support-tickets/${body.id}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <Link className="btn" to="/contact-us">
        ← Back
      </Link>
      <h2 style={{ marginTop: "1rem" }}>{row.name}</h2>
      <p>
        <strong>Email:</strong> {row.email}
      </p>
      <p>
        <strong>Phone:</strong>{" "}
        {[row.country_code, row.phone].filter(Boolean).join(" ") || "—"}
      </p>
      <p style={{ whiteSpace: "pre-wrap" }}>{row.message}</p>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        {can("support_tickets") && (
          <button type="button" className="btn primary" onClick={createTicket}>
            Create support ticket
          </button>
        )}
        <button type="button" className="btn danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}
