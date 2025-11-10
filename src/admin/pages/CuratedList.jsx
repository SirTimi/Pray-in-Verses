// src/admin/curated/CuratedList.js
import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";
import { Search, Filter, Plus, Trash2, Pencil, User as UserIcon } from "lucide-react";

/* --- State badge, themed like main platform --- */
const StateBadge = ({ state }) => {
  const styles = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    REVIEW: "bg-yellow-50 text-yellow-800 border-yellow-200",
    PUBLISHED: "bg-green-50 text-green-700 border-green-200",
  };
  const cls = styles[state] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>
      {state || "—"}
    </span>
  );
};

/* --- Safe extractors for owner name/role --- */
function extractOwner(it) {
  // try common shapes first; fall back to strings if present
  const candidate =
    it.owner || it.createdBy || it.editor || it.user || it.curator || null;

  const displayName =
    candidate?.displayName ||
    it.ownerName ||
    it.createdByName ||
    it.curatorName ||
    it.editorName ||
    "—";

  const role =
    candidate?.role ||
    it.ownerRole ||
    it.createdByRole ||
    it.curatorRole ||
    it.editorRole ||
    "—";

  const id = candidate?.id || it.ownerId || it.createdById || it.userId || it.curatorId || null;

  return { id, displayName, role };
}

function initials(name) {
  if (!name || name === "—") return "U";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || "U";
}

export default function CuratedList() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();

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

      setItems(prev => (append ? [...prev, ...nextItems] : nextItems));
      setCursor(nextCursor);
    } catch (e) {
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
    <div className="p-0">
      {/* Header / Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0C2E8A]">Curated Prayers</h1>
          <p className="text-sm text-gray-600">Review, publish, and manage curated entries</p>
        </div>
        <Link
          to="/admin/curated/new"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0C2E8A] text-white hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          New Curated Prayer
        </Link>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow border p-4 md:p-6 mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full border rounded-lg pl-9 pr-3 py-2"
              placeholder="Search theme or text…"
              value={q}
              onChange={(e) => onFilterChange({ q: e.target.value })}
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              className="w-full border rounded-lg pl-9 pr-3 py-2"
              value={state}
              onChange={(e) => onFilterChange({ state: e.target.value })}
            >
              <option value="">All states</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Book (e.g., Genesis)"
            value={book}
            onChange={(e) => onFilterChange({ book: e.target.value })}
          />

          <button
            className="border rounded-lg px-3 py-2"
            onClick={() => setSp(new URLSearchParams(), { replace: true })}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-[#0C2E8A]">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Theme</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Worked By</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>Loading…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={6}>No results.</td>
                </tr>
              ) : (
                items.map((it) => {
                  const { displayName, role } = extractOwner(it);
                  return (
                    <tr key={it.id} className="border-t">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {it.book} {it.chapter}:{it.verse}
                      </td>
                      <td className="px-4 py-3 min-w-[14rem]">
                        {it.theme || <span className="text-gray-500">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StateBadge state={it.state} />
                      </td>

                      {/* Worked By: displayName + role chip */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0C2E8A] flex items-center justify-center font-semibold">
                            {initials(displayName)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {it.displayName}
                            </div>
                            <div className="text-xs">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FCCF3A]/20 text-[#0C2E8A] font-semibold">
                                {role}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Link
                            to={`/admin/curated/${it.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 border rounded-md hover:bg-blue-50 text-[#0C2E8A]"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => onDelete(it.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 border rounded-md text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end p-3 border-t bg-gray-50">
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
    </div>
  );
}
