# Handoff: Shouks MVP

## Overview

Shouks is a platform for creating niche-community marketplaces — "Wix for vertical marketplaces." A **marketplace owner** stands up a curated market (e.g., air-cooled Ferraris, pre-war chronographs), defines its listing schema and membership rules, and moderates the community. **Members** apply to join, then browse, post listings (fixed-price or auction), and broadcast Items Sought (ISO) requests.

This package covers the **entire MVP** — every end-user and owner-facing flow described in the product spec. A non-MVP flow (cross-marketplace discovery) is deliberately excluded.

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look, copy, structure, and interaction patterns. They are **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's existing environment** (React / Next.js / Vue / SwiftUI / etc.) using its established patterns, design system, and component libraries. If no environment exists yet, pick the most appropriate framework for the project and implement there.

The HTML uses inline React (Babel-transpiled) for some flows and vanilla HTML/CSS for others. Treat each as a visual + behavioral spec, not a starting scaffold.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, copy, states, and micro-interactions are all deliberate and final. Match them pixel-perfectly using the target codebase's design system. Where the target codebase already has components that do the same job (buttons, modals, tables), use those and adapt tokens — don't rebuild primitives.

## Source Material

See `reference/`:

- **Shouks Product Spec.txt** — full product vision, scope boundaries, and post-MVP direction
- **Shouks MVP Requirements.txt** — concrete MVP feature list (authoritative for what ships)
- **logo.png** — brand mark source (also embedded as inline SVG in every flow file)

---

## Flow Inventory

Open `index.html` in a browser for a clickable portal. Each flow file is self-contained and uses a bottom stepper to page through its screens; progress is persisted to `localStorage`.

| #      | File                                     | Surface      | What it covers                                                                                                                                                                    |
| ------ | ---------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `Flow 1 - Auth and Onboarding.html`      | Web + mobile | Email/OAuth sign-in, identity verification (Facebook/Instagram/LinkedIn), role picker (Owner vs Member), first-run onboarding                                                     |
| **2**  | `Flow 2 - Create Marketplace.html`       | Web (owner)  | Marketplace setup wizard: identity, listing schema builder, membership rules, monetization tiers, publish                                                                         |
| **3**  | `Flow 3 - Member Application.html`       | Mobile       | Member-side application flow: discover marketplace → review rules → link verified accounts → submit application → status states (pending / approved / rejected / needs-more-info) |
| **4**  | `Flow 4 - Member Browsing.html`          | Mobile       | Feed / search / filters / listing detail / seller profile / post a listing / post an ISO / bid on an auction                                                                      |
| **5**  | `Flow 5 - Owner Moderation.html`         | Web (owner)  | Dashboard, application queue, applicant detail + approve/reject, listing moderation, member directory with role/suspend/remove controls                                           |
| **6**  | `Flow 6 - Core App Shell.html`           | Web (member) | Desktop browsing shell: nav, marketplace switcher, feed, search, filters, listing detail, create-listing, profile, a visitor / not-a-member variant                               |
| **7**  | `Flow 7 - Owner Admin.html`              | Web (owner)  | Settings tabs: identity, schema builder (CRUD + field types), membership rules, monetization, admin roles & granular permissions, activity/analytics, billing                     |
| **10** | `Flow 10 - Notifications and Email.html` | Mixed        | In-app bell (empty / grouped unread / read), four transactional email templates (welcome, application approved, auction won, ISO match)                                           |

**Flow 8 (cross-marketplace discovery)** is post-MVP — intentionally out of scope. **Flow 9 (visitor view)** folded into Flow 6 as screen 6F.

Also included:

- `Landing Page.html` — marketing site (hero, two-sided value prop, feature sections, FAQ, footer)

---

## Design Tokens

All flow files share the same `:root` token block. Treat these as the source of truth.

### Colors (OKLCH-defined for perceptual uniformity)

| Token            | Value                    | Use                               |
| ---------------- | ------------------------ | --------------------------------- |
| `--bg`           | `#ffffff`                | Page background                   |
| `--bg-soft`      | `oklch(0.975 0.003 230)` | Secondary surfaces, sidebar       |
| `--bg-panel`     | `oklch(0.96 0.004 230)`  | Inset panels, empty states        |
| `--surface`      | `#ffffff`                | Cards                             |
| `--line`         | `oklch(0.9 0.005 230)`   | Primary dividers                  |
| `--line-soft`    | `oklch(0.93 0.004 230)`  | Secondary dividers                |
| `--ink`          | `oklch(0.2 0.02 240)`    | Primary text, icons               |
| `--ink-soft`     | `oklch(0.38 0.02 240)`   | Secondary text                    |
| `--muted`        | `oklch(0.55 0.015 240)`  | Tertiary text, captions           |
| `--hover`        | `oklch(0.95 0.005 230)`  | Hover backgrounds                 |
| `--blue`         | `oklch(0.66 0.16 230)`   | Primary brand accent, CTAs, links |
| `--blue-ink`     | `oklch(0.5 0.15 232)`    | Pressed states, strong links      |
| `--blue-soft`    | `oklch(0.96 0.03 230)`   | Blue badge backgrounds            |
| `--blue-softer`  | `oklch(0.98 0.015 230)`  | Unread row tint                   |
| `--success`      | `oklch(0.58 0.12 155)`   | Approvals, "sold" states          |
| `--success-soft` | `oklch(0.95 0.04 155)`   | Success backgrounds               |
| `--warn`         | `oklch(0.72 0.13 75)`    | Pending, needs-attention          |
| `--warn-soft`    | `oklch(0.97 0.04 75)`    | Warn backgrounds                  |
| `--danger`       | `oklch(0.55 0.18 25)`    | Rejections, destructive actions   |
| `--danger-soft`  | `oklch(0.96 0.035 25)`   | Danger backgrounds                |

### Radii

`--r-sm: 6px` · `--r: 10px` · `--r-lg: 14px`

### Shadows

- `--shadow-sm`: `0 1px 2px oklch(0.2 0.02 240 / 0.04)` — subtle cards
- `--shadow`: `0 1px 2px oklch(0.2 0.02 240 / 0.04), 0 2px 10px -6px oklch(0.2 0.02 240 / 0.08)` — default card
- `--shadow-lg`: `0 12px 40px -12px oklch(0.2 0.02 240 / 0.2)` — modals, dropdowns

### Spacing Scale

4px base grid. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Section gutters: 24–32px. Card padding: 20–24px.

### Typography

- **Display / UI**: `"Inter Tight"`, sans-serif. Weights: 400, 500, 600, 700.
- **Serif accent**: `"Instrument Serif"`, serif. Used sparingly for marketing moments and warmth (hero tagline on Landing, emotional copy in email templates).
- **Mono**: `"JetBrains Mono"`, monospace. Only in code-like contexts (URL demos, listing IDs).

Type scale (line-height 1.4 unless noted):

- `display`: 56/1.1, weight 600 — Landing hero
- `h1`: 32/1.2, weight 600
- `h2`: 24/1.25, weight 600
- `h3`: 18/1.35, weight 600
- `body`: 14/1.5, weight 400
- `body-lg`: 16/1.55, weight 400
- `caption`: 12/1.4, weight 500 — metadata, labels
- `overline`: 11/1.3, weight 600, uppercase, letterspacing 0.04em

---

## Components (Shared Vocabulary)

Every flow uses the same component set. Build these once in the target codebase and reuse.

### Navbar (Owner + Member web shells)

Horizontal bar, 64px tall, `--bg` background, `--line` bottom border. Left to right: **brand lockup** (logo + "Shouks" wordmark), **marketplace switcher** (logo chip + name + chevron dropdown), **primary nav** (Dashboard / Browse / Messages with `.ping` count badge), spacer, **search icon button**, **notifications icon button** (bell + red dot when unread), **avatar** (32×32 circle with initial). See Flow 5/6/7 for the exact DOM.

### Browser Bar (demo chrome)

Flow files show mocks inside a `.browser-bar` (`dots` + `url`). **Do not port** — that's prototype chrome only.

### Cards

White surface, `--r` radius, `--shadow-sm` default, `--shadow` on hover. Padding 20–24px. Used for listings, member rows, application rows, settings sections.

### Buttons

- **Primary**: `--blue` bg, white text, 10px radius, 8–12px vertical padding, 14px font 500 weight. Hover: `--blue-ink`.
- **Secondary**: `--surface` bg, `--line` 1px border, `--ink` text. Hover: `--hover` bg.
- **Ghost**: transparent bg, `--ink-soft` text. Hover: `--hover` bg.
- **Danger**: `--danger` bg, white text. Hover: slightly darker red.
- **Sizes**: sm (28px tall), md (36px tall), lg (44px tall).

### Form Controls

- Inputs: 36–40px tall, `--line` 1px border, 10px radius, 12px horizontal padding. Focus: `--blue` border + 3px `--blue-softer` ring.
- Labels: 13px 500 weight `--ink-soft`, 6px bottom margin.
- Help text: 12px `--muted`.

### Badges / Pills

10–12px font 500 weight, 2–4px vertical × 8px horizontal padding, 999px radius.

- Status: Approved (`--success-soft`/`--success`), Pending (`--warn-soft`/`--warn`), Rejected (`--danger-soft`/`--danger`), Auction (`--blue-soft`/`--blue-ink`).

### Modals / Dialogs

Overlay: `oklch(0.2 0.02 240 / 0.35)`. Panel: 480–640px max-width, `--r-lg` radius, `--shadow-lg`, 24–32px padding. See Flow 5 screens 5C, Flow 7 modal examples.

### Split Pane (Owner moderation pattern)

Used in Flow 5 (applications, listings, members). Left column: list (420px fixed width), right column: detail (flex 1). List items have a vertical `--blue` rail when selected.

### Empty State

Centered column: icon (40×40, `--ink-soft`), headline (16px 600), subcopy (14px `--muted`), single CTA. Used in empty queues, empty searches, no notifications.

### Notification Row (Flow 10)

Timestamp left (12px `--muted`), avatar or icon, title line, preview line, inline CTAs right-aligned. Unread: `--blue-softer` bg + 3px `--blue` left rail. Red count badge on bell icon is `--danger`.

### Schema Field Builder (Flow 2, Flow 7)

Draggable row with: grip handle, field type icon, field name input, type dropdown (text / number / dropdown / multi-select / date / photo / money), required toggle, delete. Add-field button below list.

---

## Per-Flow Detail

### Flow 1 — Auth & Onboarding

Screens: landing → email or OAuth → verify email → identity verification (link Facebook/Instagram/LinkedIn via OAuth, skippable but badge-locked) → role selection (Owner / Member) → onboarding success.

- Identity verification is **additive**, not the login method. It populates `verifiedAccounts[]` on the user profile. A member can sign in with email and have zero linked accounts, but most marketplaces will require at least one to apply.
- Role selection sets a default landing view but doesn't restrict — one user can own and belong to marketplaces.

### Flow 2 — Create Marketplace (Owner)

A 4-step wizard with a sticky footer. Each step is a section of a single long page with a left-rail progress indicator.

1. **Identity**: name, handle (auto-suggested subdomain), tagline, description, cover image, category.
2. **Listing schema**: field builder. Pre-seeds common fields for the category. Types: text, number, dropdown, multi-select, date, photo, money. Each field: required toggle, help text.
3. **Membership rules**: radio — Public / Approval required / Invite-only. If approval: required application fields (which verified accounts, free-text questions), auto-approve criteria.
4. **Monetization**: tier builder. Each tier: name, price, billing interval, included permissions (browse / list / auctions / alerts). Free tier is always present.

Publish button in sticky footer; requires all required steps complete.

### Flow 3 — Member Application (Mobile)

Phone-frame prototype. Screens: marketplace landing page (discover) → Apply CTA → application form (linked accounts required by owner + free-text questions + attestations) → submitted state → pending / approved / rejected / needs-more-info states.

- Rejected and needs-more-info states include the owner's note verbatim.
- Approved state deep-links to the marketplace's feed.

### Flow 4 — Member Browsing (Mobile)

Phone-frame prototype. Screens: feed, search with filters (sheet), listing detail (gallery, seller card, bid/buy CTA), seller profile (listings + reputation + linked accounts), create listing (schema-driven form), create ISO (what you're looking for + price ceiling + alert frequency), place bid (auction-only modal with reserve/minimum info).

- Auctions show live countdown, current high bid, minimum next bid, reserve-met indicator.
- ISOs are broadcast posts; the feed mixes listings and ISOs with a type pill.

### Flow 5 — Owner Moderation (Web)

5 screens: dashboard, application queue, approve dialog, listing moderation, members directory.

- Dashboard: queue counts at top, recent activity feed, deep-links into each surface.
- Applicant detail shows: linked accounts with verification age, other Shouks marketplaces they belong to, email domain signal, free-text answers, attestations. Approve/Reject/Request more info use the same confirm dialog shape with an optional note.
- Member directory: search, filter by role/status, bulk actions (role change, suspend, remove).

### Flow 6 — Core App Shell (Member, Web)

Desktop-web parallel to Flow 4's mobile browsing. 6 screens including a **6F visitor / not-a-member view** — the same feed but with blurred listings, a Join CTA, and read-only visible tease.

### Flow 7 — Owner Admin (Web)

Settings, tabbed:

- **Identity**: edit name, handle, cover, description
- **Schema**: same field builder as Flow 2, plus migration warnings when changing published fields
- **Rules**: edit membership rules (same shape as Flow 2 step 3)
- **Monetization**: edit tiers, view subscriber counts per tier
- **Roles**: invite admins, granular permission matrix (e.g., "can moderate listings but not change settings")
- **Activity**: new members / listings / engagement / revenue charts
- **Billing**: platform billing (Shouks's revenue take + seat costs if any)

### Flow 10 — Notifications & Email

- **In-app bell**: dropdown panel (380px wide). Three states: empty / grouped unread / read. Groups: Today / Yesterday / Earlier this week. Category tabs: All / Mentions / Sales / ISO. Each row has a primary inline CTA ("View listing", "Approve", "Reply to ISO").
- **Emails**: 4 transactional templates laid out as desktop-web mock + mobile-web mock side by side.
  - Welcome (single CTA, quiet footer)
  - Application approved (co-signed by the marketplace owner avatar, next-steps checklist)
  - Auction won (celebratory badge + invoice treatment + escrow callout — note escrow is off-platform per product spec)
  - ISO match (side-by-side "Your ISO" vs "The match" cards)

---

## Interactions & Behavior

### Navigation & State

- Flow files use in-page tabs/stepper; in the real app each flow is a route tree. Use your router's default patterns.
- Marketplace switcher is a global nav component; the active marketplace ID is app-wide state.
- Role (owner vs member) within a marketplace is per-user-per-marketplace and determines which routes are reachable.

### Form Validation

- Inline validation on blur. Required fields marked with asterisk in label.
- Submit-disabled when invalid; show a summary banner if user hits submit anyway.
- Schema-driven listing form (Flow 4/6): field types drive input UI; required + min/max/pattern from schema definition.

### Auctions

- Countdown updates every 1s client-side from server end-time (clock-skew tolerant).
- Placing a bid opens a modal with minimum-next-bid auto-filled; user must confirm. Successful bid updates current high inline without page reload.
- Reserve-not-met state shows badge; reserve-met changes the CTA copy to "Bid to win."

### Moderation

- Approve / Reject / Request-more-info all open the same confirm dialog with an optional note. The note is sent verbatim to the applicant.
- Listing moderation actions: Approve (moves to published), Edit (opens owner-edit view of listing), Remove (with reason), Shadow-ban (visible to seller only).

### Notifications

- Bell red dot when any unread exists; badge count only when ≥1 and the dropdown is closed.
- Opening the dropdown marks items as read **on close**, not on open — so the user sees their unread highlights.
- Category tabs filter client-side from the same result set.

### Responsive

- Desktop flows (1, 2, 5, 6, 7, 10) target ≥1280px primary. Graceful collapse to 1024px (split panes stack, sticky rails become sheets). Below 1024 → redirect to mobile views (Flows 3, 4).
- Mobile flows (3, 4) target 390×844 (iPhone frame in mocks). Use safe-area insets on notched devices.

---

## State Management

Per-marketplace state shape (illustrative):

```ts
Marketplace {
  id, handle, name, tagline, description, coverImageUrl, category
  listingSchema: FieldDef[]
  membershipRules: { kind: 'public' | 'approval' | 'invite', requiredAccounts: Provider[], questions: Question[] }
  monetization: Tier[]
  roles: { userId, role: 'owner' | 'admin' | 'member', permissions: Permission[] }[]
  stats: { members, activeListings, pendingApplications, flaggedListings }
}

Listing {
  id, marketplaceId, sellerId, type: 'fixed' | 'auction' | 'iso'
  schemaValues: Record<FieldId, Value>
  photos: string[]
  price? | auction? { startPrice, reservePrice?, minIncrement, endsAt, bids: Bid[] }
  status: 'draft' | 'pending_review' | 'published' | 'sold' | 'expired' | 'removed'
}

Application {
  id, marketplaceId, userId
  linkedAccounts: { provider, handle, verifiedAt }[]
  answers: Record<QuestionId, string>
  status: 'pending' | 'approved' | 'rejected' | 'needs_info'
  reviewerNote?, reviewedBy?, reviewedAt?
}

Notification {
  id, userId, kind: 'mention' | 'sale' | 'iso_match' | 'auction_ended' | 'application_update' | 'system'
  subject, preview, deeplink, createdAt, readAt?
}
```

### Data Fetching

- Feed + search: paginated; infinite scroll on mobile, page-size controls on desktop.
- Notifications: paginated bell dropdown shows latest 20; "See all" goes to full notifications page.
- Real-time hooks: auction bids (websocket or polling), application status (polling).

---

## Assets

- **Brand mark**: `reference/logo.png` — also embedded as inline SVG in every flow file. The SVG is token-aware (uses `currentColor`) so it adapts to light/dark surfaces. Geometry: hexagon outline + 3-spoke isometric cube divider + center cyan node with 3 black satellite nodes connected by thin spokes.
- **Placeholder imagery**: Flow files use `picsum.photos` and solid color placeholders. Replace with real listing photos / marketplace cover images from your asset pipeline.
- **Icons**: Inline SVG throughout, `stroke="currentColor"` with `stroke-width="2"`. Match your codebase's icon system (Lucide, Heroicons, etc.) — shapes match Lucide conventions.
- **Avatars**: Initials on a colored chip for MVP; upgrade to photo avatars when identity verification is linked.

---

## Files in This Package

```
design_handoff_shouks_mvp/
├── README.md (this file)
├── index.html                               portal linking all flows
├── Landing Page.html                        marketing site
├── Flow 1 - Auth and Onboarding.html
├── Flow 2 - Create Marketplace.html
├── Flow 3 - Member Application.html
├── Flow 4 - Member Browsing.html
├── Flow 5 - Owner Moderation.html
├── Flow 6 - Core App Shell.html
├── Flow 7 - Owner Admin.html
├── Flow 10 - Notifications and Email.html
└── reference/
    ├── Shouks Product Spec.txt              full product vision
    ├── Shouks MVP Requirements.txt          authoritative MVP scope
    └── logo.png                             brand mark source
```

## Open Questions & Explicit Non-Scope

Per the product spec, these are **explicitly out of scope** for MVP — do not implement:

- In-app messaging (members communicate via their linked social accounts + phone)
- Payment processing (transactions happen off-platform)
- Listing authenticity verification (requires specialized partnerships)
- Cross-marketplace broadcasting (post-MVP)

Flagged for decisions during implementation:

- **Escrow mention** in "Auction won" email: currently worded as "We recommend using escrow for high-value items" — confirm copy with legal/ops before launch.
- **Identity providers**: spec calls out Facebook, Instagram, LinkedIn. Confirm OAuth implementation priority and fallback for users without social accounts.
- **Search backend**: mocks assume structured schema-aware search (filter by dropdown values, price ranges, etc.). Choose search tech (Postgres full-text / Meilisearch / Algolia / Typesense) based on expected marketplace sizes.
