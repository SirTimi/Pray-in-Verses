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
    const onProd = host === "prayinverses.com" || host === "www.prayinverses.com";
    if (onProd) return "/api";
  }
  return envBase || "http://localhost:4000/api";
}
const API_BASE = detectApiBase();

async function req(path, { method = "GET", body, headers = {}, signal } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(path.startsWith("http") ? path : `${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: isForm ? headers : { "Content-Type": "application/json", ...headers },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    signal,
  });
  const raw = await res.text().catch(() => "");
  let data;
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { data: raw }; }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `${res.status} ${res.statusText}`);
    err.status = res.status; err.payload = data;
    throw err;
  }
  return data;
}

const authAPI = {
  me:    () => req("/auth/me"),
  logout:() => req("/auth/logout", { method: "POST" }),
};

/* -------------------------------- Component -------------------------------- */
const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Loading gates
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Session user (from server)
  const [user, setUser] = useState(null);

  // Local-only profile image
  const [profileImage, setProfileImage] = useState(null);

  // Editable profile fields
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

  // ---- stats refresher (TOTAL & ANSWERED from /my-prayers/stats; SAVED from /saved-prayers) ----
  async function refreshCountsFromServer() {
    let total = 0, answered = 0, saved = 0;

    // 1) my-prayers stats
    try {
      const stats = await req("/my-prayers/stats"); // { total, open, answered }
      total    = Number(stats?.total ?? 0);
      answered = Number(stats?.answered ?? 0);
    } catch (e) {
      console.warn("GET /my-prayers/stats failed:", e);
    }

    // 2) saved-prayers list length
    try {
      const resp = await req("/saved-prayers");
      const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
      saved = list.length;
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

  // ---- initial load: user + image + counts ----
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const me = await authAPI.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
        const u = me?.user ?? me ?? null;
        if (!alive) return;
        setUser(u);

        const uid = u?.id || u?.email;
        const storedImg = uid
          ? localStorage.getItem(`profileImage_${uid}`) || localStorage.getItem("profileImage")
          : null;
        if (!alive) return;
        setProfileImage(storedImg || null);

        const joinDate = u?.createdAt
          ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })
          : "Recently";

        const base = {
          name:  u?.name || u?.displayName || "User",
          email: u?.email || "",
          joinDate,
          totalPrayers: 0,
          answeredPrayers: 0,
          savedPrayers: 0,
          notifications: true,
          privateProfile: false,
        };
        setProfile(base);
        setEditForm({ name: base.name, email: base.email });

        // then load counts
        await refreshCountsFromServer();
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Could not load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // refresh counts when tab regains focus (optional but nice)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pl-40 px-4 pb-8">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-base font-semibold text-[#0C2E8A] mb-2">My Profile</h1>
          <p className="text-[#0C2E8A] text-base">Manage your prayer journey</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow border mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0C2E8A] to-[#FCCF3A] h-32"></div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-4">
                <div className="w-32 h-32 bg-white rounded-full p-2 mx-auto relative shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-16 h-16 text-[#0C2E8A]" />
                    </div>
                  )}

                  <button
                    onClick={handleCameraClick}
                    className="absolute bottom-2 right-2 bg-[#0C2E8A] text-white p-2 rounded-full hover:bg-[#1a4ba0] transition shadow-lg"
                    title="Upload profile picture"
                    aria-label="Upload profile picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {profileImage && (
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition shadow-lg"
                      title="Remove profile picture"
                      aria-label="Remove profile picture"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="text-center">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleFormChange}
                    className="text-3xl font-bold text-[#0C2E8A] bg-transparent border-b-2 border-[#0C2E8A] focus:outline-none text-center"
                    disabled={saving}
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-[#0C2E8A]">{profile.name}</h1>
                )}
                <p className="text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {profile.joinDate}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats cards */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 text-center shadow border hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#FCCF3A] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-[#0C2E8A]" />
                  </div>
                  <p className="text-base font-semibold text-[#0C2E8A]">{profile.totalPrayers}</p>
                  <p className="text-gray-600">Total Prayers</p>
                </div>

                <div className="bg-white rounded-2xl p-6 text-center shadow border hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#FCCF3A] rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-[#0C2E8A]" />
                  </div>
                  <p className="text-base font-semibold text-[#0C2E8A]">{profile.answeredPrayers}</p>
                  <p className="text-gray-600">Answered Prayers</p>
                </div>

                <div className="bg-white rounded-2xl p-6 text-center shadow border hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#FCCF3A] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bookmark className="w-6 h-6 text-[#0C2E8A]" />
                  </div>
                  <p className="text-base font-semibold text-[#0C2E8A]">{profile.savedPrayers}</p>
                  <p className="text-gray-600">Saved Prayers</p>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-[#0C2E8A] flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </h2>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0C2E8A] text-white rounded-lg hover:bg-[#1a4ba0] transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0C2E8A] text-white rounded-lg hover:bg-[#1a4ba0] transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FCCF3A] text-[#0C2E8A] rounded-lg hover:bg-[#fdd55a] transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-[#0C2E8A]">
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                        <span className="text-[#0C2E8A] flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </span>
                        <button
                          onClick={() => toast("Email change flow coming soon", { icon: "📧" })}
                          className="text-[#0C2E8A] hover:text-[#1a4ba0] text-sm font-semibold transition"
                        >
                          Change Email
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Member Since
                    </label>
                    <p className="px-4 py-3 bg-gray-50 rounded-lg text-[#0C2E8A] flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {profile.joinDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow border p-6">
                <h2 className="text-base font-semibold text-[#0C2E8A] mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-[#0C2E8A]" />
                      <div>
                        <span className="text-[#0C2E8A] block font-medium">Notifications</span>
                        <span className="text-xs text-gray-500">Prayer reminders & updates</span>
                      </div>
                    </div>
                    <button
                      onClick={toggleNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.notifications ? "bg-[#0C2E8A]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.notifications ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#0C2E8A]" />
                      <div>
                        <span className="text-[#0C2E8A] block font-medium">Private Profile</span>
                        <span className="text-xs text-gray-500">Hide your prayer activity</span>
                      </div>
                    </div>
                    <button
                      onClick={togglePrivacy}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        profile.privateProfile ? "bg-[#0C2E8A]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          profile.privateProfile ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 transition rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>{/* grid */}
        </div>
      </div>
    </div>
  );
};

export default Profile;
