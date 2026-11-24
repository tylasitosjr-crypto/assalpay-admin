import { useEffect, useState } from "react";
import { Link, useNavigate, useMatch, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../api/axiosInstance.js";
import {
  EMPTY_SIZE_CHART_FORM,
  SIZE_CHART_FIELDS,
  SIZE_CHART_LABELS,
  SIZE_MAX_LENGTH,
  normalizeSizeChartForm,
  validateSizeChartForm,
} from "../../utils/sizeChartValidators.js";

const MEASUREMENT_GROUPS = [
  { title: "Chest", inch: "chest_in_inch", cm: "chest_in_cm" },
  { title: "Waist", inch: "waist_in_inch", cm: "waist_in_cm" },
  { title: "Hips", inch: "hips_in_inch", cm: "hips_in_cm" },
];

export default function SizeChartForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !!useMatch({ path: "/size-chart/new", end: true });
  const [form, setForm] = useState(EMPTY_SIZE_CHART_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/size-chart/${id}`);
        const row = unwrap(res);
        if (!cancelled) {
          setForm(
            Object.fromEntries(
              SIZE_CHART_FIELDS.map((key) => [
                key,
                key === "sort_order"
                  ? row[key] != null && row[key] !== ""
                    ? String(row[key])
                    : ""
                  : row[key] || "",
              ]),
            ),
          );
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const blur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const { errors: next } = validateSizeChartForm(form);
    setErrors(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    const { ok, errors: next } = validateSizeChartForm(form);
    setErrors(next);
    setTouched(Object.fromEntries(SIZE_CHART_FIELDS.map((k) => [k, true])));
    if (!ok) {
      toast.error("Fix validation errors");
      return;
    }
    const body = normalizeSizeChartForm(form);
    try {
      if (isCreate) {
        const res = await axiosInstance.post("/admin/size-chart", body);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/size-chart/${row.id}`);
      } else {
        const res = await axiosInstance.put(`/admin/size-chart/${id}`, body);
        unwrap(res);
        toast.success("Saved");
        navigate(`/size-chart/${id}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderField = (
    key,
    { placeholder, maxLength, type = "text", step } = {},
  ) => (
    <label key={key} className="field">
      <span className="field-label">{SIZE_CHART_LABELS[key]}</span>
      <input
        className="input"
        type={type}
        step={step}
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
        onBlur={() => blur(key)}
        required
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {touched[key] && errors[key] && (
        <span className="field-error">{errors[key]}</span>
      )}
    </label>
  );

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <Link className="btn" to="/size-chart">
        ← Size chart
      </Link>
      <h2 style={{ marginTop: "1rem" }}>
        {isCreate ? "New size chart row" : "Edit size chart row"}
      </h2>
      <form
        className="stack"
        style={{ gap: "1rem", marginTop: "1rem" }}
        onSubmit={submit}
      >
        {renderField("sort_order", {
          type: "number",
          step: "1",
          placeholder: "e.g. 1",
        })}
        {renderField("size", {
          placeholder: "e.g. S, M, L, XL",
          maxLength: SIZE_MAX_LENGTH,
        })}
        {MEASUREMENT_GROUPS.map(({ title, inch, cm }) => (
          <fieldset
            key={title}
            style={{
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              margin: 0,
            }}
          >
            <legend style={{ fontWeight: 600, padding: "0 0.25rem" }}>
              {title}
            </legend>
            <div
              className="rowflex"
              style={{ gap: "1rem", flexWrap: "wrap" }}
            >
              <div style={{ flex: "1 1 200px" }}>
                {renderField(inch, { placeholder: "e.g. 36 or 36-38" })}
              </div>
              <div style={{ flex: "1 1 200px" }}>
                {renderField(cm, { placeholder: "e.g. 91 or 91-97" })}
              </div>
            </div>
          </fieldset>
        ))}
        <button type="submit" className="btn primary">
          Save
        </button>
      </form>
    </div>
  );
}
