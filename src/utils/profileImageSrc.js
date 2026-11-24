import defaultUser from "../assets/user.png";
import { mediaUrl } from "./mediaUrl.js";

/** Resolved URL for profile/avatar uploads, or bundled `user.png` when missing. */
export function profileImageSrc(mediaPathFromServer) {
  if (!mediaPathFromServer || typeof mediaPathFromServer !== "string") {
    return defaultUser;
  }
  const trimmed = mediaPathFromServer.trim();
  if (!trimmed) return defaultUser;
  return mediaUrl(trimmed) || defaultUser;
}

/** Prefer vendor `logo`, else linked user profile image. */
export function vendorAvatarSrc(vendorLogo, accountProfileImage) {
  const primary =
    vendorLogo && String(vendorLogo).trim()
      ? String(vendorLogo).trim()
      : accountProfileImage && String(accountProfileImage).trim()
        ? String(accountProfileImage).trim()
        : "";
  return profileImageSrc(primary || null);
}
