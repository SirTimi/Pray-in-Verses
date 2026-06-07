// src/admin/pages/Dashboard.jsx
import React from "react";
import { api } from "../api";
import { ClipboardList, CheckCircle2, Archive, FileEdit, RefreshCw } from "lucide-react";

const EMPTY = { draft: 0, review: 0, published: 0, archived: 0 };

/** Map the server's { counts: { DRAFT, REVIEW, ... } } envelope to our shape. */
function fromServerCounts(res) {
  const c = res?.counts;
  if (!c || typeof c !== "object") return null;
  return {
    draft: Number(c.DRAFT) || 0,
    review: Number(c.REVIEW) || 0,
    published: Number(c.PUBLISHED) || 0,
    archived: Number(c.ARCHIVED) || 0,
  };
}

/** Fallback only: paginate one state and sum lengths.
 *  Uses the CURRENT listCurated signature: (q, state, book, chapter, verse, limit, cursor).
 */
async function countAllFor(state, pageSize = 200, maxPages = 50) {
  let cursor = undefined;
  let pages = 0;
  let totalLen = 0;

  do {
    const res = await api.listCurated(
      undefined, // q
      state,     // state
      undefined, // book
      undefined, // chapter
      undefined, // verse
      pageSize,  // limit
      cursor     // cursor
    );
    const items = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.data)
      ? res.data
      : [];
    totalLen += items.length;
    cursor = res?.nextCursor || null;
    pages += 1;
  } while (cursor && pages < maxPages);

  return totalLen;
}

export default function Dashboard() {
  const [counts, setCounts] = React.useState(EMPTY);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fast path: single grouped-count round-trip.
      const res = await api.curatedCounts();
      const mapped = fromServerCounts(res);

      if (mapped) {
        setCounts(mapped);
        setLoaded(true);
        return;
      }

      // Fallback (endpoint missing/old API): paginate per state in parallel.
      const [d, r, p, a] = await Promise.all([
        countAllFor("DRAFT"),
        countAllFor("REVIEW"),
        countAllFor("PUBLISHED"),
        countAllFor("ARCHIVED"),
      ]);
      setCounts({ draft: d, review: r, published: p, archived: a });
      setLoaded(true);
    } catch (e) {
      setError("Couldn't load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  const StatCard = ({ title, value, icon, accent = "primary" }) => {
    const accents = {
      primary: "bg-[#FFFEF0] border-l-4 border-[#FCCF3A] text-[#0C2E8A]",
      blue: "bg-blue-50/40 border-l-4 border-[#0C2E8A] text-[#0C2E8A]",
      green: "bg-green-50/60 border-l-4 border-green-500 text-green-800",
      gray: "bg-gray-50 border-l-4 border-gray-300 text-gray-700",
    };
    const cls = accents[accent] || accents.primary;

    return (
      <div className={`rounded-2xl shadow border ${cls} p-4 md:p-6`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">{title}</div>
          <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold">
          {loading && !loaded ? (
            <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#0C2E8A]">Dashboard</h1>
          <p className="text-sm text-gray-600">Overview of curated content across states</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-[#0C2E8A] hover:bg-blue-50"
          disabled={refreshing || loading}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Draft"
          value={loaded ? counts.draft : "—"}
          accent="gray"
          icon={<FileEdit className="w-5 h-5 text-[#0C2E8A]" />}
        />
        <StatCard
          title="In Review"
          value={loaded ? counts.review : "—"}
          accent="blue"
          icon={<ClipboardList className="w-5 h-5 text-[#0C2E8A]" />}
        />
        <StatCard
          title="Published"
          value={loaded ? counts.published : "—"}
          accent="green"
          icon={<CheckCircle2 className="w-5 h-5 text-green-700" />}
        />
        <StatCard
          title="Archived"
          value={loaded ? counts.archived : "—"}
          accent="primary"
          icon={<Archive className="w-5 h-5 text-[#0C2E8A]" />}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl shadow border p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0C2E8A]">Quick Actions</h2>
            <p className="text-xs text-gray-600">Jump into curation flows faster.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/curated/new" className="px-3 py-2 rounded-lg bg-[#0C2E8A] text-white hover:opacity-95">
              New Curated Prayer
            </a>
            <a href="/admin/curated?state=REVIEW" className="px-3 py-2 rounded-lg border hover:bg-blue-50 text-[#0C2E8A]">
              Review Queue
            </a>
            <a href="/admin/curated?state=PUBLISHED" className="px-3 py-2 rounded-lg border hover:bg-blue-50 text-[#0C2E8A]">
              Published List
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}