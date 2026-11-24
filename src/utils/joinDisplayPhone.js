/** Build E.164-style value for PhoneInput from stored country_code + national phone */
export function joinDisplayPhone(country_code, national) {
  const cc = (country_code || "").trim();
  const n = String(national || "").replace(/\s/g, "");
  if (!n && !cc) return "";
  const prefix = cc.startsWith("+")
    ? cc
    : cc
      ? `+${cc.replace(/^\+/, "")}`
      : "";
  return `${prefix}${n.replace(/\D/g, "")}`;
}
