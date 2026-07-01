import React from 'react';

/**
 * Founders page.
 * ALL content below is [EDIT ME] placeholder — bios, names, and photos must
 * come from the founders. Structure is ready; drop in real content.
 */
const FOUNDERS = [
  {
    name: '[Founder Name]',
    role: 'Founder & CEO',
    bio: '[EDIT ME — 2-3 sentences: why you started Live Now Recovery, your connection to the recovery community in Northeast Ohio, and what you did before this.]',
    initials: 'F1',
  },
  {
    name: '[Co-Founder Name]',
    role: 'Co-Founder',
    bio: '[EDIT ME — background, role in the company, and the expertise they bring (clinical, technical, operations).]',
    initials: 'F2',
  },
];

export default function Founders() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header className="text-center pt-6">
        <h1 className="text-4xl font-extrabold text-navy tracking-tight">
          Built by people who've seen the gap up close.
        </h1>
        <p className="text-gray-500 mt-4 text-lg">
          {/* [EDIT ME — one-line team thesis] */}
          Live Now Recovery is founded and operated in Northeast Ohio, for Northeast Ohio.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FOUNDERS.map((f) => (
          <div key={f.name} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            {/* Replace with <img> when photos are available */}
            <div className="w-24 h-24 rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {f.initials}
            </div>
            <h3 className="font-bold text-navy text-xl">{f.name}</h3>
            <p className="text-cplus-teal font-semibold text-sm mb-3">{f.role}</p>
            <p className="text-gray-600 text-sm leading-relaxed">{f.bio}</p>
          </div>
        ))}
      </div>

      <section className="bg-brightside-lt border border-blue-200 rounded-2xl p-6 text-center">
        <p className="text-gray-700 text-sm">
          {/* [EDIT ME — contact/advisors] */}
          Advisors, clinical partners, and volunteers: add yourself here.
          Contact: <span className="font-semibold text-brightside">[contact email]</span>
        </p>
      </section>
    </div>
  );
}
