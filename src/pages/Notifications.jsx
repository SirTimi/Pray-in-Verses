// src/pages/Notifications.jsx
import React from "react";
import { CheckCircle2, Bell } from "lucide-react";

const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "/api").trim();
const API_BASE = RAW_BASE.replace(/\/$/, "");
const apiURL = (p) => `${API_BASE}${p.startsWith("/") ? p : "/" + p}`;

export default function Notifications() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState(null);

  const uid = (n) => n.userNotificationId || n.id || "";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiURL("/notifications?limit=25"), {
        credentials: "include",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Failed (${res.status})`);

      const data = JSON.parse(text);
      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const normalized = rows.map((r) => ({
        id: r.userNotificationId || r.id,
        userNotificationId: r.userNotificationId || r.id,
        title: r.title ?? "",
        body: r.body ?? "",
        link: r.link ?? null,
        readAt: r.readAt ?? null,
        createdAt: r.createdAt ?? undefined,
      }));
      setItems(normalized);
    } catch (e) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function markReadOne(n) {
    const id = uid(n);
    if (!id) return;
    fetch(apiURL("/notifications/read"), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setItems((prev) =>
      prev.map((x) =>
        uid(x) === id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x
      )
    );
  }

  async function markAllRead() {
    fetch(apiURL("/notifications/read-all"), {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
    setItems((prev) =>
      prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() }))
    );
  }

  const unread = items.filter((i) => !i.readAt).length;

  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#0C2E8A] flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {unread} unread
          </span>
        </h1>
        {items.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-6 rounded-xl border bg-white text-center">
          <p className="text-sm text-gray-600">No notifications yet.</p>
          <p className="text-xs text-gray-500 mt-1">
            When admins broadcast updates, they'll appear here.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y rounded-lg border overflow-hidden bg-white">
          {items.map((n) => {
            const isRead = !!n.readAt;
            return (
              <li
                key={uid(n)}
                className={`p-4 flex items-start gap-3 ${isRead ? "bg-white" : "bg-blue-50"}`}
              >
                {isRead ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${isRead ? "text-gray-800" : "text-gray-900"}`}>
                    {n.title || "Notification"}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.body}</p>
                  <div className="mt-2 flex items-center gap-3">
                    {!isRead && (
                      <button
                        onClick={() => markReadOne(n)}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        markReadOne(n);
                        setSelected(n);
                      }}
                      className="text-xs text-[#0C2E8A] font-semibold hover:underline"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#0C2E8A]">
                {selected.title || "Notification"}
              </h4>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-black"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.body || ""}</p>
              {selected.link && (
                <div className="mt-4">
                  <a
                    href={selected.link}
                    target={selected.link.startsWith("http") ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="text-sm text-blue-700 hover:underline"
                  >
                    Open attached link
                  </a>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}