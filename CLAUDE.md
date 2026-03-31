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
- All user interactions are **anonymous via Internet Identity (ICP)**.
- Providers are identified by an internal opaque `id: Text` — never by patient-linked data.
- Any feature request that would store PHI must be **rejected at the architecture level**.
- Audit logs must contain only provider-side timestamps and status flags — never patient data.

### 2. THE 4-HOUR DECAY LAW
Any provider `isLive` status with a `lastVerified` timestamp **older than 14,400 seconds
(4 hours)** must be programmatically treated as `#Unknown` — never as `true`.

- `getEmergencyActive()` enforces this server-side in Motoko.
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
  via `generateHandoffToken(zipCode)` on the ICP canister, and (2) clinic staff or a peer
  scans it via `verifyHandoff(token)`, completing the on-chain record.
- Tokens expire after **exactly 5 minutes** (`TOKEN_EXPIRY_NS = 300_000_000_000` ns).
- Tokens are **one-time use only** — the canister deletes the token on successful verification.
- Each verified handoff increments the ZIP-level `totalLivesSaved` counter.
- The Admin Heatmap must display a **pulsing PoP marker** on the map for any ZIP where
  a handoff was verified in the last 30 seconds.
- `verifyHandoff` returns `#Ok(zipCode)` on success, `#Expired`, `#NotFound`, or `#AlreadyUsed`
  on failure — the frontend must handle all four cases.
- No patient data, no user identity beyond the volunteer's anonymous ICP Principal.
- The `HandoffImpact` component must be rendered alongside the PoP flow at all times.

---

## ARCHITECTURE INVARIANTS

| Layer     | Technology              | Notes                                  |
|-----------|-------------------------|----------------------------------------|
| Backend   | Motoko / ICP canister   | dfx-compatible, stable variables only  |
| Frontend  | React + Vite + Tailwind | No SSR; pure client-side               |
| Identity  | Internet Identity       | Anonymous — no wallet key logging      |
| Map       | react-leaflet           | Bounds locked to Northeast Ohio        |

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
