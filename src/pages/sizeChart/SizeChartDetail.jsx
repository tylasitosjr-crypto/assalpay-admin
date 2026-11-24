import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import {
  SIZE_CHART_FIELDS,
  SIZE_CHART_LABELS,
} from "../../utils/sizeChartValidators.js";

export default function SizeChartDetail() {
  const { id } = useParams();
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/size-chart/${id}`);
        if (!cancelled) setRow(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!row) return <p className="muted">Loading…</p>;

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <Link className="btn" to="/size-chart">
        ← Size chart
      </Link>
      <h2 style={{ marginTop: "1rem" }}>Size {row.size}</h2>
      <table className="data-table" style={{ marginTop: "1rem" }}>
        <tbody>
          {SIZE_CHART_FIELDS.filter((k) => k !== "size").map((key) => (
            <tr key={key}>
              <th>{SIZE_CHART_LABELS[key]}</th>
              <td>{row[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        className="btn primary"
        to={`/size-chart/${id}/edit`}
        style={{ marginTop: "1rem", display: "inline-block" }}
      >
        Edit
      </Link>
    </div>
  );
}
