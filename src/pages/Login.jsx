import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { TOKEN_KEY } from "../api/axiosInstance.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const errs = {
    email: email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Invalid email"
      : "",
    password:
      password && (password.length < 6 || password.length>12)
        ? "Password must be 6-12 characters"
        : "",
  };

  const submit = async (e) => {
    e.preventDefault();

    if (errs.email || errs.password || !email.trim() || !password) {
      toast.error("Fix validation errors");
      return;
    }

    setBusy(true);

    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="login-wrap">
      <div className="login-card card">
        <h1 style={{ marginTop: 0, color: "var(--brand)" }}>
          AssalPay Admin
        </h1>

        <p className="muted">
          Sign in with your admin credentials.
        </p>

        <form onSubmit={submit} className="stack" style={{ gap: "0.85rem" }}>
          <label className="field">
            <span className="field-label">Email</span>

            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {errs.email && (
              <span className="field-error">{errs.email}</span>
            )}
          </label>

          <label className="field">
            <span className="field-label">Password</span>

            <div className="password-wrap">
              <input
                className="input password-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {errs.password && (
              <span className="field-error">{errs.password}</span>
            )}
          </label>

          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <style>{`
        .login-wrap {
          min-height: 100%;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          background:
            radial-gradient(circle at 20% 20%, rgba(22,101,52,0.14), transparent 45%),
            var(--bg);
        }

        .login-card {
          width: min(420px, 100%);
          padding: 1.75rem;
        }

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

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useAuth } from "../context/AuthContext.jsx";
// import { TOKEN_KEY } from "../api/axiosInstance.js";

// export default function Login() {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [busy, setBusy] = useState(false);

//   const errs = {
//     email: email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Invalid email" : "",
//     password:
//       password && password.length < 6 ? "Min 6 characters" : "",
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     if (errs.email || errs.password || !email.trim() || !password) {
//       toast.error("Fix validation errors");
//       return;
//     }
//     setBusy(true);
//     try {
//       await login(email.trim(), password);
//       toast.success("Welcome back");
//       navigate("/", { replace: true });
//     } catch (err) {
//       toast.error(err.message || "Login failed");
//     } finally {
//       setBusy(false);
//     }
//   };

//   useEffect(() => {
//     if (localStorage.getItem(TOKEN_KEY)) {
//       navigate("/", { replace: true });
//     }
//   }, [navigate]);

//   return (
//     <div className="login-wrap">
//       <div className="login-card card">
//         <h1 style={{ marginTop: 0, color: "var(--brand)" }}>AssalPay Admin</h1>
//         <p className="muted">Sign in with your admin credentials.</p>
//         <form onSubmit={submit} className="stack" style={{ gap: "0.85rem" }}>
//           <label className="field">
//             <span className="field-label">Email</span>
//             <input
//               className="input"
//               type="email"
//               autoComplete="username"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//             {errs.email && (
//               <span className="field-error">{errs.email}</span>
//             )}
//           </label>
//           <label className="field">
//             <span className="field-label">Password</span>
//             <input
//               className="input"
//               type="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//             {errs.password && (
//               <span className="field-error">{errs.password}</span>
//             )}
//           </label>
//           <button type="submit" className="btn primary" disabled={busy}>
//             {busy ? "Signing in…" : "Sign in"}
//           </button>
//         </form>
//       </div>
//       <style>{`
//         .login-wrap {
//           min-height: 100%;
//           display: grid;
//           place-items: center;
//           padding: 1.5rem;
//           background: radial-gradient(circle at 20% 20%, rgba(22,101,52,0.14), transparent 45%), var(--bg);
//         }
//         .login-card { width: min(420px, 100%); padding: 1.75rem; }
//       `}</style>
//     </div>
//   );
// }
