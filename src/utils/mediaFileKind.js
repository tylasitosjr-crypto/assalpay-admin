import { mediaUrl } from "./mediaUrl.js";

/** @returns {"none"|"image"|"pdf"|"file"} */
export function mediaFileKind(path) {
  if (!path || typeof path !== "string") return "none";
  const lower = path.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(lower)) return "image";
  if (/\.pdf$/i.test(lower)) return "pdf";
  return "file";
}

export function mediaFileUrl(path) {
  return mediaUrl(path);
}
