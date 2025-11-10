// src/admin/AdminLayout.jsx
import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { api } from "./api";
import { useMe } from "./RequireAuth";
import { LayoutDashboard, ListChecks, UserPlus } from "lucide-react";

export default function AdminLayout() {
  const { me } = useMe();

  const navItem = (to, label, Icon, exact = false) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg transition ${
          isActive
            ? "bg-[#0C2E8A] text-white"
            : "text-[#0C2E8A] hover:bg-blue-50"
        }`
      }
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-['Poppins']">
      {/* Top header (fixed) */}
      <header className="fixed top-0 inset-x-0 z-30 h-16 bg-white/80 backdrop-blur border-b">
        <div className="h-full container mx-auto px-4 lg:px-6 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0C2E8A] to-[#FCCF3A]" />
            <span className="text-[#0C2E8A] font-semibold">
              Pray in Verses - Admin Panel
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              {me?.displayName || "—"}{" "}
              <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                {me?.role || "USER"}
              </span>
            </span>
            <button
              onClick={() =>
                api.logout().then(() => window.location.assign("/admin/login"))
              }
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-[#0C2E8A]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar (fixed on lg+) */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[224px] border-r bg-white/70 backdrop-blur z-20">
        <nav className="p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500 px-2 py-2">
            Manage
          </div>
          <ul className="space-y-1">
            <li>{navItem("/admin", "Dashboard", LayoutDashboard, true)}</li>
            <li>{navItem("/admin/curated", "Curated Prayers", ListChecks)}</li>
            {me?.role === "SUPER_ADMIN" && (
              <li>{navItem("/admin/invites", "Invites", UserPlus)}</li>
            )}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="pt-20 lg:pl-[224px] px-4 lg:px-6 pb-10">
        <div className="container mx-auto">
          {/* Page card wrapper to match main platform */}
          <div className="bg-white rounded-2xl shadow border p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
