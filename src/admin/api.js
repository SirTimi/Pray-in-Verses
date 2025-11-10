// src/admin/api.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

async function request(
  path,
  { method = "GET", body, headers = {}, allow401 = false } = {}
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !allow401) {
    window.location.assign("/admin/login");
    return;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { data: text };
  }
  return { status: res.status, ...data };
}

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

export const api = {
  me: () => request("/auth/me"),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
      allow401: true,
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

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

  // *** UPDATED: ask API to include owner and normalize owner fields
  listCurated: async (q, state, book, limit = 20, cursor) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (state) p.set("state", state);
    if (book) p.set("book", book);
    if (limit) p.set("limit", String(limit));
    if (cursor) p.set("cursor", cursor);

    // Ask backend to expand/include owner. If your controller uses a different key
    // (e.g. ?expand=owner or ?with=owner), change this line accordingly.
    p.set("include", "owner");

    const res = await request(`/admin/curated-prayers?${p.toString()}`);
    if (!res) return { items: [], nextCursor: null, status: 401 };
    const { items, nextCursor } = normalizeListPayload(res);

    const normalized = (items || []).map((it) => {
      const owner = it.owner || it.createdBy || null;
      const ownerDisplayName =
        owner?.displayName ??
        it.ownerDisplayName ??
        it.createdByName ??
        owner?.email ??
        it.ownerEmail ??
        it.createdByEmail ??
        "—";
      const ownerRole =
        owner?.role ??
        it.ownerRole ??
        it.createdByRole ??
        null;
      const ownerId =
        owner?.id ??
        it.ownerId ??
        it.createdById ??
        null;

      return {
        ...it,
        owner,
        ownerDisplayName,
        ownerRole,
        ownerId,
      };
    });

    return { items: normalized, nextCursor, status: res.status };
  },

  getCuratedRaw: (id) => request(`/admin/curated-prayers/${id}`),

  getCurated: async (id) => {
    const res = await request(`/admin/curated-prayers/${id}`);
    if (!res) return { data: null, status: 401 };
    const { data } = normalizeSinglePayload(res);
    return { ...res, data };
  },

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

  bibleBooks: () => request(`/admin/bible/books`),
  bibleChapters: (book) =>
    request(`/admin/bible/books/${encodeURIComponent(book)}/chapters`),
  bibleVerses: (book, chapter) =>
    request(
      `/admin/bible/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`
    ),

  books: () => request(`/browse/books`),
  chapters: (book) =>
    request(`/browse/books/${encodeURIComponent(book)}/chapters`),
  verses: (book, chapter) =>
    request(
      `/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`
    ),

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
