const ADMIN_TYPE_LABELS = {
  finance_admin: "Finance admin",
  operations_admin: "Operations admin",
  support_admin: "Support admin",
  content_admin: "Content admin",
};

/** @param {string | null | undefined} adminType */
export function formatAdminTypeLabel(adminType) {
  if (adminType == null || !String(adminType).trim()) return "—";
  const key = String(adminType).trim();
  if (ADMIN_TYPE_LABELS[key]) return ADMIN_TYPE_LABELS[key];
  return key.replace(/_/g, " ");
}

/**
 * @param {{ admin_type?: string | null, admin_role_id?: number | null }} row
 */
export function formatAdminSubtypeLine(row) {
  if (!row) return "—";
  if (row.admin_role_id) return "Custom role";
  return formatAdminTypeLabel(row.admin_type);
}
