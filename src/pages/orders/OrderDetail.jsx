import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams,Link } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import { formatUsd } from "../../utils/formatUsd.js";
import RatingStars from "../../components/common/RatingStars.jsx";

function formatWhen(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function formatPhone(countryCode, phone) {
  const cc =
    countryCode != null && String(countryCode).trim()
      ? String(countryCode).trim()
      : "";
  const ph = phone != null && String(phone).trim() ? String(phone).trim() : "";
  if (cc && ph) return `${cc} ${ph}`;
  if (ph) return ph;
  if (cc) return cc;
  return "—";
}

function normalizeItemStatus(s) {
  return String(s || "pending").toLowerCase();
}

function ItemStatusBadge({ status }) {
  const st = normalizeItemStatus(status);
  const label = st ? st.charAt(0).toUpperCase() + st.slice(1) : "—";
  const palette =
    st === "delivered"
      ? { bg: "#dcfce7", fg: "#166534" }
      : st === "shipped"
        ? { bg: "#ffedd5", fg: "#9a3412" }
        : st === "accepted" || st === "processing"
          ? { bg: "#dbeafe", fg: "#1e40af" }
          : st === "cancelled"
            ? { bg: "#fee2e2", fg: "#991b1b" }
            : { bg: "#f3f4f6", fg: "#374151" };
  return (
    <span
      className="badge"
      style={{
        background: palette.bg,
        color: palette.fg,
        fontWeight: 600,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}

/** Visible timeline steps; omits future stages the item has not reached. */
function buildItemTimeline(line) {
  console.log(line);
  const st = normalizeItemStatus(line.item_status ?? line.status);
  const placedAt = line.item_created_at ?? line.createdAt ?? null;

  if (st === "cancelled") {
    const steps = [];
    if (placedAt) {
      steps.push({
        key: "placed",
        label: "Item placed",
        sub: null,
        time: placedAt,
        dot: "#9ca3af",
      });
    }

    if (line.order_accepted_at) {
      steps.push({
        key: "accepted",
        label: "Accepted",
        sub: null,
        time: line.order_accepted_at,
        dot: "#9ca3af",
      });
    }
    if (line.order_processed_at) {
      steps.push({
        key: "processed",
        label: "Processing",
        sub: null,
        time: line.order_processed_at,
        dot: "#9ca3af",
      });
    }
    if (line.order_shipped_at) {
      steps.push({
        key: "shipped",
        label: "Shipped",
        sub: null,
        time: line.order_shipped_at,
        dot: "#9ca3af",
      });
    }
    const cancelledAt = line.order_cancelled_at ?? line.item_updated_at ?? null;
    const reason =
      line.cancellation_reason != null &&
      String(line.cancellation_reason).trim()
        ? String(line.cancellation_reason).trim()
        : null;
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      sub: reason,
      time: cancelledAt,
      dot: "#ef4444",
    });
    return steps;
  }

  const steps = [];
  if (placedAt) {
    steps.push({
      key: "placed",
      label: "Item placed",
      sub: null,
      time: placedAt,
      dot: "#9ca3af",
    });
  }

  if (st === "pending") {
    return steps;
  }

  if (
    st === "accepted" ||
    st === "processing" ||
    st === "shipped" ||
    st === "delivered"
  ) {
    steps.push({
      key: "accepted",
      label: "Accepted",
      sub: st === "processing" ? "Processing at vendor" : null,
      time: line.order_accepted_at ?? null,
      dot: "#3b82f6",
    });
  }

  if (st === "processing" || st === "shipped" || st === "delivered") {
    steps.push({
      key: "processed",
      label: "Processing",
      sub: null,
      time: line.order_processed_at ?? null,
      dot: "#6366f1",
    });
  }

  if (st === "processing") {
    return steps;
  }

  if (st === "shipped" || st === "delivered") {
    steps.push({
      key: "shipped",
      label: "Shipped",
      sub: null,
      time: line.order_shipped_at ?? null,
      dot: "#ea580c",
    });
  }

  if (st === "delivered") {
    steps.push({
      key: "delivered",
      label: "Delivered",
      sub: null,
      time: line.order_delivered_at ?? null,
      dot: "#16a34a",
    });
  }

  return steps;
}

function ItemTrackingTimeline({ line }) {
  const steps = buildItemTimeline(line);
  if (!steps.length) {
    return (
      <p
        className="muted"
        style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}
      >
        No tracking data.
      </p>
    );
  }
  return (
    <ol
      style={{
        listStyle: "none",
        margin: "0.35rem 0 0",
        padding: 0,
        borderLeft: "2px solid var(--border)",
        paddingLeft: "0.65rem",
        marginLeft: "0.35rem",
      }}
    >
      {steps.map((s, idx) => (
        <li
          key={s.key + String(idx)}
          style={{
            position: "relative",
            paddingBottom: idx < steps.length - 1 ? "0.7rem" : 0,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "-0.7rem",
              top: "0.35rem",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: s.dot,
              transform: "translateX(-50%)",
            }}
          />
          <div style={{ fontSize: "0.88rem" }}>
            <strong>{s.label}</strong>
            {s.sub ? (
              <div
                className="muted"
                style={{
                  fontSize: "0.8rem",
                  marginTop: 2,
                  whiteSpace: "pre-wrap",
                }}
              >
                {s.sub}
              </div>
            ) : null}
          </div>
          <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
            {s.time ? formatWhen(s.time) : "—"}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/orders/${id}`);
        if (!cancelled) setPayload(unwrap(res));
        console.log(unwrap(res));
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const multiSeller = useMemo(() => {
    const list = payload?.items || [];
    return (
      new Set(list.map((i) => i.vendor_id).filter((v) => v != null)).size > 1
    );
  }, [payload]);

  if (!payload) return <p className="muted">Loading…</p>;

  const { order, buyer, address, items, amount_breakdown, refund_request } =
    payload;

  return (
    <div className="card" style={{ maxWidth: 960 }}>
      <button type="button" className="btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 style={{ marginTop: "1rem" }}>Order {order.order_number}</h2>

      <h3 style={{ marginTop: "1rem" }}>Order</h3>
      <p>
        <strong>Total:</strong> {formatUsd(order.all_orders_total_amount)}
      </p>
      {amount_breakdown && (
        <div
          className="card"
          style={{
            marginTop: "0.5rem",
            padding: "0.85rem",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <p style={{ margin: "0.2rem 0" }}>
            <strong>Product subtotal:</strong>{" "}
            {formatUsd(amount_breakdown.product_subtotal)}
          </p>
          <p style={{ margin: "0.2rem 0" }}>
            <strong>Service Fee on whole order:</strong>
            {formatUsd(amount_breakdown.service_fee)}
          </p>
          <p style={{ margin: "0.2rem 0" }}>
            <strong>Platform commission from vendor:</strong>{" "}
            {formatUsd(amount_breakdown.platform_commission)}
            {amount_breakdown.commission_percentage_snapshot != null
              ? ` (${amount_breakdown.commission_percentage_snapshot}% snapshot on order)`
              : ""}
          </p>
          <p style={{ margin: "0.2rem 0" }}>
            <strong>Shipping Charges:</strong>{" "}
            {formatUsd(amount_breakdown.shipping_price || 0)}
          </p>
          <p style={{ margin: "0.2rem 0" }}>
            <strong>Vendor payout on this product:</strong>{" "}
            {formatUsd(amount_breakdown.vendor_payout)}
          </p>
        </div>
      )}
      <p>
        <strong>Payment method:</strong> {order.payment_method}
      </p>
      <p>
        <strong>Payment status:</strong> {order.payment_status}
      </p>
      {/* <p>
        <strong>Order status:</strong> {order.order_status}
      </p> */}
      {/* <p>
        <strong>Order-level cancellation reason:</strong>{" "}
        {order.cancellation_reason?.trim() ? order.cancellation_reason : "—"}
      </p> */}
      {multiSeller ? (
        <p
          className="muted"
          style={{ fontSize: "0.88rem", marginTop: "0.35rem" }}
        >
          This order includes items from multiple vendors. Headline dates below
          are for the order record; each line item has its own status and
          timeline.
        </p>
      ) : null}
      <p>
        <strong>Order placed at:</strong> {formatWhen(order.createdAt)}
      </p>
      <p>
        <strong>Order accepted at:</strong> {formatWhen(order.accepted_at)}
      </p>
      <p>
        <strong>Order processed at:</strong> {formatWhen(order.processed_at)}
      </p>
      <p>
        <strong>Order shipped at:</strong> {formatWhen(order.picked_at)}
      </p>
      <p>
        <strong>Order delivered at:</strong> {formatWhen(order.delivered_at)}
      </p>

      <h3 style={{ marginTop: "1.25rem" }}>Customer Details</h3>
      <p>
        <strong>Name:</strong> {buyer?.name ?? "—"}
      </p>
      <p>
        <strong>Email:</strong> {buyer?.email ?? "—"}
      </p>
      <p>
        <strong>Phone:</strong> {formatPhone(buyer?.country_code, buyer?.phone)}
      </p>

      <h3 style={{ marginTop: "1.25rem" }}>Shipping address</h3>
      {!address || Object.keys(address).length === 0 ? (
        <p className="muted">—</p>
      ) : (
        <div
          className="card"
          style={{
            marginTop: "0.5rem",
            padding: "0.85rem",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          {Object.entries(address).map(([k, v]) => (
            <p key={k} style={{ margin: "0.2rem 0" }}>
              <strong style={{ textTransform: "capitalize" }}>
                {k.replace(/_/g, " ")}:
              </strong>{" "}
              {v != null && String(v).trim() !== "" ? String(v) : "—"}
            </p>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: "1.25rem" }}>Delivery Instructions</h3>

      {order?.delivery_instruction ||
      order?.country_code ||
      order?.phone_number ? (
        <div
          className="card"
          style={{
            marginTop: "0.5rem",
            padding: "0.85rem",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          {order?.delivery_instruction ? (
            <p style={{ margin: "0.2rem 0" }}>
              <strong>Instruction:</strong> {order.delivery_instruction}
            </p>
          ) : null}

          {order?.country_code || order?.phone_number ? (
            <p style={{ margin: "0.2rem 0" }}>
              <strong>Contact Number:</strong>{" "}
              {[order?.country_code, order?.phone_number]
                .filter(Boolean)
                .join(" ")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="muted">—</p>
      )}

      {refund_request ? (
        <>
          <div
            className="rowflex"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.25rem",
            }}
          >
            <h3 style={{ margin: 0 }}>Dispute / Return</h3>

            <Link className="btn" to={`/refund-requests/${refund_request.id}`}>
              View Complete Details
            </Link>
          </div>

          <div
            className="card"
            style={{
              marginTop: "0.5rem",
              padding: "0.85rem",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <p style={{ margin: "0.2rem 0" }}>
              <strong>Status:</strong> {refund_request.status || "—"}
            </p>

            <p style={{ margin: "0.2rem 0" }}>
              <strong>Amount:</strong>{" "}
              {refund_request.amount != null
                ? formatUsd(refund_request.amount)
                : "—"}
            </p>

            <p style={{ margin: "0.2rem 0" }}>
              <strong>Reason:</strong> {refund_request.reason || "—"}
            </p>

            {refund_request.detailed_explanation ? (
              <p style={{ margin: "0.2rem 0" }}>
                <strong>Detailed Explanation:</strong>{" "}
                {refund_request.detailed_explanation}
              </p>
            ) : null}

            {refund_request.rejection_reason ? (
              <p style={{ margin: "0.2rem 0" }}>
                <strong>Rejection Reason:</strong>{" "}
                {refund_request.rejection_reason}
              </p>
            ) : null}

            {refund_request.admin_notes ? (
              <p style={{ margin: "0.2rem 0" }}>
                <strong>Admin Notes:</strong> {refund_request.admin_notes}
              </p>
            ) : null}

            {[
              refund_request.image1,
              refund_request.image2,
              refund_request.image3,
            ].filter(Boolean).length > 0 ? (
              <>
                <p style={{ margin: "0.6rem 0 0.4rem" }}>
                  <strong>Evidence Images</strong>
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    refund_request.image1,
                    refund_request.image2,
                    refund_request.image3,
                  ]
                    .filter(Boolean)
                    .map((img, idx) => (
                      <a
                        key={idx}
                        href={mediaUrl(img)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={mediaUrl(img)}
                          alt={`Evidence ${idx + 1}`}
                          style={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                          }}
                        />
                      </a>
                    ))}
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}

      <h3 style={{ marginTop: "1.25rem" }}>Order items</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 56 }} />
              <th>Product</th>
              <th>Vendor</th>
              <th>Color</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Sub-total</th>
              <th>Platform</th>
              <th>Payout</th>
              <th>Rating</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((line) => (
              <Fragment key={line.id}>
                <tr>
                  <td>
                    {line.main_image ? (
                      <img
                        alt=""
                        src={mediaUrl(line.main_image)}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{line.product_title ?? "—"}</td>
                  <td>{line.vendor_name ?? line.vendor_id ?? "—"}</td>
                  <td>{line.variant_color ?? "—"}</td>
                  <td>{line.size ?? "—"}</td>
                  <td>{line.quantity}</td>
                  <td>{formatUsd(line.price)}</td>
                  <td>{formatUsd(line.sub_total)}</td>
                  <td>{formatUsd(line.platform_commission)}</td>
                  <td>{formatUsd(line.vendor_payout)}</td>
                  <td>
                    <RatingStars value={line.rating} sizePx={16} />
                  </td>
                  <td
                    style={{
                      maxWidth: 280,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {line.review?.trim() ? line.review : "—"}
                  </td>
                </tr>
                <tr className="order-item-tracking-row">
                  <td
                    colSpan={12}
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      borderBottom: "1px solid var(--border)",
                      padding: "0.75rem 0.65rem",
                      verticalAlign: "top",
                    }}
                  >
                    <div
                      className="rowflex"
                      style={{
                        gap: "0.5rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="muted"
                        style={{
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Item fulfillment
                      </span>
                      <ItemStatusBadge
                        status={line.item_status ?? line.status}
                      />
                    </div>
                    <ItemTrackingTimeline line={line} />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
