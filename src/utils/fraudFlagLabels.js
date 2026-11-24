export const FLAG_TYPE_LABELS = {
  failed_payments: "Multiple failed payments",
  shared_device_token: "Multiple accounts (shared device)",
  refund_spike: "Refund request spike",
};

export const FLAG_TYPE_DESCRIPTIONS = {
  failed_payments: "User has 3 or more failed payment transactions.",
  shared_device_token:
    "Two or more user accounts share the same device token (possible multi-account abuse).",
  refund_spike: "User has 4 or more approved refund requests in the last 14 days.",
};

export const STATUS_LABELS = {
  open: "Open",
  under_review: "Under review",
  dismissed: "Dismissed",
  confirmed: "Confirmed",
};

export function formatFlagDetails(flag) {
  const d = flag?.details || {};
  switch (flag?.flag_type) {
    case "failed_payments":
      return `${d.failed_count ?? "—"} failed payment(s)`;
    case "shared_device_token":
      return `${d.account_count ?? d.user_ids?.length ?? "—"} linked account(s) · token …${d.token_suffix ?? "?"}`;
    case "refund_spike":
      return `${d.approved_refunds_14d ?? "—"} approved refund(s) in 14 days`;
    default:
      return d ? JSON.stringify(d) : "—";
  }
}

export function severityClass(severity) {
  if (severity === "high") return "badge danger";
  if (severity === "medium") return "badge";
  return "badge";
}

export function statusClass(status) {
  if (status === "open") return "badge danger";
  if (status === "under_review") return "badge";
  if (status === "confirmed") return "badge danger";
  return "badge";
}
