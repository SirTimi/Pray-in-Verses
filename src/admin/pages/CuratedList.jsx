// src/admin/pages/CuratedList.js
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";
import { useMe } from "../RequireAuth"; // so we can mirror AdminLayout behavior

const StateBadge = ({ state }) => {
  const colors = {
    DRAFT: "bg-gray-200 text-gray-800",
    REVIEW: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[state] || "bg-gray-100"}`}>
      {state}
    </span>
  );
};

export default function CuratedList() {
  const { me } = useMe();
  const [sp, setSp] = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState([]);
  const [cursor, setCursor] = React.useState(null);

  const q = sp.get("q") || "";
  const state = sp.get("state") || "";
  const book = sp.get("book") || "";

  async function load(listCursor = null, { append = false } = {}) {
    setLoading(true);
    try {
      const res = await api.listCurated(q, state, book, 50, listCursor || undefined);
      setLoading(false);

      if (!res) {
        setItems([]);
        setCursor(null);
        return;
      }
      if (res.status && res.status >= 400) {
        toast.error(`Failed to load (${res.status})`);
        setItems(append ? items : []);
        setCursor(null);
        return;
      }

      const nextItems = Array.isArray(res.items) ? res.items : [];
      const nextCursor = res.nextCursor || null;

      setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setCursor(nextCursor);
    } catch {
      setLoading(false);
      toast.error("Failed to load curated prayers");
      setItems(append ? items : []);
      setCursor(null);
    }
  }

  React.useEffect(() => {
    load(null, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, state, book]);

  function onFilterChange(next) {
    const nextSP = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => {
      if (v) nextSP.set(k, v);
      else nextSP.delete(k);
    });
    setSp(nextSP, { replace: true });
  }

  function ownerDisplay(it) {
    // Prefer normalized fields from api.listCurated; fall back smartly
    const display =
      it.ownerDisplayName ??
      it.owner?.displayName ??
      it.createdByName ??
      it.owner?.email ??
      it.ownerEmail ??
      it.createdByEmail ??
      "—";
    return display;
  }

  function ownerRole(it) {
    // If the owner is the current admin, trust me.role to avoid "USER" fallback
    if (me?.id && (it.ownerId === me.id || it.owner?.id === me.id)) {
      return me.role || "USER";
    }
    return it.ownerRole ?? it.owner?.role ?? it.createdByRole ?? "USER";
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this curated prayer? This cannot be undone.")) return;
    const res = await api.deleteCurated(id);
    if (res?.ok) {
      toast.success("Deleted");
      load(null, { append: false });
    } else {
      toast.error(res?.message || "Delete failed");
    }
  }

  return (
    <div className="p-6 space-y-5 pl-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-[#0C2E8A]">Curated Prayers</h1>
        <Link
          to="/admin/curated/new"
          className="px-3 py-2 rounded-lg bg-[#0C2E8A] text-white hover:opacity-95"
        >
          New Curated Prayer
        </Link>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Search theme or text…"
          value={q}
          onChange={(e) => onFilterChange({ q: e.target.value })}
        />
        <select
          className="border rounded-md px-3 py-2"
          value={state}
          onChange={(e) => onFilterChange({ state: e.target.value })}
        >
          <option value="">All states</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <input
          className="border rounded-md px-3 py-2"
          placeholder="Book (e.g., Genesis)"
          value={book}
          onChange={(e) => onFilterChange({ book: e.target.value })}
        />
        <button
          className="border rounded-md px-3 py-2"
          onClick={() => setSp(new URLSearchParams(), { replace: true })}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-2xl shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#FFFEF0]">
            <tr className="text-left text-[#0C2E8A]">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Theme</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={7}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={7}>No results.</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {it.book} {it.chapter}:{it.verse}
                  </td>
                  <td className="px-4 py-3">{it.theme || "—"}</td>
                  <td className="px-4 py-3">{ownerDisplay(it)}</td>
                  <td className="px-4 py-3">
                    <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                      {ownerRole(it)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={it.state} />
                  </td>
                  <td className="px-4 py-3">
                    {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Link
                      to={`/admin/curated/${it.id}`}
                      className="px-2 py-1 border rounded-md hover:bg-blue-50 text-[#0C2E8A]"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => onDelete(it.id)}
                      className="px-2 py-1 border rounded-md text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end">
        {cursor && !loading && (
          <button
            className="px-3 py-2 border rounded-lg hover:bg-blue-50 text-[#0C2E8A]"
            onClick={() => load(cursor, { append: true })}
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
