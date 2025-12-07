// src/admin/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";

export function useMe() {
  const [me, setMe] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.me(); // could be {status, user:{...}} or {user:{...}} or 401-handled -> undefined
      if (!mounted) return;

      // Normalize to the actual user object or null
      const raw = res?.user ?? res?.data ?? res ?? null;
      const user =
        raw && typeof raw === "object" && "id" in raw ? raw : null;

      setMe(user);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  return { me, loading };
}

export default function RequireAuth({ children, roles }) {
  const { me, loading } = useMe();
  const loc = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;

  // Not logged in
  if (!me?.id) return <Navigate to="/admin/login" state={{ from: loc }} replace />;

  // Role gate (if provided)
  if (roles?.length && !roles.includes(me.role)) {
    return <div className="p-6 text-red-600">Permission denied ({me.role}).</div>;
  }

  return children;
}
