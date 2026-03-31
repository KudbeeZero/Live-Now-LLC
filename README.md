# Live Now Recovery

> **Real-time, privacy-first medication-assisted treatment (MAT) provider availability for Ohio Region 13.**
> Built on the Internet Computer Protocol. Zero patient data. Always anonymous.

---

## Table of Contents

- [Mission](#mission)
- [Why We Built This](#why-we-built-this)
- [Who It Serves](#who-it-serves)
- [Where It Is Going](#where-it-is-going)
- [How It Works](#how-it-works)
- [Core Features](#core-features)
  - [Real-Time Provider Map](#real-time-provider-map)
  - [Emergency Banner](#emergency-banner)
  - [Proof of Presence — Warm Handoff](#proof-of-presence--warm-handoff)
  - [Price Transparency Card](#price-transparency-card)
  - [Brightside Recovery — Verified Anchor Provider](#brightside-recovery--verified-anchor-provider)
- [Hard Rules (Non-Negotiable)](#hard-rules-non-negotiable)
  - [No-PHI Policy](#1-no-phi-policy)
  - [The 4-Hour Decay Law](#2-the-4-hour-decay-law)
  - [Transparency Mandate](#3-transparency-mandate)
  - [Proof of Presence as Primary Metric](#4-proof-of-presence-as-primary-metric)
- [Architecture](#architecture)
  - [Stack Overview](#stack-overview)
  - [Backend — Motoko / ICP Canister](#backend--motoko--icp-canister)
  - [Frontend — React + Vite + Tailwind](#frontend--react--vite--tailwind)
  - [Data Flow](#data-flow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Canister CLI Reference](#canister-cli-reference)
- [Component Reference](#component-reference)
- [Map Bounds](#map-bounds)
- [Emergency Mode](#emergency-mode)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Mission

Every day in Ohio, people in active addiction call clinics — and get voicemail.
They show up at treatment centers — and find locked doors.
They ask for help — and get a waiting list.

**Live Now Recovery exists to close that gap in real time.**

We surface which providers are *actually available right now*, get people through the door with a verified warm handoff, and eliminate the hidden cost barrier that keeps Suboxone out of reach — all without storing a single byte of patient data.

---

## Why We Built This

The opioid crisis in Northeast Ohio is not a shortage of treatment — it is a shortage of **real-time information and trusted handoffs**.

Key problems this app solves:

| Problem | Our Solution |
|---|---|
| Clinics list as "open" but are actually full or closed | 4-Hour Decay Law — stale status automatically marked Unknown |
| People in crisis don't know which clinic to go to | Live map with confirmed green pins only for verified-fresh providers |
| Volunteers drop people off without proof it happened | Proof of Presence QR handoff — on-chain record, anonymous, one-time |
| Suboxone costs $185/month at retail — patients disappear | Mandatory Cost Plus price card — $45.37/month with one-click script transfer |
| Treatment deserts invisible at night and on weekends | Deep red emergency banner after 5 PM ET and on weekends with MAR NOW hotline |
| Patients afraid their data will be shared | Zero PHI — fully anonymous Internet Identity, no names, no records |

---

## Who It Serves

- **People in active addiction** seeking immediate access to MAT (Medication-Assisted Treatment) in Northeast Ohio
- **Volunteers and peer support specialists** who physically escort people to treatment and need to record the handoff
- **Clinic staff** at participating providers (especially Brightside Recovery) who verify arrivals via QR scan
- **Ohio Region 13 administrators** tracking Proof of Presence impact across ZIP codes
- **Prescribers** who want a one-click workflow to route patients to the Mark Cuban Cost Plus Drugs pharmacy

---

## Where It Is Going

Live Now Recovery is a **mission-critical infrastructure project**, not a prototype.
The roadmap is anchored by real-world impact, not feature velocity.

### Near-Term (Next 90 Days)
- [ ] Live ICP canister deployment (mainnet) with stable state
- [ ] Real provider onboarding for all 17 Brightside Recovery locations
- [ ] Heartbeat ping system — providers self-report isLive every ≤ 3 hours
- [ ] Admin dashboard for Ohio Region 13 coordinators

### Mid-Term (3–12 Months)
- [ ] Expand anchor provider network beyond Brightside (partner clinics, FQHCs)
- [ ] Multi-region support (Ohio Region 5, Region 7 — Columbus, Cincinnati corridors)
- [ ] SMS/push alert system for volunteers when a nearby provider goes live
- [ ] Offline-capable PWA — works in low-connectivity areas
- [ ] Integration with Ohio MHAR (Mental Health & Addiction Recovery) data feeds

### Long-Term Vision
- [ ] Statewide Ohio coverage with county-level PoP heatmaps
- [ ] National expansion framework — replicable sovereign stack for other states
- [ ] On-chain impact reporting for funders and grant agencies (fully anonymous aggregate data)
- [ ] Open API for peer recovery organizations to embed Live Now data in their own tools
- [ ] Real-time bed availability integration (via opt-in provider API keys)

---

## How It Works

```
Person in crisis → Volunteer finds open provider on map
                → Volunteer generates 5-min QR token (ZIP-level, no PHI)
                → Volunteer walks person into clinic
                → Clinic staff scans QR
                → On-chain Proof of Presence recorded
                → ZIP counter increments on Admin Heatmap
                → Token deleted (one-time use, privacy-preserving)
```

No patient name. No diagnosis. No identifying information. Just a ZIP code and a timestamp proving someone made it through the door.

---

## Core Features

### Real-Time Provider Map

- Interactive Leaflet map locked to Northeast Ohio bounds
- Color-coded pins:
  - **Teal (green)** — Confirmed Live, verified within 4 hours
  - **Yellow** — Unknown / Stale (last verified > 4 hours ago)
  - **Gray** — Offline
  - **Royal Blue teardrop** — Brightside Recovery anchor locations (always prioritized)
  - **Pulsing green** — Proof of Presence pulse (ZIP where a handoff was just verified)
- Map cannot be panned outside NE Ohio — bounds are enforced both on mount and on user interaction
- Legend always visible explaining all marker types

### Emergency Banner

- Full-width deep red banner rendered automatically after **5:00 PM Eastern Time** and on **Saturdays and Sundays**
- Text: **"NEED HELP NOW? Call Ohio MAR NOW: 833-234-6343"**
- Clickable tel: link — one tap to call
- Re-evaluates every 60 seconds (no page reload needed)
- This banner is a **life-safety feature** — it cannot be hidden, toggled, or feature-flagged under any circumstance

### Proof of Presence — Warm Handoff

The primary efficacy metric for the entire system.

**Volunteer side (`VolunteerHandoff` component):**
1. Enter a 5-digit NE Ohio ZIP code
2. App calls `generateHandoffToken(zipCode)` on the ICP canister
3. A QR code appears with a 5-minute countdown timer
4. Volunteer shows the QR to clinic staff on arrival

**Clinic staff side (`ScanHandoff` component):**
1. Open the scan view on a clinic device
2. Tap "Start Camera & Scan"
3. Point at volunteer's QR code
4. App calls `verifyHandoff(token)` on the canister
5. Returns one of four outcomes:
   - `#Ok(zipCode)` — success, ZIP counter incremented, token deleted
   - `#Expired` — token older than 5 minutes, rejected
   - `#NotFound` — invalid token
   - `#AlreadyUsed` — token already redeemed (one-time use enforced)

**Impact tracking (`HandoffImpact` component):**
- Total verified handoffs displayed prominently
- Per-ZIP breakdown sorted by count
- Recently verified ZIPs pulse with animated indicator

### Price Transparency Card

Every provider view includes the `PriceComparisonCard` — no exceptions.

| | Price |
|---|---|
| MAT Retail (Suboxone) | ~~$185.00/month~~ |
| Mark Cuban Cost Plus Drugs | **$45.37/month** |
| **Monthly Savings** | **$139.63** |

Drug: Buprenorphine/Naloxone 8mg/2mg Film (Generic Suboxone), 60 films / 30-day supply.

One-click "Transfer Script to Cost Plus" button links directly to costplusdrugs.com.

### Brightside Recovery — Verified Anchor Provider

Brightside Recovery is the **primary physical partner** for Ohio Region 13 — 17 locations across Northeast Ohio offering full-continuum care: Detox, IOP, and MAT.

**Rules enforced in code:**
- Brightside locations appear **first** in any search for Suboxone, MAT, Buprenorphine, IOP, or Detox
- Royal Blue (`#003087`) teardrop map markers with `zIndexOffset: 2000` (above all other pins)
- Each card shows a **Verified by Brightside** badge (blue when fresh, yellow when stale)
- All 17 locations accept Medicaid
- Every card includes the inline Suboxone price bridge ($185 → $45.37)
- "Request Script for Cost Plus" pre-fills MCCPD NCPDP ID `5755167`
- Each card embeds an inline PoP QR generator pre-filled with the location's ZIP code

---

## Hard Rules (Non-Negotiable)

These rules exist at the architecture level and cannot be removed, toggled, or overridden.

### 1. No-PHI Policy

**Absolute prohibition** on storing Patient Health Information.

- No patient names, dates of birth, diagnoses, prescriptions, or any data that could identify an individual
- All user interactions are anonymous via Internet Identity (ICP)
- Providers identified by opaque `id: Text` only
- Handoff records contain only: volunteer Principal (anonymous), ZIP code, timestamp
- No PHI in logs, console output, or error messages — ever

### 2. The 4-Hour Decay Law

Any provider `isLive` status with a `lastVerified` timestamp older than **14,400 seconds (4 hours)** is programmatically treated as `#Unknown` — never as `true`.

- Enforced server-side in `resolveStatus()` and `getEmergencyActive()` in the Motoko canister
- Frontend map displays Unknown pins in yellow — never green
- No UI component may show a green "Live" pin without a server-confirmed fresh timestamp
- Heartbeat jobs (when added) must re-verify every ≤ 3 hours

### 3. Transparency Mandate

**Every provider view must include the `PriceComparisonCard` component.**

- Hardcoded baseline: MAT Retail $185.00 vs. Mark Cuban Cost Plus Drugs $45.37
- Must include a direct "Transfer Script" CTA linking to costplusdrugs.com
- This component is not optional, not feature-flagged, and not removable
- The mandate exists to fight price opacity in addiction treatment — it is mission-critical

### 4. Proof of Presence as Primary Metric

Proof of Presence (PoP) is how we measure whether this system is actually working.

- Token expiry: exactly 5 minutes (`TOKEN_EXPIRY_NS = 300_000_000_000` ns)
- Tokens are one-time use only — deleted on successful verification
- Each verified handoff increments the ZIP-level `totalLivesSaved` counter
- Admin Heatmap pulses for any ZIP where a handoff was verified in the last 30 seconds
- `verifyHandoff` handles all four return cases: `#Ok`, `#Expired`, `#NotFound`, `#AlreadyUsed`

---

## Architecture

### Stack Overview

| Layer | Technology | Notes |
|---|---|---|
| Backend | Motoko / ICP Canister | dfx-compatible, stable variables only |
| Frontend | React 18 + Vite + Tailwind CSS | No SSR; pure client-side SPA |
| Identity | Internet Identity (ICP) | Anonymous — no wallet key logging |
| Map | react-leaflet + Leaflet 1.9.4 | Bounds locked to Northeast Ohio |
| QR Generation | qrcode.react | 256px, error-correction level H |
| QR Scanning | html5-qrcode | 10fps, 250×250 scan box |
| Icons | lucide-react | Accessible SVG icons |

### Backend — Motoko / ICP Canister

**Stable Variables** (persist across canister upgrades):

```motoko
stable var providerEntries : [(Text, Provider)]
stable var handoffEntries  : [(Text, Handoff)]
stable var tokenEntries    : [(Text, HandoffToken)]
stable var zipCountEntries : [(Text, Nat)]
stable var tokenNonce      : Nat
```

**Key Constants:**
- `DECAY_NS = 14_400_000_000_000` — 4-hour provider decay
- `TOKEN_EXPIRY_NS = 300_000_000_000` — 5-minute handoff token TTL

**Public API:**

| Function | Type | Description |
|---|---|---|
| `getAllProviders()` | query | All providers with resolved status |
| `getEmergencyActive()` | query | Only providers verified within 4 hours |
| `toggleLive(id, status)` | update | Set provider isLive, stamp lastVerified |
| `registerProvider(id, name, lat, lng)` | update | Add new provider |
| `generateHandoffToken(zipCode)` | shared | Returns opaque one-time token |
| `verifyHandoff(token)` | update | Verify QR scan, returns VerifyResult |
| `getHandoffCountsByZip()` | query | ZIP-level PoP count array |
| `getTotalHandoffs()` | query | Total verified handoffs (Nat) |

**Data Types:**

```motoko
type ProviderStatus = { #Live; #Offline; #Unknown };

type Provider = {
  id: Text; name: Text;
  lat: Float; lng: Float;
  isLive: Bool; lastVerified: Int;
};

type VerifyResult = {
  #Ok: Text;      // ZIP code of verified handoff
  #Expired;       // Token TTL exceeded
  #NotFound;      // Token does not exist
  #AlreadyUsed;   // Token already redeemed
};
```

### Frontend — React + Vite + Tailwind

**Custom Tailwind Colors:**

| Token | Hex | Usage |
|---|---|---|
| `cplus-teal` | `#00A896` | Cost Plus branding, success states |
| `navy` | `#0D1F4C` | Primary UI chrome |
| `emergency` | `#C0392B` | Emergency banner, life-safety |
| `brightside` | `#003087` | Brightside anchor provider |

**Accessibility:** All interactive elements enforce `min-h-[44px]` / `min-w-[44px]` touch targets per WCAG 2.1 AA.

### Data Flow

```
Volunteer                   ICP Canister                  Clinic Staff
────────                    ────────────                  ────────────
Enter ZIP        ──────>    generateHandoffToken()
                 <──────    token (opaque string)
Show QR code

                                                  Scan QR   ──────>
                            verifyHandoff(token)  <──────
                            - Validates TTL
                            - Deletes token (one-time)
                            - Increments ZIP counter
                            - Returns #Ok(zipCode)
                                                  <──────   Show success

                <──────     zipCounts updated
PoP pulse on map
HandoffImpact updated
```

---

## Project Structure

```
Live-Now-LLC/
├── backend/
│   ├── dfx.json              # DFX canister config (local: 127.0.0.1:4943)
│   └── main.mo               # Motoko canister — all backend logic
├── frontend/
│   ├── index.html            # Root HTML, Leaflet CSS via CDN
│   ├── package.json          # Dependencies and scripts
│   ├── vite.config.js        # Dev server port 3000, auto-open
│   ├── tailwind.config.js    # Custom color palette, touch targets
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx          # React root mount
│       ├── App.jsx           # Root component, global state
│       ├── index.css         # Tailwind directives
│       ├── test-expiry.js    # Token TTL unit tests
│       ├── hooks/
│       │   └── useEmergencyMode.js   # ET time + weekend detection
│       └── components/
│           ├── DopplerMap.jsx        # react-leaflet map, all pin types
│           ├── EmergencyBanner.jsx   # Deep red life-safety header
│           ├── PriceComparisonCard.jsx  # Mandatory transparency card
│           ├── VolunteerHandoff.jsx  # QR token generation
│           ├── ScanHandoff.jsx       # QR camera scanning + verify
│           ├── HandoffImpact.jsx     # PoP totals + ZIP breakdown
│           └── providers/
│               └── BrightsideAnchor.jsx  # 17 anchor location cards
├── CLAUDE.md                 # Permanent project memory (AI sessions)
├── README.md
└── LICENSE
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install) (for backend)
- A modern browser with camera access (for QR scanning)

### Backend Setup

```bash
cd backend

# Start local Internet Computer replica
dfx start --clean --background

# Deploy the canister
dfx deploy live_now_backend
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build
```

### Canister CLI Reference

```bash
# Get all providers
dfx canister call live_now_backend getAllProviders

# Get only fresh (within 4 hours) active providers
dfx canister call live_now_backend getEmergencyActive

# Toggle a provider live
dfx canister call live_now_backend toggleLive '("provider-id", true)'

# Generate a handoff token
dfx canister call live_now_backend generateHandoffToken '("44101")'

# Verify a scanned token
dfx canister call live_now_backend verifyHandoff '("123456-1700000000000")'

# Get handoff counts per ZIP
dfx canister call live_now_backend getHandoffCountsByZip

# Get total verified handoffs
dfx canister call live_now_backend getTotalHandoffs
```

---

## Component Reference

| Component | File | Purpose |
|---|---|---|
| `App` | `App.jsx` | Root layout, global state, provider list |
| `DopplerMap` | `DopplerMap.jsx` | Interactive NE Ohio map, all pin types |
| `EmergencyBanner` | `EmergencyBanner.jsx` | After-hours life-safety header |
| `useEmergencyMode` | `hooks/useEmergencyMode.js` | ET time + weekend hook |
| `PriceComparisonCard` | `PriceComparisonCard.jsx` | Mandatory Suboxone price transparency |
| `VolunteerHandoff` | `VolunteerHandoff.jsx` | ZIP entry + QR generation + countdown |
| `ScanHandoff` | `ScanHandoff.jsx` | Camera QR scan + canister verification |
| `HandoffImpact` | `HandoffImpact.jsx` | Total PoP count + ZIP breakdown |
| `BrightsideAnchor` | `providers/BrightsideAnchor.jsx` | All 17 Brightside location cards |

---

## Map Bounds

The map is permanently locked to Northeast Ohio. These values are enforced in code and cannot be changed at runtime:

```js
const NE_OHIO_BOUNDS = [
  [40.394, -82.758], // SW — south of Mansfield
  [42.327, -80.519], // NE — Lake Erie / PA border
];
const CLEVELAND_CENTER = [41.4993, -81.6944];
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 8;
const MAX_ZOOM = 15;
```

---

## Emergency Mode

The system enters Emergency Mode automatically when:

- The current **Eastern Time hour is 17 or later** (5:00 PM ET), **OR**
- The current day is **Saturday or Sunday**

In Emergency Mode, a deep red banner renders at the top of every page:

```
NEED HELP NOW? Call Ohio MAR NOW: 833-234-6343
```

This banner re-evaluates every 60 seconds. It is never hidden by feature flags, A/B tests, or user settings. It is a life-safety feature.

---

## Deployment

### Local Development
```bash
dfx start --clean --background  # IC replica
dfx deploy                      # Deploy backend canister
cd frontend && npm run dev       # Frontend on :3000
```

### ICP Mainnet
```bash
dfx deploy --network ic
```

The canister ID will be assigned by the IC network. Update the frontend agent configuration with the mainnet canister ID before deploying the frontend build.

---

## Contributing

This project is closed-source and proprietary. All rights reserved.
See [LICENSE](./LICENSE) for full terms.

If you are a vetted partner organization (Ohio recovery network, clinic operator, MHAR affiliate) and want to discuss integration or data-sharing agreements, contact the maintainers through official channels.

---

## License

Copyright (c) 2026 Live Now LLC. All rights reserved.

See [LICENSE](./LICENSE) for the full proprietary license terms.
**No permission is granted to use, copy, modify, or distribute this software.**
