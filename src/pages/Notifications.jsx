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
  const [selected, setSelected] = React.useState(null); // modal content

  const getUserNotifId = (n) => n?.userNotificationId || n?.id;

  async function load() {
    setLoading(true);
    setError("");
    try {
      // Backend exposes GET /notifications (aliased to "mine")
      const res = await fetch(apiURL("/notifications?limit=25"), {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed (${res.status})`);
      }
      const data = await res.json();
      const rows =
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setItems(rows);
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
    const id = getUserNotifId(n);
    if (!id) return;
    // Legacy alias: PATCH /notifications/read  { id }
    await fetch(apiURL("/notifications/read"), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setItems((prev) =>
      prev.map((x) =>
        getUserNotifId(x) === id ? { ...x, readAt: x.readAt || new Date().toISOString() } : x
      )
    );
  }

  async function markAllRead() {
    await fetch(apiURL("/notifications/read-all"), {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
  }

  function openModal(n) {
    markReadOne(n);
    setSelected(n);
  }

  const unreadCount = items.filter((i) => !i.readAt).length;

  return (
    <div className="min-h-[60vh]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-[#0C2E8A] flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {unreadCount} unread
            </span>
          )}
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

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-gray-500">No notifications yet.</div>
      )}

      <ul className="divide-y rounded-lg border overflow-hidden">
        {items.map((n) => {
          const isRead = Boolean(n.readAt);
          return (
            <li
              key={getUserNotifId(n) || `${n.title}-${n.createdAt}`}
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
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{n.body || ""}</p>

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
                    onClick={() => openModal(n)}
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

      {/* Reader Modal (always used on Open) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
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
                <div className="mt-4 flex items-center gap-2">
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
