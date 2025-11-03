import React, { useEffect, useRef, useState } from "react";
import {
  User, Mail, Edit2, Save, X, Camera, Shield, Bell, LogOut,
  Bookmark, CheckCircle, Heart, Calendar, Settings
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ---- API helpers (align with /api on prod; VITE_API_BASE or localhost in dev)
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

async function req(path, { method = "GET", body, headers = {} } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(
    path.startsWith("http") ? path : `${API_BASE}${path}`,
    {
      method,
      credentials: "include",
      headers: isForm ? headers : { "Content-Type": "application/json", ...headers },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    }
  );
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

// (optional) tiny helper
const authAPI = {
  me:    () => req("/auth/me"),
  logout:() => req("/auth/logout", { method: "POST" }),
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Loading gates
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Session user (authoritative from server)
  const [user, setUser] = useState(null);

  // Profile image (local-only for now)
  const [profileImage, setProfileImage] = useState(null);

  // Profile fields (editable)
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // 1) Get session user from server
        const me = await authAPI.me().catch((e) => {
          if (e.status === 401) return null;
          throw e;
        });

        // Don’t navigate from here; RequireAuth already guarded the route.
        const u = me?.user ?? me ?? null;
        setUser(u);

        // 2) Profile image (by user id/email)
        const uid = u?.id || u?.email;
        const storedImg = uid
          ? localStorage.getItem(`profileImage_${uid}`) || localStorage.getItem("profileImage")
          : null;
        setProfileImage(storedImg || null);

        // 3) Stats (saved prayers via API; others are placeholders for now)
        let savedCount = 0;
        try {
          const saved = await req("/saved-prayers");
          const list = saved?.data || saved || [];
          savedCount = Array.isArray(list) ? list.length : 0;
        } catch { /* keep 0 */ }

        // 4) Total/answered placeholders (replace with real endpoints later)
        const totalPrayers = 0;
        const answeredPrayers = 0;

        const joinDate = u?.createdAt
          ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })
          : "Recently";

        const name = u?.name || u?.displayName || "User";
        const email = u?.email || "";

        const next = {
          name,
          email,
          joinDate,
          totalPrayers,
          answeredPrayers,
          savedPrayers: savedCount,
          notifications: true,
          privateProfile: false,
        };
        if (!alive) return;
        setProfile(next);
        setEditForm({ name: next.name, email: next.email });
      } catch (err) {
        // If something fails, still render a lightweight fallback instead of redirecting
        console.error("Profile load error:", err);
        toast.error("Could not load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    // No backend endpoint yet; keep local update only.
    if (!editForm.name.trim()) return toast.error("Name is required");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(editForm.email)) return toast.error("Enter a valid email");

    try {
      setSaving(true);
      setProfile((p) => ({ ...p, name: editForm.name, email: editForm.email }));
      toast.success("Profile updated");
      setIsEditing(false);
      // TODO: PUT /api/users/profile when ready
    } catch (e) {
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

  // If somehow user is null here, show inline prompt (don’t navigate)
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
        <div className="text-center mb-8">
          <h1 className="text-base font-semibold text-[#0C2E8A] mb-2">My Profile</h1>
          <p className="text-[#0C2E8A] text-base">Manage your prayer journey</p>
        </div>

        <div className="max-w-4xl mx-auto">
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
