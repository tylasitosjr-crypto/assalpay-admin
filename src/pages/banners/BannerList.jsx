import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmDelete } from "../../utils/swalConfirm.js";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function BannerList() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/banners", {
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
    const res = await axiosInstance.get("/admin/banners", {
      params: Object.fromEntries(sp.entries()),
    });
    setData(unwrap(res));
  };

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete banner?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/banners/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div
        className="rowflex"
        style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}
      >
        <h2 style={{ margin: 0 }}>Banners</h2>
        <Link className="btn primary" to="/banners/new">
          Add banner
        </Link>
      </div>
      <TableToolbar
        showSearch={false}
        showSort
        sortOptions={[{ value: "createdAt", label: "Newest" }]}
      >
        <select
          className="input"
          style={{ width: 160 }}
          value={sp.get("status") || ""}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            const v = e.target.value;
            if (v) next.set("status", v);
            else next.delete("status");
            next.set("page", "1");
            setSp(next, { replace: true });
          }}
        >
          <option value="">Status (any)</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </TableToolbar>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.image && (
                      <img
                        src={mediaUrl(b.image)}
                        alt=""
                        style={{
                          height: 48,
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </td>

                  <td>
                    {b.start_date
                      ? new Date(b.start_date).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {b.end_date
                      ? new Date(b.end_date).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>{b.status}</td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/banners/${b.id}`}>
                      View
                    </Link>{" "}
                    <Link className="btn" to={`/banners/${b.id}/edit`}>
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(b)}
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
