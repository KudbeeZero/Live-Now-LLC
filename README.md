# Live Now Recovery

**Anonymous, real-time MAT provider availability for Northeast Ohio (Region 13) —
with verified Warm Handoffs and radical drug-price transparency.**

## What it does

- **Live provider map** — Northeast Ohio treatment providers with a hard rule:
  any "open" status older than 4 hours is automatically downgraded (the Decay Law).
- **Proof of Presence** — volunteers generate one-time, 5-minute QR codes; clinic
  staff scan them to verify a warm handoff. Impact is counted by verified arrivals,
  not clicks. No patient data is ever collected.
- **Price transparency** — every provider view shows Suboxone at $185.00 retail vs.
  $45.37 via Mark Cuban Cost Plus Drugs, with a prescriber script card
  (NCPDP ID pre-filled).
- **Brightside Recovery anchor** — 17 partner locations (Detox / IOP / MAT, all
  Medicaid) with priority placement and one-touch directions.

## Pages

`/` Find Care (map + handoff loop) · `/mission` · `/founders` · `/pitch`

## Run it

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
npm run build   # production build in dist/
```

```bash
npm run lint    # ESLint (also enforces the no-console NO-PHI guardrail)
npm run test    # vitest — token lifecycle + 4-hour decay law (11 tests)
```

CI (GitHub Actions) runs lint, test, and build on every pull request.

## Architecture

React + Vite + Tailwind, pure client-side. All data access goes through
`frontend/src/lib/api.js` — the single seam between UI and storage. Components
never touch storage or a network client directly (lint + tests keep it that way).
See `CLAUDE.md` for the non-negotiable product rules (No-PHI, 4-Hour Decay,
Transparency Mandate, Proof of Presence).

## What's real vs. what's deferred

**Working today (demo mode):**
- The full Proof of Presence loop — generate a QR, scan it with a camera, verify.
  Tokens are 128-bit `crypto.getRandomValues` values, expire at exactly 5 minutes,
  and are one-time use. All four verify outcomes (`Ok` / `Expired` / `NotFound` /
  `AlreadyUsed`) are enforced and tested.
- The 4-hour Decay Law, enforced in the data layer and covered by tests.
- All four routes (Find Care, Mission, Founders, Pitch) build and render clean.
- Persistence is **in-browser only** (localStorage) — a real demo, not a mock,
  but data does not sync between devices yet.

**Explicitly deferred (not started, by design):**
- **Supabase persistence** — the data layer is written as a drop-in seam for
  Postgres + edge functions; waiting on project credentials.
- **Solana attestation** — optional later phase: daily Merkle-root anchoring of
  handoff counts for public auditability. No wallet, no chain code in this repo.
- **Founders content** — `/founders` renders with `[EDIT ME]` placeholders
  awaiting the founders' real bios and photos.
- **Partner data** — Brightside addresses/phones are illustrative placeholders
  pending partner confirmation.

## Deploy (≈2 minutes)

The build is a static SPA (`frontend/dist/`), deployable to any static host:

- **Cloudflare Pages:** `npx wrangler pages deploy dist --project-name live-now-recovery`
  (after `npx wrangler login`), or connect the repo in the dashboard with build
  command `npm run build` and output `frontend/dist`.
- **Vercel:** connect the repo, set root directory to `frontend` — `vercel.json`
  already handles the SPA rewrite.
