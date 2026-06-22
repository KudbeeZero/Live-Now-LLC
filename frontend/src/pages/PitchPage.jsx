import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, MapPin, ShieldCheck, Clock, QrCode, DollarSign, Building2, Lock,
} from 'lucide-react';
import { useEmergencyMode } from '../hooks/useEmergencyMode.js';
import { useHandoffState } from '../hooks/useHandoffState.js';
import { PitchGate }          from '../components/PitchGate.jsx';
import { EmergencyBanner }    from '../components/EmergencyBanner.jsx';
import { PriceComparisonCard } from '../components/PriceComparisonCard.jsx';
import { DopplerMap }          from '../components/DopplerMap.jsx';
import { VolunteerHandoff }    from '../components/VolunteerHandoff.jsx';
import { ScanHandoff }         from '../components/ScanHandoff.jsx';
import { HandoffImpact }       from '../components/HandoffImpact.jsx';
import { BRIGHTSIDE_LOCATIONS } from '../components/providers/BrightsideAnchor.jsx';

export default function PitchPage() {
  return (
    <PitchGate>
      <PitchContent />
    </PitchGate>
  );
}

function PitchContent() {
  const emergency = useEmergencyMode();
  const {
    providers,
    zipCounts,
    pulsingZips,
    totalHandoffs,
    handleHandoffVerified,
  } = useHandoffState();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Life-safety banner stays above all content, even here (CLAUDE.md). */}
      {emergency && <EmergencyBanner />}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-blue-200 mb-4">
            <Lock size={12} aria-hidden="true" />
            Confidential investor preview · Ohio Region 13
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Live Now Recovery
          </h1>
          <p className="text-cplus-teal text-xl md:text-2xl font-bold mt-3">
            Find an open door to recovery — right now, anonymously.
          </p>
          <p className="text-blue-100 text-lg mt-6 max-w-2xl leading-relaxed">
            A privacy-first network that shows people in addiction crisis which MAT
            providers are <strong className="text-white">actually available this moment</strong>,
            bridges them to care with a verified <strong className="text-white">Warm Handoff</strong>,
            and cuts the cost of life-saving medication by ~75% — built on infrastructure
            that stores <strong className="text-white">zero patient data</strong>.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-14 space-y-20">

        {/* ── The Problem ─────────────────────────────────────────────────── */}
        <Section
          icon={<HeartPulse className="text-emergency" aria-hidden="true" />}
          eyebrow="The Problem"
          title="The moment someone asks for help is the moment we lose them."
        >
          <p>
            In Northeast Ohio's opioid crisis, the window for intervention is measured
            in minutes, not days. When a person in crisis finally reaches out, three
            failures routinely send them back to the street:
          </p>
          <ul className="mt-5 space-y-4">
            <ProblemItem title="Stale availability">
              Public provider directories list clinics that closed hours ago or have no
              open intake slots. A “directory” that's wrong is worse than none — it burns
              the one attempt a person makes.
            </ProblemItem>
            <ProblemItem title="The cold-handoff gap">
              Even when a bed exists, there's no proof the person ever arrived. Referrals
              are made on faith and counted on paper. Most warm handoffs simply… aren't.
            </ProblemItem>
            <ProblemItem title="Price opacity">
              MAT medication (generic Suboxone) is quoted at retail prices that put it out
              of reach. Patients never learn there's a legal pharmacy selling the exact
              same drug for a fraction of the cost.
            </ProblemItem>
          </ul>
        </Section>

        {/* ── The Solution ────────────────────────────────────────────────── */}
        <Section
          icon={<ShieldCheck className="text-cplus-teal" aria-hidden="true" />}
          eyebrow="The Solution"
          title="A live map of open doors — with proof people walk through them."
        >
          <p>
            Live Now Recovery does three things no legacy directory does, and it does them
            without ever storing who you are:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <FeatureCard icon={<MapPin aria-hidden="true" />} title="Real-time presence">
              Providers confirm they're open and accepting people. Any status older than
              <strong> 4 hours auto-expires to “Unknown”</strong> — we never show a green
              light we can't stand behind.
            </FeatureCard>
            <FeatureCard icon={<QrCode aria-hidden="true" />} title="Proof of Presence">
              A volunteer drops someone at a clinic and generates a one-time QR code; staff
              scan it to confirm the bridge. The handoff is recorded — anonymously — as our
              <strong> primary efficacy metric</strong>.
            </FeatureCard>
            <FeatureCard icon={<Clock aria-hidden="true" />} title="Always-on triage">
              After 5 PM and on weekends — when crisis spikes and clinics close — a
              persistent emergency banner routes people straight to the Ohio MAR hotline.
            </FeatureCard>
          </div>
        </Section>

        {/* ── Live Product (embedded demo) ────────────────────────────────── */}
        <Section
          icon={<MapPin className="text-brightside" aria-hidden="true" />}
          eyebrow="This Is Live"
          title="Not a mockup — the real product, running."
        >
          <p className="mb-6">
            Everything below is the working application, locked to Northeast Ohio. Blue
            teardrops are our verified Brightside anchor locations; you can generate and
            scan a real handoff token right here.
          </p>

          <DopplerMap
            providers={providers}
            anchorProviders={BRIGHTSIDE_LOCATIONS}
            pulsingZips={pulsingZips}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <VolunteerHandoff />
            <ScanHandoff onVerified={handleHandoffVerified} />
            <HandoffImpact
              total={totalHandoffs}
              zipCounts={zipCounts}
              pulsingZips={pulsingZips}
            />
          </div>
        </Section>

        {/* ── The Cost Plus Bridge (the Cuban angle) ──────────────────────── */}
        <Section
          icon={<DollarSign className="text-cplus-teal" aria-hidden="true" />}
          eyebrow="The Cost Plus Bridge"
          title="We turn a $185 prescription into a $45 one — every month."
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4">
              <p>
                Transparency isn't a feature we bolt on — it's wired into every provider
                view. For generic Suboxone (Buprenorphine/Naloxone 8mg/2mg film, a 30-day
                supply), we put the real numbers side by side and hand the patient a
                pre-filled script-transfer card for{' '}
                <strong>Mark Cuban's Cost Plus Drugs</strong> (NCPDP ID 5755167).
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Retail MAT pricing: <strong>$185.00/mo</strong></li>
                <li>• Cost Plus Drugs: <strong className="text-cplus-teal">$45.37/mo</strong></li>
                <li>• Patient saves <strong>$139.63 every month</strong> — ~75%</li>
              </ul>
              <p className="text-gray-600 text-sm">
                This is the difference between staying on medication and falling off it.
                Affordability <em>is</em> retention, and retention is lives.
              </p>
            </div>
            <div className="w-full lg:w-80 shrink-0">
              <PriceComparisonCard />
            </div>
          </div>
        </Section>

        {/* ── Traction ────────────────────────────────────────────────────── */}
        <Section
          icon={<Building2 className="text-brightside" aria-hidden="true" />}
          eyebrow="Traction"
          title="A verified anchor partner already on the map."
        >
          <p>
            Brightside Recovery is our primary physical partner for Ohio Region 13 —
            offering full-continuum care (Detox, IOP, MAT) and giving the network real,
            walkable destinations from day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
            <StatCard value="17" label="Brightside locations across Northeast Ohio" />
            <StatCard value="100%" label="Medicaid accepted at every location" />
            <StatCard value="3-in-1" label="Detox · IOP · MAT full-continuum care" />
          </div>
        </Section>

        {/* ── Tech & Trust Moat ───────────────────────────────────────────── */}
        <Section
          icon={<ShieldCheck className="text-cplus-teal" aria-hidden="true" />}
          eyebrow="The Moat"
          title="Privacy isn't a policy. It's the architecture."
        >
          <p>
            People in addiction crisis don't reach for help that might expose them. Our
            defensibility is that we <strong>cannot</strong> betray them, by design:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <FeatureCard icon={<ShieldCheck aria-hidden="true" />} title="Zero PHI, ever">
              No names, no dates of birth, no diagnoses. Providers are opaque IDs; users are
              anonymous. There is no patient database to breach, subpoena, or leak.
            </FeatureCard>
            <FeatureCard icon={<Lock aria-hidden="true" />} title="On-chain trust">
              The backend runs as an Internet Computer canister with anonymous Internet
              Identity. Handoff records are tamper-evident and auditable — without ever
              identifying a person.
            </FeatureCard>
          </div>
        </Section>

        {/* ── The Ask / CTA ───────────────────────────────────────────────── */}
        <section className="bg-navy text-white rounded-3xl px-8 py-12 text-center">
          <h2 className="text-3xl font-extrabold">Partner with us to scale what works.</h2>
          <p className="text-blue-100 text-lg mt-4 max-w-2xl mx-auto">
            We've proven the model in Region 13 with a verified anchor partner, a live
            product, and a transparent cost bridge. With the right partner we expand
            provider coverage, harden the canister infrastructure, and take the Proof of
            Presence metric statewide.
          </p>

          {/* TODO: confirm ask $ amount and use-of-funds breakdown before sharing */}
          <p className="text-cplus-teal font-bold text-xl mt-8">
            The Ask: [TODO — confirm funding amount &amp; use of funds]
          </p>

          <a
            href="https://costplusdrugs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 bg-cplus-teal hover:bg-cplus-teal-dk transition-colors text-white font-bold px-8 py-4 rounded-xl min-h-touch"
          >
            See the Cost Plus Bridge in action →
          </a>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-navy-lt text-blue-200 text-xs text-center py-6">
        <p>
          Confidential — prepared for investor review. Live Now Recovery operates on the{' '}
          <strong className="text-white">Internet Computer Protocol</strong>. No patient
          data is ever stored.
        </p>
        <p className="mt-2">
          <Link to="/" className="text-blue-300 hover:text-white underline">
            ← Back to the live app
          </Link>
        </p>
      </footer>
    </div>
  );
}

/* ── Presentational helpers ──────────────────────────────────────────────── */

function Section({ icon, eyebrow, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 flex items-center justify-center">{icon}</span>
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-4 max-w-3xl">
        {title}
      </h2>
      <div className="text-gray-700 text-lg leading-relaxed max-w-3xl">
        {children}
      </div>
    </section>
  );
}

function ProblemItem({ title, children }) {
  return (
    <li className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="font-bold text-navy">{title}</p>
      <p className="text-gray-600 text-base mt-1">{children}</p>
    </li>
  );
}

function FeatureCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full">
      <div className="w-10 h-10 rounded-xl bg-brightside-lt text-brightside flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="font-bold text-navy">{title}</p>
      <p className="text-gray-600 text-base mt-1">{children}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
      <p className="text-4xl font-extrabold text-brightside tabular-nums">{value}</p>
      <p className="text-gray-600 text-sm mt-2">{label}</p>
    </div>
  );
}
