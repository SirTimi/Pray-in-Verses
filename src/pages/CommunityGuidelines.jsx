// src/pages/CommunityGuidelines.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CommunityGuidelines() {
  const Section = ({ id, title, children }) => (
    <section id={id} className="space-y-3">
      <h2 className="text-lg font-semibold text-[#0C2E8A]">{title}</h2>
      <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
    </section>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <header className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#0C2E8A]">
            Pray in Verses – Community Guidelines
          </h1>
          <p className="mt-2 text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>
          <p className="mt-4 text-sm text-gray-700">
            These Community Guidelines ensure Pray in Verses remains a safe, uplifting, respectful,
            and spiritually nourishing environment. By using our website, app, or any related
            platform, you agree to follow the guidelines below.
          </p>
        </header>

        {/* Quick nav */}
        <nav className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-[#0C2E8A]">On this page</p>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {[
              ["purpose", "1) Purpose of This Community"],
              ["respect", "2) Respectful Behaviour"],
              ["content", "3) Appropriate Content"],
              ["solicit", "4) No Solicitation"],
              ["advice", "5) No Medical, Legal, or Financial Advice"],
              ["privacy", "6) Privacy & Personal Information"],
              ["ip", "7) Intellectual Property"],
              ["honesty", "8) Honest Contributions"],
              ["safety", "9) Safety and Well-Being"],
              ["moderation", "10) Moderation & Enforcement"],
              ["reporting", "11) Reporting Violations"],
              ["changes", "12) Changes to These Guidelines"],
              ["commitment", "13) Commitment to a Christ-Centred Community"],
            ].map(([id, label]) => (
              <li key={id}>
                <a className="text-[#0C2E8A] hover:underline" href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          <Section id="purpose" title="1) Purpose of This Community">
            <ul className="list-disc pl-5">
              <li>Encourage scripture-based prayer.</li>
              <li>Build a respectful and edifying Christian community.</li>
              <li>Provide a space for believers to grow spiritually.</li>
              <li>Share testimonies, reflections, and encouragement in a Christlike manner.</li>
            </ul>
            <p className="mt-2">Participate with sincerity and integrity.</p>
          </Section>

          <Section id="respect" title="2) Respectful Behaviour">
            <ul className="list-disc pl-5">
              <li>Treat others with kindness and dignity.</li>
              <li>No insults, harassment, shaming, or intimidation.</li>
              <li>Avoid divisive language, arguments, or personal attacks.</li>
              <li>Honor others’ spiritual journeys and perspectives.</li>
              <li>No hate speech, bullying, or abusive behaviour.</li>
            </ul>
          </Section>

          <Section id="content" title="3) Appropriate Content">
            <p>Your posts, comments, and interactions must:</p>
            <ul className="list-disc pl-5">
              <li>Align with Christian values.</li>
              <li>Avoid profanity, explicit content, or graphic imagery.</li>
              <li>Stay on-topic in prayer or scripture discussions.</li>
              <li>Avoid promoting violence, fear, or harmful ideologies.</li>
            </ul>
            <p className="mt-2">Prohibited content includes:</p>
            <ul className="list-disc pl-5">
              <li>Sexual content or imagery.</li>
              <li>Violent or graphic material.</li>
              <li>Blasphemous, hateful, or anti-Christian content.</li>
              <li>False doctrinal teachings presented as authoritative truth.</li>
            </ul>
          </Section>

          <Section id="solicit" title="4) No Solicitation">
            <ul className="list-disc pl-5">
              <li>No advertising of products, services, coaching, or ministries.</li>
              <li>No fundraising except via Pray in Verses’ official donation channels.</li>
              <li>No external links meant to sell, promote, or recruit.</li>
            </ul>
            <p className="mt-2">Share scripture, testimonies, or encouragement — not marketing.</p>
          </Section>

          <Section id="advice" title="5) No Medical, Legal, or Financial Advice">
            <ul className="list-disc pl-5">
              <li>Encourage spiritually, but do not provide medical, psychological, legal, or financial advice.</li>
              <li>Do not discourage anyone from seeking professional help.</li>
            </ul>
            <p className="mt-2">This platform is for spiritual growth, not a substitute for professionals.</p>
          </Section>

          <Section id="privacy" title="6) Privacy & Personal Information">
            <ul className="list-disc pl-5">
              <li>Do not share phone numbers, home addresses, IDs, or financial information.</li>
              <li>Do not ask others for private or sensitive data.</li>
              <li>Do not share someone else’s personal data without permission.</li>
              <li>Respect confidentiality at all times.</li>
            </ul>
          </Section>

          <Section id="ip" title="7) Intellectual Property">
            <ul className="list-disc pl-5">
              <li>Only share content you created, that’s public domain, or you’re licensed to use.</li>
              <li>Do not upload copyrighted text, images, or media you don’t own rights to.</li>
            </ul>
          </Section>

          <Section id="honesty" title="8) Honest Contributions">
            <ul className="list-disc pl-5">
              <li>Be truthful and authentic.</li>
              <li>No deception, spam, or fraudulent activity.</li>
              <li>Impersonation is strictly prohibited.</li>
            </ul>
          </Section>

          <Section id="safety" title="9) Safety and Well-Being">
            <ul className="list-disc pl-5">
              <li>No content that encourages harm or danger.</li>
              <li>No threats, intimidation, or incitement.</li>
              <li>No manipulation or coercion.</li>
            </ul>
            <p className="mt-2">If you feel unsafe or notice concerning behaviour, report it immediately.</p>
          </Section>

          <Section id="moderation" title="10) Moderation & Enforcement">
            <ul className="list-disc pl-5">
              <li>We may remove posts or comments that violate these guidelines.</li>
              <li>Accounts may be suspended temporarily.</li>
              <li>Repeat or severe violations can result in permanent removal.</li>
              <li>Features may be restricted to protect the community.</li>
              <li>Moderation decisions are final and aim to preserve integrity.</li>
            </ul>
          </Section>

          <Section id="reporting" title="11) Reporting Violations">
            <p>If you notice violations:</p>
            <ul className="list-disc pl-5">
              <li>Use the in-app/website reporting system (if available), or</li>
              <li>Email: <a href="mailto:info@prayinverses.com" className="text-[#0C2E8A] underline">info@prayinverses.com</a></li>
            </ul>
          </Section>

          <Section id="changes" title="12) Changes to These Guidelines">
            <p>
              We may update these guidelines as needed to protect the wellbeing of the community.
              Updates will be posted on the website and/or app.
            </p>
          </Section>

          <Section id="commitment" title="13) Commitment to a Christ-Centred Community">
            <ul className="list-disc pl-5">
              <li>Walk in love.</li>
              <li>Encourage others.</li>
              <li>Lift each other up.</li>
              <li>Grow in prayer through scripture.</li>
            </ul>
            <p className="mt-2">
              Together, we build a prayer-driven community rooted in God’s Word — one verse at a time.
            </p>
          </Section>

          {/* Footer actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center rounded-lg bg-[#0C2E8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
