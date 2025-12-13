// src/components/NotificationsBell.jsx
import React from 'react';
import { api } from '../api';

export default function NotificationsBell() {
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);

  async function load() {
    const res = await api.get('/notifications/mine?limit=20');
    setItems(res?.data || []);
  }
  React.useEffect(()=>{ load(); }, []);

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  return (
    <div className="relative">
      <button className="relative" onClick={()=>setOpen(o=>!o)}>
        🔔
        {items.some(x=>!x.readAt) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"/>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-md max-h-96 overflow-auto z-50">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No notifications</div>
          ) : items.map(row => (
            <div key={row.id} className="p-3 border-b last:border-b-0">
              <div className="text-sm font-medium">{row.notification.title}</div>
              <div className="text-sm text-slate-600">{row.notification.body}</div>
              <div className="flex items-center gap-3 mt-2">
                {row.notification.link && (
                  <a href={row.notification.link} className="text-xs text-blue-600 underline" target="_blank" rel="noreferrer">Open</a>
                )}
                {!row.readAt && (
                  <button className="text-xs text-slate-700 underline" onClick={()=>markRead(row.id)}>Mark read</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
