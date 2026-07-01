import React, { useState, useEffect, useCallback } from 'react';
import { PriceComparisonCard } from '../components/PriceComparisonCard.jsx';
import { DopplerMap }          from '../components/DopplerMap.jsx';
import { VolunteerHandoff }    from '../components/VolunteerHandoff.jsx';
import { ScanHandoff }         from '../components/ScanHandoff.jsx';
import { HandoffImpact }       from '../components/HandoffImpact.jsx';
import { BrightsideAnchor, BRIGHTSIDE_LOCATIONS } from '../components/providers/BrightsideAnchor.jsx';
import { getAllProviders, getHandoffCountsByZip } from '../lib/api.js';

// How long (ms) a ZIP stays in "pulsing" state after a fresh handoff
const PULSE_DURATION_MS = 30_000;

export default function Home() {
  const [providers, setProviders] = useState([]);
  const [zipCounts, setZipCounts] = useState([]);
  const [pulsingZips, setPulsingZips] = useState(new Set());

  useEffect(() => {
    getAllProviders().then(setProviders);
    getHandoffCountsByZip().then(setZipCounts);
  }, []);

  const liveCount     = providers.filter((p) => p.status === 'Live').length;
  const offlineCount  = providers.filter((p) => p.status !== 'Live').length;
  const totalHandoffs = zipCounts.reduce((sum, { count }) => sum + count, 0);

  // Called by ScanHandoff when a handoff is successfully verified
  const handleHandoffVerified = useCallback((zipCode) => {
    setZipCounts((prev) => {
      const existing = prev.find((z) => z.zipCode === zipCode);
      if (existing) {
        return prev.map((z) =>
          z.zipCode === zipCode ? { ...z, count: z.count + 1 } : z
        );
      }
      return [...prev, { zipCode, count: 1 }];
    });

    setPulsingZips((prev) => new Set([...prev, zipCode]));
    setTimeout(() => {
      setPulsingZips((prev) => {
        const next = new Set(prev);
        next.delete(zipCode);
        return next;
      });
    }, PULSE_DURATION_MS);
  }, []);

  return (
    <>
      {/* Status strip */}
      <div className="flex gap-3 text-sm font-semibold flex-wrap mb-6">
        <span className="bg-cplus-teal rounded-lg px-3 py-1 text-white">
          {liveCount} Live
        </span>
        <span className="bg-gray-600 rounded-lg px-3 py-1 text-white">
          {offlineCount} Offline / Unknown
        </span>
        {totalHandoffs > 0 && (
          <span className="bg-emerald-600 rounded-lg px-3 py-1 text-white">
            {totalHandoffs} Handoffs Verified
          </span>
        )}
      </div>

      {/* Doppler Map — full-width */}
      <section aria-labelledby="map-heading" className="mb-8">
        <h2 id="map-heading" className="text-navy font-bold text-xl mb-3">
          Northeast Ohio Provider Map
        </h2>
        <DopplerMap
          providers={providers}
          anchorProviders={BRIGHTSIDE_LOCATIONS}
          pulsingZips={pulsingZips}
        />
      </section>

      {/* Proof of Presence — primary impact metric */}
      <section aria-labelledby="pop-heading" className="mb-8">
        <h2 id="pop-heading" className="text-navy font-bold text-xl mb-1">
          Proof of Presence
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Record a verified Warm Handoff. A volunteer generates a one-time QR code;
          clinic staff scan it to confirm the bridge. Each scan is recorded anonymously —
          no patient data, ever.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VolunteerHandoff />
          <ScanHandoff onVerified={handleHandoffVerified} />
          <HandoffImpact
            total={totalHandoffs}
            zipCounts={zipCounts}
            pulsingZips={pulsingZips}
          />
        </div>
      </section>

      {/* Brightside Recovery — Verified Anchor Provider matrix */}
      <div className="mb-8">
        <BrightsideAnchor />
      </div>

      {/* Providers list + Price Comparison side-by-side on larger screens */}
      <div className="flex flex-col lg:flex-row gap-6">
        <section aria-labelledby="providers-heading" className="flex-1">
          <h2 id="providers-heading" className="text-navy font-bold text-xl mb-3">
            All Providers
          </h2>
          <ul className="space-y-3">
            {providers.map((p) => (
              <li
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between gap-3"
              >
                <span className="font-medium text-gray-800">{p.name}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        </section>

        {/* TRANSPARENCY MANDATE — PriceComparisonCard (required, see CLAUDE.md) */}
        <aside aria-label="Medication price transparency" className="lg:w-80">
          <h2 className="text-navy font-bold text-xl mb-3">
            Price Transparency
          </h2>
          <PriceComparisonCard />
        </aside>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Live:    'bg-teal-100 text-teal-800 border-teal-300',
    Offline: 'bg-gray-100 text-gray-600 border-gray-300',
    Unknown: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  const labels = {
    Live:    '● Live',
    Offline: '○ Offline',
    Unknown: '? Unknown',
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border min-h-[28px] ${styles[status] ?? styles.Unknown}`}
    >
      {labels[status] ?? '? Unknown'}
    </span>
  );
}
