const MEASUREMENT_RE = /^\d+(\s*-\s*\d+)?$/;
export const SIZE_MAX_LENGTH = 50;

export const SIZE_CHART_FIELDS = [
  "sort_order",
  "size",
  "chest_in_inch",
  "chest_in_cm",
  "waist_in_inch",
  "waist_in_cm",
  "hips_in_inch",
  "hips_in_cm",
];

export const MEASUREMENT_FIELDS = SIZE_CHART_FIELDS.filter(
  (k) => k !== "size" && k !== "sort_order",
);

export const SIZE_CHART_LABELS = {
  sort_order: "Sort order",
  size: "Size",
  chest_in_inch: "Chest (inch)",
  chest_in_cm: "Chest (cm)",
  waist_in_inch: "Waist (inch)",
  waist_in_cm: "Waist (cm)",
  hips_in_inch: "Hips (inch)",
  hips_in_cm: "Hips (cm)",
};

export const EMPTY_SIZE_CHART_FORM = Object.fromEntries(
  SIZE_CHART_FIELDS.map((k) => [k, ""]),
);

export function normalizeMeasurement(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s*-\s*/g, "-");
}

export function normalizeSize(value) {
  return String(value ?? "").trim();
}

export function sizeError(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Required";
  if (raw.length > SIZE_MAX_LENGTH) {
    return `Max ${SIZE_MAX_LENGTH} characters`;
  }
  return "";
}

export function measurementError(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Required";
  if (!MEASUREMENT_RE.test(raw)) {
    return "Use a number (e.g. 56) or range (e.g. 56-61 or 56 - 61)";
  }
  return "";
}

export function sortOrderError(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Required";
  if (!/^-?\d+$/.test(raw)) return "Must be a whole number";
  return "";
}

export function validateSizeChartForm(form) {
  const errors = {
    sort_order: sortOrderError(form.sort_order),
    size: sizeError(form.size),
  };
  for (const key of MEASUREMENT_FIELDS) {
    errors[key] = measurementError(form[key]);
  }
  const ok = !Object.values(errors).some(Boolean);
  return { ok, errors };
}

export function normalizeSizeChartForm(form) {
  return {
    sort_order: parseInt(String(form.sort_order).trim(), 10),
    size: normalizeSize(form.size),
    ...Object.fromEntries(
      MEASUREMENT_FIELDS.map((key) => [
        key,
        normalizeMeasurement(form[key]),
      ]),
    ),
  };
}
