import { useState, useCallback } from 'react';

/**
 * useHandoffState — shared Proof-of-Presence demo state.
 *
 * Centralizes the provider list, ZIP-level handoff counts, and the "pulsing"
 * set used by both the public HomePage and the gated PitchPage live demo.
 *
 * PRIVACY NOTE: No PHI here. Provider records contain only clinic names,
 * coordinates, and live-status — never patient data. ZIP counts are anonymous
 * aggregate tallies recorded on the Internet Computer.
 *
 * Status is pre-resolved: in production the canister's getAllProviders()
 * returns { id, name, lat, lng, status } with the 4-hour decay already applied.
 */

const MOCK_PROVIDERS = [
  { id: 'p1', name: 'Cleveland Recovery Alliance', lat: 41.4993, lng: -81.6944, status: 'Live'    },
  { id: 'p2', name: 'Lakewood MAT Center',         lat: 41.4820, lng: -81.7982, status: 'Live'    },
  { id: 'p3', name: 'Akron Hope Clinic',           lat: 41.0814, lng: -81.5190, status: 'Offline' },
  { id: 'p4', name: 'Parma Treatment Services',    lat: 41.3845, lng: -81.7229, status: 'Live'    },
  { id: 'p5', name: 'Euclid Recovery House',       lat: 41.5931, lng: -81.5268, status: 'Offline' },
  { id: 'p6', name: 'Lorain County MAT Partners',  lat: 41.4529, lng: -82.1824, status: 'Live'    },
  { id: 'p7', name: 'Medina Wellness Network',     lat: 41.1381, lng: -81.8637, status: 'Unknown' },
];

// Mock ZIP count data for demo — replace with canister getHandoffCountsByZip()
const MOCK_ZIP_COUNTS = [];

// How long (ms) a ZIP stays in "pulsing" state after a fresh handoff
const PULSE_DURATION_MS = 30_000;

export function useHandoffState() {
  const [providers]    = useState(MOCK_PROVIDERS);
  const [zipCounts, setZipCounts] = useState(MOCK_ZIP_COUNTS);
  const [pulsingZips, setPulsingZips] = useState(new Set());

  // TODO: replace mocks with canister calls once dfx is deployed:
  // useEffect(() => {
  //   liveNowBackend.getAllProviders().then(setProviders);
  //   liveNowBackend.getHandoffCountsByZip().then(setZipCounts);
  // }, []);

  const liveCount     = providers.filter((p) => p.status === 'Live').length;
  const offlineCount  = providers.filter((p) => p.status !== 'Live').length;
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

  return {
    providers,
    zipCounts,
    pulsingZips,
    liveCount,
    offlineCount,
    totalHandoffs,
    handleHandoffVerified,
  };
}
