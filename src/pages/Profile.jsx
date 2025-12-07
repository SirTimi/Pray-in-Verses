// src/pages/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  User, Mail, Edit2, Save, X, Camera, Shield, Bell, LogOut,
  Bookmark, CheckCircle, Heart, Calendar, Settings
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------- API helpers (prod => /api; dev => VITE_API_BASE || localhost) ---------- */
function detectApiBase() {
  const envBase = import.meta.env?.VITE_API_BASE;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Prefer same-origin /api in prod (avoids CORS-cookie issues)
    if (host === "prayinverses.com" || host === "www.prayinverses.com") {
      return "/api";
    }
  }
  // Ensure dev points at the API root that actually mounts /auth/*
  const base = envBase || "http://localhost:4000";
  return base.replace(/\/+$/, "") + "/api";
}
const API_BASE = detectApiBase();

// Small normalizer for /auth/me responses
function normalizeMe(payload) {
  const raw = payload?.user ?? payload?.data ?? payload;
  if (raw && typeof raw === "object" && raw.id) {
    return {
      id: String(raw.id),
      email: raw.email ?? null,
      displayName: raw.displayName ?? raw.name ?? "User",
      role: raw.role ?? "USER",
      createdAt: raw.createdAt ?? null,
    };
  }
  return null;
}

async function req(path, { method = "GET", body, headers = {}, signal } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(
    path.startsWith("http") ? path : `${API_BASE}${path}`,
    {
      method,
      credentials: "include",
      // Kill ETag/304 caching problems
      cache: "no-store",
      headers: isForm
        ? { ...headers, Accept: "application/json" }
        : { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal,
    }
  );

  // Treat 401 as a soft unauth (don’t throw; let the UI decide)
  if (res.status === 401) {
    return { __unauth: true };
  }

  // Some proxies will still send 304; handle it like 200 with possibly empty body
  if (res.status === 304) {
    return { __notModified: true };
  }

  // 204: no body
  if (res.status === 204) return { data: null };

  const raw = await res.text().catch(() => "");
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { data: raw };
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

const authAPI = {
  me: async () => {
    const r = await req("/auth/me");
    if (r?.__unauth) return null;
    // In the unlikely case of 304 + empty, re-fetch once with a cache buster
    if (r?.__notModified) {
      const again = await req(`/auth/me?ts=${Date.now()}`);
      if (again?.__unauth) return null;
      return normalizeMe(again);
    }
    return normalizeMe(r);
  },
  logout: () => req("/auth/logout", { method: "POST" }),
};

/* -------------------------------- Component -------------------------------- */
const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [user, setUser]       = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    joinDate: "",
    totalPrayers: 0,
    answeredPrayers: 0,
    savedPrayers: 0,
    notifications: true,
    privateProfile: false,
  });
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  async function refreshCountsFromServer() {
    let total = 0, answered = 0, saved = 0;
    try {
      const stats = await req("/my-prayers/stats");
      if (!stats?.__unauth) {
        total    = Number(stats?.total ?? 0);
        answered = Number(stats?.answered ?? 0);
      }
    } catch (e) {
      console.warn("GET /my-prayers/stats failed:", e);
    }

    try {
      const resp = await req("/saved-prayers");
      if (!resp?.__unauth) {
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        saved = list.length;
      }
    } catch (e) {
      console.warn("GET /saved-prayers failed:", e);
    }

    setProfile((prev) => ({
      ...prev,
      totalPrayers: total,
      answeredPrayers: answered,
      savedPrayers: saved,
    }));
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const u = await authAPI.me(); // null if unauth
        if (!alive) return;
        setUser(u);

        // If not logged in, stop here (avoid error toast)
        if (!u?.id) {
          setLoading(false);
          return;
        }

        const uid = u.id || u.email;
        const storedImg = uid
          ? localStorage.getItem(`profileImage_${uid}`) || localStorage.getItem("profileImage")
          : null;
        setProfileImage(storedImg || null);

        const joinDate = u.createdAt
          ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })
          : "Recently";

        const base = {
          name:  u.displayName || "User",
          email: u.email || "",
          joinDate,
          totalPrayers: 0,
          answeredPrayers: 0,
          savedPrayers: 0,
          notifications: true,
          privateProfile: false,
        };
        setProfile(base);
        setEditForm({ name: base.name, email: base.email });

        await refreshCountsFromServer();
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Could not load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshCountsFromServer().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /* ------------------------------ handlers ------------------------------ */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) return toast.error("Name is required");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(editForm.email)) return toast.error("Enter a valid email");

    try {
      setSaving(true);
      setProfile((p) => ({ ...p, name: editForm.name, email: editForm.email }));
      toast.success("Profile updated");
      setIsEditing(false);
      // TODO: PUT /api/users/profile when backend endpoint is ready
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ name: profile.name, email: profile.email });
    setIsEditing(false);
  };

  const handleImageUpload = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image < 5MB");
    if (!file.type.startsWith("image/")) return toast.error("Invalid image");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      setProfileImage(dataUrl);
      const uid = user?.id || user?.email || "anon";
      localStorage.setItem(`profileImage_${uid}`, dataUrl);
      localStorage.setItem("profileImage", dataUrl);
      toast.success("Profile picture updated!");
    };
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => fileInputRef.current?.click();

  const handleRemoveImage = () => {
    const uid = user?.id || user?.email || "anon";
    setProfileImage(null);
    localStorage.removeItem(`profileImage_${uid}`);
    localStorage.removeItem("profileImage");
    toast.success("Profile picture removed");
  };

  const toggleNotifications = () =>
    setProfile((p) => ({ ...p, notifications: !p.notifications }));

  const togglePrivacy = () =>
    setProfile((p) => ({ ...p, privateProfile: !p.privateProfile }));

  const handleSignOut = async () => {
    try {
      await authAPI.logout().catch(() => {});
      toast.success("Signed out");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  /* --------------------------------- UI --------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-40 px-4 pb-8 font-['Poppins']">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2E8A] mx-auto mb-4"></div>
            <p className="text-[#0C2E8A]">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow border p-6 text-center">
          <h2 className="text-lg font-semibold text-[#0C2E8A] mb-2">You’re signed out</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-lg bg-[#0C2E8A] text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    /* ... unchanged UI below ... */
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-40 px-4 pb-8">
      {/* rest of your component unchanged */}
    </div>
  );
};

export default Profile;
