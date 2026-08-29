# Keto Kitchen

A keto tracking PWA for Juan & Mariana — daily calorie/net-carb budgets, a
supermarket-ready "is this keto?" checker, a weekly menu planner drawn from
their real meal rotation, weight tracking with a loss projection, and snack
variety nudges — built on Next.js + Supabase.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Auth + Realtime) for shared, synced household data
- Recharts for the weight chart
- Vitest for the pure calculation logic in `lib/calculations/`

## Setup

1. Install dependencies: `npm install`
2. Set up Supabase — see [`supabase/README.md`](supabase/README.md) for the
   full walkthrough (schema, seed data, creating the two accounts).
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   project URL and anon key.
4. `npm run dev` and open http://localhost:3000.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run test` — run the Vitest suite (`lib/calculations/**`)
- `npm run lint` — ESLint

## Project layout

- `app/(app)/` — the authenticated app: Today, Checker, Menu, Weight, Foods, Profile
- `lib/calculations/` — pure, tested logic (net carbs, budgets, TDEE projection, menu rotation, snack variety, ingredient-fit suggestions)
- `lib/supabase/` — Supabase client/server/middleware helpers and hand-written DB types
- `supabase/` — schema migration, seed data, and setup docs
