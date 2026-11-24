import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function SupportTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [assignee, setAssignee] = useState("");
  const [staff, setStaff] = useState([]);

  const load = async () => {
    try {
      const res = await axiosInstance.get(`/admin/support-tickets/${id}`);
      const body = unwrap(res);
      setRow(body);
      setStatus(body.status);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/support-tickets/assignable-staff");
        if (!cancelled) setStaff(unwrap(res).list || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    try {
      const res = await axiosInstance.post(`/admin/support-tickets/${id}/messages`, {
        body: msg.trim(),
      });
      unwrap(res);
      setMsg("");
      toast.success("Message posted");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const sendNote = async () => {
    if (!note.trim()) return;
    try {
      const res = await axiosInstance.post(`/admin/support-tickets/${id}/notes`, {
        note: note.trim(),
      });
      unwrap(res);
      setNote("");
      toast.success("Note saved");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveStatus = async () => {
    try {
      const res = await axiosInstance.patch(`/admin/support-tickets/${id}/status`, {
        status,
      });
      unwrap(res);
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const assign = async () => {
    const aid = parseInt(String(assignee), 10);
    if (!aid) return;
    try {
      const res = await axiosInstance.post(`/admin/support-tickets/${id}/assign`, {
        assigned_to_admin_id: aid,
      });
      unwrap(res);
      toast.success("Assigned");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="stack" style={{ gap: "1rem", maxWidth: 880 }}>
      <Link className="btn" to="/support-tickets">
        ← Tickets
      </Link>
      <div className="card stack" style={{ gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>{row.ticket_number}</h2>
        <p className="muted">{row.subject}</p>
        <p>
          <strong>From:</strong> {row.requester_name || "—"} · {row.requester_email}
        </p>
        <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field">
            <span className="field-label">Status</span>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["open", "waiting_user", "resolved", "closed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn primary" onClick={saveStatus}>
            Save status
          </button>
        </div>
        {user?.role === "super_admin" && (
          <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <label className="field">
              <span className="field-label">Assign to (support admin only)</span>
              <select
                className="input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={{ minWidth: 200 }}
              >
                <option value="">—</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.email ? ` · ${s.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn" onClick={assign}>
              Assign
            </button>
          </div>
        )}
      </div>
      <div className="card stack" style={{ gap: "0.75rem" }}>
        <h3 style={{ margin: 0 }}>Conversation</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {(row.messages || []).map((m) => (
            <li key={m.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{m.is_staff ? "Staff" : "User"}:</strong> {m.body}
            </li>
          ))}
        </ul>
        <textarea
          className="input"
          rows={3}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Reply to customer…"
        />
        <button type="button" className="btn primary" onClick={sendMsg}>
          Post reply
        </button>
      </div>
      <div className="card stack" style={{ gap: "0.75rem" }}>
        <h3 style={{ margin: 0 }}>Internal notes</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {(row.internal_notes || []).map((n) => (
            <li key={n.id}>
              <strong>{n.note_author?.name || "Admin"}:</strong> {n.note}
            </li>
          ))}
        </ul>
        <textarea
          className="input"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className="btn" onClick={sendNote}>
          Add note
        </button>
      </div>
    </div>
  );
}
