import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmDelete } from "../../utils/swalConfirm.js";
import { SIZE_CHART_LABELS } from "../../utils/sizeChartValidators.js";

export default function SizeChartList() {
  const [sp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/size-chart", {
          params: { page: sp.get("page") || "1" },
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
    const res = await axiosInstance.get("/admin/size-chart", {
      params: { page: sp.get("page") || "1" },
    });
    setData(unwrap(res));
  };

  const remove = async (row) => {
    if (!(await confirmDelete({ title: "Delete size chart row?" }))) return;
    try {
      const res = await axiosInstance.delete(`/admin/size-chart/${row.id}`);
      unwrap(res);
      toast.success("Deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    "sort_order",
    "size",
    "chest_in_inch",
    "chest_in_cm",
    "waist_in_inch",
    "waist_in_cm",
    "hips_in_inch",
    "hips_in_cm",
  ];

  return (
    <>
      <div
        className="rowflex"
        style={{ justifyContent: "space-between", marginBottom: "0.75rem" }}
      >
        <h2 style={{ margin: 0 }}>Size chart</h2>
        <Link className="btn primary" to="/size-chart/new">
          Add row
        </Link>
      </div>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{SIZE_CHART_LABELS[col]}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link className="btn" to={`/size-chart/${row.id}`}>
                      View
                    </Link>{" "}
                    <Link className="btn" to={`/size-chart/${row.id}/edit`}>
                      Edit
                    </Link>{" "}
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => remove(row)}
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
