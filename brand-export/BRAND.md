# Shouks — Brand & Design System

> Source of truth for engineers. Read this before shipping UI.
> Full visual reference: **`Brand Guidelines.html`** · Machine tokens: **`tokens.json`**

---

## TL;DR

- **Blue only** (`oklch(0.66 0.16 230)`). One accent color. Don't introduce new brand hues.
- **Two type families.** IBM Plex Sans for UI, Source Serif 4 (italic) for warmth.
- **Use CSS variables, not literals.** Every color, radius, space, and shadow has a `--var`. If you're typing a hex code, you're probably doing it wrong.
- **Warm minimalism.** White surfaces, one accent, no gradients, no shadow stacks. Editorial-serious.

---

## 1 · Colors

All colors use `oklch()` so tints stay perceptually even. Don't convert to hex — browsers support oklch natively.

### Background / surface
| Token | CSS var | Value |
|---|---|---|
| Page | `--bg` | `#ffffff` |
| Panel (secondary) | `--bg-panel` | `oklch(0.96 0.004 230)` |
| Panel (subtle) | `--bg-soft` | `oklch(0.975 0.003 230)` |
| Card surface | `--surface` | `#ffffff` |

### Text
| Token | CSS var | Value | Use |
|---|---|---|---|
| Ink | `--ink` | `oklch(0.2 0.02 240)` | Headlines, primary text |
| Ink soft | `--ink-soft` | `oklch(0.38 0.02 240)` | Body copy, secondary |
| Muted | `--muted` | `oklch(0.55 0.015 240)` | Captions, meta, placeholder |

### Brand
| Token | CSS var | Value | Use |
|---|---|---|---|
| Blue | `--blue` | `oklch(0.66 0.16 230)` | Logo core, primary fills |
| Blue-ink | `--blue-ink` | `oklch(0.5 0.15 232)` | Links, italic emphasis, inline brand text |
| Blue-soft | `--blue-soft` | `oklch(0.96 0.03 230)` | Tinted chip/badge bg |
| Blue-softer | `--blue-softer` | `oklch(0.98 0.015 230)` | Subtle full-width brand wash |

### Lines & state
`--line` (default borders) · `--line-soft` (dividers inside cards) · `--hover` (list row hover)

### Semantic
`--success` / `--success-soft` (confirmations) · `--warn` / `--warn-soft` (attention) · `--danger` / `--danger-soft` (destructive, errors) · `--amber` / `--amber-soft` (new / notification).

**Rule:** danger red never reads as "brand red." If a red outline appears in the product, it means something is wrong.

---

## 2 · Typography

### Families

**IBM Plex Sans** — 400 / 500 / 600 / 700
- Workhorse. Body, UI, numerals, nav, everything functional.
- Tabular numerals by default (`font-variant-numeric: tabular-nums`) on any column of money, dates, or IDs.
- **For bid amounts, prices, totals — use the `Amount` scale (18px / 500 / tabular-nums).** Never render money at Body size; it disappears.

**Source Serif 4** — 400, 500, 600, plus italic 400/500 (opsz 8–60)
- Accent. Display, H1–H2, italicized emphasis, pull-quotes.
- **Always enable optical sizing:** `font-optical-sizing: auto;`

**ui-monospace** — system stack
- Eyebrows, IDs, codes, URLs.

### Load (HTML `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400;1,8..60,500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet">
```

### Scale

| Role | Family | Size | Weight | LS | LH |
|---|---|---|---|---|---|
| Display | Serif | `clamp(48px, 6vw, 72px)` | 500 | -0.015em | 1.02 |
| H1 | Serif | 32px | 500 | -0.01em | 1.1 |
| H2 | Serif | 22px | 500 | -0.005em | 1.2 |
| **Amount** | **Sans** | **18px** | **500** | **-0.01em** | — |
| H3 | Sans | 15px | 600 | -0.01em | 1.3 |
| H4 | Sans | 14px | 600 | -0.005em | 1.4 |
| Body | Sans | 13.5px | 400 | -0.005em | 1.5 |
| Small | Sans | 12.5px | 400 | — | 1.5 |
| Caption | Sans | 11.5px | 500 | — | 1.45 |
| Eyebrow | Mono | 11px | 600 | 0.14em uppercase | — |
| Mono (inline) | Mono | 12.5px | 400 | — | — |

### Italic emphasis

When a headline needs warmth, italicize **one phrase** in Source Serif 4 colored `--blue-ink`. Max once per screen.

```html
<h1 class="display">Your application was <em>approved.</em></h1>
```

```css
.display em { font-style: italic; color: var(--blue-ink); }
```

---

## 3 · Spacing

8px-based, with 4 and 12 as half-steps.

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-6` 24 · `--space-8` 32 · `--space-11` 44 · `--space-15` 60

Don't invent new values. If you reach for 20 or 28, round to the nearest token.

## 4 · Radius

`--r-xs` 4 · `--r-sm` 7 · `--r-md` 8 (default button/input) · `--r-lg` 10 · `--r-xl` 12 (card) · `--r-2xl` 14 (hero card) · `--r-full` 999 (pill)

## 5 · Shadow

- `--shadow-sm` — hover lift
- `--shadow` — default card
- `--shadow-lg` — modal, popover, floating sheet

Never stack shadows. Never tint the shadow.

---

## 6 · Logo

Files live under `dist/svg/`. Two different use cases — pick the right one.

### In the app (your CSS reaches)

Icon SVG + HTML text. Lighter, scales via CSS, selectable, accessible.

```html
<a href="/" class="brand-lockup">
  <img src="/brand/icon/shouks-icon-color.svg" alt="" width="28" height="28">
  <span>Shouks</span>
</a>
```
```css
.brand-lockup {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 700; font-size: 17px; letter-spacing: -0.04em;
  color: var(--ink); text-decoration: none;
}
```

### Off-app (CSS doesn't reach)

Email templates, OG / social cards, app stores, print, partner co-marketing, vendor briefs. Use the pre-baked lockup SVG or PNG — the "Shouks" in these files is **outlined paths, not live text**, so kerning is guaranteed even without the font.

| Variant | Path |
|---|---|
| Icon color | `dist/svg/icon/shouks-icon-color.svg` |
| Icon mono | `dist/svg/icon/shouks-icon-mono.svg` |
| Icon reversed (on dark) | `dist/svg/icon/shouks-icon-white.svg` |
| Horizontal lockup | `dist/svg/lockup/shouks-horizontal.svg` |
| Stacked lockup | `dist/svg/lockup/shouks-stacked.svg` |

**Rule of thumb:** if the surrounding text is yours (your CSS, your fonts), typeset "Shouks" with HTML. If the surface belongs to someone else (Gmail, Twitter, the App Store, a printer), use the lockup file.

- **Clear space** = height of the icon's inner dot on all sides.
- **Minimum icon size** = 16px wide in digital, 6mm in print.
- **Don't** recolor the blue, stretch, add drop shadows, or place the icon on photography without a scrim.

---

## 7 · Using tokens

### CSS

```css
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow);
}
.card h3 { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.card .meta { color: var(--muted); font-size: 11.5px; }
```

### JS / TS (if you're importing `tokens.json`)

```ts
import tokens from './tokens.json';
const blue = tokens.color.brand.blue.$value;           // "oklch(0.66 0.16 230)"
const body = tokens.typography.scale.body.$value;      // { fontFamily, fontSize, ... }
```

The JSON follows the [W3C Design Tokens draft](https://tr.designtokens.org/format/). Pipe it through Style Dictionary or your tool of choice if you need platform-native outputs (iOS, Android, Tailwind).

---

## 8 · Don'ts

- ❌ New brand colors. Blue only.
- ❌ Gradients, except as approved hero backgrounds.
- ❌ Multiple italics per screen.
- ❌ Type under 11px.
- ❌ Shadow on top of shadow, or colored shadows.
- ❌ Emoji as UI iconography.
- ❌ Typing hex codes. Use variables.
- ❌ "Shouks" typeset where the **lockup file** should be used (email, OG, print). In-app it's fine — see §6.

---

*Last updated 2026-04-20 · type system v1 (Source Serif 4 + IBM Plex Sans)*
