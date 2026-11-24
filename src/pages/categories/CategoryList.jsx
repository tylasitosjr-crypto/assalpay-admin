import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmDelete, confirmAction } from "../../utils/swalConfirm.js";

export default function CategoryList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/categories", {
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
    const res = await axiosInstance.get("/admin/categories", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete category?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/categories/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const patchStatus = async (row, next) => {
    if (!next || next === row.status) return;
    if (!(await confirmAction({ title: `Set status to ${next}?` }))) return;
    try {
      const res = await axiosInstance.patch(`/admin/categories/${row.id}/status`, {
        status: next,
      });
      unwrap(res);
      toast.success("Updated");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="rowflex" style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>Categories</h2>
        <Link className="btn primary" to="/categories/new">
          Add category
        </Link>
      </div>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "title", label: "Title" },
        ]}
      />
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>
                    <select
                      className="input"
                      style={{ minWidth: 110 }}
                      value={c.status === "inactive" ? "inactive" : "active"}
                      onChange={(e) => patchStatus(c, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/categories/${c.id}`}>
                      View
                    </Link>{" "}
                    <Link className="btn" to={`/categories/${c.id}/edit`}>
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(c)}
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
