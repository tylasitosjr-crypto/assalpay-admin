import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdPhotoCamera } from "react-icons/md";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import SearchableAsyncSelect from "../../components/common/SearchableAsyncSelect.jsx";
import { mediaUrl } from "../../utils/mediaUrl.js";
import { confirmAction } from "../../utils/swalConfirm.js";
import { formatUsd } from "../../utils/formatUsd.js";

const FLASH_PAGE_SIZE = 15;

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultCampaignDates() {
  const s = new Date();
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return { starts: toDatetimeLocal(s), ends: toDatetimeLocal(e) };
}

export default function CampaignsFlash() {
  const [campaigns, setCampaigns] = useState({ list: [], meta: null });
  const [flash, setFlash] = useState({ list: [], meta: null });
  const [flashPage, setFlashPage] = useState(1);
  const [campSearchInput, setCampSearchInput] = useState("");
  const [campSearch, setCampSearch] = useState("");
  const [campPage, setCampPage] = useState(1);

  const [campaignEditingId, setCampaignEditingId] = useState(null);
  const [campTitle, setCampTitle] = useState("");
  const [campSlug, setCampSlug] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [campStarts, setCampStarts] = useState("");
  const [campEnds, setCampEnds] = useState("");
  const [campImageFile, setCampImageFile] = useState(null);
  const [campExistingImage, setCampExistingImage] = useState("");
  const [campImagePreviewUrl, setCampImagePreviewUrl] = useState("");
  const campFileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [vendorPick, setVendorPick] = useState(null);
  const [productPick, setProductPick] = useState(null);
  const [campaignPick, setCampaignPick] = useState(null);
  const [flashPrice, setFlashPrice] = useState("");
  const [qtyLimit, setQtyLimit] = useState("");

  const hasCampaign = (campaigns.list || []).length > 0;
  const canAddCampaign = !hasCampaign || campaignEditingId;

  const refreshCampaigns = useCallback(async () => {
    const res = await axiosInstance.get("/admin/campaigns", {
      params: {
        page: campPage,
        limit: FLASH_PAGE_SIZE,
        search: campSearch || undefined,
      },
    });
    setCampaigns(unwrap(res));
  }, [campPage, campSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = campSearchInput.trim();
      setCampSearch((prev) => {
        if (prev !== next) setCampPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [campSearchInput]);

  useEffect(() => {
    refreshCampaigns().catch((e) => toast.error(e.message));
  }, [refreshCampaigns]);

  useEffect(() => {
    if (!campImageFile) {
      setCampImagePreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(campImageFile);
    setCampImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [campImageFile]);

  const campImageDisplaySrc = useMemo(() => {
    if (campImagePreviewUrl) return campImagePreviewUrl;
    if (campExistingImage) return mediaUrl(campExistingImage);
    return "";
  }, [campImagePreviewUrl, campExistingImage]);

  const loadFlashList = useCallback(async () => {
    const res = await axiosInstance.get("/admin/flash-sales", {
      params: { page: flashPage, limit: FLASH_PAGE_SIZE },
    });
    setFlash(unwrap(res));
  }, [flashPage]);

  useEffect(() => {
    loadFlashList().catch((e) => toast.error(e.message));
  }, [loadFlashList]);

  const applyCampaignDates = useCallback((campaign) => {
    if (!campaign) return;
    setCampaignPick({
      id: campaign.id,
      label: `${campaign.name} (${campaign.slug})`,
      starts_at: campaign.starts_at,
      ends_at: campaign.ends_at,
    });
  }, []);

  useEffect(() => {
    const list = campaigns.list || [];
    if (list.length === 1 && !editingId) {
      applyCampaignDates(list[0]);
    }
    if (campaignPick?.id) {
      const match = list.find((c) => c.id === campaignPick.id);
      if (
        match &&
        (match.starts_at !== campaignPick.starts_at ||
          match.ends_at !== campaignPick.ends_at)
      ) {
        setCampaignPick({
          id: match.id,
          label: `${match.name} (${match.slug})`,
          starts_at: match.starts_at,
          ends_at: match.ends_at,
        });
      }
    }
  }, [campaigns.list, editingId, applyCampaignDates, campaignPick?.id, campaignPick?.starts_at, campaignPick?.ends_at]);

  const resetCampaignForm = () => {
    setCampaignEditingId(null);
    setCampTitle("");
    setCampSlug("");
    setCampDesc("");
    const { starts, ends } = defaultCampaignDates();
    setCampStarts(starts);
    setCampEnds(ends);
    setCampImageFile(null);
    setCampExistingImage("");
  };

  const startEditCampaign = async (row) => {
    try {
      const res = await axiosInstance.get(`/admin/campaigns/${row.id}`);
      const c = unwrap(res);
      setCampaignEditingId(c.id);
      setCampTitle(c.name || "");
      setCampSlug(c.slug || "");
      setCampDesc(c.description ?? "");
      setCampStarts(toDatetimeLocal(c.starts_at));
      setCampEnds(toDatetimeLocal(c.ends_at));
      setCampImageFile(null);
      setCampExistingImage(c.image || "");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitCampaign = async (e) => {
    e.preventDefault();
    if (!campTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!campaignEditingId && !campImageFile && !campExistingImage) {
      toast.error("Image is required for a new campaign");
      return;
    }
    if (!campStarts || !campEnds) {
      toast.error("Start and end dates are required");
      return;
    }
    const fd = new FormData();
    fd.append("name", campTitle.trim());
    if (campSlug.trim()) fd.append("slug", campSlug.trim());
    fd.append("description", campDesc);
    fd.append("starts_at", new Date(campStarts).toISOString());
    fd.append("ends_at", new Date(campEnds).toISOString());
    if (campImageFile) fd.append("image", campImageFile);

    try {
      if (campaignEditingId) {
        await axiosInstance.put(`/admin/campaigns/${campaignEditingId}`, fd);
        toast.success("Campaign updated");
      } else {
        await axiosInstance.post("/admin/campaigns", fd);
        toast.success("Campaign created");
      }
      resetCampaignForm();
      await refreshCampaigns();
      loadFlashList();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeCampaign = async (row) => {
    if (
      !(await confirmAction({
        title: "Delete this campaign?",
        text: `${row.name} — flash sales linked to it may need a new campaign.`,
      }))
    ) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/campaigns/${row.id}`);
      toast.success("Campaign deleted");
      if (campaignEditingId === row.id) resetCampaignForm();
      await refreshCampaigns();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setVendorPick(null);
    setProductPick(null);
    setFlashPrice("");
    setQtyLimit("");
    const list = campaigns.list || [];
    if (list.length === 1) {
      applyCampaignDates(list[0]);
    } else {
      setCampaignPick(null);
    }
  };

  const loadVendorsPage = async (q, page) => {
    const res = await axiosInstance.get("/admin/vendors", {
      params: {
        search: q.trim() || undefined,
        page,
        limit: FLASH_PAGE_SIZE,
      },
    });
    const body = unwrap(res);
    const meta = body.meta;
    const list = body.list || [];
    return {
      options: list.map((v) => ({
        id: v.id,
        label: `${v.name}${v.email ? ` · ${v.email}` : ""} (#${v.id})`,
      })),
      hasMore: meta && meta.currentPage < meta.totalPages,
    };
  };

  const loadProductsPage = useCallback(
    async (q, page) => {
      if (!vendorPick?.id) {
        return { options: [], hasMore: false };
      }
      const params = {
        vendor_id: vendorPick.id,
        search: q.trim() || undefined,
        page,
        limit: FLASH_PAGE_SIZE,
      };
      if (campaignPick?.id) {
        params.exclude_in_campaign_id = campaignPick.id;
        if (editingId && productPick?.id) {
          params.allow_product_id = productPick.id;
        }
      }
      const res = await axiosInstance.get("/admin/products", { params });
      const body = unwrap(res);
      const meta = body.meta;
      const list = body.list || [];
      return {
        options: list.map((p) => ({
          id: p.id,
          label: `${p.title} · ${formatUsd(p.price)} (#${p.id})`,
          price: Number(p.price),
        })),
        hasMore: meta && meta.currentPage < meta.totalPages,
      };
    },
    [vendorPick?.id, campaignPick?.id, editingId, productPick?.id],
  );

  const loadCampaignsPage = async (q, page) => {
    const res = await axiosInstance.get("/admin/campaigns", {
      params: {
        search: q.trim() || undefined,
        page,
        limit: FLASH_PAGE_SIZE,
      },
    });
    const body = unwrap(res);
    const meta = body.meta;
    const list = body.list || [];
    return {
      options: list.map((c) => ({
        id: c.id,
        label: `${c.name} (${c.slug})`,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
      })),
      hasMore: meta && meta.currentPage < meta.totalPages,
    };
  };

  const handleCampaignPick = (c) => {
    if (!c) {
      setCampaignPick(null);
      setProductPick(null);
      return;
    }
    setCampaignPick(c);
    setProductPick(null);
  };

  const startEdit = async (row) => {
    try {
      const res = await axiosInstance.get(`/admin/flash-sales/${row.id}`);
      const { flash } = unwrap(res);
      setEditingId(flash.id);
      const v = flash.flash_product?.product_vendor;
      const p = flash.flash_product;
      const c = flash.flash_campaign;
      setVendorPick(
        v
          ? {
              id: v.id,
              label: `${v.name}${v.email ? ` · ${v.email}` : ""} (#${v.id})`,
            }
          : p?.vendor_id
            ? { id: p.vendor_id, label: `Vendor #${p.vendor_id}` }
            : null,
      );
      setProductPick(
        p
          ? {
              id: p.id,
              label: `${p.title} · ${formatUsd(p.price)} (#${p.id})`,
              price: Number(p.price),
            }
          : null,
      );
      setCampaignPick(
        c
          ? {
              id: c.id,
              label: `${c.name} (${c.slug})`,
              starts_at: c.starts_at,
              ends_at: c.ends_at,
            }
          : null,
      );
      setFlashPrice(String(flash.flash_price ?? ""));
      setQtyLimit(String(flash.quantity_limit ?? ""));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitFlash = async (e) => {
    e.preventDefault();
    if (!vendorPick?.id || !productPick?.id || !campaignPick?.id) {
      toast.error("Select vendor, product, and campaign");
      return;
    }
    if (!campaignPick.starts_at || !campaignPick.ends_at) {
      toast.error("Selected campaign has no start/end dates");
      return;
    }
    const body = {
      vendor_user_id: vendorPick.id,
      product_id: productPick.id,
      campaign_id: campaignPick.id,
      flash_price: parseFloat(String(flashPrice).replace(",", ".")),
      quantity_limit: parseInt(String(qtyLimit), 10),
    };
    try {
      if (editingId) {
        await axiosInstance.put(`/admin/flash-sales/${editingId}`, body);
        toast.success("Flash sale updated");
      } else {
        await axiosInstance.post("/admin/flash-sales", body);
        toast.success("Flash sale created");
      }
      resetForm();
      loadFlashList();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeFlash = async (row) => {
    if (
      !(await confirmAction({
        title: "Delete this flash sale?",
        text: `${row.flash_product?.title ?? row.product_id}`,
      }))
    ) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/flash-sales/${row.id}`);
      toast.success("Deleted");
      loadFlashList();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const origLabel =
    productPick?.price != null && !Number.isNaN(productPick.price)
      ? formatUsd(productPick.price)
      : "—";

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <div>
        <h2 style={{ margin: 0 }}>Campaigns</h2>
        <p className="muted">
          Create one campaign with a title, image, and date window. Flash sale products inherit the
          campaign dates automatically.
        </p>

        <label className="field" style={{ maxWidth: 360, marginTop: "0.5rem" }}>
          <span className="field-label">Search campaigns</span>
          <div className="rowflex" style={{ gap: "0.35rem" }}>
            <input
              className="input"
              placeholder="Name or slug…"
              value={campSearchInput}
              onChange={(e) => setCampSearchInput(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              onClick={() => refreshCampaigns().catch((e) => toast.error(e.message))}
            >
              Refresh
            </button>
          </div>
        </label>

        {hasCampaign && !campaignEditingId ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            A campaign already exists. Edit it below or delete it before creating a new one.
          </p>
        ) : null}

        {canAddCampaign ? (
        <div className="card stack" style={{ gap: "0.75rem", marginTop: "0.75rem", maxWidth: 560 }}>
          <h3 style={{ margin: 0 }}>
            {campaignEditingId ? `Edit campaign #${campaignEditingId}` : "Add campaign"}
          </h3>
          <form className="stack" style={{ gap: "0.65rem" }} onSubmit={submitCampaign}>
            <label className="field">
              <span className="field-label">Title</span>
              <input
                className="input"
                required
                value={campTitle}
                onChange={(e) => setCampTitle(e.target.value)}
                placeholder="Campaign name"
              />
            </label>
            <label className="field">
              <span className="field-label">Slug (optional)</span>
              <input
                className="input"
                value={campSlug}
                onChange={(e) => setCampSlug(e.target.value)}
                placeholder="Leave blank to generate from title"
              />
            </label>
            <div className="field">
              <span className="field-label">
                Image {campaignEditingId ? "(optional — keep current if unchanged)" : "(required)"}
              </span>
              <input
                ref={campFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setCampImageFile(e.target.files?.[0] || null)}
              />
              <button type="button" className="btn" onClick={() => campFileInputRef.current?.click()}>
                <span className="rowflex" style={{ gap: "0.35rem", alignItems: "center" }}>
                  <MdPhotoCamera size={18} aria-hidden />
                  Choose image
                </span>
              </button>
              {campImageDisplaySrc ? (
                <img
                  alt=""
                  src={campImageDisplaySrc}
                  style={{
                    marginTop: "0.5rem",
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: 160,
                    objectFit: "contain",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              ) : null}
            </div>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="input"
                rows={3}
                value={campDesc}
                onChange={(e) => setCampDesc(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Start</span>
              <input
                className="input"
                type="datetime-local"
                required
                value={campStarts}
                onChange={(e) => setCampStarts(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">End</span>
              <input
                className="input"
                type="datetime-local"
                required
                value={campEnds}
                title="Must be after start"
                onChange={(e) => setCampEnds(e.target.value)}
              />
            </label>
            <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn primary">
                {campaignEditingId ? "Save campaign" : "Create campaign"}
              </button>
              {campaignEditingId ? (
                <button type="button" className="btn" onClick={resetCampaignForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </div>
        ) : null}

        <div className="card table-wrap" style={{ marginTop: "0.75rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 72 }}>Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Starts</th>
                <th>Ends</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(campaigns.list || []).map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.image ? (
                      <img
                        alt=""
                        src={mediaUrl(r.image)}
                        style={{
                          width: 52,
                          height: 52,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{r.name}</td>
                  <td>{r.slug}</td>
                  <td>{r.starts_at ? new Date(r.starts_at).toLocaleString() : "—"}</td>
                  <td>{r.ends_at ? new Date(r.ends_at).toLocaleString() : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button type="button" className="btn" onClick={() => startEditCampaign(r)}>
                      Edit
                    </button>{" "}
                    <button type="button" className="btn danger" onClick={() => removeCampaign(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="rowflex muted"
          style={{
            marginTop: "0.5rem",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span>
            Page {campaigns.meta?.currentPage ?? 1} of {campaigns.meta?.totalPages ?? 1} ·{" "}
            {campaigns.meta?.total ?? 0} campaigns
          </span>
          <div className="rowflex" style={{ gap: "0.35rem" }}>
            <button
              type="button"
              className="btn"
              disabled={(campaigns.meta?.currentPage ?? 1) <= 1}
              onClick={() => setCampPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn"
              disabled={
                (campaigns.meta?.currentPage ?? 1) >= (campaigns.meta?.totalPages ?? 1)
              }
              onClick={() => setCampPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ margin: 0 }}>Flash sales</h2>
        <p className="muted">
          Limited-time offers: discounted price must be below the product&apos;s regular price,
          quantity limit &gt; 0. Dates are set on the campaign and apply to all products in it.
        </p>

        <div className="card stack" style={{ gap: "0.75rem", marginTop: "0.75rem", maxWidth: 560 }}>
          <h3 style={{ margin: 0 }}>{editingId ? `Edit #${editingId}` : "Add flash sale"}</h3>
          <form className="stack" style={{ gap: "0.65rem" }} onSubmit={submitFlash}>
            <label className="field">
              <span className="field-label">Vendor</span>
              <SearchableAsyncSelect
                value={vendorPick}
                onChange={(v) => {
                  setVendorPick(v);
                  setProductPick(null);
                }}
                loadOptionsPage={loadVendorsPage}
                placeholder="Search name or email…"
                title="Search vendors with pagination (Load more)"
              />
            </label>
            <label className="field">
              <span className="field-label">Campaign</span>
              <SearchableAsyncSelect
                value={campaignPick}
                onChange={handleCampaignPick}
                loadOptionsPage={loadCampaignsPage}
                placeholder="Search campaigns…"
                title="Campaign this flash sale belongs to"
                disabled={hasCampaign && (campaigns.list || []).length === 1}
              />
            </label>
            {campaignPick?.starts_at && campaignPick?.ends_at ? (
              <div className="field">
                <span className="field-label">Campaign window (read-only)</span>
                <div className="stack" style={{ gap: "0.35rem" }}>
                  <input
                    className="input"
                    type="datetime-local"
                    value={toDatetimeLocal(campaignPick.starts_at)}
                    readOnly
                    disabled
                  />
                  <input
                    className="input"
                    type="datetime-local"
                    value={toDatetimeLocal(campaignPick.ends_at)}
                    readOnly
                    disabled
                  />
                </div>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  Update dates on the campaign — all linked products sync automatically.
                </span>
              </div>
            ) : null}
            <label className="field">
              <span className="field-label">Product</span>
              <SearchableAsyncSelect
                key={`flash-product-${vendorPick?.id}-${campaignPick?.id}-${editingId || "new"}`}
                value={productPick}
                onChange={setProductPick}
                loadOptionsPage={loadProductsPage}
                disabled={!vendorPick?.id || !campaignPick?.id}
                placeholder={
                  !vendorPick?.id
                    ? "Select a vendor first"
                    : !campaignPick?.id
                      ? "Select a campaign first"
                      : "Search this vendor's products…"
                }
                title="Products not already in this campaign"
              />
            </label>
            <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
              Regular price: <strong>{origLabel}</strong>
            </p>
            <label className="field">
              <span className="field-label">Discounted price</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                required
                value={flashPrice}
                title="Must be less than the product regular price"
                onChange={(e) => setFlashPrice(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Quantity limit</span>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                required
                value={qtyLimit}
                title="Must be greater than 0"
                onChange={(e) => setQtyLimit(e.target.value)}
              />
            </label>
            <div className="rowflex" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn primary">
                {editingId ? "Save changes" : "Create"}
              </button>
              {editingId ? (
                <button type="button" className="btn" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card table-wrap" style={{ marginTop: "1rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Vendor</th>
                <th>Campaign</th>
                <th>Flash price</th>
                <th>Regular</th>
                <th>Limit</th>
                <th>Window</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(flash.list || []).map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.flash_product?.title || r.product_id}</td>
                  <td>
                    {r.flash_product?.product_vendor?.name ?? "—"}
                    <span className="muted" style={{ display: "block", fontSize: "0.8rem" }}>
                      {r.flash_product?.product_vendor?.email ?? ""}
                    </span>
                  </td>
                  <td>{r.flash_campaign?.name ?? "—"}</td>
                  <td>{r.flash_price}</td>
                  <td>{r.flash_product?.price ?? "—"}</td>
                  <td>{r.quantity_limit ?? "—"}</td>
                  <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    {r.starts_at ? new Date(r.starts_at).toLocaleString() : "—"}
                    <br />
                    <span className="muted">
                      {r.ends_at ? new Date(r.ends_at).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button type="button" className="btn" onClick={() => startEdit(r)}>
                      Edit
                    </button>{" "}
                    <button type="button" className="btn danger" onClick={() => removeFlash(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="rowflex muted"
          style={{ marginTop: "0.5rem", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}
        >
          <span>
            Page {flash.meta?.currentPage ?? 1} of {flash.meta?.totalPages ?? 1} ·{" "}
            {flash.meta?.total ?? 0} flash sales
          </span>
          <div className="rowflex" style={{ gap: "0.35rem" }}>
            <button
              type="button"
              className="btn"
              disabled={(flash.meta?.currentPage ?? 1) <= 1}
              onClick={() => setFlashPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn"
              disabled={
                (flash.meta?.currentPage ?? 1) >= (flash.meta?.totalPages ?? 1)
              }
              onClick={() => setFlashPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
