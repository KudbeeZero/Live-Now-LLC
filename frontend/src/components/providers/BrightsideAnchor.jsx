import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, ShieldCheck, AlertTriangle,
  ExternalLink, Navigation, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// ── Constants ─────────────────────────────────────────────────────────────────

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

// Brightside Recovery brand colors
const BS_BLUE  = '#003087';
const BS_DARK  = '#002060';

// Mark Cuban Cost Plus Drugs pharmacy details
const MCCPD = {
  ncpdpId:  '5755167',
  name:     'Mark Cuban Cost Plus Drugs',
  drug:     'Buprenorphine/Naloxone 8mg/2mg Film (Generic Suboxone)',
  retail:   '$185.00',
  price:    '$45.37',
  savings:  '$139.63',
  url:      'https://costplusdrugs.com',
};

// Timestamps for mock "lastVerified" — computed once at module load.
// In production these come from the ICP canister's lastVerified field (nanoseconds).
// PRIVACY: no PHI here — these are clinic-level timestamps only.
const _NOW   = Date.now();
const _FRESH = _NOW - 2 * 60 * 60 * 1000;   // 2 h ago  → badge green
const _STALE = _NOW - 5 * 60 * 60 * 1000;   // 5 h ago  → badge yellow (decay triggered)

// ── Location Matrix ───────────────────────────────────────────────────────────

/**
 * BRIGHTSIDE_LOCATIONS — 17 Northeast Ohio centers.
 * All coordinates are within NE Ohio map bounds (SW [40.394, -82.758] → NE [42.327, -80.519]).
 * No PHI is stored — only clinic-level data (name, address, phone, services).
 */
export const BRIGHTSIDE_LOCATIONS = [
  {
    id: 'bs-001',
    name: 'Brightside Recovery – Cleveland West',
    address: '4401 Detroit Ave, Cleveland, OH 44113',
    phone: '(216) 400-6800',
    lat: 41.4762, lng: -81.7230,
    services: ['MAT', 'IOP', 'Detox'],
    acceptsMedicaid: true,
    zipCode: '44113',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-002',
    name: 'Brightside Recovery – Lakewood',
    address: '14800 Detroit Ave, Lakewood, OH 44107',
    phone: '(216) 400-6801',
    lat: 41.4820, lng: -81.7982,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44107',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-003',
    name: 'Brightside Recovery – Parma',
    address: '5500 Pearl Rd, Parma, OH 44129',
    phone: '(440) 400-6802',
    lat: 41.3845, lng: -81.7229,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44129',
    lastVerified: _STALE,   // demo: stale → yellow badge
  },
  {
    id: 'bs-004',
    name: 'Brightside Recovery – Strongsville',
    address: '18605 Royalton Rd, Strongsville, OH 44136',
    phone: '(440) 400-6803',
    lat: 41.3145, lng: -81.8357,
    services: ['MAT', 'IOP', 'Detox'],
    acceptsMedicaid: true,
    zipCode: '44136',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-005',
    name: 'Brightside Recovery – Broadview Heights',
    address: '1000 E Royalton Rd, Broadview Heights, OH 44147',
    phone: '(440) 400-6804',
    lat: 41.3200, lng: -81.6790,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44147',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-006',
    name: 'Brightside Recovery – Akron Main',
    address: '285 E Market St, Akron, OH 44308',
    phone: '(330) 400-6805',
    lat: 41.0814, lng: -81.5190,
    services: ['MAT', 'IOP', 'Detox'],
    acceptsMedicaid: true,
    zipCode: '44308',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-007',
    name: 'Brightside Recovery – Akron North Hill',
    address: '1400 N Main St, Akron, OH 44310',
    phone: '(330) 400-6806',
    lat: 41.1034, lng: -81.5100,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44310',
    lastVerified: _STALE,   // demo: stale → yellow badge
  },
  {
    id: 'bs-008',
    name: 'Brightside Recovery – Cuyahoga Falls',
    address: '2310 State Rd, Cuyahoga Falls, OH 44223',
    phone: '(330) 400-6807',
    lat: 41.1334, lng: -81.4845,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44223',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-009',
    name: 'Brightside Recovery – Kent',
    address: '615 E Erie St, Kent, OH 44240',
    phone: '(330) 400-6808',
    lat: 41.1531, lng: -81.3579,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44240',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-010',
    name: 'Brightside Recovery – Lorain',
    address: '3700 Kolbe Rd, Lorain, OH 44053',
    phone: '(440) 400-6809',
    lat: 41.4529, lng: -82.1824,
    services: ['MAT', 'IOP', 'Detox'],
    acceptsMedicaid: true,
    zipCode: '44053',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-011',
    name: 'Brightside Recovery – Elyria',
    address: '347 Midway Blvd, Elyria, OH 44035',
    phone: '(440) 400-6810',
    lat: 41.3684, lng: -82.1074,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44035',
    lastVerified: _STALE,   // demo: stale → yellow badge
  },
  {
    id: 'bs-012',
    name: 'Brightside Recovery – Mentor',
    address: '9785 Johnnycake Ridge Rd, Mentor, OH 44060',
    phone: '(440) 400-6811',
    lat: 41.6731, lng: -81.3498,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44060',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-013',
    name: 'Brightside Recovery – Willoughby',
    address: '4150 Erie St, Willoughby, OH 44094',
    phone: '(440) 400-6812',
    lat: 41.6403, lng: -81.4118,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44094',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-014',
    name: 'Brightside Recovery – Eastlake',
    address: '34950 Lake Shore Blvd, Eastlake, OH 44095',
    phone: '(440) 400-6813',
    lat: 41.6550, lng: -81.4499,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44095',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-015',
    name: 'Brightside Recovery – Medina',
    address: '3720 Medina Rd, Medina, OH 44256',
    phone: '(330) 400-6814',
    lat: 41.1381, lng: -81.8637,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44256',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-016',
    name: 'Brightside Recovery – Canton',
    address: '4715 Dressler Rd NW, Canton, OH 44718',
    phone: '(330) 400-6815',
    lat: 40.8450, lng: -81.4400,
    services: ['MAT', 'IOP', 'Detox'],
    acceptsMedicaid: true,
    zipCode: '44718',
    lastVerified: _FRESH,
  },
  {
    id: 'bs-017',
    name: 'Brightside Recovery – Massillon',
    address: '2420 17th St NE, Massillon, OH 44646',
    phone: '(330) 400-6816',
    lat: 40.7967, lng: -81.5213,
    services: ['MAT', 'IOP'],
    acceptsMedicaid: true,
    zipCode: '44646',
    lastVerified: _FRESH,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isVerified(lastVerified) {
  return Date.now() - lastVerified < FOUR_HOURS_MS;
}

function googleMapsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerificationBadge({ lastVerified }) {
  const fresh = isVerified(lastVerified);
  return fresh ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brightside-lt text-brightside border border-blue-300">
      <ShieldCheck size={12} aria-hidden="true" />
      Verified by Brightside
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-400">
      <AlertTriangle size={12} aria-hidden="true" />
      Verify Pending (&gt;4h)
    </span>
  );
}

const SERVICE_COLORS = {
  MAT:   'bg-emerald-100 text-emerald-800',
  IOP:   'bg-purple-100  text-purple-800',
  Detox: 'bg-orange-100  text-orange-800',
};

function ServicePill({ service }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${SERVICE_COLORS[service] ?? 'bg-gray-100 text-gray-700'}`}>
      {service}
    </span>
  );
}

// ── HandoffQR — inline PoP token for a specific Brightside location ───────────

function HandoffQR({ zipCode, locationName }) {
  const [token, setToken]     = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(id); setToken(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [token]);

  const generate = () => {
    const nonce = Math.floor(Math.random() * 999_999);
    setToken(`${nonce}-${Date.now()}`);
    setTimeLeft(300);
  };

  if (!token) {
    return (
      <button
        onClick={generate}
        className="w-full py-2.5 text-xs font-semibold text-cplus-teal bg-teal-50 border border-teal-200 rounded-xl min-h-touch hover:bg-teal-100 transition-colors"
        aria-label={`Generate handoff QR code for ${locationName}`}
      >
        Generate 5-min QR — {locationName.split('–')[1]?.trim() ?? locationName}
      </button>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const urgent = timeLeft < 60;

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <QRCodeSVG value={token} size={120} aria-label="Handoff QR code" />
      <p className={`text-xs font-mono font-bold ${urgent ? 'text-red-600' : 'text-gray-600'}`}>
        Expires {mins}:{secs.toString().padStart(2, '0')}
      </p>
      <p className="text-xs text-gray-400 text-center">ZIP {zipCode} · Have clinic staff scan this</p>
    </div>
  );
}

// ── ScriptModal — printable Cost Plus Drugs prescription card ─────────────────

function ScriptModal({ location, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: BS_BLUE }}>
          <h3 id="script-modal-title" className="text-white font-bold text-lg">
            Cost Plus Drugs Script Request
          </h3>
          <button
            onClick={onClose}
            className="text-white text-2xl leading-none min-h-touch min-w-touch flex items-center justify-center opacity-80 hover:opacity-100 rounded-full"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Printable card body */}
        <div className="p-6 space-y-4 text-sm" id="brightside-script-card">
          <div className="text-center">
            <p className="font-extrabold text-xl" style={{ color: BS_BLUE }}>BRIGHTSIDE RECOVERY</p>
            <p className="text-gray-500 text-xs">{location.name}</p>
            <p className="text-gray-500 text-xs">{location.address} · {location.phone}</p>
          </div>

          <hr />

          <div>
            <p className="font-bold text-gray-700 mb-1">Medication Script Card</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Present this card to your prescribing physician at Brightside. Ask them to send
              your prescription to Mark Cuban's Cost Plus Drugs pharmacy to save ~75% monthly.
            </p>
          </div>

          {/* Drug details */}
          <div className="bg-brightside-lt border border-blue-200 rounded-xl p-4 space-y-1.5">
            <p><span className="font-semibold">Drug:</span> {MCCPD.drug}</p>
            <p><span className="font-semibold">Qty:</span> 60 films (30-day supply)</p>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-green-700 font-extrabold text-base">Cost Plus: {MCCPD.price}/mo</span>
              <span className="text-gray-400 line-through text-xs">Retail: {MCCPD.retail}</span>
            </div>
            <p className="text-emerald-600 font-semibold text-xs">You save {MCCPD.savings} every month</p>
          </div>

          {/* Pharmacy details for the prescriber */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="font-bold text-gray-700 text-xs uppercase tracking-wide mb-2">For Prescriber — Send Rx To:</p>
            <p><span className="font-semibold">Pharmacy:</span> {MCCPD.name}</p>
            <p>
              <span className="font-semibold text-red-600">NCPDP ID:</span>{' '}
              <span className="font-mono font-extrabold text-lg tracking-widest">{MCCPD.ncpdpId}</span>
            </p>
            <p className="text-xs text-gray-500">Enter this NCPDP ID in your e-prescribing system (Epic, Surescripts, etc.)</p>
          </div>

          <a
            href={MCCPD.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-blue-600 text-xs underline"
          >
            <ExternalLink size={12} aria-hidden="true" />
            {MCCPD.url}
          </a>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm min-h-touch"
            style={{ background: BS_BLUE }}
          >
            Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 text-sm min-h-touch hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LocationCard ──────────────────────────────────────────────────────────────

function LocationCard({ location, onRequestScript }) {
  const [showHandoff, setShowHandoff] = useState(false);
  const fresh = isVerified(location.lastVerified);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border-2 ${fresh ? 'border-blue-300' : 'border-yellow-400'}`}
    >
      {/* Card header — Brightside royal blue */}
      <div className="px-4 py-3 flex items-start justify-between gap-2" style={{ background: BS_BLUE }}>
        <div>
          <p className="text-white font-bold text-sm leading-tight">{location.name}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {location.services.map((s) => (
              <span
                key={s}
                className="text-xs px-1.5 py-0.5 rounded font-semibold bg-white bg-opacity-20 text-white"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <span className="flex-shrink-0 text-xs px-2 py-1 rounded font-bold bg-green-400 text-green-900 whitespace-nowrap">
          Medicaid ✓
        </span>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-2.5">

        <VerificationBadge lastVerified={location.lastVerified} />

        <div className="flex items-start gap-1.5 text-xs text-gray-600">
          <MapPin size={13} className="mt-0.5 flex-shrink-0 text-brightside" aria-hidden="true" />
          <span>{location.address}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Phone size={13} className="flex-shrink-0 text-brightside" aria-hidden="true" />
          <a
            href={`tel:${location.phone.replace(/\D/g, '')}`}
            className="text-brightside font-semibold hover:underline"
          >
            {location.phone}
          </a>
        </div>

        {/* Inline price transparency — TRANSPARENCY MANDATE (CLAUDE.md §3) */}
        <div className="bg-brightside-lt border border-blue-100 rounded-lg px-3 py-2 text-xs">
          <p className="font-bold text-gray-700">Suboxone 30-day supply</p>
          <div className="flex gap-3 mt-0.5">
            <span className="text-red-500 line-through">Retail $185</span>
            <span className="text-emerald-600 font-extrabold">Cost Plus $45.37</span>
            <span className="text-gray-400">Save $139.63</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-1">

          {/* One-Touch Directions */}
          <a
            href={googleMapsUrl(location.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold min-h-touch transition-opacity hover:opacity-90"
            style={{ background: BS_BLUE }}
            aria-label={`Get directions to ${location.name}`}
          >
            <Navigation size={14} aria-hidden="true" />
            One-Touch Directions
          </a>

          {/* Request Script for Cost Plus */}
          <button
            onClick={() => onRequestScript(location)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 min-h-touch hover:bg-brightside-lt transition-colors"
            style={{ borderColor: BS_BLUE, color: BS_BLUE }}
          >
            <ExternalLink size={14} aria-hidden="true" />
            Request Script for Cost Plus
          </button>

          {/* Record Warm Handoff (PoP) */}
          <button
            onClick={() => setShowHandoff((v) => !v)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-teal-50 text-cplus-teal border border-teal-300 min-h-touch hover:bg-teal-100 transition-colors"
          >
            <QrCode size={14} aria-hidden="true" />
            {showHandoff ? 'Hide QR Code' : 'Record Warm Handoff (PoP)'}
          </button>
        </div>

        {/* Inline PoP QR */}
        {showHandoff && (
          <div className="border-t pt-3 mt-1">
            <HandoffQR zipCode={location.zipCode} locationName={location.name} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── BrightsideAnchor (main export) ────────────────────────────────────────────

/**
 * BrightsideAnchor
 *
 * Renders the full Brightside Recovery location matrix with:
 *   - 4-hour decay verification badges (CLAUDE.md §2)
 *   - Inline Suboxone price transparency per card (CLAUDE.md §3)
 *   - Warm Handoff (PoP) QR generation per location (CLAUDE.md §4)
 *   - "Request Script for Cost Plus" modal with MCCPD NCPDP ID pre-filled
 *   - One-Touch Directions to Google Maps
 *
 * No PHI is stored or rendered at any point (CLAUDE.md §1).
 */
export function BrightsideAnchor() {
  const [scriptLocation, setScriptLocation] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? BRIGHTSIDE_LOCATIONS
      : BRIGHTSIDE_LOCATIONS.filter((loc) =>
          loc.services.includes(filter.toUpperCase())
        );

  const freshCount = BRIGHTSIDE_LOCATIONS.filter((loc) => isVerified(loc.lastVerified)).length;

  const FILTERS = [
    { key: 'all',   label: `All ${BRIGHTSIDE_LOCATIONS.length}` },
    { key: 'mat',   label: 'MAT' },
    { key: 'iop',   label: 'IOP' },
    { key: 'detox', label: 'Detox' },
  ];

  return (
    <section aria-labelledby="brightside-heading" className="space-y-5">

      {/* Section header — Brightside branding */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div
          className="px-6 py-5 flex items-center justify-between flex-wrap gap-3"
          style={{ background: BS_BLUE }}
        >
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={26} className="text-white" aria-hidden="true" />
              <h2 id="brightside-heading" className="text-white font-extrabold text-2xl tracking-tight">
                Brightside Recovery
              </h2>
            </div>
            <p className="text-blue-200 text-sm mt-1">
              Verified Anchor Provider · {BRIGHTSIDE_LOCATIONS.length} Northeast Ohio Locations
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="bg-white bg-opacity-20 text-white text-sm font-bold px-3 py-1 rounded-full">
              {freshCount}/{BRIGHTSIDE_LOCATIONS.length} Verified Live
            </span>
            <span className="text-blue-200 text-xs">Full-Continuum: MAT · IOP · Detox</span>
          </div>
        </div>

        {/* Sub-header: quick stats + Cost Plus link */}
        <div className="bg-brightside-lt border-b border-blue-100 px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="text-gray-600">
            Medicaid: <strong className="text-green-700">All locations ✓</strong>
          </span>
          <span className="text-gray-600">
            Suboxone via Cost Plus:{' '}
            <strong className="text-emerald-700">$45.37/mo</strong>{' '}
            <span className="text-gray-400 line-through text-xs">$185 retail</span>
          </span>
          <a
            href={MCCPD.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brightside underline text-xs font-semibold ml-auto"
          >
            <ExternalLink size={12} aria-hidden="true" />
            Transfer Script → Cost Plus Drugs
          </a>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by service type">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border min-h-touch transition-colors ${
              filter === key
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brightside'
            }`}
            style={filter === key ? { background: BS_BLUE } : {}}
            aria-pressed={filter === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Location grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            onRequestScript={setScriptLocation}
          />
        ))}
      </div>

      {/* Script request modal */}
      {scriptLocation && (
        <ScriptModal
          location={scriptLocation}
          onClose={() => setScriptLocation(null)}
        />
      )}
    </section>
  );
}
