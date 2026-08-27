# AI Travel Budget Simulator

A B2B SaaS web app that lets travel agents, tour operators, and travel planners
go from **customer → trip → costs → pricing → AI optimization → quotation** in
minutes instead of a spreadsheet.

## Overview

The core promise: *"Saya tidak perlu menghitung budget perjalanan secara
manual lagi."* An agent logs in, picks or creates a customer, enters trip
details and travelers, builds up costs (flights, hotels, transport,
activities, meals, other), configures contingency/service fee/markup, and
immediately sees selling price, profit, and margin. From there they can run a
Budget/Standard/Premium scenario simulator, ask the AI Travel Copilot for
optimization ideas, apply the ones they like, and generate a customer-facing
quotation with a downloadable PDF.

## Features

- **Email/password authentication** (Auth.js / NextAuth v5, JWT sessions).
- **Multi-step trip creation wizard** — Customer → Trip Details → Costs →
  Pricing — with the draft persisted in `localStorage` (Zustand) so nothing is
  lost when navigating back and forth.
- **Deterministic calculation engine** (`src/lib/calculations`) — every
  formula (flight, accommodation, activity, meal, base cost, contingency,
  service fee, selling price, profit, margin, scenarios) is plain
  TypeScript, unit tested, and re-run on both the client (instant feedback)
  and the server (source of truth). The server never trusts totals sent by
  the browser — it recomputes everything from the raw cost items before
  saving.
- **Cost Database** — reusable supplier prices with full CRUD, search, and
  filtering; pick an item while building a trip and its fields pre-fill (still
  editable).
- **Trip Templates** — save a itinerary (KL 4D3N, Singapore 4D3N, Bangkok
  5D4N, Tokyo 7D6N, Bali 4D3N are seeded as demo data) with default costs,
  markup, and contingency; "Use Template" pre-fills a new trip.
- **Scenario Simulator** — Budget/Standard/Premium projections computed from
  the trip's real costs, with a deterministic (non-AI) recommendation based on
  customer budget fit and margin health.
- **AI Travel Copilot** — a chat panel for free-form questions ("Kategori mana
  yang paling besar?", "Berapa profit saya jika markup menjadi 20%?") plus an
  "Optimize My Trip" flow that proposes savings grounded only in the trip's
  existing cost items (never invents prices), shows a before/after preview,
  and only touches the database once the agent explicitly applies it — through
  the same deterministic calculation engine used everywhere else.
- **Quotations** — generate a customer-facing quotation from a trip's current
  pricing, preview it, toggle internal financials (hidden from customers by
  default), and download a matching PDF (`@react-pdf/renderer`).
- **Settings** — company info, default markup/contingency/service fee,
  quotation terms, and per-currency exchange rates (IDR, MYR, SGD, THB, JPY,
  USD, EUR) used to normalize every cost item to IDR.
- **Dashboard, Customers, Trips, Quotations** list views with live data (no
  hardcoded numbers), search/filtering, and polished empty states.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** + hand-built shadcn/ui-style primitives (Radix UI under
  the hood)
- **Prisma** + **PostgreSQL**
- **Auth.js (NextAuth v5)** — Credentials provider, bcrypt password hashing
- **Zod** for all input validation (client and server)
- **Zustand** for the trip-creation wizard's draft state
- **@react-pdf/renderer** for quotation PDFs
- **Vitest** for unit tests

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Long random string used to sign session tokens |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `AUTH_TRUST_HOST` | Set to `true` when running behind a proxy/container where the Host header may not match `NEXTAUTH_URL` |
| `AI_API_KEY` | API key for an OpenAI-compatible chat completions endpoint. Leave empty to run without AI — the Travel Copilot will show a friendly "not configured" message instead of erroring. |
| `AI_BASE_URL` | Base URL for the AI provider (defaults to `https://api.openai.com/v1`) |
| `AI_MODEL` | Model name (defaults to `gpt-4o-mini`) |

No secrets are ever exposed to the browser — the AI key and database URL are
only read in server components, server actions, and route handlers.

## Database Setup

```bash
# Apply the schema (creates the database if needed, given a valid DATABASE_URL)
npx prisma migrate dev

# Seed demo data: a demo login, customers, cost database items, templates,
# and the Sarah Wijaya / Kuala Lumpur 4D3N trip used in the acceptance test
npm run db:seed
```

Demo login after seeding:

```
email:    agent@travelbuilder.demo
password: travelbuilder123
```

`npm run db:studio` opens Prisma Studio if you want to inspect the data.

## Development

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## Testing

Unit tests cover the entire calculation engine (flight/accommodation/
transportation/activity/meal/other formulas, base cost, contingency, service
fee, selling price, profit, margin, margin-status thresholds, currency
conversion, and the scenario simulator) including edge cases: single vs.
multiple travelers, multiple rooms/nights, zero markup, high markup, and loss
scenarios.

```bash
npm run test
```

## Build

```bash
npm run build
npm run start
```

## AI Setup

The Travel Copilot and "Optimize My Trip" call any OpenAI-compatible
`/chat/completions` endpoint (OpenAI itself, Azure OpenAI, OpenRouter, a local
proxy, etc.) — just set `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`. The AI is
never trusted to do arithmetic: optimization responses are validated against
a Zod schema, every proposed change references an existing cost item by id,
and the actual savings/new totals shown to the agent (and the numbers that
get saved when they click "Apply") are always recomputed by the deterministic
calculation engine, never taken from the AI's own claimed numbers.

## Project Structure

```
prisma/                   Schema, migrations, seed script
src/
  app/
    (auth)/login/         Public login page
    (app)/                Authenticated app shell: dashboard, trips,
                           customers, templates, cost-database, quotations,
                           settings
    api/                  AI chat/optimize, quotation PDF, template lookup,
                           NextAuth route handlers
  components/
    ui/                   shadcn/ui-style primitives (Button, Card, Dialog...)
    layout/                Sidebar, topbar, responsive app shell
    trips/                 Wizard steps, cost item editor, cost database picker
    pricing/               Live cost summary, scenario simulator
    ai/                    Travel Copilot chat + optimization panel
    quotation/              Quotation tab, PDF preview
    customers/, cost-database/, templates/, settings/, dashboard/
  lib/
    calculations/          Deterministic pricing engine (pure functions)
    currency/               Currency conversion + supported currencies
    ai/                     AI client, prompt/context builder, Zod schemas
    pdf/                    React-PDF quotation document
    auth/                   NextAuth config, session helpers
    validation/             Zod schemas for every form/entity
    actions/                Server actions (create/update/delete, recompute)
    queries/                Server-side data-fetching helpers
    db/                     Prisma client singleton
  store/                   Zustand trip-draft store, toast store
tests/                     Vitest unit tests for the calculation engine
```

## Important Design Decisions

- **Financial calculations are never performed by AI.** All formulas live in
  `src/lib/calculations` as plain, unit-tested TypeScript. The AI can only
  explain, analyze, and propose changes to existing cost items — the app
  always recomputes the actual numbers.
- **Server-side recalculation.** Every mutation (`createTrip`,
  `updateTripCostsAndPricing`, `applyAIOptimization`) re-validates the input
  with Zod and recomputes base cost → contingency → service fee → total cost →
  selling price → profit → margin from scratch on the server before writing
  to the database. The client's numbers are for instant feedback only.
- **Currency normalization.** Every cost item stores its own currency, unit
  price, and the exchange rate used, plus a computed `baseAmountIDR`. All
  trip-level totals are in IDR.
- **Not implemented (by design, out of MVP scope):** live flight/hotel
  pricing APIs, payment gateways, WhatsApp integration, multi-tenant/role
  permissions, real-time market pricing. The architecture (separate
  `lib/calculations`, `lib/ai`, `lib/currency`, `lib/pdf` modules) is meant to
  make adding these later straightforward without a rewrite.
