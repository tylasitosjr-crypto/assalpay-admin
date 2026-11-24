import { useEffect, useRef, useState } from "react";
import { MdPhotoCamera } from "react-icons/md";
import { profileImageSrc } from "../../utils/profileImageSrc.js";

/**
 * Avatar preview + camera overlay; click opens file picker.
 * Optional `assistText` renders under the circle (hidden from picker focus).
 */
export default function ProfileImagePicker({
  label = "Profile image",
  assistText,
  existingPath,
  file,
  onFileChange,
  size = 96,
}) {
  const inputRef = useRef(null);
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = objectUrl || profileImageSrc(existingPath);
  const openPicker = () => inputRef.current?.click();

  return (
    <div className="field profile-image-picker-wrap">
      {label ? <span className="field-label">{label}</span> : null}
      <div className="profile-image-picker-row">
        <button
          type="button"
          className="profile-image-picker-hit"
          onClick={openPicker}
          aria-label="Choose profile photo"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
          }}
        >
          <img
            alt=""
            src={src}
            className="profile-image-picker-img"
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid var(--border)",
              display: "block",
            }}
          />
          <span className="profile-image-picker-camera-wrap" aria-hidden>
            <MdPhotoCamera size={18} />
          </span>
        </button>
        {assistText ? (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem", maxWidth: 280 }}>
            {assistText}
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="profile-image-picker-input-hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
