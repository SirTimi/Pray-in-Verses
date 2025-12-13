// src/pages/AdminUsers.jsx
import React from "react";
import { api } from "../api";
import toast from "react-hot-toast";

const ROLES = ["USER", "EDITOR", "MODERATOR", "SUPER_ADMIN"];

export default function AdminUsers() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);
  const [modal, setModal] = React.useState({ open: false, user: null, reason: "" });

  async function load() {
    try {
      setLoading(true);
      const res = await api.listUsers(); // must include status/displayName in payload
      setLoading(false);
      if (Array.isArray(res?.data)) setRows(res.data);
      else if (Array.isArray(res)) setRows(res);
      else setRows([]);
    } catch (e) {
      setLoading(false);
      toast.error("Failed to load users");
      setRows([]);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onChangeRole(id, role) {
    const res = await api.updateUserRole(id, role);
    if (res?.ok || res?.status === 200) {
      toast.success("Role updated");
      load();
    } else toast.error(res?.message || "Update failed");
  }

  function openSuspend(u) {
    setModal({ open: true, user: u, reason: "" });
  }
  function closeSuspend() {
    setModal({ open: false, user: null, reason: "" });
  }

  async function confirmSuspend() {
    if (!modal.user) return;
    try {
      const res = await api.suspendUser(modal.user.id, modal.reason?.trim() || undefined);
      if (res?.ok || res?.status === 200) {
        toast.success("User suspended and notified");
        closeSuspend();
        load();
      } else {
        toast.error(res?.message || "Suspend failed");
      }
    } catch (e) {
      toast.error("Suspend failed");
    }
  }

  async function onUnsuspend(u) {
    try {
      const res = await api.unsuspendUser(u.id);
      if (res?.ok || res?.status === 200) {
        toast.success("User unsuspended");
        load();
      } else {
        toast.error(res?.message || "Unsuspend failed");
      }
    } catch (e) {
      toast.error("Unsuspend failed");
    }
  }

  const nameOf = (u) =>
    u?.displayName?.trim() ||
    u?.name?.trim() ||
    u?.profile?.displayName?.trim() ||
    "-";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6">No users.</td></tr>
            ) : rows.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{nameOf(u)}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="border rounded-md px-2 py-1"
                    value={u.role}
                    onChange={e => onChangeRole(u.id, e.target.value)}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.status === "SUSPENDED" ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 border border-red-200">
                      SUSPENDED
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}
                </td>
                <td className="px-4 py-3 space-x-2">
                  {u.status === "SUSPENDED" ? (
                    <button
                      onClick={() => onUnsuspend(u)}
                      className="px-3 py-1 rounded-md border text-xs hover:bg-gray-50"
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => openSuspend(u)}
                      className="px-3 py-1 rounded-md border border-red-300 text-red-700 text-xs hover:bg-red-50"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple modal for suspend reason */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-5">
            <h3 className="text-sm font-semibold mb-2">
              Suspend {nameOf(modal.user)} ({modal.user?.email})
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Add a short reason (e.g. “Violation of Community Guidelines — harassment/spam”). The user will receive this in the email.
            </p>
            <textarea
              rows={4}
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Reason (optional but recommended)"
              value={modal.reason}
              onChange={(e) => setModal((m) => ({ ...m, reason: e.target.value }))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeSuspend}
                className="px-3 py-2 rounded-md border text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Suspend & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
