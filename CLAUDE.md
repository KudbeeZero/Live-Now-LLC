# Live Now Recovery — Sovereign Stack Project Memory
## Ohio Region 13 | Privacy-by-Design Architecture

> This file is permanent project memory for all AI-assisted development sessions.
> Every rule below is non-negotiable and must be enforced in every commit.

---

## HARD RULES

### 1. NO-PHI POLICY
**ABSOLUTE PROHIBITION** on storing Patient Health Information (PHI).

- No patient names, dates of birth, medical history, diagnoses, prescriptions, or
  any data that could identify an individual seeking treatment.
- All user interactions are **anonymous — no accounts, no identity collection**.
- Providers are identified by an internal opaque `id: Text` — never by patient-linked data.
- Any feature request that would store PHI must be **rejected at the architecture level**.
- Audit logs must contain only provider-side timestamps and status flags — never patient data.

### 2. THE 4-HOUR DECAY LAW
Any provider `isLive` status with a `lastVerified` timestamp **older than 14,400 seconds
(4 hours)** must be programmatically treated as `#Unknown` — never as `true`.

- `resolveStatus()` enforces this in the data layer (`frontend/src/lib/api.js`);
  once Supabase lands, it moves server-side into a SQL view.
- The frontend map must visually distinguish `#Unknown` (grey) from confirmed Live (green).
- No UI component may display a green "Live" pin without a server-confirmed fresh timestamp.
- Cron-style heartbeat jobs (if added) must re-verify every ≤ 3 hours to stay within margin.

### 3. TRANSPARENCY MANDATE
**Every provider view must include the `PriceComparisonCard` component.**

- Hardcoded baseline: MAT Retail $185.00 vs. Mark Cuban Cost Plus Drugs $45.37.
- Must include a direct "Transfer Script" CTA linking to https://costplusdrugs.com.
- This component is not optional, not feature-flagged, and not removable.
- The mandate exists to fight price opacity in addiction treatment — it is a mission-critical feature.

### 4. PROOF OF PRESENCE — PRIMARY EFFICACY METRIC
**Proof of Presence (PoP) is the primary metric for system efficacy.**

- A "Warm Handoff" is verified when: (1) a Volunteer generates a one-time QR token
  via `generateHandoffToken(zipCode)` in the data layer, and (2) clinic staff or a peer
  scans it via `verifyHandoff(token)`, completing the verified record.
- Tokens expire after **exactly 5 minutes** (`TOKEN_TTL_MS` in `frontend/src/lib/api.js`).
- Tokens are **one-time use only** — marked used on successful verification.
- Each verified handoff increments the ZIP-level `totalLivesSaved` counter.
- The Admin Heatmap must display a **pulsing PoP marker** on the map for any ZIP where
  a handoff was verified in the last 30 seconds.
- `verifyHandoff` returns `{ status: 'Ok', zipCode }` on success, or status `'Expired'`,
  `'NotFound'`, or `'AlreadyUsed'` on failure — the frontend must handle all four cases.
- No patient data, no user identity — tokens are cryptographically random and opaque.
- The `HandoffImpact` component must be rendered alongside the PoP flow at all times.

---

## BRIGHTSIDE RECOVERY — VERIFIED ANCHOR PROVIDER

Brightside Recovery is the **primary physical partner** for Ohio Region 13.
They offer Full-Continuum care (Detox, IOP, MAT) across 17 Northeast Ohio locations.

### Priority Rules
- **Search Priority:** For any query containing "Suboxone", "MAT", "Buprenorphine",
  "IOP", "Detox", or "medication-assisted treatment", Brightside Recovery locations
  **must appear first** in results, before generic/unverified providers.
- **Anchor Designation:** Brightside locations display with Royal Blue (`#003087`)
  teardrop markers on the map with `zIndexOffset: 2000` (above all other pins).
- **Verification Badge:** Brightside cards show "Verified by Brightside" (blue) when
  `lastVerified < 4 hours`; badge turns yellow ("Verify Pending") when stale (§2 Decay Law).
- **Medicaid:** All 17 Brightside locations `acceptsMedicaid: true`.

### Suboxone Cost Plus Bridge (Mandatory)
- Every Brightside location card must display the inline price snippet:
  Retail `$185.00` → Cost Plus `$45.37` (save `$139.63/month`).
- The "Request Script for Cost Plus" button pre-fills the MCCPD NCPDP ID `5755167`.
- Drug: Buprenorphine/Naloxone 8mg/2mg Film (Generic Suboxone), 60 films / 30-day supply.

### Warm Handoff (PoP) Integration
- Each Brightside location card embeds an inline PoP QR generator (pre-filled ZIP).
- When a volunteer drops a user at any Brightside location, the generated QR is scanned
  by clinic staff via the global `ScanHandoff` component — this pulses the correct ZIP
  on the Admin Heatmap, fulfilling the Proof of Presence mandate (§4).

---

## ARCHITECTURE INVARIANTS

| Layer     | Technology                    | Notes                                            |
|-----------|-------------------------------|--------------------------------------------------|
| Data      | `frontend/src/lib/api.js`     | Single seam — local adapter now, Supabase next   |
| Backend   | Supabase (Postgres + edge fn) | Planned — decay via SQL view, tokens via edge fn |
| Frontend  | React + Vite + Tailwind       | No SSR; client-side routing via react-router     |
| Identity  | None                          | Anonymous by architecture — no accounts          |
| Map       | react-leaflet                 | Bounds locked to Northeast Ohio                  |
| Ledger    | Solana (optional, phase 4)    | Daily Merkle-root anchoring of handoff counts    |

**ICP/Motoko is retired.** Do not reintroduce dfx, canisters, or Internet Identity.
All backend calls go through `frontend/src/lib/api.js` — components never talk to
storage or a network client directly.

### Map Bounds — Northeast Ohio Lock
The Leaflet map MUST be constrained to the following bounds at all times:

```js
const NE_OHIO_BOUNDS = [
  [40.394, -82.758], // SW corner (south of Mansfield)
  [42.327, -80.519], // NE corner (Lake Erie / PA border)
];
const CLEVELAND_CENTER = [41.4993, -81.6944];
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 8;
const MAX_ZOOM = 15;
```

The map must call `map.setMaxBounds(NE_OHIO_BOUNDS)` and `map.setMinZoom(MIN_ZOOM)`.
Users must not be able to pan outside Northeast Ohio.

---

## EMERGENCY MODE RULES

- If the current **Eastern Time** hour >= 17 (5:00 PM) **OR** the day is Saturday/Sunday,
  render a persistent **Deep Red** header banner.
- Banner text: **"NEED HELP NOW? Call Ohio MAR NOW: 833-234-6343"**
- The banner must be full-width, `min-height: 44px`, and appear above all other content.
- This is a life-safety feature — it must never be hidden behind feature flags or A/B tests.

---

## DEVELOPMENT CONVENTIONS

- **No PHI in logs, console.log, or error messages.**
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- All Motoko stable variables must be explicitly typed.
- React components use functional style with hooks — no class components.
- Tailwind classes preferred over inline styles.
- Accessibility: All interactive elements must meet WCAG 2.1 AA (min touch target 44×44px).
