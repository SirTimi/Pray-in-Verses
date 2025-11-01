// src/lib/api.js

// Use VITE_API_BASE when provided, else default to /api prefix
// e.g. VITE_API_BASE="http://localhost:4000/api"
const RAW_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// Joiner that avoids double slashes and supports absolute URLs in `path`
function joinURL(base, path) {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const url = joinURL(RAW_BASE, path);

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = isFormData
    ? headers // let browser set multipart boundary
    : { "Content-Type": "application/json", ...headers };

  const res = await fetch(url, {
    method,
    credentials: "include", // keep cookies for auth
    headers: finalHeaders,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // Optional global 401 handler:
  // if (res.status === 401) {
  //   try { await res.clone().json(); } catch {}
  //   // window.location.assign("/login");
  // }

  // Try JSON, then fall back to text
  const raw = await res.text();
  const data = (() => {
    try { return raw ? JSON.parse(raw) : {}; } catch { return { data: raw }; }
  })();

  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) ||
      `${res.status} ${res.statusText}`
    );
    err.status = res.status;
    err.payload = data;
    err.url = url;
    throw err;
  }

  return data;
}

// Verb helpers
export async function get(path)    { return request(path, { method: "GET" }); }
export async function post(path,b) { return request(path, { method: "POST", body: b }); }
export async function patch(path,b){ return request(path, { method: "PATCH", body: b }); }
export async function del(path)    { return request(path, { method: "DELETE" }); }

// Convenience grouped exports
export const api = { get, post, patch, del };
export default api;

// Example resource helpers (these will now resolve to /api/journals/*)
export const journals = {
  list:        ()        => get("/journals"),
  get:         (id)      => get(`/journals/${id}`),
  create:      (payload) => post("/journals", payload),
  update:      (id, p)   => patch(`/journals/${id}`, p),
  remove:      (id)      => del(`/journals/${id}`),
};

// (Optional) Auth convenience helpers if you want them:
// export const auth = {
//   login: (email, password) => post("/auth/login", { email, password }),
//   me:    ()                 => get("/auth/me"),
//   logout:()                 => post("/auth/logout"),
// };
