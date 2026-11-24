/** Public paths like `images/x.jpg` served from API origin */
export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    window.location.origin;
  const p = String(path).replace(/^\//, "");
  return `${base}/${p}`;
}
