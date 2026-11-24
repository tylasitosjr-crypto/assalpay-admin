import axios from "axios";
import { decrementApiPending, incrementApiPending } from "./apiLoadingRegistry.js";

const TOKEN_KEY = "assalpay_admin_token";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export const axiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Prefer backend `message` / `error` from JSON body; avoid axios defaults like
 * "Request failed with status code 400".
 */
export function getApiErrorMessage(err, fallback = "Something went wrong.") {
  const data = err.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }
  if (!err.response) {
    const code = err.code;
    const msg = err.message || "";
    if (code === "ERR_NETWORK" || msg.includes("Network Error")) {
      return "Network error. Check your connection.";
    }
    if (msg && !/^Request failed with status code \d+$/i.test(msg)) {
      return msg;
    }
    return fallback;
  }
  return fallback;
}

axiosInstance.interceptors.request.use((config) => {
  incrementApiPending();
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (r) => {
    decrementApiPending();
    return r;
  },
  (err) => {
    decrementApiPending();
    const status = err.response?.status;
    err.message = getApiErrorMessage(err);

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

/** API responses: `{ success, message, body }` */
export function unwrap(res) {
  const data = res.data;
  if (!data?.success) {
    const msg = data?.message || "Request failed";
    const e = new Error(msg);
    e.body = data?.body;
    throw e;
  }
  return data.body;
}

export { TOKEN_KEY };
