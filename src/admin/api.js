// src/admin/api.js

// Prefer explicit VITE_API_BASE if provided.
// Otherwise: in production (same-origin) use "/api"; in local dev use "http://localhost:4000".
const inferBase = () => {
  const env = import.meta?.env?.VITE_API_BASE;
  if (env && typeof env === "string") return env.replace(/\/+$/, "");

  const host = typeof window !== "undefined" ? window.location.host : "";
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".local");

  return isLocal ? "http://localhost:4000" : "/api";
};

export const API_BASE = inferBase();

/** ----------------------------- core request ----------------------------- */
async function request(
  path,
  { method = "GET", body, headers = {}, allow401 = false } = {}
) {
  const url = `${API_BASE}${path}`;
  let res;

  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Network error: surface a consistent shape so callers can decide.
    return { status: 0, error: "NETWORK_ERROR", detail: String(e) };
  }

  if (res.status === 401 && !allow401) {
    // Unauth everywhere except where explicitly allowed (e.g., login, accept invite)
    window.location.assign("/admin/login");
    return;
  }

  // Some endpoints legitimately return 204 No Content
  if (res.status === 204) return { status: 204, data: null };

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { data: text };
  }
  return { status: res.status, ...data };
}

/** ----------------------------- normalizers ----------------------------- */
function normalizeListPayload(payload) {
  const items =
    payload?.data ??
    payload?.items ??
    payload?.rows ??
    (Array.isArray(payload) ? payload : []);
  const nextCursor = payload?.nextCursor ?? payload?.cursor ?? null;
  return { items, nextCursor };
}

function normalizeSinglePayload(payload) {
  const data =
    payload?.data ??
    payload?.item ??
    payload?.row ??
    (payload && typeof payload === "object" ? payload : null);
  return { data };
}

function normalizeUserShape(u) {
  if (!u) return null;
  return {
    id: u.id ?? u.userId ?? null,
    displayName: u.displayName ?? u.name ?? u.email ?? "—",
    role: u.role ?? u.userRole ?? "USER",
    email: u.email ?? null,
  };
}

const keyOfUser = (u) => (u?.id || u?.email || u?.displayName || "").toString();

/** Merge missing identity fields from a lookup map into a partial user */
function hydrateUser(partial, map) {
  if (!partial) return null;
  const id = partial.id ?? null;
  const found = id ? map.get(id) : null;
  if (!found) return normalizeUserShape(partial);
  const merged = {
    id: found.id,
    displayName:
      partial.displayName || found.displayName || found.email || "—",
    email: partial.email || found.email || null,
    role: partial.role || found.role || "USER",
  };
  return merged;
}

/** Collect unique user IDs we should look up from a batch of curated rows */
function collectUserIds(rows) {
  const ids = new Set();
  for (const it of rows) {
    const ownerId = it?.owner?.id ?? it?.ownerId ?? it?.createdById;
    if (ownerId) ids.add(ownerId);

    if (Array.isArray(it?.contributors)) {
      it.contributors.forEach((c) => {
        const id = (typeof c === "string" ? c : c?.id) ?? null;
        if (id) ids.add(id);
      });
    }
    if (Array.isArray(it?.contributorIds)) {
      it.contributorIds.forEach((id) => id && ids.add(id));
    }
    if (Array.isArray(it?.history)) {
      it.history.forEach((h) => {
        const id =
          h?.actor?.id ??
          h?.user?.id ??
          (typeof h?.actor === "string" ? h.actor : null);
        if (id) ids.add(id);
      });
    }
  }
  return Array.from(ids);
}

/** ------------------------------- API  ---------------------------------- */
export const api = {
  /* auth */
  me: () => request("/auth/me"),
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
      allow401: true,
    }),
  logout: () => request("/auth/logout", { method: "POST" }),

  /* invites / users */
  createInvite: (email, role) =>
    request("/admin/invites", { method: "POST", body: { email, role } }),
  listInvites: () => request("/admin/invites"),
  acceptInvite: (token, password, name) =>
    request("/admin/invites/accept", {
      method: "POST",
      body: { token, password, name },
      allow401: true,
    }),
  listUsers: () => request("/admin/users"),
  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),

  /**
   * Identity lookup for all admin roles.
   * GET /admin/users/lookup?ids=a,b,c
   */
  lookupUsersByIds: async (ids = []) => {
    if (!ids.length) return { map: new Map(), status: 200 };
    const p = new URLSearchParams({ ids: ids.join(",") });
    const res = await request(`/admin/users/lookup?${p.toString()}`);

    // If backend hasn’t mounted this route yet (404), or we got a network failure, just continue gracefully.
    if (!res || res.status === 404 || res.status === 0) {
      return { map: new Map(), status: res?.status ?? 0 };
    }

    const rows = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];

    const map = new Map(
      rows.filter(Boolean).map((u) => [u.id, normalizeUserShape(u)])
    );
    return { map, status: res.status };
  },

  /* curated list (with identity hydration) */
  listCurated: async (q, state, book, limit = 20, cursor) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (state) p.set("state", state);
    if (book) p.set("book", book);
    if (limit) p.set("limit", String(limit));
    if (cursor) p.set("cursor", cursor);
    p.set("include", "owner,contributors");

    const res = await request(`/admin/curated-prayers?${p.toString()}`);
    if (!res) return { items: [], nextCursor: null, status: 401 };

    const { items, nextCursor } = normalizeListPayload(res);
    const baseRows = (items || []).map((it) => {
      const ownerRaw = it.owner || it.createdBy || null;
      const owner = normalizeUserShape(ownerRaw);

      let rawContribs = [];
      if (Array.isArray(it?.contributors)) rawContribs = it.contributors;
      else if (Array.isArray(it?.audit?.contributors))
        rawContribs = it.audit.contributors;
      else if (Array.isArray(it?.history)) {
        rawContribs = it.history
          .map((h) => h.actor || h.user || null)
          .filter(Boolean);
      }

      const seen = new Set();
      const contributors = rawContribs
        .map(normalizeUserShape)
        .filter(Boolean)
        .filter((c) => {
          const key = keyOfUser(c);
          if (!key) return false;
          if (owner && c.id && owner.id && c.id === owner.id) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      return {
        ...it,
        owner,
        ownerId: owner?.id ?? it.ownerId ?? it.createdById ?? null,
        ownerDisplayName:
          owner?.displayName ??
          it.ownerDisplayName ??
          it.createdByName ??
          owner?.email ??
          it.ownerEmail ??
          it.createdByEmail ??
          "—",
        ownerRole: owner?.role ?? it.ownerRole ?? it.createdByRole ?? "USER",
        contributors,
        contributorIds: Array.isArray(it.contributorIds)
          ? it.contributorIds
          : undefined,
      };
    });

    const needIds = collectUserIds(baseRows);
    let lookupMap = new Map();

    if (needIds.length) {
      try {
        const { map } = await api.lookupUsersByIds(needIds);
        lookupMap = map || new Map();
      } catch {
        lookupMap = new Map();
      }

      // Fallback if open lookup isn’t available
      if (!lookupMap.size) {
        try {
          const lu = await api.listUsers();
          const rows = Array.isArray(lu?.data) ? lu.data : Array.isArray(lu) ? lu : [];
          rows.forEach((u) => {
            const nu = normalizeUserShape(u);
            if (nu?.id) lookupMap.set(nu.id, nu);
          });
        } catch {
          /* ignore */
        }
      }
    }

    const normalized = baseRows.map((it) => {
      const owner =
        it.ownerId && (!it.owner || !it.owner.displayName || !it.owner.email)
          ? hydrateUser({ id: it.ownerId, ...it.owner }, lookupMap)
          : it.owner;

      let contributors = it.contributors || [];
      if (
        !contributors.length &&
        Array.isArray(it.contributorIds) &&
        it.contributorIds.length
      ) {
        contributors = it.contributorIds
          .map((id) => hydrateUser({ id }, lookupMap))
          .filter(Boolean);
      } else {
        contributors = contributors.map((c) =>
          c?.id ? hydrateUser(c, lookupMap) : normalizeUserShape(c)
        );
      }

      const seen = new Set();
      const finalContribs = [];
      for (const c of contributors) {
        const k = keyOfUser(c);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        if (owner?.id && c?.id && owner.id === c.id) continue;
        finalContribs.push(c);
      }

      return {
        ...it,
        owner,
        ownerId: owner?.id ?? it.ownerId ?? null,
        ownerDisplayName: owner?.displayName ?? it.ownerDisplayName ?? "—",
        ownerRole: owner?.role ?? it.ownerRole ?? "USER",
        contributors: finalContribs,
      };
    });

    return { items: normalized, nextCursor, status: res.status };
  },

  /* single curated */
  getCuratedRaw: (id) => request(`/admin/curated-prayers/${id}`),
  getCurated: async (id) => {
    const res = await request(`/admin/curated-prayers/${id}`);
    if (!res) return { data: null, status: 401 };
    const { data } = normalizeSinglePayload(res);
    return { ...res, data };
  },

  /* mutations */
  createCurated: (payload) =>
    request(`/admin/curated-prayers`, { method: "POST", body: payload }),
  updateCurated: (id, payload) =>
    request(`/admin/curated-prayers/${id}`, { method: "PATCH", body: payload }),
  transitionCurated: (id, target) =>
    request(`/admin/curated-prayers/${id}/transition`, {
      method: "POST",
      body: { target },
    }),
  updatePublishState: (id, state) =>
    request(`/admin/curated-prayers/${id}/publish-state`, {
      method: "PATCH",
      body: { state },
    }),
  deleteCurated: (id) =>
    request(`/admin/curated-prayers/${id}`, { method: "DELETE" }),

  /* per-point admin editing */
  prayerPoints: {
    replace: (id, items) =>
      request(`/admin/curated-prayers/${id}/prayer-points`, {
        method: "PATCH",
        body: { items },
      }),
    append: (id, text) =>
      request(`/admin/curated-prayers/${id}/prayer-points`, {
        method: "POST",
        body: { text },
      }),
    updateOne: (id, index, text) =>
      request(`/admin/curated-prayers/${id}/prayer-points/${index}`, {
        method: "PATCH",
        body: { text },
      }),
    removeOne: (id, index) =>
      request(`/admin/curated-prayers/${id}/prayer-points/${index}`, {
        method: "DELETE",
      }),
    reorder: (id, from, to) =>
      request(`/admin/curated-prayers/${id}/prayer-points/reorder`, {
        method: "POST",
        body: { from, to },
      }),
  },

  replaceCuratedPoints: (id, items) =>
    request(`/admin/curated-prayers/${id}/prayer-points`, {
      method: "PATCH",
      body: { items },
    }),

  /* bible helpers (admin) */
  bibleBooks: () => request(`/admin/bible/books`),
  bibleChapters: (book) =>
    request(`/admin/bible/books/${encodeURIComponent(book)}/chapters`),
  bibleVerses: (book, chapter) =>
    request(
      `/admin/bible/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`
    ),

  /* shared browse helpers */
  books: () => request(`/browse/books`),
  chapters: (book) =>
    request(`/browse/books/${encodeURIComponent(book)}/chapters`),
  verses: (book, chapter) =>
    request(`/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`),

  /* saved points & counts (shared) */
  savePoint: (curatedPrayerId, index) =>
    request(`/saved-prayers/${curatedPrayerId}/points/${index}`, {
      method: "POST",
    }),
  unsavePoint: (curatedPrayerId, index) =>
    request(`/saved-prayers/${curatedPrayerId}/points/${index}`, {
      method: "DELETE",
    }),
  publishedPointsCount: () => request(`/browse/published-points-count`),
};
