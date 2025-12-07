// src/RequireAuth.jsx
import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";

// Infer API base: explicit VITE_API_BASE wins; else same-origin "/api" in prod, localhost in dev.
const inferBase = () => {
  const env = import.meta?.env?.VITE_API_BASE;
  if (env && typeof env === "string") return env.replace(/\/+$/, "");
  const host = typeof window !== "undefined" ? window.location.host : "";
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".local");
  return isLocal ? "http://localhost:4000/api" : "/api";
};
const API_BASE = inferBase();

function normalizeMe(payload) {
  if (!payload) return null;
  const raw = payload.user ?? payload.data ?? payload; // controller returns { user }
  if (raw && typeof raw === "object" && raw.id) {
    return {
      id: String(raw.id),
      email: raw.email ?? null,
      displayName: raw.displayName ?? null,
      role: raw.role ?? "USER",
    };
  }
  return null;
}

export default function RequireAuth({ roles }) {
  const [state, setState] = React.useState({ loading: true, user: null });
  const loc = useLocation();

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
          // Avoid 304/ETag cache confusion so we always get a fresh body
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (res.status === 401) {
          if (active) setState({ loading: false, user: null });
          return;
        }

        // Some servers return 304 with empty body if a proxy adds If-None-Match.
        // Treat 304 like 200 but without body; do a best-effort parse.
        let data = null;
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }

        const user = normalizeMe(data);
        if (active) setState({ loading: false, user });
      } catch {
        if (active) setState({ loading: false, user: null });
      }
    })();
    return () => {
      active = false;
    };
  }, [loc.pathname]);

  if (state.loading) return <div className="p-6">Loading…</div>;

  // Redirect to app's login page if unauthenticated
  if (!state.user?.id)
    return <Navigate to="/login" state={{ from: loc }} replace />;

  // Optional role gate
  if (roles && roles.length && !roles.includes(state.user.role)) {
    return (
      <div className="p-6 text-red-600">Permission denied ({state.user.role}).</div>
    );
  }

  return <Outlet />;
}
