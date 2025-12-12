// src/pages/Eula.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const LAST_UPDATED =
  import.meta.env.VITE_EULA_LAST_UPDATED || "December 12, 2025";

export default function Eula() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = new URLSearchParams(loc.search).get("from") || "/welcome";

  const sections = [
    { id: "license", label: "1. License Grant" },
    { id: "restrictions", label: "2. User Restrictions" },
    { id: "ownership", label: "3. Ownership" },
    { id: "donations", label: "4. Donations (No Payments or Subscriptions)" },
    { id: "user-content", label: "5. User Content" },
    { id: "privacy", label: "6. Privacy" },
    { id: "termination", label: "7. Termination" },
    { id: "disclaimer", label: "8. Disclaimers & Liability Limits" },
    { id: "indemnity", label: "9. Indemnification" },
    { id: "law", label: "10. Governing Law & Dispute Resolution" },
    { id: "changes", label: "11. Changes to this EULA" },
    { id: "contact", label: "12. Contact" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 pt-24 pl-0 lg:pl-[224px]">
      {/* Header under fixed top bar */}
      <header className="sticky top-16 lg:top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-[#0C2E8A]">
            Pray in Verses — End-User License Agreement (EULA)
          </h1>
          <span className="text-xs text-slate-500">Last Updated: {LAST_UPDATED}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Intro */}
        <section className="prose max-w-none">
          <p className="text-sm text-slate-600">
            This End-User License Agreement (“Agreement” or “EULA”) is a legal agreement between you
            (“User”, “you”) and Pray in Verses (“we”, “our”, “us”) covering your use of the Pray in
            Verses application, website, and related services (“Service”). By installing, accessing,
            or using the Service, you agree to be bound by this EULA. If you do not agree, do not use
            the Service.
          </p>
        </section>

        {/* ToC */}
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

        {/* 1. License Grant */}
        <section id="license" className="prose max-w-none">
          <h2 className="text-base font-semibold text-[#0C2E8A]">1. License Grant</h2>
          <p className="text-sm">
            Subject to this EULA, we grant you a non-exclusive, non-transferable, revocable license
            to use the Service on your device for personal, non-commercial purposes.
          </p>
          <p className="text-sm">This license does not permit you to:</p>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Modify, reverse engineer, decompile, or disassemble the Service.</li>
            <li>Rent, lease, sell, sublicense, or distribute the Service.</li>
            <li>Copy or reproduce Service content unless expressly authorized.</li>
          </ul>
        </section>

        {/* 2. User Restrictions */}
        <section id="restrictions" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">2. User Restrictions</h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Do not use the Service for unlawful or fraudulent purposes.</li>
            <li>Do not damage, disable, or impair the Service or interfere with others’ use.</li>
            <li>Do not upload or distribute harmful, offensive, or unlawful content.</li>
            <li>Do not access areas you are not authorized to access.</li>
            <li>Do not infringe intellectual property rights of us or third parties.</li>
          </ul>
        </section>

        {/* 3. Ownership */}
        <section id="ownership" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">3. Ownership</h2>
          <p className="text-sm">
            The Service (including content, software, features, and trademarks) is owned by Pray in
            Verses and licensors. You receive a license only; no ownership is transferred.
          </p>
        </section>

        {/* 4. Donations */}
        <section id="donations" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            4. Donations (No Payments or Subscriptions)
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>The app is free; no premium tiers or paid subscriptions.</li>
            <li>Donations are voluntary and confer no special privileges or access.</li>
            <li>
              Donations are processed by third-party providers (e.g., Paystack/Flutterwave/Stripe)
              and subject to their terms.
            </li>
            <li>Donations are non-refundable unless required by law.</li>
            <li>Your use of the Service is not conditioned on donating.</li>
          </ul>
        </section>

        {/* 5. User Content */}
        <section id="user-content" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">5. User Content</h2>
          <p className="text-sm">
            You retain ownership of notes, journals, and entries you create (“User Content”). You
            grant us a license to store, display, and process such content solely to provide the
            Service. Do not submit unlawful, offensive, or infringing content. We may remove content
            that violates these terms.
          </p>
        </section>

        {/* 6. Privacy */}
        <section id="privacy" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">6. Privacy</h2>
          <p className="text-sm">
            Your use of the Service is governed by our{" "}
            <Link className="text-[#0C2E8A] underline" to="/privacy-policy">
              Privacy Policy
            </Link>
            . By using the Service, you consent to data practices described there.
          </p>
        </section>

        {/* 7. Termination */}
        <section id="termination" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">7. Termination</h2>
          <p className="text-sm">
            We may suspend or terminate access without notice if you violate this EULA or your use is
            harmful/inappropriate. Upon termination, your license ends and you must stop using the
            Service.
          </p>
        </section>

        {/* 8. Disclaimers & Liability */}
        <section id="disclaimer" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            8. Disclaimers & Limitation of Liability
          </h2>
          <p className="text-sm">
            The Service is provided “as is,” without warranties of any kind. We do not guarantee
            uninterrupted or error-free operation, or that the Service will meet your expectations. To
            the fullest extent permitted by law, we are not liable for indirect or consequential
            damages, data loss, or device issues. Our maximum liability, if any, is limited to the
            amount of donations you voluntarily contributed in the past 12 months.
          </p>
        </section>

        {/* 9. Indemnification */}
        <section id="indemnity" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">9. Indemnification</h2>
          <p className="text-sm">
            You agree to indemnify and hold us harmless from claims or losses arising from your use of
            the Service, your content, or your breach of this EULA.
          </p>
        </section>

        {/* 10. Governing Law */}
        <section id="law" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            10. Governing Law & Dispute Resolution
          </h2>
          <p className="text-sm">
            This Agreement is governed by the laws of Nigeria. Disputes will be resolved via
            arbitration/mediation in Nigeria unless otherwise required by applicable law.
          </p>
        </section>

        {/* 11. Changes */}
        <section id="changes" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">11. Changes to this EULA</h2>
          <p className="text-sm">
            We may modify this EULA at any time. Changes will be posted here and the “Last Updated”
            date will be revised. Continued use constitutes acceptance.
          </p>
        </section>

        {/* 12. Contact */}
        <section id="contact" className="prose max-w-none mt-8 mb-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">12. Contact</h2>
          <p className="text-sm">
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

      {/* Sticky Footer avoids sidebar on large screens */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[224px] bg-white/90 backdrop-blur border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to={from}
            className="text-sm px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            onClick={() => nav(from + "?acceptedEula=1")}
            className="text-sm px-4 py-2 rounded-md bg-[#0C2E8A] text-white hover:bg-blue-800"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}
