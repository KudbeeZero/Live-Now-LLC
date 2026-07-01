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
