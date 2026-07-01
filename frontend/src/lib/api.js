/**
 * Live Now Recovery — Data Layer
 *
 * Single seam between the UI and the backend. Every UI component calls these
 * functions and nothing else. The current implementation ("local adapter")
 * runs entirely in the browser via localStorage so the full loop —
 * generate token → scan QR → verify → pulse heatmap — works end-to-end
 * with no server. Swapping to Supabase (Postgres + edge functions) means
 * reimplementing ONLY this file; no component changes.
 *
 * HARD RULES ENFORCED HERE (CLAUDE.md):
 *   - NO PHI: tokens carry no identity; only a ZIP code is recorded.
 *   - 4-HOUR DECAY: resolveStatus() downgrades stale providers to 'Unknown'.
 *   - PoP: tokens expire after exactly 5 minutes and are one-time use.
 */

const TOKEN_TTL_MS = 5 * 60 * 1000;       // 5 minutes — PoP mandate
const DECAY_MS     = 4 * 60 * 60 * 1000;  // 4 hours — Decay Law

const LS_TOKENS = 'lnr.tokens.v1';
const LS_COUNTS = 'lnr.zipCounts.v1';

// ── storage helpers ───────────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) — loop still works in-memory below
  }
}

// In-memory mirror so the loop works even when localStorage is blocked
let tokens = load(LS_TOKENS, {});   // token -> { zipCode, expiresAt, used }
let counts = load(LS_COUNTS, {});   // zipCode -> count

function persist() {
  save(LS_TOKENS, tokens);
  save(LS_COUNTS, counts);
}

// ── Proof of Presence API ─────────────────────────────────────────────────────

/**
 * Generate a one-time handoff token for a ZIP code.
 * Token is cryptographically random — it encodes nothing about the volunteer.
 * Supabase version: POST /functions/v1/generate-token
 */
export async function generateHandoffToken(zipCode) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  tokens[token] = { zipCode, expiresAt: Date.now() + TOKEN_TTL_MS, used: false };
  persist();
  return token;
}

/**
 * Verify a scanned token. Mirrors the four-case contract in CLAUDE.md §4:
 * returns { status: 'Ok', zipCode } | { status: 'Expired' | 'NotFound' | 'AlreadyUsed' }
 * Supabase version: POST /functions/v1/verify-token
 */
export async function verifyHandoff(token) {
  tokens = load(LS_TOKENS, tokens); // re-read: scanner may run in another tab
  const rec = tokens[token];
  if (!rec)      return { status: 'NotFound' };
  if (rec.used)  return { status: 'AlreadyUsed' };
  if (Date.now() > rec.expiresAt) {
    delete tokens[token];
    persist();
    return { status: 'Expired' };
  }

  rec.used = true;                                  // one-time use
  counts[rec.zipCode] = (counts[rec.zipCode] ?? 0) + 1;
  persist();
  return { status: 'Ok', zipCode: rec.zipCode };
}

/** ZIP-level verified handoff counts, for the impact panel and heatmap. */
export async function getHandoffCountsByZip() {
  counts = load(LS_COUNTS, counts);
  return Object.entries(counts).map(([zipCode, count]) => ({ zipCode, count }));
}

// ── Provider API ──────────────────────────────────────────────────────────────

/** 4-HOUR DECAY LAW: stale lastVerified must never render as Live. */
export function resolveStatus({ isLive, lastVerified }) {
  if (Date.now() - lastVerified > DECAY_MS) return 'Unknown';
  return isLive ? 'Live' : 'Offline';
}

/**
 * Demo provider seed (clinic-level data only — never PHI).
 * Supabase version: SELECT from a `providers_view` that computes status in SQL.
 */
const SEED_PROVIDERS = [
  { id: 'p1', name: 'Cleveland Recovery Alliance', lat: 41.4993, lng: -81.6944, isLive: true  },
  { id: 'p2', name: 'Lakewood MAT Center',          lat: 41.4820, lng: -81.7982, isLive: true  },
  { id: 'p3', name: 'Akron Hope Clinic',            lat: 41.0814, lng: -81.5190, isLive: false },
  { id: 'p4', name: 'Parma Treatment Services',     lat: 41.3845, lng: -81.7229, isLive: true  },
  { id: 'p5', name: 'Euclid Recovery House',        lat: 41.5931, lng: -81.5268, isLive: false },
  { id: 'p6', name: 'Lorain County MAT Partners',  lat: 41.4529, lng: -82.1824, isLive: true  },
  { id: 'p7', name: 'Medina Wellness Network',      lat: 41.1381, lng: -81.8637, isLive: false },
];

export async function getAllProviders() {
  const now = Date.now();
  return SEED_PROVIDERS.map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    // stagger one stale entry so the decay state is visible in the demo
    status: resolveStatus({ isLive: p.isLive, lastVerified: i === 6 ? now - 5 * 60 * 60 * 1000 : now }),
  }));
}

/** True when a lastVerified timestamp is within the 4-hour decay window. */
export function isFresh(lastVerified) {
  return Date.now() - lastVerified < DECAY_MS;
}

// ── Brightside Recovery — Verified Anchor Provider ────────────────────────────

// Demo lastVerified timestamps, computed once at module load.
// Supabase version: last_verified column on the providers table.
const _NOW   = Date.now();
const _FRESH = _NOW - 2 * 60 * 60 * 1000;   // 2 h ago  → badge fresh
const _STALE = _NOW - 5 * 60 * 60 * 1000;   // 5 h ago  → badge stale (decay triggered)

/**
 * 17 Northeast Ohio centers. Clinic-level data only (name, address, phone,
 * services) — never PHI. Addresses/phones are illustrative placeholders
 * pending partner confirmation.
 * All coordinates are within NE Ohio map bounds (SW [40.394, -82.758] → NE [42.327, -80.519]).
 */
const BRIGHTSIDE_SEED = [
  { id: 'bs-001', name: 'Brightside Recovery – Cleveland West',    address: '4401 Detroit Ave, Cleveland, OH 44113',           phone: '(216) 400-6800', lat: 41.4762, lng: -81.7230, services: ['MAT', 'IOP', 'Detox'], acceptsMedicaid: true, zipCode: '44113', lastVerified: _FRESH },
  { id: 'bs-002', name: 'Brightside Recovery – Lakewood',          address: '14800 Detroit Ave, Lakewood, OH 44107',           phone: '(216) 400-6801', lat: 41.4820, lng: -81.7982, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44107', lastVerified: _FRESH },
  { id: 'bs-003', name: 'Brightside Recovery – Parma',             address: '5500 Pearl Rd, Parma, OH 44129',                  phone: '(440) 400-6802', lat: 41.3845, lng: -81.7229, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44129', lastVerified: _STALE },
  { id: 'bs-004', name: 'Brightside Recovery – Strongsville',      address: '18605 Royalton Rd, Strongsville, OH 44136',       phone: '(440) 400-6803', lat: 41.3145, lng: -81.8357, services: ['MAT', 'IOP', 'Detox'], acceptsMedicaid: true, zipCode: '44136', lastVerified: _FRESH },
  { id: 'bs-005', name: 'Brightside Recovery – Broadview Heights', address: '1000 E Royalton Rd, Broadview Heights, OH 44147', phone: '(440) 400-6804', lat: 41.3200, lng: -81.6790, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44147', lastVerified: _FRESH },
  { id: 'bs-006', name: 'Brightside Recovery – Akron Main',        address: '285 E Market St, Akron, OH 44308',                phone: '(330) 400-6805', lat: 41.0814, lng: -81.5190, services: ['MAT', 'IOP', 'Detox'], acceptsMedicaid: true, zipCode: '44308', lastVerified: _FRESH },
  { id: 'bs-007', name: 'Brightside Recovery – Akron North Hill',  address: '1400 N Main St, Akron, OH 44310',                 phone: '(330) 400-6806', lat: 41.1034, lng: -81.5100, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44310', lastVerified: _STALE },
  { id: 'bs-008', name: 'Brightside Recovery – Cuyahoga Falls',    address: '2310 State Rd, Cuyahoga Falls, OH 44223',         phone: '(330) 400-6807', lat: 41.1334, lng: -81.4845, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44223', lastVerified: _FRESH },
  { id: 'bs-009', name: 'Brightside Recovery – Kent',              address: '615 E Erie St, Kent, OH 44240',                   phone: '(330) 400-6808', lat: 41.1531, lng: -81.3579, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44240', lastVerified: _FRESH },
  { id: 'bs-010', name: 'Brightside Recovery – Lorain',            address: '3700 Kolbe Rd, Lorain, OH 44053',                 phone: '(440) 400-6809', lat: 41.4529, lng: -82.1824, services: ['MAT', 'IOP', 'Detox'], acceptsMedicaid: true, zipCode: '44053', lastVerified: _FRESH },
  { id: 'bs-011', name: 'Brightside Recovery – Elyria',            address: '347 Midway Blvd, Elyria, OH 44035',               phone: '(440) 400-6810', lat: 41.3684, lng: -82.1074, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44035', lastVerified: _STALE },
  { id: 'bs-012', name: 'Brightside Recovery – Mentor',            address: '9785 Johnnycake Ridge Rd, Mentor, OH 44060',      phone: '(440) 400-6811', lat: 41.6731, lng: -81.3498, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44060', lastVerified: _FRESH },
  { id: 'bs-013', name: 'Brightside Recovery – Willoughby',        address: '4150 Erie St, Willoughby, OH 44094',              phone: '(440) 400-6812', lat: 41.6403, lng: -81.4118, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44094', lastVerified: _FRESH },
  { id: 'bs-014', name: 'Brightside Recovery – Eastlake',          address: '34950 Lake Shore Blvd, Eastlake, OH 44095',       phone: '(440) 400-6813', lat: 41.6550, lng: -81.4499, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44095', lastVerified: _FRESH },
  { id: 'bs-015', name: 'Brightside Recovery – Medina',            address: '3720 Medina Rd, Medina, OH 44256',                phone: '(330) 400-6814', lat: 41.1381, lng: -81.8637, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44256', lastVerified: _FRESH },
  { id: 'bs-016', name: 'Brightside Recovery – Canton',            address: '4715 Dressler Rd NW, Canton, OH 44718',           phone: '(330) 400-6815', lat: 40.8450, lng: -81.4400, services: ['MAT', 'IOP', 'Detox'], acceptsMedicaid: true, zipCode: '44718', lastVerified: _FRESH },
  { id: 'bs-017', name: 'Brightside Recovery – Massillon',         address: '2420 17th St NE, Massillon, OH 44646',            phone: '(330) 400-6816', lat: 40.7967, lng: -81.5213, services: ['MAT', 'IOP'],          acceptsMedicaid: true, zipCode: '44646', lastVerified: _FRESH },
];

/**
 * Brightside anchor locations. Async so the Supabase swap (SELECT + realtime)
 * changes only this file — components already treat the result as fetched data.
 */
export async function getBrightsideLocations() {
  return BRIGHTSIDE_SEED;
}
