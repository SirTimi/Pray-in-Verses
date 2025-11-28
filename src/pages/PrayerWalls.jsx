// src/components/PrayerWalls.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Search,
  Send,
  Bookmark,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * API base rules
 * - Prefer VITE_API_BASE when defined (e.g., http://localhost:4000 or https://api.example.com)
 * - Otherwise default to "/api" so a dev proxy or same-origin API works
 * - Ensure no trailing slash, and join with a single slash
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "/api").trim();
const API_BASE = RAW_BASE.replace(/\/$/, "");
const apiURL = (path) => `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;

// --- Safe JSON helpers to prevent HTML pages being parsed as JSON ---
async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON, got ${ct || "unknown"}\n` + text.slice(0, 400)
    );
  }
  return res.json();
}

async function request(path, { method = "GET", body, headers = {}, allow401 = false } = {}) {
  const url = apiURL(path);
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (allow401 && res.status === 401) {
      // caller wants to treat 401 as a soft-fail (e.g., public page without login)
      return null;
    }
    // try to surface a meaningful error body
    const ct = res.headers.get("content-type") || "";
    const bodyText = ct.includes("application/json")
      ? JSON.stringify(await res.json().catch(() => ({})))
      : await res.text();
    const err = new Error(`HTTP ${res.status} ${res.statusText} at ${url}
${String(bodyText).slice(0, 400)}`);
    err.status = res.status;
    try { err.payload = JSON.parse(bodyText); } catch { err.payload = bodyText; }
    throw err;
  }
  return safeJson(res);
}

// Mock hooks (keep as-is)
const usePageLogger = (data) => {
  useEffect(() => {
    console.log("Page logged:", data);
  }, []); // eslint-disable-line
};
const logPrayer = (title, content, category) => {
  console.log("Prayer logged:", { title, content, category });
};

// Toast Component
const Toast = ({ message }) => (
  <div className="fixed top-20 right-4 md:right-6 bg-white shadow-lg rounded-lg px-4 py-3 border-l-4 border-green-500 z-50 animate-slide-in max-w-sm">
    <div className="flex items-center gap-2">
      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
      <span className="text-gray-800 font-medium text-sm md:text-base">
        {message}
      </span>
    </div>
  </div>
);

const categories = [
  "All",
  "Healing",
  "Provision",
  "Family",
  "Career",
  "Relationship",
  "Financial",
  "Spiritual",
  "Guidance",
  "Thanksgiving",
  "Other",
];

const categoryColors = {
  Healing: "bg-red-100 text-red-800",
  Family: "bg-green-100 text-green-800",
  Career: "bg-blue-100 text-blue-800",
  Relationship: "bg-purple-100 text-purple-800",
  Financial: "bg-yellow-100 text-yellow-800",
  Spiritual: "bg-indigo-100 text-indigo-800",
  Provision: "bg-emerald-100 text-emerald-800",
  Guidance: "bg-sky-100 text-sky-800",
  Thanksgiving: "bg-orange-100 text-orange-800",
  Other: "bg-gray-100 text-gray-800",
};

const PrayerWalls = () => {
  const nav = useNavigate();

  // server-backed items
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(null);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showComments, setShowComments] = useState(null);
  const [commentsMap, setCommentsMap] = useState({}); // id -> comments[]
  const [newComment, setNewComment] = useState("");

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // form
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Other",
    isUrgent: false,
    isAnonymous: false,
    // optional verse ref
    book: "",
    chapter: "",
    verse: "",
  });

  // toast
  const [toastMessage, setToastMessage] = useState("");
  const [stats, setStats] = useState({ users: 0, requests: 0 });
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Track page visit
  usePageLogger({
    title: "Prayer Wall",
    type: "page",
    reference: "Prayer Wall Page",
    content: "Browsing community prayer requests",
    category: "Prayer",
  });

  // Load list from server (NO TRAILING '?')
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const usp = new URLSearchParams();
      if (searchTerm.trim()) usp.set("q", searchTerm.trim());
      if (selectedCategory !== "All") usp.set("category", selectedCategory);
      const path = "/prayer-wall" + (usp.toString() ? `?${usp.toString()}` : "");

      const res = await request(path);
      const rows = res?.data ?? res ?? [];
      const norm = rows.map((r) => ({
        ...r,
        _likesCount: r.likesCount ?? r._likesCount ?? 0,
        _commentsCount: r.commentsCount ?? r._commentsCount ?? 0,
        currentUserLiked: !!r.currentUserLiked,
        currentUserBookmarked: !!r.currentUserBookmarked,
      }));
      setPrayerRequests(norm);
    } catch (err) {
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Failed to load prayer wall");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, nav]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // total users count (optional)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await request("/stats/users-count");
        if (alive) setTotalUsers(Number(res?.count ?? 0));
      } catch (e) {
        // silent
        console.warn("GET /stats/users-count failed:", e?.message || e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // prayer wall stats (users + requests). Keep it quiet: no probing of non-existent endpoints
  const statsWarnedRef = useRef(false);
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Users count (public). Soft-fail if protected/missing
        let users = 0;
        try {
          const usersResp = await request("/stats/users-count", { allow401: true });
          users = Number(usersResp?.count ?? 0) || 0;
        } catch {}

        // 2) Requests count via HEAD header if backend provides X-Total-Count
        let requests = 0;
        try {
          const head = await fetch(apiURL("/prayer-wall"), { method: "HEAD", credentials: "include" });
          if (head.ok) {
            const hdr = head.headers.get("x-total-count");
            const n = Number(hdr);
            if (Number.isFinite(n) && n >= 0) requests = n;
          }
        } catch {}

        // 3) Final fallback: visible list length (may be paginated)
        if (!requests) requests = Array.isArray(prayerRequests) ? prayerRequests.length : 0;

        if (alive) setStats({ users, requests });

        if (!statsWarnedRef.current && requests === 0) {
          console.warn("PrayerWalls: using list-length fallback for requests; add HEAD /prayer-wall with X-Total-Count for accuracy.");
          statsWarnedRef.current = true;
        }
      } catch (e) {
        if (!statsWarnedRef.current) {
          console.warn("PrayerWalls: stats fetch failed (silent mode)", e?.message || e);
          statsWarnedRef.current = true;
        }
      }
    })();

    return () => { alive = false; };
  }, [prayerRequests]);

  // Sort client-side for now
  const filteredSorted = (() => {
    let arr = [...prayerRequests];
    switch (sortBy) {
      case "newest":
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "most-prayed": // interpret as most liked
        arr.sort((a, b) => (b._likesCount || 0) - (a._likesCount || 0));
        break;
      case "urgent":
        arr.sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent));
        break;
      default:
        break;
    }
    return arr;
  })();

  // Like
  async function onToggleLike(id) {
    const current = prayerRequests.find((r) => r.id === id);
    if (!current) return;
    setPrayerRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              currentUserLiked: !r.currentUserLiked,
              _likesCount: (r._likesCount || 0) + (!r.currentUserLiked ? 1 : -1),
            }
          : r
      )
    );
    try {
      await request(`/prayer-wall/${id}/like`, { method: "POST" });
    } catch (err) {
      // revert
      setPrayerRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                currentUserLiked: !r.currentUserLiked,
                _likesCount:
                  (r._likesCount || 0) + (r.currentUserLiked ? 1 : -1),
              }
            : r
        )
      );
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Action failed");
    }
  }

  // Bookmark
  async function onToggleBookmark(id) {
    const current = prayerRequests.find((r) => r.id === id);
    if (!current) return;
    setPrayerRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, currentUserBookmarked: !r.currentUserBookmarked } : r
      )
    );
    try {
      await request(`/prayer-wall/${id}/bookmark`, { method: "POST" });
      showToast(current.currentUserBookmarked ? "Removed bookmark" : "Bookmarked!");
    } catch (err) {
      // revert
      setPrayerRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, currentUserBookmarked: !r.currentUserBookmarked } : r
        )
      );
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Action failed");
    }
  }

  // Show comments
  async function onToggleComments(id) {
    const next = showComments === id ? null : id;
    setShowComments(next);
    if (!next) return;

    try {
      const res = await request(`/prayer-wall/${id}`);
      const item = res?.data ?? res ?? null;
      const comments = item?.comments ?? [];
      setCommentsMap((m) => ({ ...m, [id]: comments }));
      setPrayerRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                _commentsCount: item?.commentsCount ?? comments.length ?? r._commentsCount ?? 0,
                currentUserBookmarked: !!item?.currentUserBookmarked,
                currentUserLiked: !!item?.currentUserLiked,
              }
            : r
        )
      );
    } catch (err) {
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Failed to load comments");
    }
  }

  // Add comment
  async function onAddComment(requestId) {
    const body = newComment.trim();
    if (!body) return;
    try {
      const res = await request(`/prayer-wall/${requestId}/comments`, {
        method: "POST",
        body: { body },
      });
      const created = res?.data ?? res;
      setCommentsMap((m) => ({
        ...m,
        [requestId]: [created, ...(m[requestId] || [])],
      }));
      setPrayerRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, _commentsCount: (r._commentsCount || 0) + 1 }
            : r
        )
      );
      setNewComment("");
      showToast("Comment added");
    } catch (err) {
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Failed to add comment");
    }
  }

  // Create request
  function resetForm() {
    setFormData({
      title: "",
      content: "",
      category: "Other",
      isUrgent: false,
      isAnonymous: false,
      book: "",
      chapter: "",
      verse: "",
    });
  }
  async function onCreate(e) {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.content.trim(), // server expects 'description'
        category: formData.category || "Other",
        isUrgent: !!formData.isUrgent,
        isAnonymous: !!formData.isAnonymous,
      };
      if (formData.book && Number(formData.chapter) && Number(formData.verse)) {
        payload.book = formData.book.trim();
        payload.chapter = Number(formData.chapter);
        payload.verse = Number(formData.verse);
      }

      await request("/prayer-wall", { method: "POST", body: payload });
      setShowModal(false);
      resetForm();
      showToast("Prayer request posted successfully!");
      loadList();
      logPrayer(`Posted Prayer Request: ${payload.title}`, payload.description, payload.category);
    } catch (err) {
      if (err.status === 401) nav("/login", { replace: true });
      else showToast(err.message || "Create failed");
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffH = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH} hours ago`;
    return `${Math.floor(diffH / 24)} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 pt-24 pl-0 lg:pl-[224px] font-['Poppins']">
      {toastMessage && <Toast message={toastMessage} />}

      <main className="flex-1 space-y-10 px-4 lg:px-6 pb-10">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C2E8A] to-blue-700 rounded-lg shadow-lg p-6 md:p-8 text-white mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-base font-semibold mb-2">Community Prayer Wall</h1>
                <p className="text-blue-100 text-sm">
                  {totalUsers == null
                    ? "Join believers in prayer and support"
                    : <>Join <span className="font-semibold">{totalUsers.toLocaleString()}</span>+ believers in prayer and support</>}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <p className="text-sm font-medium">
                    {prayerRequests.length} Active Requests
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action card */}
          <div className="bg-[#FCCF3A] rounded-lg p-4 mt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-[#0C2E8A] font-semibold text-base mb-1">Need Prayer?</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Share your prayer request with our loving community
                </p>
                <button
                  className="bg-[#0C2E8A] text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 transition font-medium text-sm flex items-center gap-2"
                  onClick={() => setShowModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  Post Your Prayer Request
                </button>
              </div>
            </div>
          </div>

          {/* Browse header */}
          <div className="flex items-center pt-8 justify-between gap-3 mb-4">
            <div className="grid">
              <h2 className="text-base font-semibold text-[#0C2E8A]">Browse Prayer Requests</h2>
              <p className="text-sm text-gray-600">Support others through prayer and encouragement</p>
            </div>
            <div className="w-10 h-0.5 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-full"></div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search prayer requests by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadList()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#0C2E8A] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-[#0C2E8A] mb-2">
                  Filter by Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        selectedCategory === cat
                          ? "bg-[#0C2E8A] text-white"
                          : "bg-[#FCCF3A] text-[#0C2E8A] font-bold hover:bg-[#ABBC6B]"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2E8A] focus:border-transparent"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most-prayed">Most Liked</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                onClick={loadList}
                className="px-4 py-2 rounded-md border bg-white text-gray-900"
              >
                Apply
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse" />
              ))
            ) : filteredSorted.length > 0 ? (
              filteredSorted.map((req) => {
                const name =
                  req.isAnonymous ? "Anonymous" : (req.user?.name || req.user?.email || "User");
                const created = req.createdAt ? formatTimeAgo(req.createdAt) : "";
                const commentsFor = commentsMap[req.id] || [];
                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-lg transition ${
                      req.answered ? "bg-green-50 border-green-300" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C2E8A] text-white font-bold flex-shrink-0">
                          {name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-[#0C2E8A] break-words">
                            {req.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            by {name} {created && `• ${created}`}
                          </p>
                        </div>
                      </div>

                      {/* Bookmark */}
                      <button
                        onClick={() => onToggleBookmark(req.id)}
                        className={`p-2 rounded-lg transition flex-shrink-0 ${
                          req.currentUserBookmarked
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600"
                        }`}
                        title="Bookmark"
                      >
                        <Bookmark className={`w-5 h-5 ${req.currentUserBookmarked ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {req.description && (
                      <p className="text-gray-700 text-sm mb-4 break-words leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap mb-4">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          categoryColors[req.category] || categoryColors.Other
                        }`}
                      >
                        {req.category || "Other"}
                      </span>
                      {req.isUrgent && (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-200 text-red-800 font-medium">
                          Urgent
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-4">
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition font-medium text-sm ${
                            req.currentUserLiked
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600"
                          }`}
                          onClick={() => onToggleLike(req.id)}
                          title={req.currentUserLiked ? "Unlike" : "Like"}
                        >
                          <Heart className={`w-4 h-4 ${req.currentUserLiked ? "fill-current" : ""}`} />
                          <span>{req._likesCount || 0}</span>
                        </button>

                        <button
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-[#0C2E8A] transition font-medium text-sm"
                          onClick={() => onToggleComments(req.id)}
                          title="Comments"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{req._commentsCount ?? commentsFor.length ?? 0}</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    {showComments === req.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        {commentsFor.length === 0 ? (
                          <div className="text-sm text-gray-500">No comments yet.</div>
                        ) : (
                          commentsFor.map((c) => {
                            const who = c.user?.name //|| c.user?.email || "User";
                            const when = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
                            return (
                              <div key={c.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-[#0C2E8A] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                  {who?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#0C2E8A] break-words">{who}</p>
                                  <p className="text-sm text-gray-700 break-words">{c.body}</p>
                                  {when && <span className="text-xs text-gray-400">{when}</span>}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Add Comment */}
                        <div className="flex gap-2 items-center mt-3">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onAddComment(req.id)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2E8A] focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => onAddComment(req.id)}
                            className="bg-[#0C2E8A] text-white p-2 rounded-lg hover:bg-blue-800 transition flex-shrink-0"
                            title="Send comment"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-blue-700" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  {searchTerm || selectedCategory !== "All"
                    ? "No prayer requests match your search"
                    : "No prayer requests yet"}
                </h3>
                <p className="text-gray-600 mb-6 px-4">
                  {searchTerm || selectedCategory !== "All"
                    ? "Try adjusting your search or filter"
                    : "Be the first to share a prayer request with the community"}
                </p>
                {!searchTerm && selectedCategory === "All" && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#0C2E8A] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-medium"
                  >
                    Add First Prayer Request
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="bg-gradient-to-r from-[#0C2E8A] to-blue-700 p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">
                        Share Your Prayer Request
                      </h2>
                      <p className="text-blue-100 text-sm">
                        Our community is here to pray with you
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={onCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prayer Request Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Healing for my mother, Job interview tomorrow..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0C2E8A] focus:border-[#0C2E8A] transition"
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Describe Your Request *
                  </label>
                  <textarea
                    placeholder="Share the details of what you need prayer for…"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows="5"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0C2E8A] focus:border-[#0C2E8A] resize-none transition"
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0C2E8A] focus:border-[#0C2E8A] transition"
                    >
                      {categories.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <label className="inline-flex items-center gap-2 mt-7">
                      <input
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                      />
                      <span className="text-sm">Mark as urgent</span>
                    </label>
                    <label className="inline-flex items-center gap-2 mt-7">
                      <input
                        type="checkbox"
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      />
                      <span className="text-sm">Post anonymously</span>
                    </label>
                  </div>
                </div>

                {/* Optional verse reference */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Book (optional)</label>
                    <input
                      value={formData.book}
                      onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                      placeholder="e.g., John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chapter</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Verse</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.verse}
                      onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0C2E8A] text-white rounded-lg hover:bg-blue-800 transition font-medium shadow-lg shadow-blue-500/30"
                  >
                    Submit Prayer Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default PrayerWalls;
