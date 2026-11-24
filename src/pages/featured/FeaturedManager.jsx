import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import SearchableAsyncSelect from "../../components/common/SearchableAsyncSelect.jsx";

export default function FeaturedManager() {
  const [data, setData] = useState({ vendors: [], products: [] });
  const [vendorPickFeatured, setVendorPickFeatured] = useState(null);
  const [vendorForProducts, setVendorForProducts] = useState(null);
  const [productPick, setProductPick] = useState(null);

  const loadVendorsForFeatured = useCallback(async (q) => {
    const res = await axiosInstance.get("/admin/vendors", {
      params: {
        search: q.trim() || undefined,
        limit: 20,
        page: 1,
        exclude_featured: "1",
      },
    });
    const body = unwrap(res);
    return (body.list || []).map((v) => ({
      id: v.id,
      label: `${v.name}${v.email ? ` · ${v.email}` : ""} (#${v.id})`,
    }));
  }, []);

  const loadAllVendors = useCallback(async (q) => {
    const res = await axiosInstance.get("/admin/vendors", {
      params: {
        search: q.trim() || undefined,
        limit: 20,
        page: 1,
      },
    });
    const body = unwrap(res);
    return (body.list || []).map((v) => ({
      id: v.id,
      label: `${v.name}${v.email ? ` · ${v.email}` : ""} (#${v.id})`,
    }));
  }, []);

  const load = async () => {
    try {
      const res = await axiosInstance.get("/admin/featured");
      setData(unwrap(res));
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addVendor = async (e) => {
    e.preventDefault();
    if (!vendorPickFeatured?.id) {
      toast.error("Select a vendor");
      return;
    }
    try {
      const res = await axiosInstance.post("/admin/featured/vendors", {
        vendor_user_id: vendorPickFeatured.id,
        sort_order: 0,
      });
      unwrap(res);
      toast.success("Added");
      setVendorPickFeatured(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const delVendor = async (rowId) => {
    try {
      const res = await axiosInstance.delete(`/admin/featured/vendors/${rowId}`);
      unwrap(res);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!vendorForProducts?.id || !productPick?.id) {
      toast.error("Select vendor and product");
      return;
    }
    try {
      const res = await axiosInstance.post("/admin/featured/products", {
        vendor_user_id: vendorForProducts.id,
        product_id: productPick.id,
        sort_order: 0,
      });
      unwrap(res);
      toast.success("Added");
      setProductPick(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const delProduct = async (rowId) => {
    try {
      const res = await axiosInstance.delete(`/admin/featured/products/${rowId}`);
      unwrap(res);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 800 }}>
      <h2>Featured manager</h2>
      <h3 style={{ marginTop: "1rem" }}>Featured vendors</h3>
      <form onSubmit={addVendor} className="stack" style={{ gap: 8, marginBottom: "0.75rem" }}>
        <label className="field">
          <span className="field-label">Vendor</span>
          <SearchableAsyncSelect
            key={`featured-vendor-${(data.vendors || []).length}`}
            value={vendorPickFeatured}
            onChange={setVendorPickFeatured}
            loadOptions={loadVendorsForFeatured}
            placeholder="Search vendor…"
            title="Pick one vendor to pin on the homepage"
          />
        </label>
        <button type="submit" className="btn primary" title="Add vendor to featured list">
          Add vendor
        </button>
      </form>
      <ul>
        {(data.vendors || []).map((v) => (
          <li key={v.id}>
            {v.featured_vendor_user?.name} (#{v.vendor_user_id}){" "}
            <button
              type="button"
              className="btn"
              title="Remove from featured vendors"
              onClick={() => delVendor(v.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: "1.25rem" }}>Featured products</h3>
      <form onSubmit={addProduct} className="stack" style={{ gap: 8 }}>
        <label className="field">
          <span className="field-label">Vendor</span>
          <SearchableAsyncSelect
            value={vendorForProducts}
            onChange={(v) => {
              setVendorForProducts(v);
              setProductPick(null);
            }}
            loadOptions={loadAllVendors}
            placeholder="Search vendor…"
            title="Any vendor — pick one to browse their products"
          />
        </label>
        <label className="field">
          <span className="field-label">Product</span>
          <SearchableAsyncSelect
            key={`featured-product-${vendorForProducts?.id}-${(data.products || []).length}`}
            value={productPick}
            onChange={setProductPick}
            loadOptions={async (q) => {
              if (!vendorForProducts?.id) return [];
              const res = await axiosInstance.get("/admin/products", {
                params: {
                  vendor_id: vendorForProducts.id,
                  search: q.trim() || undefined,
                  limit: 20,
                  page: 1,
                  exclude_featured: "1",
                },
              });
              const body = unwrap(res);
              return (body.list || []).map((p) => ({
                id: p.id,
                label: `${p.title} (#${p.id})`,
              }));
            }}
            disabled={!vendorForProducts?.id}
            placeholder={
              vendorForProducts?.id ? "Search this vendor's products…" : "Select vendor first"
            }
            title="Pick one product after choosing its vendor"
          />
        </label>
        <button
          type="submit"
          className="btn primary"
          title="Add product to featured list"
          disabled={!vendorForProducts?.id}
        >
          Add product
        </button>
      </form>
      <ul style={{ marginTop: "0.75rem" }}>
        {(data.products || []).map((p) => (
          <li key={p.id}>
            {p.fp_product?.title} · vendor {p.fp_vendor?.name}{" "}
            <button
              type="button"
              className="btn"
              title="Remove from featured products"
              onClick={() => delProduct(p.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
