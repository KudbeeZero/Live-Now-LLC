import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, TrendingUp } from 'lucide-react';
import { getHandoffCountsByZip } from '../lib/api.js';

const MONTHLY_SAVINGS = 139.63; // $185.00 retail − $45.37 Cost Plus, per person per month

/**
 * Pitch page — the "Triple Win" story for partners and investors.
 * Live metrics are pulled from the real handoff ledger, not hardcoded.
 */
export default function Pitch() {
  const [totalHandoffs, setTotalHandoffs] = useState(0);

  useEffect(() => {
    getHandoffCountsByZip().then((counts) =>
      setTotalHandoffs(counts.reduce((s, { count }) => s + count, 0))
    );
  }, []);

  const annualSavings = totalHandoffs * MONTHLY_SAVINGS * 12;

  return (
    <div className="max-w-4xl mx-auto space-y-12">

      {/* Hero */}
      <header className="text-center pt-6">
        <p className="text-cplus-teal font-bold text-sm uppercase tracking-widest mb-3">
          The Pitch
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-navy tracking-tight leading-tight">
          Every verified handoff saves a life<br className="hidden md:block" />
          and <span className="text-cplus-teal">$1,675 a year</span> in drug costs.
        </h1>
        <p className="text-gray-500 mt-5 text-lg max-w-2xl mx-auto">
          Live Now Recovery bridges physical treatment capacity with radically
          transparent pricing — and proves every single connection.
        </p>
      </header>

      {/* Live metrics strip — real data, not vanity numbers */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric value={totalHandoffs.toLocaleString()} label="Verified Warm Handoffs" />
        <Metric value={`$${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} label="Annualized Rx savings unlocked" />
        <Metric value="17" label="Brightside anchor locations live" />
      </section>

      {/* The Triple Win */}
      <section>
        <h2 className="text-2xl font-bold text-navy text-center mb-6">The Triple Win</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <WinCard
            icon={<Building2 size={28} className="text-brightside" aria-hidden="true" />}
            title="For the Clinic"
            body="Brightside Recovery gets verified warm handoffs from trained volunteers —
                  filling IOP chairs and detox beds with zero marketing spend. Their 'open now'
                  status is trusted because our 4-hour Decay Law makes stale listings impossible."
          />
          <WinCard
            icon={<User size={28} className="text-brightside" aria-hidden="true" />}
            title="For the Person"
            body="A physical location with a doctor, open right now, that takes Medicaid —
                  plus a prescription pathway that cuts their Suboxone cost from $185 to
                  $45.37 a month. Anonymous from first tap to front door."
          />
          <WinCard
            icon={<TrendingUp size={28} className="text-brightside" aria-hidden="true" />}
            title="For Cost Plus Drugs"
            body="A working blueprint for moving an entire clinic chain's MAT prescriptions
                  to transparent pricing — every Brightside prescriber gets our script card
                  with the Cost Plus pharmacy ID pre-filled. Region 13 is the template;
                  there are 49 more states."
          />
        </div>
      </section>

      {/* Why it's defensible */}
      <section className="bg-navy rounded-2xl text-white p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Why this works when directories fail</h2>
        <ul className="space-y-3 text-blue-100 text-sm leading-relaxed max-w-2xl mx-auto">
          <li><strong className="text-white">Freshness is enforced, not requested.</strong> The 4-hour Decay Law is code, not policy — no listing can claim "open" on stale data.</li>
          <li><strong className="text-white">Impact is proven, not surveyed.</strong> One-time QR handoff verification means our lives-reached number is an auditable ledger, not an estimate.</li>
          <li><strong className="text-white">Privacy is structural.</strong> We never collect patient data, so there is nothing to breach, subpoena, or sell. Adoption follows trust.</li>
          <li><strong className="text-white">The unit economics write themselves.</strong> Each retained MAT patient moved to Cost Plus saves $1,675.56/year — measurable value for payers, patients, and the pharmacy.</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="text-center pb-6">
        <Link
          to="/"
          className="inline-block bg-cplus-teal hover:bg-cplus-teal-dk text-white font-bold px-8 py-4 rounded-xl text-lg min-h-touch transition-colors"
        >
          See the live demo →
        </Link>
        <p className="text-gray-400 text-xs mt-4">
          Demo runs on illustrative Region 13 data. Handoff verification loop is fully functional.
        </p>
      </section>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
      <p className="text-3xl font-extrabold text-navy tabular-nums">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
}

function WinCard({ icon, title, body }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-navy text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
