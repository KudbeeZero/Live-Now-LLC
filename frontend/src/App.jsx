import React, { useState, useCallback } from 'react';
import { useEmergencyMode } from './hooks/useEmergencyMode.js';
import { EmergencyBanner }   from './components/EmergencyBanner.jsx';
import { PriceComparisonCard } from './components/PriceComparisonCard.jsx';
import { DopplerMap }         from './components/DopplerMap.jsx';
import { VolunteerHandoff }   from './components/VolunteerHandoff.jsx';
import { ScanHandoff }        from './components/ScanHandoff.jsx';
import { HandoffImpact }      from './components/HandoffImpact.jsx';
import { BrightsideAnchor, BRIGHTSIDE_LOCATIONS } from './components/providers/BrightsideAnchor.jsx';

/**
 * Mock provider data — mirrors the seed data in backend/main.mo.
 * Replace with live ICP canister calls once dfx is deployed.
 *
 * PRIVACY NOTE: No PHI here. Provider records contain only clinic names,
 * coordinates, and live-status — never patient data.
 *
 * Status is pre-resolved: in production the canister's getAllProviders()
 * returns { id, name, lat, lng, status } with the 4-hour decay already applied.
 */
const MOCK_PROVIDERS = [
  { id: 'p1', name: 'Cleveland Recovery Alliance',  lat: 41.4993, lng: -81.6944, status: 'Live'    },
  { id: 'p2', name: 'Lakewood MAT Center',           lat: 41.4820, lng: -81.7982, status: 'Live'    },
  { id: 'p3', name: 'Akron Hope Clinic',             lat: 41.0814, lng: -81.5190, status: 'Offline' },
  { id: 'p4', name: 'Parma Treatment Services',      lat: 41.3845, lng: -81.7229, status: 'Live'    },
  { id: 'p5', name: 'Euclid Recovery House',         lat: 41.5931, lng: -81.5268, status: 'Offline' },
  { id: 'p6', name: 'Lorain County MAT Partners',   lat: 41.4529, lng: -82.1824, status: 'Live'    },
  { id: 'p7', name: 'Medina Wellness Network',       lat: 41.1381, lng: -81.8637, status: 'Unknown' },
];

// Mock ZIP count data for demo — replace with canister getHandoffCountsByZip()
const MOCK_ZIP_COUNTS = [];

// How long (ms) a ZIP stays in "pulsing" state after a fresh handoff
const PULSE_DURATION_MS = 30_000;

export default function App() {
  const emergency = useEmergencyMode();
  const [providers]    = useState(MOCK_PROVIDERS);
  const [zipCounts, setZipCounts] = useState(MOCK_ZIP_COUNTS);
  const [pulsingZips, setPulsingZips] = useState(new Set());

  // TODO: replace mocks with canister calls once dfx is deployed:
  // useEffect(() => {
  //   liveNowBackend.getAllProviders().then(setProviders);
  //   liveNowBackend.getHandoffCountsByZip().then(setZipCounts);
  // }, []);

  const liveCount    = providers.filter((p) => p.status === 'Live').length;
  const offlineCount = providers.filter((p) => p.status !== 'Live').length;
  const totalHandoffs = zipCounts.reduce((sum, { count }) => sum + count, 0);

  // Called by ScanHandoff when a handoff is successfully verified
  const handleHandoffVerified = useCallback((zipCode) => {
    // Update ZIP counts
    setZipCounts((prev) => {
      const existing = prev.find((z) => z.zipCode === zipCode);
      if (existing) {
        return prev.map((z) =>
          z.zipCode === zipCode ? { ...z, count: z.count + 1 } : z
        );
      }
      return [...prev, { zipCode, count: 1 }];
    });

    // Add to pulsing set, then remove after PULSE_DURATION_MS
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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* EMERGENCY BANNER — rendered first, always above all content */}
      {emergency && <EmergencyBanner />}

      {/* Site Header */}
      <header className="bg-navy text-white px-6 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Live Now Recovery
            </h1>
            <p className="text-blue-200 text-sm mt-0.5">
              Ohio Region 13 — Anonymous MAT Provider Availability
            </p>
          </div>
          <div className="flex gap-3 text-sm font-semibold flex-wrap">
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-8">

        {/* Doppler Map — full-width */}
        <section aria-labelledby="map-heading">
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
        <section aria-labelledby="pop-heading">
          <h2 id="pop-heading" className="text-navy font-bold text-xl mb-1">
            Proof of Presence
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Record a verified Warm Handoff. A volunteer generates a one-time QR code;
            clinic staff scan it to confirm the bridge. Each scan is recorded anonymously
            on the Internet Computer.
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
        <BrightsideAnchor />

        {/* Providers list + Price Comparison side-by-side on larger screens */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Provider list */}
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

      </main>

      {/* Footer */}
      <footer className="bg-navy-lt text-blue-200 text-xs text-center py-4 mt-8">
        <p>
          Live Now Recovery operates on the{' '}
          <strong className="text-white">Internet Computer Protocol</strong>.
          No patient data is ever stored. All interactions are anonymous.
        </p>
        <p className="mt-1">
          Ohio Region 13 · Privacy-by-Design · Powered by Internet Identity
        </p>
      </footer>
    </div>
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
