import React from "react";
import { Link } from "react-router-dom";
import { getDefaultAboutContent } from "../data/defaultContent";
import { Info, BookOpen, Users, CheckCircle2 } from "lucide-react";

export default function About() {
  const content = getDefaultAboutContent();

  return (
    <div className="pt-24 pb-8 md:ml-56 bg-gray-50 min-h-screen font-['Poppins']">
      {/* Hero Section */}
      <section className="text-white px-8 py-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-xl text-[#0C2E8A] font-semibold">
            {content.hero.title}
          </h1>
          <h2 className="text-sm mt-1 font-semibold text-yellow-300">
            {content.hero.highlight}
          </h2>
          <p className="italic text-sm text-[#FCCF3A] max-w-2xl mx-auto">
            {content.hero.description}
          </p>
          <p className="text-gray-700 text-base">
            {content.hero.motivation}{" "}
            <span className="font-semibold text-[#FCCF3A]">Luke 18: 1</span>
          </p>
          <p className="text-gray-600 text-sm mt-10">{content.hero.about}</p>
        </div>

        {/* Mobile-only: 5 quick policy buttons (3-up then 2) */}
        <div className="md:hidden mt-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-3 px-2">
            <Link
              to="/privacy-policy"
              title="Privacy Policy"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
            >
              Privacy Policy
            </Link>
            <Link
              to="/community-guidelines"
              title="Community Guidelines"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
            >
              Community Guidelines
            </Link>
            <Link
              to="/terms-of-service"
              title="Terms of Service"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
            >
              Terms Of Service
            </Link>
            <Link
              to="/donation-policy"
              title="Donation Policy"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
            >
              Donation Policy
            </Link>
            <Link
              to="/eula"
              title="End-User License"
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-md border border-[#0C2E8A] text-[#0C2E8A] hover:bg-[#0C2E8A] hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[#0C2E8A]/30"
            >
              End-User License
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base text-gray-900 font-semibold text-center mb-10">
            What You Will Get
          </h2>
          <div className="w-10 h-0.5 bg-gradient-to-r from-blue-600 to-yellow-500 rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {content.features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 size={24} className="text-blue-600" />
                <h3 className="text-base text-gray-900 font-semibold">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-8 max-w-5xl mx-auto">
        <div className="text-base font-semibold mb-4 flex items-center gap-3">
          <Users size={20} className="text-blue-600" />
          <h3 className="text-base text-gray-900 font-semibold">
            {content.vision.title}
          </h3>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">
          {content.vision.description}
        </p>
      </section>
    </div>
  );
}
