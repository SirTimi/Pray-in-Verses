import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function DonationThankYou() {
  const [params] = useSearchParams();
  const reference =
    params.get('reference') ||
    params.get('trxref');

  return (
    <div className="min-h-screen bg-[#FFFEF0] flex items-center justify-center px-4 py-12 text-slate-800">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 md:p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF3FF] text-3xl">
          ♡
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-semibold text-[#0C2E8A]">
          Thank you for supporting Pray in Verses
        </h1>

        <p className="mt-4 text-sm md:text-base leading-6 text-slate-600">
          Paystack has returned you to Pray in Verses. Payment confirmation is handled securely on the server and may take a moment to appear.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          If you started this donation from the mobile app, you can close this browser and return to the app. It will check the transaction status automatically.
        </p>

        {reference ? (
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Payment reference
            </p>
            <p className="mt-1 break-all text-xs text-slate-600">
              {reference}
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/donation-policy"
            className="rounded-xl border border-[#0C2E8A] px-5 py-3 text-sm font-semibold text-[#0C2E8A] hover:bg-blue-50"
          >
            Donation Policy
          </Link>
          <Link
            to="/"
            className="rounded-xl bg-[#0C2E8A] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900"
          >
            Return to Pray in Verses
          </Link>
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-400">
          Questions about a donation? Email info@prayinverses.com.
        </p>
      </div>
    </div>
  );
}
