import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";

export default function VendorDocuments() {
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/vendor-documents");
      setData(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sync = async () => {
    try {
      const res = await axiosInstance.post("/admin/vendor-documents/sync-from-business");
      toast.success(`Imported ${unwrap(res).created || 0} rows`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const review = async (r, action) => {
    let rejection_reason;
    if (action === "reject") {
      rejection_reason = window.prompt("Rejection reason (required):");
      if (!rejection_reason || !rejection_reason.trim()) {
        toast.error("Reason required");
        return;
      }
    }
    if (!(await confirmAction({ title: `${action} document ${r.id}?` }))) return;
    try {
      const res = await axiosInstance.post(`/admin/vendor-documents/${r.id}/review`, {
        action,
        rejection_reason,
      });
      unwrap(res);
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <div className="rowflex" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Vendor documents</h2>
        <button type="button" className="btn" onClick={sync}>
          Sync from business profiles
        </button>
      </div>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Status</th>
                <th>File</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.list.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.vendor_user_id}</td>
                  <td>{r.doc_type}</td>
                  <td>{r.status}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.file_path}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => review(r, "approve")}
                        >
                          Approve
                        </button>{" "}
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => review(r, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
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
