import { useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { axiosInstance, unwrap } from "../api/axiosInstance.js";
import {
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
} from "../constants/passwordRules.js";

export default function ChangePassword() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasNew = newPassword.length > 0;

  const pwdErr =
    hasNew &&
    (newPassword.length < PASSWORD_MIN_LEN ||
      newPassword.length > PASSWORD_MAX_LEN)
      ? `New password must be ${PASSWORD_MIN_LEN}–${PASSWORD_MAX_LEN} characters`
      : "";

  const confirmEmptyErr =
    hasNew && confirm.trim() === ""
      ? "Confirm your new password"
      : "";

  const matchErr =
    confirm.length > 0 && confirm !== newPassword
      ? "Does not match new password"
      : "";

  const submit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      toast.error("Enter current and new password");
      return;
    }

    if (!confirm.trim()) {
      toast.error("Confirm your new password");
      return;
    }

    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (pwdErr || matchErr) {
      toast.error("Fix validation errors");
      return;
    }

    setBusy(true);

    try {
      const res = await axiosInstance.put("/admin/change-password", {
        oldPassword,
        newPassword,
      });

      unwrap(res);

      toast.success("Password updated");

      setOld("");
      setNew("");
      setConfirm("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <h2 style={{ marginTop: 0 }}>Change password</h2>

      <form className="stack" style={{ gap: "1rem" }} onSubmit={submit}>
        <label className="field">
          <span className="field-label">Current password</span>

          <div className="password-wrap">
            <input
              type={showOld ? "text" : "password"}
              className="input password-input"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOld(e.target.value)}
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowOld((prev) => !prev)}
            >
              {showOld ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </label>

        <label className="field">
          <span className="field-label">New password</span>

          <div className="password-wrap">
            <input
              type={showNew ? "text" : "password"}
              className="input password-input"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
              required
              minLength={PASSWORD_MIN_LEN}
              maxLength={PASSWORD_MAX_LEN}
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowNew((prev) => !prev)}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {pwdErr && <span className="field-error">{pwdErr}</span>}
        </label>

        <label className="field">
          <span className="field-label">Confirm new password</span>

          <div className="password-wrap">
            <input
              type={showConfirm ? "text" : "password"}
              className="input password-input"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
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

        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
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


// import { useState } from "react";
// import { toast } from "react-toastify";
// import { axiosInstance, unwrap } from "../api/axiosInstance.js";
// import {
//   PASSWORD_MAX_LEN,
//   PASSWORD_MIN_LEN,
// } from "../constants/passwordRules.js";

// export default function ChangePassword() {
//   const [oldPassword, setOld] = useState("");
//   const [newPassword, setNew] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [busy, setBusy] = useState(false);

//   const hasNew = newPassword.length > 0;
//   const pwdErr =
//     hasNew &&
//     (newPassword.length < PASSWORD_MIN_LEN ||
//       newPassword.length > PASSWORD_MAX_LEN)
//       ? `New password must be ${PASSWORD_MIN_LEN}–${PASSWORD_MAX_LEN} characters`
//       : "";
//   const confirmEmptyErr =
//     hasNew && confirm.trim() === ""
//       ? "Confirm your new password"
//       : "";
//   const matchErr =
//     confirm.length > 0 && confirm !== newPassword
//       ? "Does not match new password"
//       : "";

//   const submit = async (e) => {
//     e.preventDefault();
//     if (!oldPassword || !newPassword) {
//       toast.error("Enter current and new password");
//       return;
//     }
//     if (!confirm.trim()) {
//       toast.error("Confirm your new password");
//       return;
//     }
//     if (newPassword !== confirm) {
//       toast.error("Passwords do not match");
//       return;
//     }
//     if (pwdErr || matchErr) {
//       toast.error("Fix validation errors");
//       return;
//     }
//     setBusy(true);
//     try {
//       const res = await axiosInstance.put("/admin/change-password", {
//         oldPassword,
//         newPassword,
//       });
//       unwrap(res);
//       toast.success("Password updated");
//       setOld("");
//       setNew("");
//       setConfirm("");
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div className="card" style={{ maxWidth: 440 }}>
//       <h2 style={{ marginTop: 0 }}>Change password</h2>
//       <form className="stack" style={{ gap: "1rem" }} onSubmit={submit}>
//         <label className="field">
//           <span className="field-label">Current password</span>
//           <input
//             type="password"
//             className="input"
//             autoComplete="current-password"
//             value={oldPassword}
//             onChange={(e) => setOld(e.target.value)}
//             required
//           />
//         </label>
//         <label className="field">
//           <span className="field-label">New password</span>
//           <input
//             type="password"
//             className="input"
//             autoComplete="new-password"
//             value={newPassword}
//             onChange={(e) => setNew(e.target.value)}
//             required
//             minLength={PASSWORD_MIN_LEN}
//             maxLength={PASSWORD_MAX_LEN}
//           />
//           {pwdErr && <span className="field-error">{pwdErr}</span>}
//         </label>
//         <label className="field">
//           <span className="field-label">Confirm new password</span>
//           <input
//             type="password"
//             className="input"
//             autoComplete="new-password"
//             value={confirm}
//             onChange={(e) => setConfirm(e.target.value)}
//             required
//             minLength={PASSWORD_MIN_LEN}
//             maxLength={PASSWORD_MAX_LEN}
//           />
//           {confirmEmptyErr ? (
//             <span className="field-error">{confirmEmptyErr}</span>
//           ) : matchErr ? (
//             <span className="field-error">{matchErr}</span>
//           ) : null}
//         </label>
//         <button type="submit" className="btn primary" disabled={busy}>
//           Update password
//         </button>
//       </form>
//     </div>
//   );
// }
