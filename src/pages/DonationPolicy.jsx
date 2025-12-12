// src/pages/DonationPolicy.jsx
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LAST_UPDATED = "December 12, 2025";

export default function DonationPolicy() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = new URLSearchParams(loc.search).get("from") || "/welcome";

  const sections = [
    { id: "intro", label: "Intro" },
    { id: "voluntary", label: "1. Voluntary Contributions Only" },
    { id: "purpose", label: "2. Purpose of Donations" },
    { id: "processing", label: "3. Donation Processing" },
    { id: "confirmation", label: "4. Donation Confirmation" },
    { id: "refunds", label: "5. Refunds" },
    { id: "privileges", label: "6. No Donor Privileges or Influence" },
    { id: "transparency", label: "7. Transparency" },
    { id: "tax", label: "8. Tax Status" },
    { id: "fraud", label: "9. Fraud and Unauthorized Transactions" },
    { id: "changes", label: "10. Changes to This Donation Policy" },
    { id: "contact", label: "11. Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 pt-24 pl-0 lg:pl-[224px]">
      {/* Header */}
      <header className="sticky top-16 lg:top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-[#0C2E8A]">
            Pray in Verses - Donation Policy
          </h1>
          <span className="text-xs text-slate-500">
            Last Updated: {LAST_UPDATED}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Intro */}
        <section id="intro" className="prose max-w-none">
          <p className="text-sm text-slate-600">
            This Donation Policy explains how voluntary contributions (“donations”) to
            Pray in Verses are handled. Since our app and website are provided free of
            charge, donations help support development, hosting, maintenance, and
            future improvements. By making a donation, you acknowledge and agree to
            the terms below.
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

        {/* Sections ... (unchanged content) */}
        <section id="voluntary" className="prose max-w-none">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            1. Voluntary Contributions Only
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>All donations are completely voluntary.</li>
            <li>Donations are not required to access any feature.</li>
            <li>Donations do not unlock premium content or privileges.</li>
            <li>The app remains free for all users.</li>
          </ul>
        </section>

        <section id="purpose" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            2. Purpose of Donations
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>App and website hosting; infrastructure and servers</li>
            <li>Ongoing feature development; content updates</li>
            <li>Security, maintenance, and technical support</li>
            <li>Ministry-focused outreach aligned with our mission</li>
          </ul>
          <p className="text-sm">
            Donations are used solely for maintaining and improving Pray in Verses
            and related Christian-purpose activities.
          </p>
        </section>

        <section id="processing" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            3. Donation Processing
          </h2>
          <p className="text-sm">
            All donations are processed securely through trusted third-party
            payment providers such as Paystack, Flutterwave, Stripe, PayPal (if
            enabled), and App Store/Google Play in-app systems (if applicable).
            These processors may collect personal and financial information
            necessary to complete the transaction. Pray in Verses does not store
            or handle your payment card or banking details. For more on data
            handling, please see our Privacy Policy.
          </p>
        </section>

        <section id="confirmation" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            4. Donation Confirmation
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>A confirmation email from the payment provider</li>
            <li>A transaction receipt</li>
            <li>An on-screen confirmation in the app or website</li>
          </ul>
          <p className="text-sm">
            Ensure your email address is accurate when donating.
          </p>
        </section>

        <section id="refunds" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">5. Refunds</h2>
          <p className="text-sm">
            Donations are generally non-refundable as they are voluntary
            contributions and not payments for goods or services. However,
            refunds may be granted when required by law, in the case of
            duplicate donations, or where a technical payment error is proven.
            Send refund requests to our support email.
          </p>
        </section>

        <section id="privileges" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            6. No Donor Privileges or Influence
          </h2>
          <p className="text-sm">
            Donations do not entitle contributors to special treatment,
            decision-making influence, priority access, governance rights, early
            feature access, or private contact with founders. All users receive
            equal access to the Service.
          </p>
        </section>

        <section id="transparency" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">7. Transparency</h2>
          <p className="text-sm">
            We aim to maintain transparency regarding how donations support the
            project and may publish periodic updates on app improvements,
            stewardship summaries, community growth, and major milestones funded
            through donations. Personal donor information will never be published
            without explicit consent.
          </p>
        </section>

        <section id="tax" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">8. Tax Status</h2>
          <p className="text-sm">
            Pray in Verses does not currently operate as a registered charity or
            non-profit. Donations may not be tax-deductible in your jurisdiction,
            and we cannot issue tax exemption certificates unless legally
            authorized. This section may be updated if our legal status changes.
          </p>
        </section>

        <section id="fraud" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            9. Fraud and Unauthorized Transactions
          </h2>
          <p className="text-sm">
            If you suspect fraud, unauthorized card use, or incorrect
            transactions, contact your bank/payment provider immediately. You
            may also notify us so we can investigate.
          </p>
        </section>

        <section id="changes" className="prose max-w-none mt-8">
          <h2 className="text-base font-semibold text-[#0C2E8A]">
            10. Changes to This Donation Policy
          </h2>
          <ul className="text-sm leading-6 list-disc pl-5">
            <li>We may update this policy periodically</li>
            <li>We’ll revise the “Last Updated” date</li>
            <li>We may provide in-app or website notifications where appropriate</li>
          </ul>
          <p className="text-sm">
            Continued use of the Service after such updates implies acceptance.
          </p>
        </section>

        <section id="contact" className="prose max-w-none mt-8 mb-24">
          <h2 className="text-base font-semibold text-[#0C2E8A]">11. Contact Us</h2>
          <p className="text-sm">
            For questions regarding donations, refunds, or this policy, contact:
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

      {/* Footer avoids sidebar on lg */}
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
