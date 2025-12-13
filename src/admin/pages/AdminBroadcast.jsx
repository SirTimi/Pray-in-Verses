// src/admin/AdminBroadcast.jsx
import React from "react";
import toast from "react-hot-toast";

const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "/api").trim();
const API_BASE = RAW_BASE.replace(/\/$/, "");
const apiURL = (path) => `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;

const ROLES = ["USER", "EDITOR", "MODERATOR", "SUPER_ADMIN"];
const AUDIENCES = [
  { value: "ALL", label: "All users" },
  { value: "ROLE", label: "By role" },
  { value: "USER_IDS", label: "Specific user IDs" },
];

export default function AdminBroadcast() {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [link, setLink] = React.useState("");
  const [audience, setAudience] = React.useState("ALL");
  const [roles, setRoles] = React.useState([]);
  const [userIds, setUserIds] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function onSend(e) {
    e?.preventDefault?.();

    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    const payload = {
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || undefined,
      audience,
      roles: audience === "ROLE" ? roles : undefined,
      userIds:
        audience === "USER_IDS"
          ? userIds
              .split(/[\s,]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };

    if (audience === "ROLE" && (!roles || roles.length === 0)) {
      toast.error("Select at least one role");
      return;
    }
    if (audience === "USER_IDS" && (!payload.userIds || payload.userIds.length === 0)) {
      toast.error("Provide at least one user ID");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(apiURL("/admin/notifications/broadcast"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Broadcast failed (${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      toast.success(data?.message || "Broadcast sent");
      // reset form (optional)
      setTitle("");
      setBody("");
      setLink("");
      setAudience("ALL");
      setRoles([]);
      setUserIds("");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not send broadcast");
    } finally {
      setSending(false);
    }
  }

  const toggleRole = (r) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Broadcast Notification</h1>
        <p className="text-sm text-slate-500">Send an in-app notification to users.</p>
      </div>

      <form onSubmit={onSend} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short headline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Optional Link</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://prayinverses.com/somewhere"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the body of your announcement…"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {audience === "ROLE" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Roles</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => toggleRole(r)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${
                      roles.includes(r)
                        ? "bg-[#0C2E8A] text-white border-[#0C2E8A]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {audience === "USER_IDS" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User IDs (comma or newline separated)
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                placeholder="cuid1, cuid2, cuid3…"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setTitle(""); setBody(""); setLink("");
              setAudience("ALL"); setRoles([]); setUserIds("");
            }}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded-lg bg-[#0C2E8A] text-white hover:bg-blue-800 disabled:opacity-70"
          >
            {sending ? "Sending…" : "Send Broadcast"}
          </button>
        </div>
      </form>
    </div>
  );
}
