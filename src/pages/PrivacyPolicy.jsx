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
    { id: "cookies", label: "2. Cookies & Similar Technologies" },
    { id: "use-of-info", label: "3. How We Use Your Information" },
    { id: "sharing", label: "4. Sharing Your Information" },
    { id: "security", label: "5. How We Store & Protect Your Data" },
    { id: "rights", label: "6. Your Rights" },
    { id: "children", label: "7. Children’s Privacy" },
    { id: "donations", label: "8. Donations (Voluntary)" },
    { id: "transfers", label: "9. International Data Transfers" },
    { id: "changes", label: "10. Changes to This Policy" },
    { id: "contact", label: "11. Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 pt-24 pl-0 lg:pl-[224px]">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
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
        <section id="intro" className="prose max-w-none">
          <p className="text-sm text-slate-600">
            This Privacy Policy explains how Pray in Verses (“we,” “us,” “our”)
            collects, uses, stores, and protects your information when you use
            our mobile application, website, and related services (“Service”).
            By using the Service, you agree to these terms.
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
        <section id="info-we-collect" className="prose max-w-none">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            1. Information We Collect
          </h2>

          <h3 className="text-sm font-semibold mt-4">A. Information You Provide Voluntarily</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>
              <b>Account Information (Optional):</b> Name, email address, and password (hashed; never
              stored in plain text).
            </li>
            <li>
              <b>Prayer Notes & Journal Entries:</b> Personal reflections you add in the app. Stored
              securely and accessible only to you.
            </li>
            <li>
              <b>Donations (Voluntary):</b> If you support us, the payment provider may collect your
              name, email, billing information, and transaction details. Pray in Verses does{" "}
              <b>not</b> store your card or bank details.
            </li>
          </ul>

          <h3 className="text-sm font-semibold mt-4">B. Information Collected Automatically</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Device/app data (device type, OS, app version, crash logs)</li>
            <li>Anonymous analytics (pages visited, buttons clicked, time spent, general usage)</li>
          </ul>
        </section>

        {/* 2. Cookies */}
        <section id="cookies" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            2. Cookies & Similar Technologies
          </h2>
          <p className="text-sm">
            Our website may use cookies for performance analytics, functionality, security, and
            preference storage. You can manage or disable cookies via your browser settings.
          </p>
        </section>

        {/* 3. Use of Info */}
        <section id="use-of-info" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            3. How We Use Your Information
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Provide, maintain, and improve the Service</li>
            <li>Save your preferences and secure your account</li>
            <li>Respond to support requests</li>
            <li>Process voluntary donations</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="text-sm">
            We do <b>not</b> use your personal data for advertising or profiling.
          </p>
        </section>

        {/* 4. Sharing */}
        <section id="sharing" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            4. Sharing Your Information
          </h2>
          <p className="text-sm">We do not sell, rent, trade, or distribute your personal data.</p>
          <h3 className="text-sm font-semibold mt-4">A. Service Providers</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Cloud storage</li>
            <li>Analytics (e.g., Google Analytics, Firebase)</li>
            <li>Payment processors (for donations only)</li>
          </ul>
          <h3 className="text-sm font-semibold mt-4">B. Legal Requirements</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Law enforcement, court orders, or regulatory obligations</li>
          </ul>
          <h3 className="text-sm font-semibold mt-4">C. Protection Against Harm</h3>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>User safety, platform integrity, or our legal rights</li>
          </ul>
        </section>

        {/* 5. Security */}
        <section id="security" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            5. How We Store & Protect Your Data
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Encrypted connections (HTTPS/TLS)</li>
            <li>Encrypted database storage where applicable</li>
            <li>Regular security audits</li>
            <li>Password hashing</li>
            <li>Limited access to internal systems</li>
          </ul>
          <p className="text-sm">
            We retain information only as long as necessary to provide the Service or comply with
            legal obligations.
          </p>
        </section>

        {/* 6. Rights */}
        <section id="rights" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">6. Your Rights</h2>
          <p className="text-sm">
            Depending on your region (e.g., EU, UK, California), you may have the right to:
          </p>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Access, correct, or delete your data</li>
            <li>Object to processing或request data portability</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with a data authority</li>
          </ul>
          <p className="text-sm">
            To exercise rights, contact{" "}
            <a className="text-[#0C2E8A] underline" href="mailto:support@prayinverses.com">
              support@prayinverses.com
            </a>
            .
          </p>
        </section>

        {/* 7. Children */}
        <section id="children" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">7. Children’s Privacy</h2>
          <p className="text-sm">
            Pray in Verses is not intended for children under 13 (or your region’s digital consent
            age). We do not knowingly collect data from children under this age. If you believe a
            child has provided data, please contact us so we can delete it.
          </p>
        </section>

        {/* 8. Donations */}
        <section id="donations" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            8. Donations (Voluntary)
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Donations are optional and not required to access any feature.</li>
            <li>Processing is handled by third-party payment processors.</li>
            <li>We do not store payment card details or banking information.</li>
            <li>
              We may store transaction metadata (amount, date) for reporting and transparency.
            </li>
          </ul>
        </section>

        {/* 9. Transfers */}
        <section id="transfers" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            9. International Data Transfers
          </h2>
          <p className="text-sm">
            Your data may be transferred to servers outside your country. We use safeguards such as
            DPAs, Standard Contractual Clauses, and secure cloud infrastructure.
          </p>
        </section>

        {/* 10. Changes */}
        <section id="changes" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            10. Changes to This Privacy Policy
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>We may update this policy occasionally.</li>
            <li>We’ll notify you in-app/website and update the “Last Updated” date.</li>
          </ul>
          <p className="text-sm">
            Your continued use of the Service constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* 11. Contact */}
        <section id="contact" className="prose max-w-none mt-8 mb-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">11. Contact Us</h2>
          <p className="text-sm">
            Questions or privacy requests? Contact:
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

      {/* Footer (avoids sidebar on lg) */}
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
