// src/admin/pages/CuratedList.js
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import toast from "react-hot-toast";

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

function idOf(u) {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u.id || null;
}

function collectRowUsers(it, userMap) {
  const out = [];
  const seen = new Set();

  const push = (src, isOwner = false) => {
    if (!src) return;
    const id = idOf(src);
    const hydrated = id ? userMap.get(id) : null;
    const u = hydrated || (typeof src === "object" ? src : null);

    const displayName = u?.displayName || u?.name || u?.email || "—";
    const email = u?.email || "";
    const role = u?.role || "USER";
    const key = id || email || displayName;
    if (!key || seen.has(key)) return;
    seen.add(key);

    out.push({ id, displayName, email, role, isOwner });
  };

  // owner (supports owner object, ownerId, or legacy owner* fields)
  if (it.owner) push(it.owner, true);
  else if (it.ownerId) push({ id: it.ownerId }, true);
  else if (it.ownerEmail || it.ownerDisplayName) {
    push(
      { id: null, email: it.ownerEmail, displayName: it.ownerDisplayName, role: it.ownerRole },
      true
    );
  }

  // contributors (ids or objects)
  if (Array.isArray(it.contributors)) it.contributors.forEach((c) => push(c, false));
  if (Array.isArray(it.contributorIds)) it.contributorIds.forEach((id) => push({ id }, false));

  return out;
}

function UsersCell({ it, userMap }) {
  const users = collectRowUsers(it, userMap);
  if (users.length === 0) return <span className="text-gray-400">—</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {users.map((u) => (
        <div
          key={(u.id || u.email || u.displayName) + (u.isOwner ? "-owner" : "")}
          className={`min-w-[200px] max-w-full px-2 py-1 rounded-lg border ${
            u.isOwner ? "bg-[#FFFEF0] border-[#FCCF3A]" : "bg-white border-gray-200"
          }`}
          title={`${u.displayName}${u.email ? ` • ${u.email}` : ""} • ${u.role}${
            u.isOwner ? " • owner" : ""
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-medium text-[#0C2E8A]">{u.displayName}</span>
            {u.email ? (
              <span className="text-[11px] text-gray-600 break-all">{u.email}</span>
            ) : null}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
              {u.role}
            </span>
            {u.isOwner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFF6CC] border border-[#FCE58A] text-[#7A5B00]">
                owner
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CuratedList() {
  const [sp, setSp] = useSearchParams();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState([]);
  const [cursor, setCursor] = React.useState(null);

  // id -> {id, displayName, email, role}
  const [userMap, setUserMap] = React.useState(() => new Map());

  const q = sp.get("q") || "";
  const state = sp.get("state") || "";
  const book = sp.get("book") || "";

  function idsNeeded(batch) {
    const ids = new Set();
    for (const it of batch) {
      const ownerId = idOf(it.owner) || it.ownerId || null;
      if (ownerId) ids.add(ownerId);
      if (Array.isArray(it.contributors)) {
        it.contributors.forEach((c) => {
          const id = idOf(c);
          if (id) ids.add(id);
        });
      }
      if (Array.isArray(it.contributorIds)) it.contributorIds.forEach((id) => ids.add(id));
    }
    // remove already cached
    return Array.from(ids).filter((id) => !userMap.has(id));
  }

  async function hydrateUsers(batch) {
    const missing = idsNeeded(batch);
    if (!missing.length) return;

    // 1) Try open-to-all lookup
    let got = false;
    try {
      const res = await api.lookupUsersByIds(missing);
      if (res?.map) {
        const next = new Map(userMap);
        res.map.forEach((v, k) => next.set(k, v));
        setUserMap(next);
        got = true;
      }
    } catch { /* ignore */ }

    // 2) Fallback to listUsers (may require SUPER_ADMIN). Still harmless if 403.
    if (!got) {
      try {
        const res = await api.listUsers();
        if (res?.status < 400) {
          const rows = Array.isArray(res?.data) ? res.data
                     : Array.isArray(res)       ? res
                     : [];
          const next = new Map(userMap);
          rows.forEach((u) => { if (u?.id) next.set(u.id, u); });
          setUserMap(next);
        }
      } catch { /* ignore */ }
    }
  }

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

      const merged = append ? [...items, ...nextItems] : nextItems;
      setItems(merged);
      setCursor(nextCursor);

      // hydrate identities for visible rows (role/email/displayName for all)
      await hydrateUsers(nextItems);
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
    <div className="p-6 space-y-4">
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
      <div className="grid gap-3 md:grid-cols-5">
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
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={6}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={6}>No results.</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {it.book} {it.chapter}:{it.verse}
                  </td>
                  <td className="px-4 py-3">{it.theme || "—"}</td>
                  <td className="px-4 py-3">
                    <UsersCell it={it} userMap={userMap} />
                  </td>
                  <td className="px-4 py-3"><StateBadge state={it.state} /></td>
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
