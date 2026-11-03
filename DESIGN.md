# Spendwell — DESIGN

## World

**Charcoal & Lime** — premium financial operating system. Charcoal for structure and trust, strategic Lime for action and key signals, Warm Off-White for calm content.

## Brand palette

| Token | Hex | Role |
|-------|-----|------|
| Charcoal Black | `#171717` | Sidebar, headings, dark cards, dark buttons |
| Fresh Lime | `#B8F34B` | Active nav, primary CTAs, KPI accents, chart highlights |
| Warm Off-White | `#F5F5F0` | App ground / content canvas |

Supporting: surface `#FFFFFF`, border `#E4E4DE`, muted `#6B6B66`, negative `#DC2626`, lime tint `#EEF8D4`, readable positive `#4D7C0F`.

Sources of truth: `src/index.css` (`@theme` + `:root`), `src/theme/colors.js`.

## Type

- UI: Geist (fallback Inter)
- Money: Geist Mono / tabular nums

## Shell

- Charcoal sidebar, lime active rail, tight padding
- Warm Off-White ground — flat, no glass / no neon
- Clean header; white cards with thin borders (12–16px radius)
- Views driven by path routes: `/` (Summary), `/transactions`, `/cash`

## Brand mark

Animated growth-bars mark (`SiteLogo`) — rising ledger bars with a lime pulse tip. Charcoal plate on light; lime-on-charcoal on dark shells.

## Rules

1. Prefer CSS variables (`var(--charcoal)`, `var(--lime)`, …) over hardcoded hex.
2. Cards: white + 1px border; soft depth only — no glassmorphism, no cyan/Bootstrap blue.
3. One corner radius everywhere: `var(--radius)` (12px). Circles/pills only for avatars & badges.
4. Primary button = lime + charcoal text; secondary = charcoal + white text.
5. Lime sparingly — CTAs, active states, KPI accents. Not decorative chrome.
6. Semantic red only for losses/errors.
7. Beat Bootstrap link/primary blues with unlayered overrides in `src/index.css`.
