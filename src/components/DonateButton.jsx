// src/components/DonateButton.tsx (React)
import React, { useState } from 'react';

export default function DonateButton() {
  const [amount, setAmount] = useState(2000); // NGN
  const [email, setEmail] = useState('');

  async function donate() {
    const res = await fetch('/api/donations/init', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({
        email,
        amount,
        metadata: { source: 'donate_page' },
        callbackPath: '/donate/success', // your thank-you page
      }),
    });
    const data = await res.json();
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      alert('Unable to start donation');
    }
  }

  return (
    <div className="rounded-xl border p-4 bg-white">
      <h3 className="font-semibold text-[#0C2E8A] mb-2">Support the mission</h3>
      <input
        type="email"
        placeholder="Your email"
        className="border rounded px-3 py-2 w-full mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="number"
        min={100}
        step={100}
        className="border rounded px-3 py-2 w-full mb-3"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={donate} className="bg-[#0C2E8A] text-white px-4 py-2 rounded">
        Donate ₦{amount.toLocaleString()}
      </button>
    </div>
  );
}
