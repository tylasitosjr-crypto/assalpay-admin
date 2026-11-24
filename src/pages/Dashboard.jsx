import { useEffect, useMemo, useState } from "react";
import { axiosInstance, unwrap } from "../api/axiosInstance.js";
import { toast } from "react-toastify";
import {useNavigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function intField(v) {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dayKey(row) {
  const d = row?.day;
  if (d == null) return "";
  if (typeof d === "string") return d.slice(0, 10);
  try {
    return d.toISOString?.().slice(0, 10) ?? String(d).slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
}

function countValue(row) {
  const c = row?.count;
  if (typeof c === "bigint") return Number(c);
  const n = Number(c);
  return Number.isFinite(n) ? n : 0;
}

function formatChartAxisLabel(isoYmd) {
  if (!isoYmd || isoYmd.length < 10) return "";
  const [y, m, d] = isoYmd.slice(0, 10).split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return isoYmd.slice(5);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatChartTitle(isoYmd) {
  if (!isoYmd || isoYmd.length < 10) return "";
  const [y, m, d] = isoYmd.slice(0, 10).split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return isoYmd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRating(r) {
  if (r == null || r === "") return "—";
  const n = Number(r);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function monthTitle(monthNum, year) {
  const m = Number(monthNum);
  if (!m || m < 1 || m > 12) return "";
  const dt = new Date(year, m - 1, 1);
  return dt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** @param {{ values: number[]; year: number; color: string; fillId: string; ariaLabel: string; valueLabel: string }} props */
function MonthlyLineChart({
  values,
  year,
  color,
  fillId,
  ariaLabel,
  valueLabel,
}) {
  const [hover, setHover] = useState(null);
  const VB_W = 640;
  const VB_H = 228;
  const padL = 44;
  const padR = 14;
  const padT = 18;
  const padB = 40;
  const innerW = VB_W - padL - padR;
  const innerH = VB_H - padT - padB;
  const n = values.length;
  const maxY = Math.max(1, ...values);
  const xAt = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => padT + innerH * (1 - v / maxY);
  const polyPoints = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const baseY = padT + innerH;
  let areaD = `M ${xAt(0)},${baseY} L ${xAt(0)},${yAt(values[0])}`;
  for (let i = 1; i < n; i++) {
    areaD += ` L ${xAt(i)},${yAt(values[i])}`;
  }
  areaD += ` L ${xAt(n - 1)},${baseY} Z`;
  const gridLines = [0, 0.5, 1].map((t) => {
    const y = padT + innerH * (1 - t);
    return (
      <line
        key={`g-${t}`}
        className="line-chart__grid-line"
        x1={padL}
        x2={VB_W - padR}
        y1={y}
        y2={y}
      />
    );
  });
  const colW = innerW / Math.max(1, n);

  return (
    <div className="line-chart__shell">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="line-chart__svg"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines}
        <path d={areaD} fill={`url(#${fillId})`} stroke="none" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyPoints}
        />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(v)}
            r={hover === i ? 5 : 4}
            fill={color}
            stroke="#fff"
            strokeWidth="1.5"
            className="line-chart__dot"
          />
        ))}
        {MONTH_SHORT.map((lbl, i) => (
          <text
            key={lbl}
            x={xAt(i)}
            y={VB_H - 10}
            textAnchor="middle"
            className="line-chart__axis-text"
          >
            {lbl}
          </text>
        ))}
        {values.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={xAt(i) - colW / 2}
            y={padT}
            width={colW}
            height={innerH}
            fill="transparent"
            className="line-chart__hit"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          />
        ))}
      </svg>
      {hover != null && (
        <div
          className="line-chart__flyout"
          style={{ left: `${(hover / Math.max(1, n - 1)) * 100}%` }}
        >
          <strong>{monthTitle(hover + 1, year)}</strong>
          <span>
            {valueLabel}: {values[hover]}
          </span>
        </div>
      )}
    </div>
  );
}

/** @param {{ userValues: number[]; vendorValues: number[]; year: number }} props */
function MonthlySignupBarChart({ userValues, vendorValues, year }) {
  const [hover, setHover] = useState(null);
  const VB_W = 640;
  const VB_H = 278;
  const padL = 48;
  const padR = 14;
  const padT = 20;
  const padB = 42;
  const innerW = VB_W - padL - padR;
  const innerH = VB_H - padT - padB;
  const n = 12;
  const slotW = innerW / n;
  const maxY = Math.max(1, ...userValues, ...vendorValues);
  const baseY = padT + innerH;
  const padSlot = slotW * 0.12;
  const pairInner = slotW - 2 * padSlot;
  const betweenBars = slotW * 0.08;
  const barW = Math.max(4, (pairInner - betweenBars) / 2);

  const barHeight = (v) => {
    if (v <= 0) return 3;
    return Math.max(5, (v / maxY) * innerH);
  };

  const gridLines = [0, 0.5, 1].map((t) => {
    const y = padT + innerH * (1 - t);
    return (
      <line
        key={`g-${t}`}
        className="line-chart__grid-line"
        x1={padL}
        x2={VB_W - padR}
        y1={y}
        y2={y}
      />
    );
  });

  const cUserHex = "#2563eb";
  const cVendorHex = "#059669";

  return (
    <div className="line-chart__shell line-chart__shell--dual signup-bar-chart">
      <div className="line-chart__legend" aria-hidden="false">
        <span className="line-chart__legend-item">
          <span className="line-chart__swatch" style={{ background: cUserHex }} />
          Users
        </span>
        <span className="line-chart__legend-item">
          <span className="line-chart__swatch" style={{ background: cVendorHex }} />
          Vendors
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="line-chart__svg"
        role="img"
        aria-label={`New user and vendor signups by month as a bar chart for ${year}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="signupBarUser" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="signupBarVendor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        {gridLines}
        {userValues.map((v, i) => {
          const x = padL + i * slotW + padSlot;
          const h = barHeight(v);
          const y = baseY - h;
          return (
            <rect
              key={`u-${i}`}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={5}
              ry={5}
              fill="url(#signupBarUser)"
              className="signup-bar-chart__bar"
            />
          );
        })}
        {vendorValues.map((v, i) => {
          const x = padL + i * slotW + padSlot + barW + betweenBars;
          const h = barHeight(v);
          const y = baseY - h;
          return (
            <rect
              key={`v-${i}`}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={5}
              ry={5}
              fill="url(#signupBarVendor)"
              className="signup-bar-chart__bar"
            />
          );
        })}
        {MONTH_SHORT.map((lbl, i) => (
          <text
            key={lbl}
            x={padL + i * slotW + slotW / 2}
            y={VB_H - 10}
            textAnchor="middle"
            className="line-chart__axis-text"
          >
            {lbl}
          </text>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={`hit-${i}`}
            x={padL + i * slotW}
            y={padT}
            width={slotW}
            height={innerH}
            fill="transparent"
            className="line-chart__hit"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          />
        ))}
      </svg>
      {hover != null && (
        <div
          className="line-chart__flyout line-chart__flyout--dual"
          style={{ left: `${((hover + 0.5) / n) * 100}%` }}
        >
          <strong>{monthTitle(hover + 1, year)}</strong>
          <span>
            <span className="line-chart__tip-line line-chart__tip-line--user">
              Users: {userValues[hover]}
            </span>
            <span className="line-chart__tip-line line-chart__tip-line--vendor">
              Vendors: {vendorValues[hover]}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
const navigate = useNavigate();
  const { can } = useAuth();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/dashboard");
        const body = unwrap(res);
        if (!cancelled) setData(body);
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chart = data?.ordersPerDay || [];
  const normalizedChart = useMemo(
    () =>
      chart.map((row) => ({
        day: dayKey(row),
        count: countValue(row),
      })),
    [chart],
  );

  const maxCount = useMemo(() => {
    const m = Math.max(0, ...normalizedChart.map((r) => r.count));
    return m === 0 ? 1 : m;
  }, [normalizedChart]);

  const ordersWindowTotal = useMemo(
    () => normalizedChart.reduce((s, r) => s + r.count, 0),
    [normalizedChart],
  );

  const dashboardYear = data?.dashboardYear ?? new Date().getFullYear();

  const signupsUserSeries = useMemo(() => {
    const rows = data?.signupsByMonth ?? [];
    return Array.from({ length: 12 }, (_, i) => intField(rows[i]?.user_count));
  }, [data]);

  const signupsVendorSeries = useMemo(() => {
    const rows = data?.signupsByMonth ?? [];
    return Array.from({ length: 12 }, (_, i) => intField(rows[i]?.vendor_count));
  }, [data]);

  const deliveredSeries = useMemo(() => {
    const rows = data?.deliveredOrdersByMonth ?? [];
    return Array.from({ length: 12 }, (_, i) => intField(rows[i]?.count));
  }, [data]);

  return (
    <div className="stack" style={{ gap: "1.25rem" }}>
      <div className="rowflex" style={{ gap: "1rem", flexWrap: "wrap" }}>
        {[
          { label: "Orders", value: data?.totalSalesCount ?? "—",navigateUrl:"/orders" },
          { label: "Users", value: data?.totalUsersCount ?? "—", navigateUrl:"/users" },
          { label: "Vendors", value: data?.totalVendorsCount ?? "—", navigateUrl:"/vendors" },
        ].map((k) => (
          <div
            key={k.label}
            className="card dashboard-stat-card"
            style={{ flex: "1 1 180px",cursor:"pointer" }}
            onClick={()=>navigate(k.navigateUrl)}
          >
            <div className="dashboard-stat-card__label">{k.label}</div>
            <div className="dashboard-stat-card__value">{k.value}</div>
          </div>
        ))}
      </div>

      {data?.analytics && (
        <div className="card stack" style={{ gap: "1rem" }}>
          <div
            className="rowflex"
            style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}
          >
            <h3 style={{ margin: 0 }}>GMV &amp; operations</h3>
            {can("analytics") && (
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  try {
                    const res = await axiosInstance.get("/admin/analytics/export", {
                      responseType: "blob",
                    });
                    const blob = new Blob([res.data], { type: "text/csv" });
                    const u = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = u;
                    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(u);
                    toast.success("Download started");
                  } catch (e) {
                    toast.error(e.message || "Export failed");
                  }
                }}
              >
                Export reports CSV
              </button>
            )}
          </div>
          <div className="rowflex" style={{ gap: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "GMV today", value: data.analytics.gmv_today },
              { label: "GMV this week", value: data.analytics.gmv_week },
              { label: "GMV this month", value: data.analytics.gmv_month },
            ].map((k) => (
              <div
                key={k.label}
                className="card dashboard-stat-card"
                style={{ flex: "1 1 160px" }}
              >
                <div className="dashboard-stat-card__label">{k.label}</div>
                <div className="dashboard-stat-card__value">
                  {typeof k.value === "number" ? k.value.toFixed(2) : "—"}
                </div>
              </div>
            ))}
          </div>
          <div className="rowflex" style={{ gap: "1rem", flexWrap: "wrap", alignItems: "stretch" }}>
            <div className="card table-wrap dashboard-side-card" style={{ flex: "1 1 280px" }}>
              <h4 className="dashboard-side-card__title">Order status breakdown</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.analytics.order_breakdown || []).map((r) => (
                    <tr key={r.status}>
                      <td>{r.status}</td>
                      <td>{r.cnt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card table-wrap dashboard-side-card" style={{ flex: "1 1 280px" }}>
              <h4 className="dashboard-side-card__title">Top vendors by sales</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.analytics.top_vendors_by_sales || []).map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{Number(r.sales_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card table-wrap dashboard-side-card" style={{ flex: "1 1 280px" }}>
              <h4 className="dashboard-side-card__title">Top products by units</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.analytics.top_products_by_units || []).map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.units_sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card dashboard-orders-card">
        <div className="dashboard-orders-card__header">
          <div>
            <h3 className="dashboard-orders-card__title">Orders per day</h3>
            <p className="dashboard-orders-card__subtitle muted">
              Last 14 calendar days · all dates shown, including zeros
            </p>
          </div>
          <div className="dashboard-orders-card__meta">
            <span className="dashboard-orders-card__meta-val">{ordersWindowTotal}</span>
            <span className="dashboard-orders-card__meta-lbl">orders in window</span>
          </div>
        </div>

        <div className="ap-chart ap-chart--modern" role="img" aria-label="Bar chart of orders per day for the last 14 days">
          <div className="ap-chart__grid" aria-hidden />
          {normalizedChart.map((row) => {
            const pct =
              row.count === 0
                ? 0
                : Math.max(6, Math.round((row.count / maxCount) * 100));
            const short = formatChartAxisLabel(row.day);
            const full = formatChartTitle(row.day);
            return (
              <div key={row.day || short} className="ap-chart__bar-wrap">
                <div className="ap-chart__tooltip" role="tooltip">
                  <strong>{full}</strong>
                  <span>{row.count} orders</span>
                </div>
                <div className="ap-chart__track">
                  <div
                    className={
                      row.count === 0
                        ? "ap-chart__bar ap-chart__bar--zero"
                        : "ap-chart__bar ap-chart__bar--value"
                    }
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="ap-chart__label" title={full}>
                  {short}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rowflex dashboard-year-charts" style={{ gap: "1rem", flexWrap: "wrap", alignItems: "stretch" }}>
        <div className="card dashboard-line-card" style={{ flex: "1 1 380px" }}>
          <div className="dashboard-line-card__header">
            <div>
              <h3 className="dashboard-line-card__title">User &amp; vendor signups</h3>
              <p className="dashboard-line-card__subtitle muted">
                Grouped bar chart · new accounts per month · {dashboardYear} · all twelve months shown
                (zeros included). Users are accounts with role{" "}
                <code className="line-chart__code">customer</code>.
              </p>
            </div>
          </div>
          <MonthlySignupBarChart
            userValues={signupsUserSeries}
            vendorValues={signupsVendorSeries}
            year={dashboardYear}
          />
        </div>
        <div className="card dashboard-line-card" style={{ flex: "1 1 380px" }}>
          <div className="dashboard-line-card__header">
            <div>
              <h3 className="dashboard-line-card__title">Delivered orders</h3>
              <p className="dashboard-line-card__subtitle muted">
                Orders with status <code className="line-chart__code">delivered</code> in{" "}
                {dashboardYear}, by month · zeros included.
              </p>
            </div>
            <div className="line-chart__legend line-chart__legend--inline" aria-hidden="false">
              <span className="line-chart__legend-item">
                <span className="line-chart__swatch" style={{ background: "#7c3aed" }} />
                Delivered count
              </span>
            </div>
          </div>
          <MonthlyLineChart
            values={deliveredSeries}
            year={dashboardYear}
            color="#7c3aed"
            fillId="deliveredGradient"
            ariaLabel={`Delivered orders per month for ${dashboardYear}`}
            valueLabel="Delivered"
          />
        </div>
      </div>

      <div className="rowflex dashboard-tables-row" style={{ gap: "1rem", alignItems: "stretch", flexWrap: "wrap" }}>
        <div className="card table-wrap dashboard-side-card" style={{ flex: "1 1 320px" }}>
          <h3 className="dashboard-side-card__title">Top vendors by rating</h3>
          <p className="muted dashboard-side-card__hint">
            Ratings greater than zero only (up to 10).
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topVendors || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No vendors with a rating yet.
                  </td>
                </tr>
              ) : (
                (data?.topVendors || []).map((v) => (
                  <tr key={String(v.id)}>
                    <td>{v.name || "—"}</td>
                    <td>{v.email || "—"}</td>
                    <td>{formatRating(v.rating)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card table-wrap dashboard-side-card" style={{ flex: "1 1 320px" }}>
          <h3 className="dashboard-side-card__title">Top products by rating</h3>
          <p className="muted dashboard-side-card__hint">
            Ratings greater than zero only (up to 10).
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Vendor</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topProducts || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No products with a rating yet.
                  </td>
                </tr>
              ) : (
                (data?.topProducts || []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{p.vendor_name?.trim() ? p.vendor_name : "—"}</td>
                    <td>{formatRating(p.rating)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
