import React from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2, ArrowLeft } from "lucide-react";

const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "/api").trim();
const API_BASE = RAW_BASE.replace(/\/$/, "");
const apiURL = (path) => `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;

export default function NotificationsPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState([]);
  const [next, setNext] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function load(initial = false) {
    setLoading(initial);
    const url = new URL(apiURL("/notifications"), window.location.origin);
    if (initial === false && next) url.searchParams.set("cursor", next);
    url.searchParams.set("limit", "25");

    try {
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = data?.data || data?.notifications || data || [];
      const cursor = data?.nextCursor || data?.next || null;
      setItems((prev) => (initial ? list : [...prev, ...list]));
      setNext(cursor);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load(true);
  }, []);

  async function markAllRead() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(apiURL("/notifications/read"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function markOneRead(id) {
    try {
      await fetch(apiURL("/notifications/read"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="pt-24 pb-8 md:ml-56 min-h-screen bg-gray-50 font-['Poppins']">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-sm text-[#0C2E8A] hover:underline"
            >
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
          <button
            onClick={markAllRead}
            disabled={busy}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
          >
            {busy ? "Marking…" : "Mark all as read"}
          </button>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h1 className="text-base font-semibold text-slate-800">Notifications</h1>
          </div>

          {/* List */}
          {loading && items.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No notifications yet.</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const link = n.link || n.href || "/home";
                const title = n.title || n.subject || "Notification";
                const description = n.description || n.body || "";
                const time =
                  n.createdAt
                    ? new Date(n.createdAt).toLocaleString()
                    : n.time || "";

                return (
                  <li key={n.id} className={n.read ? "bg-slate-50/60" : "bg-white"}>
                    <div className="p-4 flex items-start gap-3">
                      {n.read ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-900 truncate">
                            {title}
                          </h3>
                          {!n.read && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              NEW
                            </span>
                          )}
                        </div>
                        {description && (
                          <p className="text-xs text-slate-600 mt-1">{description}</p>
                        )}
                        {time && (
                          <div className="text-[11px] text-slate-400 mt-1">{time}</div>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            to={link}
                            onClick={() => !n.read && markOneRead(n.id)}
                            className="text-xs text-[#0C2E8A] hover:underline"
                          >
                            Open
                          </Link>
                          {!n.read && (
                            <button
                              onClick={() => markOneRead(n.id)}
                              className="text-xs text-slate-600 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pager */}
          {next && (
            <div className="p-3 border-t bg-slate-50 flex justify-center">
              <button
                onClick={() => load(false)}
                className="text-sm px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
