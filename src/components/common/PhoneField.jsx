import { PhoneInput, removeDialCode } from "react-international-phone";
import "react-international-phone/style.css";

function deriveCountryAndNational(fullPhone, meta) {
  if (!fullPhone || !fullPhone.replace(/\D/g, "")) {
    return { countryCode: "", nationalNumber: "" };
  }
  const dial = meta?.country?.dialCode;
  if (dial == null || dial === "") {
    return {
      countryCode: "",
      nationalNumber: fullPhone.replace(/\D/g, ""),
    };
  }
  const dialStr = String(dial);
  const nationalRaw = removeDialCode({
    phone: fullPhone,
    dialCode: dialStr,
    prefix: "+",
    charAfterDialCode: " ",
  });
  return {
    countryCode: `+${dialStr}`,
    nationalNumber: nationalRaw.replace(/\D/g, ""),
  };
}

export default function PhoneField({
  label,
  value,
  onChange,
  onSplitChange,
  disabled,
  error,
}) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <PhoneInput
        defaultCountry="dj"
        value={value || ""}
        onChange={(phone, meta) => {
          onChange?.(phone);
          if (onSplitChange) {
            onSplitChange(deriveCountryAndNational(phone, meta));
          }
        }}
        disabled={disabled}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
