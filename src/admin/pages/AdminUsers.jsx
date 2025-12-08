import React from "react";
import { api } from "../api";
import toast from "react-hot-toast";

const ROLES = ["USER", "EDITOR", "MODERATOR", "SUPER_ADMIN"];

export default function AdminUsers() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);

  async function load() {
    setLoading(true);
    const res = await api.listUsers();
    setLoading(false);
    if (Array.isArray(res?.data)) setRows(res.data);
    else if (Array.isArray(res)) setRows(res);
    else setRows([]);
  }

  React.useEffect(() => { load(); }, []);

  async function onChangeRole(id, role) {
    const res = await api.updateUserRole(id, role);
    if (res?.ok || res?.status === 200) {
      toast.success("Role updated");
      load();
    } else toast.error(res?.message || "Update failed");
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Users</h1>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6">No admins.</td></tr>
            ) : rows.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.name || "-"}</td>
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
                  {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
