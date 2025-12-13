// src/pages/admin/AdminBroadcast.jsx
import React from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';

export default function AdminBroadcast() {
  const [form, setForm] = React.useState({
    title: '',
    body: '',
    link: '',
    audience: 'ALL',
    roles: [],
    userIds: '',
  });
  const roles = ['USER','EDITOR','MODERATOR','SUPER_ADMIN'];

  async function submit(e) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      link: form.link.trim() || undefined,
      audience: form.audience,
      ...(form.audience === 'ROLE' ? { roles: form.roles } : {}),
      ...(form.audience === 'USER' ? { userIds: form.userIds.split(',').map(s=>s.trim()).filter(Boolean) } : {}),
    };
    const res = await api.post('/admin/notifications', payload);
    if (res?.ok || res?.status === 200) toast.success('Broadcast sent');
    else toast.error(res?.message || 'Failed to send');
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Broadcast Notification</h1>
      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <input className="w-full border rounded p-2" placeholder="Title" value={form.title}
               onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        <textarea className="w-full border rounded p-2" placeholder="Body" rows={4} value={form.body}
                  onChange={e=>setForm(f=>({...f,body:e.target.value}))}/>
        <input className="w-full border rounded p-2" placeholder="Optional link (deeplink/URL)" value={form.link}
               onChange={e=>setForm(f=>({...f,link:e.target.value}))}/>
        <div className="flex gap-3 items-center">
          <label className="font-medium">Audience</label>
          <select className="border rounded p-2" value={form.audience}
                  onChange={e=>setForm(f=>({...f,audience:e.target.value, roles:[], userIds:''}))}>
            <option value="ALL">All Users</option>
            <option value="ROLE">By Role</option>
            <option value="USER">Specific Users</option>
          </select>
        </div>

        {form.audience === 'ROLE' && (
          <div className="space-y-2">
            <div className="text-sm text-slate-600">Select roles:</div>
            <div className="flex flex-wrap gap-2">
              {roles.map(r=>(
                <label key={r} className="inline-flex items-center gap-2 border rounded px-2 py-1">
                  <input type="checkbox" checked={form.roles.includes(r)}
                         onChange={e=>{
                           setForm(f=>{
                             const set = new Set(f.roles);
                             e.target.checked ? set.add(r) : set.delete(r);
                             return {...f, roles:[...set]};
                           });
                         }}/>
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {form.audience === 'USER' && (
          <input className="w-full border rounded p-2"
                 placeholder="Comma-separated user IDs"
                 value={form.userIds}
                 onChange={e=>setForm(f=>({...f,userIds:e.target.value}))}/>
        )}

        <button className="px-4 py-2 rounded bg-[#0C2E8A] text-white">Send</button>
      </form>
    </div>
  );
}
