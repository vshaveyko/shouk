# Shouks

Private marketplace platform — Next.js 14 + Prisma + Auth.js v5 + Playwright.

## Quick start

```bash
# 1. Install deps (already done if you see node_modules)
npm install

# 2. Ensure a local Postgres is running, then:
npx prisma migrate dev --name init
npm run db:seed

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

## Seeded test accounts

| Email                   | Password    | Role                                       |
| ----------------------- | ----------- | ------------------------------------------ |
| owner@shouks.test       | Test123!@#  | Owner of Ferrari Frenzy + Gooners United   |
| member@shouks.test      | Test123!@#  | Active member of both seeded marketplaces  |
| reviewer@shouks.test    | Test123!@#  | Admin of Ferrari Frenzy                    |
| applicant@shouks.test   | Test123!@#  | Pending applicant on Ferrari Frenzy        |

## E2E tests

```bash
npm run test:install          # first run only, installs Chromium
npm run test:e2e              # runs against seeded DB + spun up dev server
npm run test:e2e:ui           # Playwright UI mode
```

Tests exercise every major workflow end-to-end (full CRUD, not smoke):

- `01-auth-onboarding.spec.ts` — signup, signin, role picker, verifications (OAuth mock + phone OTP)
- `02-create-marketplace.spec.ts` — full 4-step wizard publish + validation + slug auto-fill
- `03-member-application.spec.ts` — apply, verify gating, pending/approved/rejected states
- `04-browsing-listings.spec.ts` — feed, listing detail, create/edit listings, search, auctions + bids
- `05-owner-moderation.spec.ts` — application approve/reject, members directory, listing queue
- `06-owner-admin.spec.ts` — settings tabs (identity, schema, rules, monetization, roles, activity, billing)
- `07-notifications.spec.ts` — bell popover, inbox, mark-read, email templates

## Deploy (Railway)

1. New Railway project → "Deploy from GitHub".
2. Add a Postgres plugin. Railway will inject `DATABASE_URL`.
3. Set env vars (or reuse `.env.railway`):
   - `NEXTAUTH_SECRET` / `AUTH_SECRET` — long random string
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
   - `NEXTAUTH_URL` — your public URL (e.g. `https://shouks-production.up.railway.app`)
   - `NEXT_PUBLIC_APP_URL` — same
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (web push)
4. Build command: `npm ci && npx prisma generate && npx prisma migrate deploy && npm run build`
5. Start command: `npm run start`
6. Health check: `/api/health`

Configuration lives in `railway.json` + `nixpacks.toml`.

## PWA

- Manifest at `public/manifest.webmanifest`.
- Service worker at `public/sw.js` (cache-first icons, network-first navigations, push + notificationclick).
- Icons at `public/icons/`.

## Project shape

- `app/` — Next.js App Router pages, API routes.
- `components/` — UI primitives + app shell + brand.
- `lib/` — prisma client, auth helpers, utils.
- `prisma/` — schema, migrations, seed.
- `tests/e2e/` — Playwright specs.
- `styles/globals.css` — design tokens (OKLCH) + pattern classes.
