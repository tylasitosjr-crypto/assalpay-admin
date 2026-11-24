import { useEffect, useState } from "react";
import { Link, useParams, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import RatingStars from "../../components/common/RatingStars.jsx";

export default function ProductRatingsList() {
  const { id } = useParams();
  const location = useLocation();
  const [meta, setMeta] = useState(null);
  const [list, setList] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sp, setSp] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/admin/products/${id}/ratings`, {
          params: Object.fromEntries(sp.entries()),
        });
        const body = unwrap(res);
        if (!cancelled) {
          setList(body.list || []);
          setMeta(body.meta || null);
          setProduct(body.product || null);
        }
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, sp]);

  return (
    <>
      <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link className="btn" to={`/products/${id}`}>
          ← Product
        </Link>
      </div>

      {product ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: "0 0 0.35rem" }}>Product ratings</h2>
          <p style={{ margin: 0 }} className="muted">
            <strong>{product.title}</strong>
            {product.sku != null && String(product.sku).trim()
              ? ` · SKU ${product.sku}`
              : null}
          </p>
        </div>
      ) : null}

      <TableToolbar
        showStatus={false}
        sortOptions={[
          { value: "createdAt", label: "Date" },
          { value: "rating", label: "Rating" },
        ]}
      />

      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Order number</th>
                <th>Rating</th>
                <th style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No ratings found.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.rated_by_name?.trim() ? row.rated_by_name : "—"}</td>
                    <td>{row.rated_by_email?.trim() ? row.rated_by_email : "—"}</td>
                    <td>{row.order_number?.trim() ? row.order_number : "—"}</td>
                    <td>
                      <RatingStars value={row.rating} sizePx={18} />
                    </td>
                    <td>
                      <Link className="btn" to={`/ratings/${row.id}${location.search}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={meta} />
    </>
  );
}
