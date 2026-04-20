# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow rules (must follow)

### TDD — write the Playwright spec first

Every feature, bug fix, or UI change goes through Playwright e2e before any implementation edit.

1. **Write a failing spec first.** Add to an existing file in `tests/e2e/` if it fits a flow (01-07), or create a new numbered spec. Use helpers from `tests/fixtures/helpers.ts` (`signIn`, `signUp`, `USERS`, `uniqueEmail`, `completeRole`) — don't re-implement login flows inline.
2. **Run the spec — confirm it fails for the right reason.** `npm run test:e2e -- tests/e2e/NN-foo.spec.ts -g "test name"`.
3. **Implement the minimum to pass.** Edit app/components/API/schema as needed.
4. **Re-run the same spec — it must pass.** Then run the full suite (`npm run test:e2e`) to catch regressions.
5. **Only when green, commit.**

Tests run sequentially (single worker) against a shared seeded DB, so avoid ordering dependencies between tests. State resets are via helpers, not `beforeEach` hacks. Prefer role-based locators (`getByRole`, `getByLabel`, `getByTestId`) over CSS selectors.

### Commit discipline — one commit per feature, with a real message

When a feature or meaningful change is done (spec green, typecheck clean), commit it immediately — don't batch multiple features into one commit.

- Commit message: imperative subject line ≤70 chars, then a blank line, then a body that answers **what + why** (not how). Reference the design flow / spec filename when relevant.
- Never skip hooks (`--no-verify`) unless I ask. If a hook fails, fix the underlying issue.
- Never amend an already-shared commit. For local fixups before pushing, amend is fine.
- Don't commit `.env*` files (other than `.env.example`), `.claude/`, or anything matching `.gitignore` patterns. Check `git status` before staging.

Example of a good message:

```
Port owner dashboard HTML from Flow 5 screen 1

Replaces the ad-hoc stats grid with the design's exact metric-grid +
section-grid structure. Wires live Prisma data for pending apps (hot
state when aging >48h), listings-to-approve, member counts, GMV 30d.
Activity feed unions applications/listings/bids/sales.

Spec: tests/e2e/05-owner-moderation.spec.ts "dashboard shows queue counts"
```

### Design fidelity

Match the HTML in `design_handoff_shouks_mvp/` verbatim when building a screen. The flow prefix tells you which file:

- Flow 1 — auth & onboarding
- Flow 2 — create-marketplace wizard
- Flow 3 — member application (mobile)
- Flow 4 — member browsing (mobile)
- Flow 5 — owner moderation
- Flow 6 — core app shell (member, desktop) · 6A home, 6B marketplace, 6C listing, 6D sell/ISO, 6E messages, 6F profile, 6G activity, 6H account settings
- Flow 7 — owner admin (analytics, customization, rules, billing)
- Flow 10 — notifications & email

Serve the design files locally when comparing: `python3 -m http.server 8765 -d design_handoff_shouks_mvp/`.

Use the existing design tokens in `styles/globals.css` (OKLCH-based). Serif display type is Instrument Serif — apply via `serif` class or inline `fontFamily: '"Instrument Serif", serif'` for large headings and numeric displays. Sans is Inter Tight.

## Commands

```bash
# dev
npm run dev                   # http://localhost:3000
npm run typecheck             # tsc --noEmit (run before commit)
npm run lint

# database
npx prisma migrate dev --name <short-name>   # local schema change
npm run db:seed               # re-seed the demo users/marketplaces
npm run db:studio             # Prisma Studio

# e2e
npm run test:install          # first time only (chromium)
npm run test:e2e              # full suite against dev server on port 3100
npm run test:e2e:ui           # Playwright UI for debugging
npm run test:e2e -- tests/e2e/04-browsing-listings.spec.ts -g "create listing"   # single test
E2E_NO_WEBSERVER=1 E2E_BASE_URL=http://localhost:3000 npm run test:e2e           # reuse running dev server

# build
npm run build                 # prisma generate → migrate deploy → next build
```

## Architecture

### Stack

Next.js 14 App Router · Prisma + Postgres · Auth.js v5 (`auth.ts` / `auth.config.ts`) · Radix UI primitives · Tailwind with OKLCH tokens · Playwright e2e.

### Authentication & access control

- `auth.ts` exports `auth()`, `signIn`, `signOut`. Providers: Google OAuth + email+password (`bcryptjs`). Sessions are JWT.
- **Always gate pages through helpers** in `lib/auth-helpers.ts`:
  - `requireUser()` — any signed-in user; redirects to `/signin`.
  - `getUserContext()` — returns `{ user, memberships, owned }` or null; use for Navbar props.
  - `requireOwnerOf(slug)` — owner/admin/moderator of that marketplace; redirects to `/home`.
  - `requireMemberOf(slug)` — active membership; returns membership even if not ACTIVE so the caller can show pending/rejected states.
- Don't hand-roll session checks in new pages — it misses the role hierarchy.

### Route layout

- **Marketing / public**: `/`, `/explore`, `/m/[slug]` (visitor view), `/u/[id]` (seller profile), `/l/[id]` (listing).
- **Member app** (authenticated, non-owner chrome): `/home`, `/messages`, `/activity`, `/notifications`, `/profile`, `/saved`, `/search`, `/settings`, `/m/[slug]/feed`, `/m/[slug]/new`, `/apply/[slug]`.
- **Owner shell** (authenticated, sidebar chrome): `/owner/create`, `/owner/[slug]/{dashboard,applications,listings,members,settings/*,analytics,payouts}`.
- **Auth**: `/(auth)/signin`, `/(auth)/signup`, `/(auth)/onboarding/{verify,role}`.
- **API**: `/api/{auth,health,applications,listings,marketplaces,notifications,push,signup,user}`.

### Shell components — use these; don't create parallel chrome

- `components/app/Navbar.tsx` — top bar with brand, marketplace switcher, Explore/Messages (member) or Dashboard/Browse/Messages (owner), search chip, bell, avatar menu. Pass `mode="owner"` only for `/owner/*` routes — it hides nav-links since the sidebar takes over.
- `components/owner/OwnerShell.tsx` — wraps Navbar + `OwnerSidebar` (MODERATION: Dashboard/Applications/Listings/Members with live counts; MARKETPLACE: Settings/Analytics/Payouts). Loads the active marketplace and badge counts via Prisma. Use for every `/owner/[slug]/*` page.
- `components/owner/SettingsTabs.tsx` — identity/schema/rules/monetization/roles/activity/billing tab strip inside settings.
- `components/ui/*` — Radix-backed primitives (Button, Dialog, Select, Tabs, etc.). Prefer these over raw HTML form controls.

### Data model (prisma/schema.prisma)

Domain entities: `User`, `VerifiedAccount`, `Marketplace`, `SchemaField`, `ApplicationQuestion`, `Membership`, `Application`, `Listing`, `Bid`, `ListingSave`, `Report`, `ModerationAction`, `Invite`, `SavedSearch`, `Notification`, `PushSubscription` + Auth.js tables (`Account`, `Session`, `VerificationToken`).

Key patterns:

- Marketplace owners also have an auto-created OWNER `Membership` — when querying "my marketplaces", union `ownedMarketplaces` with `memberships` (see `getUserContext`).
- Listings are schema-driven: `Marketplace.schemaFields` defines the form; `Listing.schemaValues` is the JSON payload. Validate against the field types in `SchemaField` when writing.
- `Listing.status` enum: `DRAFT | PENDING_REVIEW | ACTIVE | SOLD | CLOSED | RESERVE_NOT_MET | WON | REMOVED | SHADOW_HIDDEN`. Moderation flags come through `Report` (unresolved = flagged).
- `Application.status`: `PENDING | APPROVED | REJECTED | NEEDS_INFO`. Status transitions should go through `/api/applications/[id]` so notifications fire.

### Styling per-page CSS

Large ported screens (dashboard, applications, listings, members, messages, activity, wizard) inline a scoped `<style dangerouslySetInnerHTML>` block with a body-class prefix (`dash-body`, `apps-body`, `mem-body`, `msgs`, `act-wrap`, `wiz-wrap`, etc.) to match the design HTML exactly without fighting Tailwind. Keep the class names identical to the design file so future edits map 1:1.

Global tokens + shared patterns live in `styles/globals.css` (`@layer components` has `.btn-*`, `.card`, `.badge-*`, `.shell`, `.split-pane`, `.mobile-frame`, `.hero-wash`).

### Email templates

Preview-only routes under `app/emails/*` render the transactional templates (welcome, application-approved, auction-won, iso-match) using `EmailFrame` + `emailHtml.ts`. No sender is wired yet — hooking up Resend (or similar) means calling `renderEmailHtml` and posting to the provider from API routes.

## Deployment

Production target: Railway. Config in `railway.json` + `nixpacks.toml`. Build runs `prisma generate && prisma migrate deploy && next build`; start runs `next start`. Health check at `/api/health`.

Required env in production:

- `DATABASE_URL` (Railway Postgres plugin)
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — long random
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` — the public domain
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — only if web push is turned on

## Seeded accounts (local + test DB)

All password `Test123!@#`:

- `owner@shouks.test` — owner of Ferrari Frenzy + Gooners United
- `member@shouks.test` — active member of both
- `reviewer@shouks.test` — admin of Ferrari Frenzy
- `applicant@shouks.test` — pending applicant on Ferrari Frenzy
