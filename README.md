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

## Architecture

React + Vite + Tailwind, pure client-side. All data access goes through
`frontend/src/lib/api.js` — currently a local adapter (the full handoff loop works
in-browser), designed to swap to Supabase (Postgres + edge functions) without
touching components. See `CLAUDE.md` for the non-negotiable product rules
(No-PHI, 4-Hour Decay, Transparency Mandate, Proof of Presence).

> Demo data is illustrative. Partner locations, addresses, and phone numbers are
> placeholders pending confirmation.
