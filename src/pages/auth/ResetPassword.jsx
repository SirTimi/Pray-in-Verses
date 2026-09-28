// src/pages/auth/ResetPassword.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";
import logo from "../../assets/images/prayinverse2.png";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, { method = "POST", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text().catch(() => "");
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    const err = new Error(payload?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") || "",
    [location.search]
  );

  const mobileResetUrl = useMemo(() => {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return `pray-in-verses://reset-password${query}`;
  }, [token]);

  const isMobileDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;

    const userAgentDataMobile = navigator.userAgentData?.mobile;
    if (typeof userAgentDataMobile === "boolean") {
      return userAgentDataMobile;
    }

    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isMobileDevice || !token) return;

    const timer = window.setTimeout(() => {
      window.location.replace(mobileResetUrl);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isMobileDevice, mobileResetUrl, token]);

  // lock scroll + set --vh (to match your auth screens)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return toast.error("Reset link is invalid or missing.");
    if (!newPassword) return toast.error("Please enter a new password.");
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters.");
    if (newPassword !== confirm) return toast.error("Passwords do not match.");

    setLoading(true);
    try {
      await request("/auth/reset-password", { body: { token, newPassword } });
      toast.success("Password reset successfully. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Reset failed. The link may be expired.");
    } finally {
      setLoading(false);
    }
  }

  if (isMobileDevice) {
    return (
      <div
        className="w-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary overflow-hidden px-4 sm:px-6"
        style={{ height: "calc(var(--vh,1vh)*100)" }}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col items-center justify-center p-6 text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Pray in Verses" className="h-32 w-32 object-contain" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Opening Pray in Verses
          </h2>

          <p className="text-sm text-slate-600 leading-6">
            Your secure password reset will continue in the Pray in Verses app.
          </p>

          {token ? (
            <a
              href={mobileResetUrl}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white"
            >
              Open Pray in Verses
            </a>
          ) : (
            <p className="mt-5 text-sm text-amber-600">
              This reset link is incomplete. Request a new password reset link from the app.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary overflow-hidden px-4 sm:px-6"
      style={{ height: "calc(var(--vh,1vh)*100)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col justify-center p-6">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="logo" className="h-32 w-32 object-contain" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Reset Password
        </h2>

        {!token && (
          <div className="text-center mb-4 text-sm text-amber-600">
            No reset token detected. Please use the link from your email, or{" "}
            <Link to="/forgot-password" className="underline">request a new one</Link>.
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-primary font-semibold hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
