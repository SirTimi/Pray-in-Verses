// src/AppRouter.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useUIStore } from "./store";
import { PrayersProvider } from "./context/PrayerContext";

// Layout
import Header from "./components/layout/Header";
import BottomNavigation from "./components/layout/ButtomNavigation";

// Auth guard (APP)
import RequireAuth from "./components/RequireAuth";

// Pages (public)
import Welcome from "./pages/onboarding/Welcome";
import Login from "./pages/onboarding/Login";
import SignUp from "./pages/onboarding/Signup";
import ForgotPassword from "./pages/onboarding/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import DonationPolicy from "./pages/DonationPolicy";
import TermsOfService from "./pages/Terms-of-Service";
import Eula from "./pages/End-user-License-agreement";

// Pages (app, require auth)
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SavedPrayers from "./pages/SavedPrayers";
import AnsweredPrayers from "./pages/AnsweredPrayers";
import Reminders from "./pages/Reminders";
import PrayerWalls from "./pages/PrayerWalls";
import Mission from "./pages/Mission";
import About from "./pages/About";
import GuidedPrayer from "./pages/GuidedPrayer";
import BrowsePrayers from "./pages/BrowsePrayers";
import BibleVerse from "./pages/BibleVerse";
import Bookmarks from "./pages/Bookmark";
import MyPrayerPoint from "./pages/MyPrayerPoint";
import History from "./pages/History";

// Browse flow (now public)
import BookPage from "./pages/BookPage";
import ChapterPage from "./pages/ChapterPage";
import VerseDetails from "./pages/VerseDetails";

// --------------------
// Admin (separate auth)
// --------------------
import AdminLayout from "./admin/AdminLayout";
import AdminRequireAuth from "./admin/RequireAuth";
import AdminLogin from "./admin/pages/Login";
import AdminDashboard from "./admin/pages/Dashboard";
import CuratedList from "./admin/pages/CuratedList";
import CuratedEdit from "./admin/pages/CuratedEdit";
import Invites from "./admin/pages/Invites";
import AcceptInvite from "./admin/pages/AcceptInvite";
import AdminRoute from "./admin/AdminRoute";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminBroadcast from "./admin/pages/AdminBroadcast";

import { Toaster } from "react-hot-toast";

function AppContent() {
  const { theme } = useUIStore();
  const location = useLocation();

  // Only these are "public layout" (no app header/footer)
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/admin/login",
    "/admin/accept",
  ];

  const isAppLoggedInView =
    !publicPaths.includes(location.pathname) &&
    !location.pathname.startsWith("/admin");

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      {/* App header on app pages (not admin / not onboarding pages) */}
      {isAppLoggedInView && <Header />}

      <div className="min-h-screen flex flex-col bg-white dark:bg-primary text-primary dark:text-white font-sans">
        <main className="flex-1 pb-14 md:pb-0">
          <Routes>
            {/* Public / onboarding */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/donation-policy" element={<DonationPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/eula" element={<Eula />} />
            {/* PUBLIC: Bible browse flow so search results never hit an auth gate */}
            <Route path="/book/:bookSlug" element={<BookPage />} />
            <Route
              path="/book/:bookSlug/chapter/:chapterNumber"
              element={<ChapterPage />}
            />
            <Route
              path="/book/:bookSlug/chapter/:chapterNumber/verse/:verseNumber"
              element={<VerseDetails />}
            />

            {/* Protected APP routes */}
            <Route element={<RequireAuth />}>
              <Route path="/home" element={<Home />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/guided-prayer" element={<GuidedPrayer />} />
              <Route path="/browse-prayers" element={<BrowsePrayers />} />
              <Route path="/bible-verse" element={<BibleVerse />} />
              <Route path="/answered-prayers" element={<AnsweredPrayers />} />
              <Route path="/saved-prayers" element={<SavedPrayers />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/prayer-wall" element={<PrayerWalls />} />
              <Route path="/about" element={<About />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/my-prayer-point" element={<MyPrayerPoint />} />
              <Route path="/history" element={<History />} />
            </Route>

            {/* Admin auth & routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/accept" element={<AcceptInvite />} />

            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="curated" element={<CuratedList />} />
                <Route path="curated/new" element={<CuratedEdit />} />
                <Route path="curated/:id" element={<CuratedEdit />} />

                <Route
                  path="users"
                  element={
                    <AdminRequireAuth roles={["MODERATOR", "SUPER_ADMIN"]}>
                      <AdminUsers />
                    </AdminRequireAuth>
                  }
                />
                <Route
                  path="invites"
                  element={
                    <AdminRequireAuth roles={["SUPER_ADMIN"]}>
                      <Invites />
                    </AdminRequireAuth>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <AdminRequireAuth roles={["SUPER_ADMIN"]}>
                      <AdminBroadcast />
                    </AdminRequireAuth>
                  }
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Bottom nav for app pages only */}
        {isAppLoggedInView && <BottomNavigation />}

        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <PrayersProvider>
        <AppContent />
      </PrayersProvider>
    </Router>
  );
}
