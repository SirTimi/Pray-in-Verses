// src/pages/TermsOfService.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LAST_UPDATED =
  import.meta.env.VITE_TOS_LAST_UPDATED || "December 12, 2025";

export default function TermsOfService() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = new URLSearchParams(loc.search).get("from") || "/welcome";

  const sections = [
    { id: "eligibility", label: "1. Eligibility" },
    { id: "use", label: "2. Use of the Service" },
    { id: "accounts", label: "3. Accounts" },
    { id: "donations", label: "4. Donations (Optional)" },
    { id: "user-content", label: "5. User Content" },
    { id: "ip", label: "6. Intellectual Property" },
    { id: "availability", label: "7. Service Availability" },
    { id: "warranty", label: "8. Disclaimer of Warranties" },
    { id: "liability", label: "9. Limitation of Liability" },
    { id: "termination", label: "10. Termination" },
    { id: "third-party", label: "11. Third-Party Services" },
    { id: "privacy", label: "12. Privacy" },
    { id: "changes", label: "13. Changes to These Terms" },
    { id: "contact", label: "14. Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 pt-24 pl-0 lg:pl-[224px]">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-[#0C2E8A]">
            Pray in Verses - Terms of Service
          </h1>
          <span className="text-xs text-slate-500">Last Updated: {LAST_UPDATED}</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Intro */}
        <section className="prose max-w-none">
          <p className="text-sm text-slate-600">
            Welcome to Pray in Verses. These Terms of Service (“Terms”) govern your use
            of our mobile application, website, and related services (“Service”). By
            accessing or using the Service, you agree to comply with these Terms. If you
            do not agree, you must stop using the Service.
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

        {/* Sections */}
        <section id="eligibility" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">1. Eligibility</h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>You must be at least 13 years old to use Pray in Verses.</li>
            <li>
              By using the Service, you affirm you are legally permitted to use the
              platform under your local laws and agree to these Terms and our Privacy
              Policy.
            </li>
          </ul>
        </section>

        <section id="use" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">2. Use of the Service</h2>
          <p className="text-sm">
            Pray in Verses provides free access to Bible-reading features, verse-based
            prayer content, reflections, saved notes and journals, personal study tools,
            and community/devotional features (if enabled). Your use must be lawful and
            aligned with the purpose of the app. You agree not to:
          </p>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Misuse, disrupt, or damage the platform</li>
            <li>Engage in illegal, harmful, or abusive behaviour</li>
            <li>Upload or share offensive, harmful, or infringing content</li>
            <li>Hack, reverse-engineer, or bypass security</li>
            <li>Use automated tools to access, copy, or scrape the Service</li>
          </ul>
        </section>

        <section id="accounts" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">3. Accounts</h2>
          <p className="text-sm">
            Some features may require an account. You agree to provide accurate
            information, keep your login secure, not share your account, and notify us of
            unauthorized use. You are responsible for all activity on your account.
          </p>
        </section>

        <section id="donations" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">4. Donations (Optional)</h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>Pray in Verses is free. We do not sell subscriptions or premium content.</li>
            <li>Users may voluntarily support the project through donations.</li>
            <li>
              Donations are processed by third-party providers (e.g., Paystack, Flutterwave,
              Stripe). We do not store your card or bank details.
            </li>
            <li>Donations are generally non-refundable unless legally required.</li>
            <li>Your experience is not affected by donating or not donating.</li>
          </ul>
        </section>

        <section id="user-content" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">5. User Content</h2>
          <p className="text-sm">
            You may create or upload notes, journal entries, bookmarks, prayer lists, and
            feedback. You retain ownership of your content, but you grant us permission
            to store and process it solely to provide the Service. You agree not to
            upload content that violates any law, is harmful/abusive/hateful, infringes
            IP, or harasses others. We may remove content that violates these rules.
          </p>
        </section>

        <section id="ip" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">6. Intellectual Property</h2>
          <p className="text-sm">
            All platform features—text, graphics, design, code, and branding—belong to
            Pray in Verses or licensors. You may not copy, modify, redistribute, create
            derivative works, or use our content commercially without permission.
          </p>
        </section>

        <section id="availability" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">7. Service Availability</h2>
          <p className="text-sm">
            We aim for a stable experience but do not guarantee uninterrupted
            availability, error-free operation, or compatibility with every device. Features
            may change or be discontinued.
          </p>
        </section>

        <section id="warranty" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">8. Disclaimer of Warranties</h2>
          <p className="text-sm">
            The Service is provided “as is” without warranties of any kind, including
            accuracy, uninterrupted service, or error-free performance. Use at your own
            risk.
          </p>
        </section>

        <section id="liability" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">9. Limitation of Liability</h2>
          <p className="text-sm">
            To the fullest extent permitted by law, we are not liable for indirect or
            incidental damages (e.g., data loss, device damage, interruptions, or
            unauthorized access). If liability cannot be excluded, our total liability is
            limited to the amount you have voluntarily donated in the past 12 months (if
            any).
          </p>
        </section>

        <section id="termination" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">10. Termination</h2>
          <p className="text-sm">
            We may suspend or terminate access if you violate these Terms, misuse the
            Service, submit harmful content, or engage in suspicious/illegal activity.
            You may delete your account at any time. Upon termination, you must stop
            using the Service; access may be revoked and stored content may be deleted.
          </p>
        </section>

        <section id="third-party" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">11. Third-Party Services</h2>
          <p className="text-sm">
            The Service may integrate with cloud storage, analytics, payment processors
            (donations only), and email/notification services. These third parties have
            their own terms and privacy policies; we are not responsible for their
            actions.
          </p>
        </section>

        <section id="privacy" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">12. Privacy</h2>
          <p className="text-sm">
            Your use of the Service is governed by our Privacy Policy, which explains
            what information we collect and how we use it.
          </p>
        </section>

        <section id="changes" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">13. Changes to These Terms</h2>
          <p className="text-sm">
            We may update these Terms occasionally. When changes are made, we will update
            the “Last Updated” date and may notify users in-app or via email (where
            applicable). Continued use of the Service means acceptance of the updated
            Terms.
          </p>
        </section>

        <section id="contact" className="prose max-w-none mt-8 mb-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">14. Contact Us</h2>
          <p className="text-sm">
            If you have questions about these Terms, please contact:
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
            Back
          </Link>
          <button
            onClick={() => nav(from)}
            className="text-sm px-4 py-2 rounded-md bg-[#0C2E8A] text-white hover:bg-blue-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
