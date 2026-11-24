import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { MdPhotoCamera } from "react-icons/md";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import SearchableAsyncSelect from "../../components/common/SearchableAsyncSelect.jsx";

export default function BannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !!useMatch({ path: "/banners/new", end: true });
  const inputRef = useRef(null);
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
const [linkType] = useState("2");
  const [productPick, setProductPick] = useState(null);
  const [vendorPick, setVendorPick] = useState(null);
  const [categoryPick, setCategoryPick] = useState(null);
  const [image, setImage] = useState(null);
  const [existingImagePath, setExistingImagePath] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const loadProducts = useCallback(async (q) => {
    const res = await axiosInstance.get("/admin/products", {
      params: { search: q.trim() || undefined, limit: 20, page: 1 },
    });
    const body = unwrap(res);
    return (body.list || []).map((p) => ({
      id: p.id,
      label: `${p.title} (#${p.id})`,
    }));
  }, []);

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
    if (isCreate || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/banners/${id}`);
        const row = unwrap(res);
        if (!cancelled) {
          setStatus(row.status === "inactive" ? "inactive" : "active");
          setExistingImagePath(row.image || "");
          setDescription(row.description || "");
          setStartDate(row.start_date || "");
          setEndDate(row.end_date || "");
          // setLinkType(row.link_type != null ? String(row.link_type) : "");
          if (row.product_id != null) {
            setProductPick({
              id: row.product_id,
              label: row.banner_product?.title
                ? `${row.banner_product.title} (#${row.product_id})`
                : `Product #${row.product_id}`,
            });
          } else setProductPick(null);
          if (row.vendor_id != null) {
            setVendorPick({
              id: row.vendor_id,
              label: row.banner_vendor?.name
                ? `${row.banner_vendor.name} (#${row.vendor_id})`
                : `Vendor #${row.vendor_id}`,
            });
          } else setVendorPick(null);
          if (row.category_id != null) {
            setCategoryPick({
              id: row.category_id,
              label: row.banner_category?.title
                ? `${row.banner_category.title} (#${row.category_id})`
                : `Category #${row.category_id}`,
            });
          } else setCategoryPick(null);
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  // useEffect(() => {
  //   if (linkType !== "1") setProductPick(null);
  //   if (linkType !== "2") setVendorPick(null);
  //   if (linkType !== "3") setCategoryPick(null);
  // }, [linkType]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const displaySrc = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (existingImagePath) return mediaUrl(existingImagePath);
    return "";
  }, [previewUrl, existingImagePath]);

  const openPicker = () => inputRef.current?.click();

  const submit = async (e) => {
    e.preventDefault();
    if (isCreate && !image) {
      toast.error("Image required");
      return;
    }
    if (linkType === "1" && !productPick?.id) {
      toast.error("Select a product");
      return;
    }
    if (linkType === "2" && !vendorPick?.id) {
      toast.error("Select a vendor");
      return;
    }
    if (linkType === "3" && !categoryPick?.id) {
      toast.error("Select a category");
      return;
    }
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      toast.error("Description is required");
      return;
    }

    if (trimmedDescription.length > 100) {
      toast.error("Description cannot exceed 100 characters");
      return;
    }

    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    if (!endDate) {
      toast.error("End date is required");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be greater than or equal to start date");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("status", status);
      fd.append("description", trimmedDescription);
      fd.append("start_date", startDate);
      fd.append("end_date", endDate);
      if (linkType) fd.append("link_type", linkType);
      if (linkType === "1" && productPick?.id)
        fd.append("product_id", String(productPick.id));
      if (linkType === "2" && vendorPick?.id)
        fd.append("vendor_id", String(vendorPick.id));
      if (linkType === "3" && categoryPick?.id) {
        fd.append("category_id", String(categoryPick.id));
      }
      if (image) fd.append("image", image);

      if (isCreate) {
        const res = await axiosInstance.post("/admin/banners", fd);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/banners/${row.id}`);
      } else {
        const res = await axiosInstance.put(`/admin/banners/${id}`, fd);
        unwrap(res);
        toast.success("Saved");
        navigate(`/banners/${id}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Link className="btn" title="Back to banners" to="/banners">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>
        {isCreate ? "New banner" : "Edit banner"}
      </h2>
      <form
        className="stack"
        style={{ gap: "1rem", marginTop: "1rem" }}
        onSubmit={submit}
      >
        <div className="field">
          <span className="field-label">
            Image {isCreate ? "(required)" : "(optional)"}
          </span>
          <button
            type="button"
            className="banner-image-preview-hit"
            onClick={openPicker}
            aria-label="Choose banner image"
            title="Upload the image shoppers see for this banner"
          >
            {displaySrc ? (
              <>
                <img
                  className="banner-image-preview-img"
                  alt=""
                  src={displaySrc}
                />
                <span className="profile-image-picker-camera-wrap" aria-hidden>
                  <MdPhotoCamera size={20} />
                </span>
              </>
            ) : (
              <>
                <div className="banner-image-preview-img muted banner-image-preview-placeholder">
                  Click to select image
                </div>
                <span className="profile-image-picker-camera-wrap" aria-hidden>
                  <MdPhotoCamera size={20} />
                </span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            tabIndex={-1}
            className="profile-image-picker-input-hidden"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </div>
        {/* <label className="field">
          <span className="field-label">Link type</span>
          <select
            className="input"
            style={{ maxWidth: 280 }}
            title="What opening this banner should navigate to"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
          >
            <option value="">None</option>
            <option value="1">Product</option>
            <option value="2">Vendor</option>
            <option value="3">Category</option>
          </select>
        </label> */}
        {/* {linkType === "1" ? (
          <label className="field">
            <span className="field-label">Product</span>
            <SearchableAsyncSelect
              value={productPick}
              onChange={setProductPick}
              loadOptions={loadProducts}
              placeholder="Search product by title…"
              title="Search and pick one product to link"
            />
          </label>
        ) : null} */}
        {linkType === "2" ? (
          <label className="field">
            <span className="field-label">Vendor</span>
            <SearchableAsyncSelect
              value={vendorPick}
              onChange={setVendorPick}
              loadOptions={loadVendors}
              placeholder="Search vendor…"
              title="Search by vendor name or email"
            />
          </label>
        ) : null}
        {/* {linkType === "3" ? (
          <label className="field">
            <span className="field-label">Category</span>
            <SearchableAsyncSelect
              value={categoryPick}
              onChange={setCategoryPick}
              loadOptions={loadCategories}
              placeholder="Search category…"
              title="Pick one category to link"
            />
          </label>
        ) : null} */}

        <label className="field">
          <span className="field-label">Description *</span>

          <textarea
            className="input"
            rows={4}
            value={description}
            maxLength={100}
            onChange={(e) => setDescription(e.target.value)}
          />

          <small className="muted">{description.length}/100 characters</small>
        </label>

        <label className="field">
          <span className="field-label">Start Date *</span>

          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">End Date *</span>

          <input
            type="date"
            className="input"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="input"
            style={{ maxWidth: 200 }}
            title="Inactive banners are hidden from the storefront"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button type="submit" className="btn primary" title="Save this banner">
          Save
        </button>
      </form>
    </div>
  );
}
