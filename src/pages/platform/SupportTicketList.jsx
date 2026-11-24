import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";

export default function SupportTicketList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/support-tickets", {
          params: Object.fromEntries(sp.entries()),
        });
        if (!cancelled) setData(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sp]);

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <h2 style={{ margin: 0 }}>Support tickets</h2>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Requester</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((t) => (
                <tr key={t.id}>
                  <td>{t.ticket_number}</td>
                  <td>{t.subject}</td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                  <td>{t.requester_email}</td>
                  <td>
                    <Link className="btn" to={`/support-tickets/${t.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </div>
  );
}
