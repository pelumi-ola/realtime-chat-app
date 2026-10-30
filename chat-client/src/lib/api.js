import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const TOKEN_KEY = "chat_token";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const isAuthForm = url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && !isAuthForm) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  },
);

// Readable error text from your standard error format
export const errMsg = (e) =>
  e?.response?.data?.errors?.[0]?.message ||
  e?.response?.data?.message ||
  e?.message ||
  "Something went wrong";

// Your responses may be { rooms } or { data: { rooms } } or { data: [...] }.
// pick() handles all three so the UI doesn't break if the shape differs slightly.
export function pick(res, key) {
  const body = res?.data;
  if (body?.[key] !== undefined) return body[key];
  if (body?.data?.[key] !== undefined) return body.data[key];
  return body?.data;
}

export default api;
