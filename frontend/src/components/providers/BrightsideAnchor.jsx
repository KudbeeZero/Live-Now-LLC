import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, ShieldCheck, AlertTriangle,
  ExternalLink, Navigation, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateHandoffToken, isFresh } from '../../lib/api.js';

// ── Constants ─────────────────────────────────────────────────────────────────

// Brightside Recovery brand color
const BS_BLUE = '#003087';

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


// ── Helpers ───────────────────────────────────────────────────────────────────

function googleMapsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VerificationBadge({ lastVerified }) {
  const fresh = isFresh(lastVerified);
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

  const generate = async () => {
    const t = await generateHandoffToken(zipCode);
    setToken(t);
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
  const fresh = isFresh(location.lastVerified);

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
export function BrightsideAnchor({ locations = [] }) {
  const [scriptLocation, setScriptLocation] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered =
    filter === 'all'
      ? locations
      : locations.filter((loc) =>
          loc.services.includes(filter.toUpperCase())
        );

  const freshCount = locations.filter((loc) => isFresh(loc.lastVerified)).length;

  const FILTERS = [
    { key: 'all',   label: `All ${locations.length}` },
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
              Verified Anchor Provider · {locations.length} Northeast Ohio Locations
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="bg-white bg-opacity-20 text-white text-sm font-bold px-3 py-1 rounded-full">
              {freshCount}/{locations.length} Verified Live
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
