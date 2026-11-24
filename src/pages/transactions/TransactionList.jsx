import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { formatUsd } from "../../utils/formatUsd.js";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";

const TYPE_LABEL = {
  cod: "COD",
  mobile_money: "Mobile money",
  withdraw: "Withdraw",
  refund: "Refund",
};

function labelType(v) {
  return TYPE_LABEL[v] || v || "—";
}

export default function TransactionList() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/transactions", {
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

  const patch = (updates) => {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  return (
    <>
      <TableToolbar
        showStatus={false}
        sortOptions={[
          { value: "createdAt", label: "Date" },
          { value: "amount", label: "Amount" },
        ]}
      >
        <select
          className="input"
          style={{ width: 160 }}
          value={sp.get("transaction_type") || ""}
          onChange={(e) => patch({ transaction_type: e.target.value })}
        >
          <option value="">Type (any)</option>
          {/* <option value="cod">COD</option> */}
          {/* <option value="mobile_money">Mobile money</option> */}
          <option value="waafi">WAAFI</option>
          <option value="cac_pay">CAC Pay</option>
          <option value="mobile_money">Mobile money</option>
          <option value="withdraw">Withdraw</option>
          <option value="refund">Refund</option>
        </select>
        <select
          className="input"
          style={{ width: 150 }}
          value={sp.get("status") || ""}
          onChange={(e) => patch({ status: e.target.value })}
        >
          <option value="">Status (any)</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <label
          className="rowflex muted"
          style={{ gap: "0.35rem", alignItems: "center" }}
        >
          From
          <input
            type="date"
            className="input"
            value={sp.get("date_from") || ""}
            onChange={(e) => patch({ date_from: e.target.value })}
          />
        </label>
        <label
          className="rowflex muted"
          style={{ gap: "0.35rem", alignItems: "center" }}
        >
          To
          <input
            type="date"
            className="input"
            value={sp.get("date_to") || ""}
            onChange={(e) => patch({ date_to: e.target.value })}
          />
        </label>
      </TableToolbar>
      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((t) => (
                <tr key={t.id}>
                  <td>{t.paid_by_name?.trim() ? t.paid_by_name : "—"}</td>
                  <td>{formatUsd(t.amount)}</td>
                  <td>{labelType(t.transaction_type)}</td>
                  <td>{t.transaction_id ?? "—"}</td>
                  <td>{t.status ?? "—"}</td>
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
