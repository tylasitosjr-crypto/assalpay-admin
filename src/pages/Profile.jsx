import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import PhoneField from "../components/common/PhoneField.jsx";
import ProfileImagePicker from "../components/common/ProfileImagePicker.jsx";
import { joinDisplayPhone } from "../utils/joinDisplayPhone.js";
import { formatUsd } from "../utils/formatUsd.js";

export default function Profile() {
  const { user, refreshMe, isSuperAdmin } = useAuth();
  const [name, setName] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [nationalPhone, setNationalPhone] = useState("");
  const [commissionPct, setCommissionPct] = useState("");
  const [commissionUserPct, setCommissionUserPct] = useState("");

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      const cc = user.country_code || "";
      const nat = user.phone || "";
      setCountryCode(cc);
      setNationalPhone(String(nat).replace(/\s/g, ""));
      setPhoneDisplay(joinDisplayPhone(cc, nat));
      const cp = user.commission_percentage;
      setCommissionPct(
        cp !== null && cp !== undefined && String(cp) !== "" ? String(cp) : "0",
      );
      const cpu = user.commission_percentage_user;
      setCommissionUserPct(
        cpu !== null && cpu !== undefined && String(cpu) !== ""
          ? String(cpu)
          : "0",
      );
    }
  }, [user]);

  const nameErr =
    name && (name.trim().length < 2 || name.trim().length > 100)
      ? "2–100 characters"
      : "";

  const commissionErr = useMemo(() => {
    if (!isSuperAdmin) return "";
    const s = String(commissionPct).trim();
    if (s === "") return "Required";
    const n = Number(s);
    if (Number.isNaN(n)) return "Enter a valid number";
    if (n < 0 || n > 100) return "Must be between 0 and 100";
    return "";
  }, [commissionPct, isSuperAdmin]);

  const commissionUserErr = useMemo(() => {
    if (!isSuperAdmin) return "";
    const s = String(commissionUserPct).trim();
    if (s === "") return "Required";
    const n = Number(s);
    if (Number.isNaN(n)) return "Enter a valid number";
    if (n < 0 || n > 100) return "Must be between 0 and 100";
    return "";
  }, [commissionUserPct, isSuperAdmin]);

  const submit = async (e) => {
    e.preventDefault();
    if (nameErr || commissionErr || commissionUserErr) {
      toast.error("Fix validation errors");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (countryCode.trim()) {
        fd.append("country_code", countryCode.trim());
      } else {
        fd.append("country_code", "");
      }
      fd.append("phone", nationalPhone || "");
      if (isSuperAdmin) {
        fd.append("commission_percentage", String(commissionPct).trim());
        fd.append("commission_percentage_user", String(commissionUserPct).trim());
      }
      if (file) fd.append("profile_image", file);
      const res = await axiosInstance.put("/admin/profile", fd);
      unwrap(res);
      toast.success("Profile saved");
      await refreshMe();
      setFile(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>Your profile</h2>
      {isSuperAdmin ? (
        <p>
          <strong>Total revenue:</strong> {formatUsd(user?.total_revenue)}
        </p>
      ) : null}
      <form className="stack" style={{ gap: "1rem" }} onSubmit={submit}>
        <ProfileImagePicker
          assistText="Click the photo or camera icon to choose a new profile image."
          existingPath={user?.profile_image}
          file={file}
          onFileChange={setFile}
          size={88}
        />
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {nameErr && <span className="field-error">{nameErr}</span>}
        </label>
        <PhoneField
          label="Phone"
          value={phoneDisplay}
          onChange={setPhoneDisplay}
          onSplitChange={({ countryCode: cc, nationalNumber: nat }) => {
            setCountryCode(cc);
            setNationalPhone(nat);
          }}
        />
        <label className="field">
          <span className="field-label">Email (read only)</span>
          <input className="input" value={user?.email || ""} disabled />
        </label>
        {isSuperAdmin ? (
          <>
          <label className="field">
            <span className="field-label">Commission percentage (%) (from vendor if no category commission added)</span>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
            />
            {commissionErr && (
              <span className="field-error">{commissionErr}</span>
            )}
          </label>
          <label className="field">
            <span className="field-label">Commission percentage (%) (from user)</span>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              value={commissionUserPct}
              onChange={(e) => setCommissionUserPct(e.target.value)}
            />
            {commissionUserErr && (
              <span className="field-error">{commissionUserErr}</span>
            )}
          </label>
          </>
        ) : null}
        <button type="submit" className="btn primary" disabled={busy}>
          Save changes
        </button>
      </form>
    </div>
  );
}
