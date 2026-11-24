import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmDelete, confirmAction } from "../../utils/swalConfirm.js";

export default function SubcategoryList() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

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
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/sub-categories", {
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
    const res = await axiosInstance.get("/admin/sub-categories", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const catTitle = useMemo(() => {
    const m = {};
    cats.forEach((c) => {
      m[c.id] = c.title;
    });
    return m;
  }, [cats]);

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete sub category?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/sub-categories/${row.id}`);
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
      const res = await axiosInstance.patch(`/admin/sub-categories/${row.id}/status`, {
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
        <h2 style={{ margin: 0 }}>Sub categories</h2>
        <Link className="btn primary" to="/sub-categories/new">
          Add sub category
        </Link>
      </div>
      <TableToolbar
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "title", label: "Title" },
        ]}
      >
        <select
          className="input"
          style={{ width: 200 }}
          value={sp.get("category_id") || ""}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            const v = e.target.value;
            if (v) next.set("category_id", v);
            else next.delete("category_id");
            next.set("page", "1");
            setSp(next, { replace: true });
          }}
        >
          <option value="">Category (any)</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </TableToolbar>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{s.category?.title || catTitle[s.category_id] || "—"}</td>
                  <td>
                    <select
                      className="input"
                      style={{ minWidth: 110 }}
                      value={s.status === "inactive" ? "inactive" : "active"}
                      onChange={(e) => patchStatus(s, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/sub-categories/${s.id}`}>
                      View
                    </Link>{" "}
                    <Link className="btn" to={`/sub-categories/${s.id}/edit`}>
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(s)}
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
