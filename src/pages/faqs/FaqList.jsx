import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmDelete } from "../../utils/swalConfirm.js";

export default function FaqList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/faqs", {
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

  const reload = async () => {
    const res = await axiosInstance.get("/admin/faqs", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete FAQ?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/faqs/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="rowflex" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>FAQs</h2>
        <Link className="btn primary" to="/faqs/new">
          Add FAQ
        </Link>
      </div>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "question", label: "Question" },
        ]}
      />
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((f) => (
                <tr key={f.id}>
                  <td>{f.question?.slice(0, 120)}</td>
                  <td>{f.status === 1 ? "Active" : "Inactive"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/faqs/${f.id}`}>
                      View
                    </Link>{" "}
                    <Link className="btn" to={`/faqs/${f.id}/edit`}>
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(f)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />
    </>
  );
}
