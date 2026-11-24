import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import SearchableAsyncSelect from "../../components/common/SearchableAsyncSelect.jsx";

const empty = {
  code: "",
  discount_type: "percent",
  value: "",
  min_order_value: "0",
  expires_at: "",
  usage_limit_per_user: "",
  total_usage_limit: "",
  scope: "platform",
  is_active: true,
};

function parseDiscount(value, discountType) {
  const n = parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return "Enter a valid discount amount";
  if (discountType === "percent" && n > 100) return "Percentage cannot exceed 100";
  if (discountType === "fixed" && n > 100000) return "Fixed discount cannot exceed 100000";
  return null;
}

export default function CouponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [form, setForm] = useState(empty);
  const [stats, setStats] = useState(null);
  const [vendorPick, setVendorPick] = useState(null);
  const [categoryPick, setCategoryPick] = useState(null);

  const discountType = form.discount_type === "fixed" ? "fixed" : "percent";
  const valueHint = useMemo(
    () =>
      discountType === "percent"
        ? "Max 100 (percent of order)"
        : "Max 100000 (fixed currency amount)",
    [discountType],
  );

  const loadVendors = useCallback(async (q) => {
    const res = await axiosInstance.get("/admin/vendors", {
      params: { search: q.trim() || undefined, limit: 20, page: 1 },
    });
    const body = unwrap(res);
    return (body.list || []).map((v) => ({
      id: v.id,
      label: `${v.name}${v.email ? ` · ${v.email}` : ""} (#${v.id})`,
    }));
  }, []);

  const loadCategories = useCallback(async (q) => {
    const res = await axiosInstance.get("/admin/categories", {
      params: { search: q.trim() || undefined, limit: 20, page: 1 },
    });
    const body = unwrap(res);
    return (body.list || []).map((c) => ({
      id: c.id,
      label: `${c.title} (#${c.id})`,
    }));
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/coupons/${id}`);
        const body = unwrap(res);
        const c = body.coupon;
        setStats(body.stats);
        if (!cancelled) {
          setForm({
            code: c.code || "",
            discount_type: c.discount_type || "percent",
            value: String(c.value ?? ""),
            min_order_value: String(c.min_order_value ?? "0"),
            expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
            usage_limit_per_user:
              c.usage_limit_per_user != null ? String(c.usage_limit_per_user) : "",
            total_usage_limit:
              c.total_usage_limit != null ? String(c.total_usage_limit) : "",
            scope: c.scope || "platform",
            is_active: !!c.is_active,
          });
          setVendorPick(
            c.vendor_id != null && c.coupon_vendor
              ? {
                  id: c.vendor_id,
                  label: `${c.coupon_vendor.name} (#${c.vendor_id})`,
                }
              : c.vendor_id != null
                ? { id: c.vendor_id, label: `Vendor #${c.vendor_id}` }
                : null,
          );
          setCategoryPick(
            c.category_id != null && c.coupon_category
              ? {
                  id: c.category_id,
                  label: `${c.coupon_category.title} (#${c.category_id})`,
                }
              : c.category_id != null
                ? { id: c.category_id, label: `Category #${c.category_id}` }
                : null,
          );
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  useEffect(() => {
    if (form.scope === "platform" || form.scope === "first_order") {
      setVendorPick(null);
      setCategoryPick(null);
    } else if (form.scope === "vendor") {
      setCategoryPick(null);
    } else if (form.scope === "category") {
      setVendorPick(null);
    }
  }, [form.scope]);

  const submit = async (e) => {
    e.preventDefault();
    const err = parseDiscount(form.value, discountType);
    if (err) {
      toast.error(err);
      return;
    }
    if (form.scope === "vendor" && !vendorPick?.id) {
      toast.error("Select a vendor");
      return;
    }
    if (form.scope === "category" && !categoryPick?.id) {
      toast.error("Select a category");
      return;
    }
    const payload = {
      ...form,
      value: parseFloat(String(form.value).replace(",", ".")),
      min_order_value: parseFloat(form.min_order_value || "0"),
      usage_limit_per_user: form.usage_limit_per_user
        ? parseInt(form.usage_limit_per_user, 10)
        : null,
      total_usage_limit: form.total_usage_limit
        ? parseInt(form.total_usage_limit, 10)
        : null,
      vendor_id:
        form.scope === "vendor" && vendorPick?.id ? vendorPick.id : null,
      category_id:
        form.scope === "category" && categoryPick?.id ? categoryPick.id : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };
    try {
      if (isNew) {
        const res = await axiosInstance.post("/admin/coupons", payload);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/coupons/${row.id}`);
      } else {
        const res = await axiosInstance.put(`/admin/coupons/${id}`, payload);
        unwrap(res);
        toast.success("Saved");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const showVendorField = form.scope === "vendor";
  const showCategoryField = form.scope === "category";

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Link className="btn" title="Back to coupons" to="/coupons">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>{isNew ? "New coupon" : `Coupon #${id}`}</h2>
      {stats ? (
        <p className="muted" title="Aggregated from coupon redemptions">
          Times redeemed: {stats.total_redeemed} · Total discount given:{" "}
          {Number(stats.total_discount_given || 0).toFixed(2)}
        </p>
      ) : null}
      <form className="stack" style={{ gap: "0.75rem", marginTop: "1rem" }} onSubmit={submit}>
        <label className="field">
          <span className="field-label">Code</span>
          <input
            className="input"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Discount type</span>
          <select
            className="input"
            title="Percent applies to order subtotal; fixed is a flat amount off"
            value={form.discount_type}
            onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Value ({valueHint})</span>
          <input
            className="input"
            type="number"
            step="0.01"
            title={valueHint}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Min order value</span>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.min_order_value}
            onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="field-label">Expires (local)</span>
          <input
            className="input"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="field-label">Usage limit / user</span>
          <input
            className="input"
            value={form.usage_limit_per_user}
            onChange={(e) =>
              setForm((f) => ({ ...f, usage_limit_per_user: e.target.value }))
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Total usage limit</span>
          <input
            className="input"
            value={form.total_usage_limit}
            onChange={(e) =>
              setForm((f) => ({ ...f, total_usage_limit: e.target.value }))
            }
          />
        </label>
        <label className="field">
          <span className="field-label">Scope</span>
          <select
            className="input"
            title="Who can use this coupon"
            value={form.scope}
            onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
          >
            <option value="platform">Platform (all eligible)</option>
            <option value="vendor">Single vendor</option>
            <option value="category">Single category</option>
            <option value="first_order">First-time buyers</option>
          </select>
        </label>
        {showVendorField ? (
          <label className="field">
            <span className="field-label">Vendor</span>
            <SearchableAsyncSelect
              value={vendorPick}
              onChange={setVendorPick}
              loadOptions={loadVendors}
              placeholder="Search vendor by name or email…"
              title="Pick exactly one vendor for this coupon"
            />
          </label>
        ) : null}
        {showCategoryField ? (
          <label className="field">
            <span className="field-label">Category</span>
            <SearchableAsyncSelect
              value={categoryPick}
              onChange={setCategoryPick}
              loadOptions={loadCategories}
              placeholder="Search category…"
              title="Pick exactly one category for this coupon"
            />
          </label>
        ) : null}
        <label className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            title="Inactive codes cannot be applied at checkout"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          <span>Active</span>
        </label>
        <button type="submit" className="btn primary" title="Save coupon rules">
          Save
        </button>
      </form>
    </div>
  );
}
