// src/admin/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "./api";
import toast from "react-hot-toast";

const ALLOWED = new Set(["EDITOR", "MODERATOR", "SUPER_ADMIN"]);

export default function AdminRoute() {
  const [state, setState] = React.useState({ loading: true, ok: false });
  const loc = useLocation();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.me();
        const user = res?.data || res?.user || res;
        const role = user?.role;
        if (alive) setState({ loading: false, ok: ALLOWED.has(role) });
      } catch {
        if (alive) setState({ loading: false, ok: false });
      }
    })();
    return () => { alive = false; };
  }, [loc.pathname]);

  if (state.loading) {
    return (
      <div className="w-full h-[50vh] grid place-items-center text-sm text-slate-500">
        Checking admin access…
      </div>
    );
  }

  if (!state.ok) {
    // Fire and forget; avoid duplicate toasts by gating on pathname if you like
    toast.error("Admins only");
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: loc.pathname + loc.search }}
      />
    );
  }

  return <Outlet />;
}
