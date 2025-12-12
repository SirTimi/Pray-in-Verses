// src/pages/PrivacyPolicy.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LAST_UPDATED =
  import.meta.env.VITE_PRIVACY_LAST_UPDATED || "December 12, 2025";

export default function PrivacyPolicy() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = new URLSearchParams(loc.search).get("from") || "/welcome";

  const sections = [
    { id: "intro", label: "Intro" },
    { id: "info-we-collect", label: "1. Information We Collect" },
    { id: "use-of-info", label: "2. How We Use Your Information" },
    { id: "legal-basis", label: "3. Legal Basis (GDPR)" },
    { id: "sharing", label: "4. How We Share Information" },
    { id: "payments", label: "5. Payment Processing" },
    { id: "security", label: "6. Data Storage & Security" },
    { id: "rights", label: "7. Your Rights" },
    { id: "retention", label: "8. Data Retention" },
    { id: "children", label: "9. Children’s Privacy" },
    { id: "transfers", label: "10. International Transfers" },
    { id: "links", label: "11. Third-Party Links" },
    { id: "changes", label: "12. Changes to This Policy" },
    { id: "contact", label: "13. Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 pt-24 pl-0 lg:pl-[224px]">
      {/* Header (sticks within content area, not under the sidebar) */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-[#0C2E8A]">
            Pray in Verses — Privacy Policy
          </h1>
          <span className="text-xs text-slate-500">
            Last Updated: {LAST_UPDATED}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Intro */}
        <section id="intro" className="prose max-w-none scroll-mt-24">
          <p className="text-sm text-slate-600">
            Pray in Verses (“we,” “our,” “us”) is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our mobile app, website,
            or related services (collectively, the “Service”). By accessing or
            using Pray in Verses, you agree to the terms described in this
            policy.
          </p>
        </section>

        {/* TOC */}
        <nav className="my-6 rounded-lg border bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">On this page</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[#0C2E8A] hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 1. Information We Collect */}
        <section id="info-we-collect" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            1. Information We Collect
          </h2>

          <h3 className="text-sm font-semibold mt-4">
            A. Personal Information You Provide
          </h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>
              <b>Account Information:</b> Name, email address, and password when
              you create an account.
            </li>
            <li>
              <b>Subscription Information:</b> If you subscribe to premium,
              payment details are collected via secure third-party processors
              (e.g., Paystack, Flutterwave, Stripe, Apple, Google).
            </li>
            <li>
              <b>User Content:</b> Notes, saved verses, journal entries, prayer
              preferences.
            </li>
            <li>
              <b>Communication Data:</b> Messages you send to support.
            </li>
            <li>
              We do not collect sensitive categories like health or biometric
              identifiers.
            </li>
          </ul>

          <h3 className="text-sm font-semibold mt-4">
            B. Automatically Collected Information
          </h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Device Information (device model, OS version, browser type)</li>
            <li>Usage Data (pages viewed, time spent, navigation patterns)</li>
            <li>Log Data (IP address, timestamps, error logs)</li>
            <li>Cookies/Tracking (website): analytics and UX improvements</li>
          </ul>

          <h3 className="text-sm font-semibold mt-4">
            C. Third-Party Information
          </h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Payment processors</li>
            <li>Social login providers (if enabled)</li>
            <li>Analytics providers</li>
          </ul>
        </section>

        {/* 2. Use of Info */}
        <section id="use-of-info" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            2. How We Use Your Information
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Provide and personalize your devotional experience</li>
            <li>Deliver daily verses, reminders, and notifications</li>
            <li>Store and sync your journal, bookmarks, and prayer notes</li>
            <li>Process payments and manage subscriptions</li>
            <li>Improve performance and user experience</li>
            <li>Send updates, support responses, and announcements</li>
            <li>Monitor usage trends and develop new features</li>
            <li>Protect the platform from fraud or misuse</li>
          </ul>
        </section>

        {/* 3. Legal Basis */}
        <section id="legal-basis" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            3. Legal Basis for Processing (For GDPR Regions)
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Consent</li>
            <li>Performance of a Contract</li>
            <li>Legitimate Interests</li>
            <li>Compliance with Legal Obligations</li>
          </ul>
        </section>

        {/* 4. Sharing */}
        <section id="sharing" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            4. How We Share Information
          </h2>
          <p className="text-sm">We do not sell your personal information.</p>

          <h3 className="text-sm font-semibold mt-4">A. Service Providers</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Cloud storage</li>
            <li>Payment gateways</li>
            <li>Analytics platforms</li>
            <li>Email service providers</li>
          </ul>
          <p className="text-sm">
            These partners access data only to perform services on our behalf.
          </p>

          <h3 className="text-sm font-semibold mt-4">B. Legal Requirements</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Law, court orders, or government requests</li>
            <li>Protecting our rights, users, or the public</li>
          </ul>

          <h3 className="text-sm font-semibold mt-4">C. Business Transfers</h3>
          <p className="text-sm">
            If Pray in Verses is merged, acquired, or restructured, user data
            may be transferred. You will be notified.
          </p>
        </section>

        {/* 5. Payments */}
        <section id="payments" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            5. Payment Processing
          </h2>
          <p className="text-sm">
            Payments are handled by third parties (Paystack, Flutterwave,
            Stripe, Google Play Billing, Apple In-App Purchases). We do not
            store your card details.
          </p>
        </section>

        {/* 6. Security */}
        <section id="security" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            6. Data Storage and Security
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Encrypted database storage</li>
            <li>Secure authentication</li>
            <li>Restricted access controls</li>
            <li>Regular security audits</li>
          </ul>
          <p className="text-sm">
            While we strive to protect your data, no online system is 100%
            secure.
          </p>
        </section>

        {/* 7. Rights */}
        <section id="rights" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            7. Your Rights
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Access, correction, or deletion</li>
            <li>Withdraw consent</li>
            <li>Export your data</li>
            <li>Opt-out of marketing</li>
            <li>Restrict certain processing</li>
          </ul>
          <p className="text-sm">
            To exercise rights, contact{" "}
            <a className="text-[#0C2E8A] underline" href="mailto:support@prayinverses.com">
              support@prayinverses.com
            </a>
            .
          </p>
        </section>

        {/* 8. Retention */}
        <section id="retention" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            8. Data Retention
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>While your account is active</li>
            <li>As required by law</li>
            <li>As necessary to provide the Service</li>
          </ul>
          <p className="text-sm">You may request account deletion at any time.</p>
        </section>

        {/* 9. Children */}
        <section id="children" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            9. Children’s Privacy
          </h2>
          <p className="text-sm">
            Pray in Verses is not intended for children under 13. We do not
            knowingly collect data from children under this age. If you believe
            a child has registered, please contact us to remove the account.
          </p>
        </section>

        {/* 10. Transfers */}
        <section id="transfers" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            10. International Data Transfers
          </h2>
          <p className="text-sm">
            Your data may be stored or processed in various countries. We ensure
            appropriate safeguards for cross-border transfers.
          </p>
        </section>

        {/* 11. Third-Party Links */}
        <section id="links" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            11. Third-Party Links
          </h2>
          <p className="text-sm">
            The app may contain links to external resources. We are not
            responsible for the privacy practices of third-party sites or
            services.
          </p>
        </section>

        {/* 12. Changes */}
        <section id="changes" className="prose max-w-none mt-8 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            12. Changes to This Privacy Policy
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>The updated date will be revised</li>
            <li>You may receive notification via email or app alert</li>
          </ul>
          <p className="text-sm">
            Your continued use of the Service constitutes acceptance of the
            updated policy.
          </p>
        </section>

        {/* 13. Contact */}
        <section id="contact" className="prose max-w-none mt-8 mb-24 scroll-mt-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            13. Contact Us
          </h2>
          <p className="text-sm">
            For questions or privacy requests, contact:
            <br />
            Email:{" "}
            <a className="text-[#0C2E8A] underline" href="mailto:info@prayinverses.com">
              info@prayinverses.com
            </a>
            <br />
            Website:{" "}
            <a
              className="text-[#0C2E8A] underline"
              href="https://prayinverses.com"
              target="_blank"
              rel="noreferrer"
            >
              https://prayinverses.com
            </a>
          </p>
        </section>
      </main>

      {/* Footer actions (fixed, offset so it doesn't sit under the sidebar) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[224px] bg-white/90 backdrop-blur border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to={from}
            className="text-sm px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Back to Welcome
          </Link>
          <button
            onClick={() => nav(from + "?acceptedPrivacy=1")}
            className="text-sm px-4 py-2 rounded-md bg-[#0C2E8A] text-white hover:bg-blue-800"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}
