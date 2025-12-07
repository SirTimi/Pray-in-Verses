// src/hooks/useMe.ts
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

export type PublicUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role?: string | null;
};

function normalizeMe(res: any): PublicUser | null {
  if (!res) return null;
  const raw = res.user ?? res.data ?? res;
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return {
      id: String((raw as any).id),
      email: (raw as any).email ?? null,
      displayName: (raw as any).displayName ?? null,
      role: (raw as any).role ?? null,
    };
  }
  return null;
}

export function useMe() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get('/auth/me'); // ✅ single argument
      const u = normalizeMe(res);
      setUser(u); // null if 401 or unexpected shape (handled below)
    } catch (e: any) {
      // Treat 401 as "not logged in", anything else as an error
      const status =
        e?.status ??
        e?.response?.status ??
        (typeof e?.message === 'string' && e.message.includes('401') ? 401 : 0);
      if (status === 401) {
        setUser(null);
      } else {
        setErr(e?.message ?? 'AUTH');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, err, refresh, setUser };
}
