import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import TableToolbar from "../../components/common/TableToolbar.jsx";
import PaginationBar from "../../components/common/PaginationBar.jsx";
import { confirmAction } from "../../utils/swalConfirm.js";
import { profileImageSrc } from "../../utils/profileImageSrc.js";

export default function SendNotification() {
  const [sp, setSp] = useSearchParams();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState({ list: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [sendAt, setSendAt] = useState("");
  const [city, setCity] = useState("");
  const [deliveries, setDeliveries] = useState({ list: [], meta: null });
  const [dLoading, setDLoading] = useState(true);
  const [dPage, setDPage] = useState(1);
  const dLimit = 25;
  const [dQInput, setDQInput] = useState("");
  const [dQ, setDQ] = useState("");
  const [dFrom, setDFrom] = useState("");
  const [dTo, setDTo] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDQ(dQInput.trim()), 350);
    return () => clearTimeout(t);
  }, [dQInput]);

  useEffect(() => {
    setDPage(1);
  }, [dQ, dFrom, dTo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/admin/notifications/recipients", {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDLoading(true);
      try {
        const res = await axiosInstance.get("/admin/notifications/deliveries", {
          params: {
            page: dPage,
            limit: dLimit,
            q: dQ || undefined,
            date_from: dFrom || undefined,
            date_to: dTo || undefined,
          },
        });
        if (!cancelled) setDeliveries(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (!cancelled) setDLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dPage, dLimit, dQ, dFrom, dTo]);

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    const ids = data.list.map((u) => u.id);
    const allOn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const titleErr =
    title && (title.length < 3 || title.length > 255)
      ? "3–255 characters"
      : "";
  const msgErr =
    message && (message.length < 3 || message.length > 5000)
      ? "3–5000 characters"
      : "";

  const canCompose =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    !titleErr &&
    !msgErr;

  const send = async (scope, extra = {}) => {
    if (titleErr || msgErr || !title.trim() || !message.trim()) {
      toast.error("Fix validation errors");
      return;
    }
    const confirmText =
      scope === "all_users"
        ? "All customers"
        : scope === "all_vendors"
          ? "All vendors"
          : scope === "selected"
            ? `${selected.size} selected recipients`
            : scope === "city"
              ? `Recipients whose saved location contains this text (empty locations skipped): ${extra.city || "?"}`
              : scope;
    const ok = await confirmAction({
      title: "Send notification?",
      text: confirmText,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        message: message.trim(),
        scope,
        ...extra,
      };
      if (sendAt?.trim()) {
        body.send_at = new Date(sendAt).toISOString();
      }
      const res = await axiosInstance.post("/admin/notifications/send", body);
      const out = unwrap(res);
      toast.success(out.scheduled ? "Scheduled" : "Sent");
      setSelected(new Set());
      setDPage(1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pageIds = useMemo(() => data.list.map((u) => u.id), [data.list]);
  const pageAllSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const dMeta = deliveries.meta;
  const dShowNav = dMeta && dMeta.totalPages > 1;

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <h2 style={{ margin: 0 }}>Send notification</h2>
      <div className="card stack" style={{ gap: "0.85rem" }}>
        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            title="Short headline shown with the notification"
          />
          {titleErr && <span className="field-error">{titleErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">Message</span>
          <textarea
            className="input"
            rows={5}
            value={message}
            title="Body text users see in-app"
            onChange={(e) => setMessage(e.target.value)}
          />
          {msgErr && <span className="field-error">{msgErr}</span>}
        </label>
        <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !canCompose}
            title="Deliver immediately to every active customer account"
            onClick={() => send("all_users")}
          >
            All users
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !canCompose}
            title="Deliver immediately to every active vendor account"
            onClick={() => send("all_vendors")}
          >
            All vendors
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || !canCompose || selected.size === 0}
            title="Send only to accounts checked in the table below"
            onClick={() =>
              send("selected", { user_ids: Array.from(selected) })
            }
          >
            Selected ({selected.size})
          </button>
        </div>
        <label className="field">
          <span className="field-label">Schedule send (optional, local time)</span>
          <input
            type="datetime-local"
            className="input"
            value={sendAt}
            title="If set in the future, the campaign is queued instead of sent now"
            onChange={(e) => setSendAt(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">City / location filter</span>
          <input
            className="input"
            value={city}
            title="Matches this substring against users.location; skips blank locations"
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Dubai"
          />
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy || !canCompose || !city.trim()}
          title="Send to customers and vendors whose location field contains the text above"
          onClick={() => send("city", { city: city.trim() })}
        >
          Send to matching locations
        </button>
      </div>

      <TableToolbar
        showStatus={false}
        sortOptions={[
          { value: "createdAt", label: "Newest" },
          { value: "name", label: "Name" },
          { value: "email", label: "Email" },
        ]}
      >
        <select
          className="input"
          style={{ width: 160 }}
          title="Filter recipient picker by role"
          value={sp.get("role") || ""}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            const v = e.target.value;
            if (v) next.set("role", v);
            else next.delete("role");
            next.set("page", "1");
            setSp(next, { replace: true });
          }}
        >
          <option value="">Role (any)</option>
          <option value="user">Customers</option>
          <option value="vendor">Vendors</option>
        </select>
      </TableToolbar>

      <div className="card table-wrap">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    title="Select or deselect everyone on this page"
                    checked={pageAllSelected}
                    onChange={togglePage}
                  />
                </th>
                <th style={{ width: 48 }} />
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {data.list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <input
                      type="checkbox"
                      title={`Include ${u.name || u.email} in "Selected" send`}
                      checked={selected.has(u.id)}
                      onChange={() => toggleRow(u.id)}
                    />
                  </td>
                  <td>
                    <img
                      alt=""
                      src={profileImageSrc(u.profile_image)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <PaginationBar meta={data.meta} />

      <div className="card stack" style={{ gap: "0.75rem" }}>
        <h3 style={{ margin: 0 }}>Notification delivery log</h3>
        <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
          One row per recipient. Use search and dates to narrow results.
        </p>
        <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ minWidth: 200, flex: "1 1 160px" }}
            placeholder="Search name or email…"
            title="Filter by sender or recipient name/email"
            value={dQInput}
            onChange={(e) => setDQInput(e.target.value)}
          />
          <label className="rowflex muted" style={{ gap: "0.35rem", alignItems: "center" }}>
            From
            <input
              type="date"
              className="input"
              title="Deliveries on or after this date (UTC)"
              value={dFrom}
              onChange={(e) => setDFrom(e.target.value)}
            />
          </label>
          <label className="rowflex muted" style={{ gap: "0.35rem", alignItems: "center" }}>
            To
            <input
              type="date"
              className="input"
              title="Deliveries on or before this date (UTC)"
              value={dTo}
              onChange={(e) => setDTo(e.target.value)}
            />
          </label>
        </div>
        {dLoading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sent by</th>
                  <th>Sent to</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {(deliveries.list || []).map((row) => (
                  <tr key={row.id}>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>
                    <td>
                      {row.sender_name || "—"}{" "}
                      <span className="muted">{row.sender_email || ""}</span>
                    </td>
                    <td>
                      {row.recipient_name || "—"}{" "}
                      <span className="muted">{row.recipient_email || ""}</span>
                    </td>
                    <td>{row.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div
          className="rowflex"
          style={{
            justifyContent: "space-between",
            marginTop: "0.5rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span className="muted">
            Page {dMeta?.currentPage || 1} of {dMeta?.totalPages || 1} ·{" "}
            {dMeta?.total ?? 0} rows
          </span>
          {dShowNav ? (
            <div className="rowflex" style={{ gap: "0.5rem" }}>
              <button
                type="button"
                className="btn"
                disabled={(dMeta?.currentPage || 1) <= 1}
                title="Previous page of deliveries"
                onClick={() => setDPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn"
                disabled={(dMeta?.currentPage || 1) >= (dMeta?.totalPages || 1)}
                title="Next page of deliveries"
                onClick={() => setDPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
