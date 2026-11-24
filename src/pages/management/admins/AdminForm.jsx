import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance, unwrap } from "../../../api/axiosInstance.js";
import PhoneField from "../../../components/common/PhoneField.jsx";
import ProfileImagePicker from "../../../components/common/ProfileImagePicker.jsx";
import {
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
} from "../../../constants/passwordRules.js";
import { joinDisplayPhone } from "../../../utils/joinDisplayPhone.js";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function AdminForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !!useMatch({ path: "/management/admins/new", end: true });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [nationalPhone, setNationalPhone] = useState("");
  const [image, setImage] = useState(null);
  const [existingProfileImage, setExistingProfileImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adminType, setAdminType] = useState("");
  const [adminRoleId, setAdminRoleId] = useState("");

  useEffect(() => {
    if (isCreate || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/admin/management/admins/${id}`);
        const row = unwrap(res);
        if (!cancelled) {
          setName(row.name || "");
          setEmail(row.email || "");
          const cc = row.country_code || "";
          const nat = row.phone || "";
          setCountryCode(cc);
          setNationalPhone(String(nat).replace(/\s/g, ""));
          setPhoneDisplay(joinDisplayPhone(cc, nat));
          setExistingProfileImage(row.profile_image || "");
          setAdminType(row.admin_type || "");
          setAdminRoleId(
            row.admin_role_id != null ? String(row.admin_role_id) : "",
          );
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isCreate]);

  const nameErr =
    name && (name.trim().length < 2 || name.trim().length > 100)
      ? "2–100 characters"
      : "";
  const emailErr =
    email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Invalid email" : "";

  const hasPasswordInput = password.length > 0;
  const pwdErr =
    hasPasswordInput &&
    (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN)
      ? `Password must be ${PASSWORD_MIN_LEN}–${PASSWORD_MAX_LEN} characters`
      : "";
  const confirmEmptyErr =
    hasPasswordInput && confirm.trim() === ""
      ? "Confirm password is required when setting a password"
      : "";
  const matchErr =
    confirm.length > 0 && confirm !== password ? "Passwords do not match" : "";

  const submit = async (e) => {
    e.preventDefault();
    if (
      nameErr ||
      emailErr ||
      pwdErr ||
      confirmEmptyErr ||
      matchErr ||
      !name.trim() ||
      !email.trim()
    ) {
      toast.error("Fix validation errors");
      return;
    }
    if (isCreate) {
      if (!password.trim()) {
        toast.error("Password is required");
        return;
      }
      if (!confirm.trim()) {
        toast.error("Confirm password");
        return;
      }
      if (password !== confirm) {
        toast.error("Passwords do not match");
        return;
      }
    } else if (hasPasswordInput) {
      if (!confirm.trim()) {
        toast.error("Confirm password");
        return;
      }
      if (password !== confirm) {
        toast.error("Passwords do not match");
        return;
      }
    }
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      fd.append("country_code", countryCode.trim());
      fd.append("phone", nationalPhone || "");
      if (adminType) fd.append("admin_type", adminType);
      else if (!isCreate) fd.append("admin_type", "");
      if (adminRoleId) fd.append("admin_role_id", adminRoleId);
      else if (!isCreate) fd.append("admin_role_id", "");
      if (password) fd.append("password", password);
      if (image) fd.append("profile_image", image);

      if (isCreate) {
        const res = await axiosInstance.post("/admin/management/admins", fd);
        const row = unwrap(res);
        toast.success("Created");
        navigate(`/management/admins/${row.id}`);
      } else {
        const res = await axiosInstance.put(
          `/admin/management/admins/${id}`,
          fd,
        );
        unwrap(res);
        toast.success("Saved");
        navigate(`/management/admins/${id}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Link className="btn" to="/management/admins">
        ← List
      </Link>
      <h2 style={{ marginTop: "1rem" }}>
        {isCreate ? "New admin" : "Edit admin"}
      </h2>
      <form
        className="stack"
        style={{ gap: "1rem", marginTop: "1rem" }}
        onSubmit={submit}
      >
        <ProfileImagePicker
          assistText="Optional. Click photo or icon to upload."
          existingPath={existingProfileImage || undefined}
          file={image}
          onFileChange={setImage}
          size={88}
        />
        <label className="field">
          <span className="field-label">Name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {nameErr && <span className="field-error">{nameErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailErr && <span className="field-error">{emailErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">Admin type (RBAC preset)</span>
          <select
            className="input"
            value={adminType}
            onChange={(e) => setAdminType(e.target.value)}
          >
            <option value="">— Full legacy admin —</option>
            <option value="finance_admin">Finance</option>
            <option value="operations_admin">Operations</option>
            <option value="support_admin">Support</option>
            <option value="content_admin">Content</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">admin_role_id (optional DB role)</span>
          <input
            className="input"
            inputMode="numeric"
            value={adminRoleId}
            onChange={(e) => setAdminRoleId(e.target.value.replace(/\D/g, ""))}
            placeholder="FK to admin_roles"
          />
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
          <span className="field-label">
            Password {isCreate ? "(required)" : "(leave blank to keep)"}
          </span>

          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              className="input password-input"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isCreate}
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {pwdErr && <span className="field-error">{pwdErr}</span>}
        </label>
        <label className="field">
          <span className="field-label">
            Confirm password {isCreate ? "(required)" : ""}
          </span>
          <div className="password-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              className="input password-input"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required={isCreate}
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirm((prev) => !prev)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {confirmEmptyErr ? (
            <span className="field-error">{confirmEmptyErr}</span>
          ) : matchErr ? (
            <span className="field-error">{matchErr}</span>
          ) : null}
        </label>
        <button type="submit" className="btn primary">
          Save
        </button>
      </form>

      <style>{`
        .password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  width: 100%;
  padding-right: 42px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 16px;
}

.toggle-password:hover {
  color: #111;
}
      `}</style>
    </div>
  );
}
