import React from 'react';
import { ShieldCheck, Clock, DollarSign, HeartHandshake } from 'lucide-react';

/**
 * Mission page.
 * Copy marked [EDIT ME] is placeholder drafted from project principles —
 * replace with the founders' own words before presenting.
 */
export default function Mission() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">

      <header className="text-center pt-6">
        <h1 className="text-4xl font-extrabold text-navy tracking-tight">
          Nobody should die waiting for a bed that was open.
        </h1>
        <p className="text-gray-500 mt-4 text-lg leading-relaxed">
          {/* [EDIT ME — founders' voice] */}
          In Northeast Ohio, people ready for treatment are turned away by stale
          directories, opaque pricing, and cold referrals that go nowhere. Live Now
          Recovery closes the gap between "I'm ready" and "I'm in a chair" — anonymously,
          transparently, and with proof.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Pillar
          icon={<Clock className="text-cplus-teal" size={26} aria-hidden="true" />}
          title="Live means live"
          body="A provider marked open must have confirmed it within 4 hours — our Decay Law.
                Stale listings are downgraded automatically, never shown as available. A directory
                you can't trust at 2 AM is worse than no directory."
        />
        <Pillar
          icon={<ShieldCheck className="text-cplus-teal" size={26} aria-hidden="true" />}
          title="Anonymous by architecture"
          body="We store zero patient health information — not names, not diagnoses, not history.
                It isn't a policy we promise to follow; the system is built so the data cannot exist."
        />
        <Pillar
          icon={<DollarSign className="text-cplus-teal" size={26} aria-hidden="true" />}
          title="Radical price transparency"
          body="A month of Suboxone is $185 retail and $45.37 through Mark Cuban Cost Plus Drugs.
                Every provider view on this platform shows that comparison. Price opacity kills;
                we treat transparency as a clinical feature."
        />
        <Pillar
          icon={<HeartHandshake className="text-cplus-teal" size={26} aria-hidden="true" />}
          title="Proof, not promises"
          body="Our metric is the verified Warm Handoff: a volunteer physically delivers someone
                to care and clinic staff scan a one-time code to confirm it. We count arrivals,
                not clicks."
        />
      </div>

      <section className="bg-navy rounded-2xl text-white p-8 text-center">
        <h2 className="text-2xl font-bold">The Region 13 Pilot</h2>
        <p className="text-blue-200 mt-3 leading-relaxed">
          {/* [EDIT ME — pilot specifics] */}
          We're proving the model in Ohio Region 13 with Brightside Recovery as our
          anchor partner — 17 physical locations offering detox, IOP, and
          medication-assisted treatment, all accepting Medicaid. Every verified
          handoff is a life bridged to care and a data point the whole system can trust.
        </p>
      </section>
    </div>
  );
}

function Pillar({ icon, title, body }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-bold text-navy text-lg">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
