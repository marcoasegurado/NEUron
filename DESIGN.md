# NEUron — Design Specification

**Status:** Approved visual direction, expanded into an implementation-ready specification. No external design tool is required to build from this document.
**Source of truth:** Consolidated visual specification for the NEUron rebuild. Derived from the original master brief (Part 3 and relevant product context), which has since been removed at the user's request, with the visual direction elaborated here. This file is now the visual reference; raise conflicts instead of guessing.

> This is the visual contract for the rebuild. Implement screens from the descriptions, tokens, components, and screen specs below. Where a value is not yet approved, use the proposed baseline and label it as a proposal rather than presenting it as final.

---

## 1. Design concept

NEUron should feel like a friendly study companion, not a corporate grade portal.

- **Metaphor:** warm cream paper, orange highlighter, golden stickers, and a cat study buddy.
- **Tone:** encouraging, calm, clear, and slightly playful. Never childish at the expense of readability.
- **Density:** generous whitespace, large touch targets, calm grouping.
- **Trust:** numbers and grades are the hero; decoration never competes with academic data.
- **Continuity:** the same visual language across phone, tablet, and desktop; only the layout pattern changes.

The mascot is a supporting character. It appears in branding, onboarding, empty states, and gentle status messages — not behind dense data or inside form controls.

## 2. Color system

These are proposed baseline tokens for implementation. Keep them in one centralized token file; do not hard-code colors inside components.

| Token | Role | Proposed value |
|---|---|---|
| `--color-bg-page` | Warm cream page background | `#FFF8EF` |
| `--color-bg-surface` | Card and panel surface | `#FFFDF9` |
| `--color-bg-elevated` | Dialog / popover surface | `#FFFFFF` |
| `--color-primary` | Primary actions, active navigation | `#F26B21` |
| `--color-primary-hover` | Primary hover/pressed | `#D9540E` |
| `--color-primary-soft` | Tinted primary backgrounds | `#FDE7D6` |
| `--color-accent-gold` | Highlights, grade accents, stickers | `#F5B82E` |
| `--color-text` | Primary warm-brown text | `#3A2A1F` |
| `--color-text-secondary` | Secondary labels | `#7A6355` |
| `--color-text-muted` | Hints, placeholders | `#A08D80` |
| `--color-border` | Default soft border | `#F3D6BF` |
| `--color-border-strong` | Focused/selected border | `#E9B892` |
| `--color-success` | Complete / healthy status | `#4F8A5B` |
| `--color-warning` | Needs attention | `#D98A1C` |
| `--color-danger` | Errors, destructive actions | `#C44536` |
| `--color-info` | Neutral informational status | `#4A7C8C` |

### Grade and status colors

Grade colors communicate meaning, not decoration. Use tinted pill backgrounds with darker text, never saturated full-card fills.

| Status / grade band (proposal) | Text / accent | Tint background |
|---|---|---|
| Strong (roughly 1.00–1.75) | `#3F7D52` | `#E7F2EA` |
| Good (roughly 1.76–2.25) | `#5C8A2E` | `#EFF5E3` |
| Fair (roughly 2.26–2.75) | `#B07A12` | `#FCF1D6` |
| Low (roughly 2.76–3.50) | `#C0621F` | `#FBE8D8` |
| At risk (roughly 3.51–5.00) | `#A83A2E` | `#F8E4E0` |
| No Grade Yet / pending | `#7A6355` | `#F2ECE5` |

The exact band boundaries must align with the approved conversion table in `GRADING_RULES.md`. Until the official NEU thresholds are approved, treat the bands above as a visual proposal only.

**Rules:**
- Orange is reserved for actions and active navigation; do not use it for grade semantics.
- Gold signals highlight or achievement, not warning.
- Never rely on color alone: pair every status color with text such as `No Grade Yet`, `Pending`, or the grade value.
- Check contrast for text on every tint; darken text tokens instead of using light text on tint.

## 3. Typography

Use a friendly humanist/geometric sans-serif with rounded terminals. A single family with multiple weights is preferred for performance and consistency.

**Proposed families:** `Nunito Sans` for UI text, with `Inter` or the system sans stack as fallback. Adding a webfont is a dependency decision and should be approved before production.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Display | 32 / 40 | 700 | Login hero, major empty states |
| H1 | 28 / 36 | 700 | Page titles |
| H2 | 22 / 30 | 700 | Section titles, dialog titles |
| H3 | 18 / 26 | 600 | Card titles, subject names |
| Body | 16 / 24 | 400 | Default text |
| Body strong | 16 / 24 | 600 | Labels, emphasis |
| Small | 14 / 20 | 400 | Supporting text, metadata |
| Caption | 12 / 16 | 600 | Chips, overlines, table headers |
| Grade number | 28–40 / 1.1 | 700 | Hero grade figures, tabular numerals |

**Rules:**
- Use tabular numerals for grades, percentages, scores, and GWA so digits align.
- Keep body text at 16px minimum on phone.
- Avoid all-caps except short overlines and chips.
- Do not use more than three weights on one screen.

## 4. Shape, elevation, and spacing

### Radius

| Element | Radius |
|---|---|
| Buttons, chips, inputs, nav items | Pill / 999px |
| Cards, subject panels | 20px |
| Inner tiles, score rows | 14px |
| Dialogs / sheets | 28px |
| Mascot illustrations | Organic, container-free |

### Elevation

Use soft, warm shadows — never harsh gray drop shadows.

- Card: `0 2px 8px rgba(58, 42, 31, 0.06)`
- Raised card / dialog: `0 12px 32px rgba(58, 42, 31, 0.14)`
- Sticky header / bottom nav: `0 -2px 12px rgba(58, 42, 31, 0.06)`

Borders and shadows work together: 1px soft orange-brown border plus a low shadow gives the warm, paper-like feel.

### Spacing scale

`4, 8, 12, 16, 24, 32, 48, 64`

- Card padding: 20–24px desktop, 16–20px phone.
- Section gap: 24–32px.
- Form field gap: 16px.
- Page gutters: 32–48px desktop, 16–20px phone.
- Touch targets: minimum 44×44px.

## 5. Layout and responsive behavior

### Breakpoints

| Range | Name | Pattern |
|---|---|---|
| 0–599px | Phone | Single column, bottom navigation |
| 600–1023px | Tablet | Hybrid: narrow rail or top nav, 1–2 column content |
| 1024px+ | Desktop | Left sidebar, wide content grid |

### Desktop

- Left vertical sidebar, width 248–272px, full height.
- Sidebar structure: brand/mascot at top, primary nav in the middle, student/profile block pinned near the bottom.
- Main content: max width ~1120px, page padding 32–48px.
- Page header: title and supporting text at upper-left; semester switcher and primary action at upper-right on the same row where space allows.
- Home uses a responsive card grid (2–3 columns). Subjects uses a single expandable list. Schedule uses a wide calendar grid.

### Phone

- No shrunken sidebar. Use a compact single-column layout.
- Bottom navigation with three items: Home, Subjects, Schedule.
- Bottom nav height ~64px plus safe-area padding; active item in orange, inactive in muted brown.
- Page header is stacked: title, then subtitle, then actions.
- Primary action is a full-width or prominent pill button near the content it affects.
- Dialogs become bottom sheets or full-width cards with 28px top corners.

### Tablet

- Blend the two patterns: keep the phone bottom navigation for narrow tablets and switch to a compact sidebar or top navigation at the wider end.
- Content may use two columns once width allows.
- Do not invent a third visual system; reuse phone and desktop components.

## 6. Components

### Buttons

| Variant | Appearance | Use |
|---|---|---|
| Primary | Orange fill, white text, pill radius, subtle warm shadow | Save, Log in, Add Score, Add Class |
| Secondary | Transparent fill, 1px orange border, orange text | Cancel-adjacent actions, View details |
| Ghost | No border, brown text, soft tint on hover | Tertiary actions, nav |
| Destructive | Soft red fill or red outline + red text | Delete score, remove subject |

- Heights: 44px phone, 48px desktop.
- Horizontal padding: 20–28px.
- Disabled: reduce opacity, remove shadow, keep label readable.
- Loading: keep width stable, show a small spinner and preserve the label or use a clear loading label.

### Inputs and form controls

- Surface: white or near-white on cream.
- Border: 1px `--color-border`; focus border `--color-primary` plus a soft orange focus ring.
- Radius: pill for single-line text inputs, 14px for textareas and multi-part fields.
- Label above field; helper text below; error text in `--color-danger` with an icon.
- Placeholders are muted and never the only label.
- Selects use the same shell as inputs with a rounded chevron.
- Checkboxes and radios use rounded-square/circular shapes with orange checked states.
- Toggles use an orange track when on.

### Cards

- Cream-white surface, 20px radius, 1px soft border, low warm shadow.
- Padding 20–24px.
- Clear internal hierarchy: title row, optional metadata row, content, actions.
- Avoid nesting more than one card level deep.

### Subject card (expandable)

- Header: subject name, units, current percentage/grade chip, expand chevron.
- Collapsed: shows subject-level status only.
- Expanded: category list, each with weight, average, and activity rows; add/edit/delete controls.
- Expanded content uses a subtle inset background or divider rhythm, not a second heavy card.
- Incomplete subjects show a `No Grade Yet` chip and a short explanation.

### Grade chips and badges

- Pill shape, tinted background, dark readable text.
- Show the grade value and, where space allows, the percentage.
- `GWA Pending` uses the neutral pending tint.
- Never show a grade chip without a text label in the same control.

### Score / activity rows

- Activity name on the left, score (`earned / total`) on the right.
- Percentage as secondary metadata.
- Row actions appear on hover/focus on desktop and as a visible menu on phone.
- Destructive actions require confirmation.

### Progress indicators

- Track in soft cream/tan, fill in orange or gold.
- Show category completion and semester readiness.
- Always pair with a text label such as `Quizzes 82%` or `2 of 4 categories complete`.
- Never use a progress bar as the only indication of incompleteness.

### Dialogs and sheets

- Centered card on desktop, upward sheet on phone.
- Title, supporting text, form/content, action row.
- Primary action on the right/bottom; destructive action visually distinguished.
- Overlay uses a warm dark scrim, not pure black.
- Focus is trapped; Escape/back closes; restore focus on close.

### Navigation

**Sidebar (desktop)**
- Brand block with mascot mark and "NEUron" wordmark.
- Nav items as pill rows with icon + label; active state uses soft orange fill and orange icon/text.
- Profile block at the bottom with avatar/initials, name, and semester context.

**Bottom nav (phone)**
- Three items with icon + short label.
- Active item orange; inactive muted brown.
- Safe-area aware; never cover content or dialogs.

**Phone account bar (proposal)**
- Authenticated phone screens show a compact bar above the page header with the NEUron mark and a text Sign out action, so sign-out is reachable without adding a fourth bottom-nav item.
- Hidden on desktop, where the sidebar profile block owns sign-out.
- This is a proposal recorded during Phase 2; remove or restyle it if a dedicated profile/menu treatment is approved later.

### Semester switcher

- Compact pill/select in the page header.
- Shows the active semester label.
- Opens a menu listing semesters with the current one marked.
- Long labels truncate with the full label available via tooltip/expansion.

### Status banner and toasts

- Soft tinted surface, mascot optional, short supportive message.
- Success, info, warning, and error variants map to the status colors.
- Toasts are transient; persistent problems use an inline banner.

### Empty states

- Mascot illustration or simple icon.
- Short headline, one supporting sentence, and one clear action.
- Examples: `No scores yet` with `Add score`; `No classes yet` with `Add class`; `Add subjects to calculate your GWA`.
- Never show a zero value in place of missing data.

### Loading and skeleton states

- Use skeletons shaped like the eventual content, not generic spinners, for page-level loads.
- Use inline spinners for button and row-level saves.
- Keep layout stable to avoid jumps.

## 7. Mascot and illustration usage

- The cat mascot is the NEUron study buddy: friendly, encouraging, never mocking.
- Place it in the login brand panel, onboarding/setup, empty states, and gentle status banners.
- Sizes: small 48–64px for inline banners; medium 96–140px for empty states; large for hero/brand panels.
- Keep generous clear space; never crop the face.
- Do not place the mascot behind text, inside inputs, or over grade figures.
- Do not recolor or replace the mascot with a generic placeholder without approval.
- Illustrations use the same warm palette; avoid pure black or neon accents.

## 8. Iconography

- Rounded outline icons, 24px grid, ~2px stroke.
- Consistent family across nav, actions, and status.
- Use icons to support labels, not replace them, except in dense row actions where an accessible name is still required.
- Filled icons indicate active navigation; outline icons indicate inactive.

## 9. Motion

- Duration: 150–200ms for small transitions, up to 250ms for sheets/dialogs.
- Easing: ease-out for entrances, ease-in for exits.
- Expand/collapse subject cards: height and opacity, no bounce.
- Respect `prefers-reduced-motion`; replace movement with instant state changes.
- Avoid decorative looping animation except a subtle mascot idle state if approved.

## 10. Screen and state inventory

Each screen must be implemented for the listed layouts and states. Screens marked **needs spec** must receive an approved written specification before implementation.

### Auth layout baseline
- Login, Forgot Password, and Reset Password share one frame.
- **Phone:** stacked brand mark header, form card, supporting links. `16px` form padding, `20px` card radius.
- **Desktop (1024px+):** two-panel layout — orange/cream brand panel on one side, form panel on the other. Brand panel keeps the product name, a short encouraging line, and the mascot area.
- **Mascot note:** the cat mascot artwork is not yet in the repository. Use the existing orange `N` brand mark in the mascot area until approved artwork exists; this is a temporary, recorded deviation.
- All fields use the shared `Input` component, `44px` minimum control height, visible labels, and field-level errors.
- Auth screens never reveal whether an email is registered.

### Login
- **Phone:** stacked brand mark/mascot header, email-or-username field, password field with visibility control, primary Log in button, forgot-password link. No create-account link.
- **Desktop:** two-panel layout — orange/cream brand panel with mascot on one side, form panel on the other.
- **States:** default, field-level validation, submitting, invalid credentials, success redirect, network error.

### Manual account creation
- There is no public Register screen. `/register` redirects to `/login`.
- The owner creates accounts with `npm run cf:account:create`; the script collects a display name, unique username, email, and password.
- A new account receives no automatic session and signs in through the Login screen.

### Forgot Password / reset
- **Approved baseline:** reuse the Auth layout.
- **Request step:** email field, primary Send reset link, back-to-login link.
- **Request-sent state:** always shows the same generic confirmation, whether or not the email exists, with a back-to-login action.
- **Reset step:** opens from the emailed link, shows new password and confirm password with visibility controls, primary Update password.
- **Reset success:** confirmation with a Sign in action. All existing sessions are ended.
- **Invalid/expired link:** dedicated message and a link to request a new reset email.
- **States:** default, field-level validation, submitting, request-sent, reset success, invalid/expired token, network error.

### Semester setup
- **Phone:** three steps — (1) semester name and number of subjects; (2) subject details and editable grading categories/weights; (3) readiness summary and save.
- **Desktop:** two-step equivalent with wider forms and multi-column subject configuration.
- **States:** step progress, add/remove subject, invalid weight total, missing required fields, saving, success, unsaved-changes warning.
- **Implemented (Phase 3):** phone renders all three steps; desktop combines subjects and review in step 2, with a sticky review column beside the subject cards. Subject fields become two columns at `640px+`; the term uses a native select styled as the shared control. This is the current visual baseline.

### Home
- **Phone:** page title, active semester, compact grade rows/cards, bottom navigation, Add Score.
- **Desktop:** page title/description, status banner, semester switcher, Add Score, multi-column grade cards.
- **States:** complete grades, incomplete subject, no subjects, no scores, loading, error, Add Score default/validation/saved.
- **Implemented (Phase 5):** the header holds the semester switcher and Add Score. A persistent status banner states that percentages are exact while numeric grades are pending official NEU thresholds. Subject cards show the exact percentage, a `Grade Pending` chip, and category-completion progress; incomplete subjects show `No Grade Yet` plus the categories still missing scores. The grid uses one column on phone, two at `720px`, and three at `1024px`. Add Score opens a centered dialog on desktop and a bottom sheet below `600px`, with Escape/overlay close and contained keyboard focus. At `640px+` the header Add Score control uses a compact `40px` height so it sits closer to the semester switcher; phone keeps the `44px` touch target. On phone widths the page header — title, semester context, switcher, and Add Score — sticks to the top of the viewport. Once the dashboard is scrolled past roughly `64px`, the sticky header collapses to a single row with the title and Add Score; the semester context and switcher hide until the user scrolls back to the top. This is the current visual baseline.

### Subjects
- **Phone:** subject list; expanded subject with categories, weights, averages, activities; empty-score state; delete-score confirmation.
- **Desktop:** expandable subject rows/cards with the same content; empty-score and delete-confirmation states.
- **States:** collapsed, expanded, no scores in a category, no subjects, loading, error, deleting.
- **Implemented (Phase 6):** a single-column list of subject cards, collapsed by default. The subject header is a full-width expand button with a rotating chevron; the summary shows units, professor, active-category count, and the exact percentage with `Grade Pending`, or `No Grade Yet` when incomplete. Expanded content lists every grading category with its weight, exact average or `No scores yet`, and newest-first activity rows (name, date, earned/total, activity percentage). Active categories have an Add score action; every activity has Edit and Delete actions. Delete opens a confirmation modal that names the activity and score. Inactive categories stay visible with an `Inactive` chip and no Add score action. The shared dialog is centered on desktop and becomes a bottom sheet below `600px`. On phone widths the page header sticks to the top of the viewport while the list scrolls, so the page title and semester context stay visible. At `640px+` the per-category Add score control uses a compact `36px` height; phone keeps the `44px` touch target. Every successful change refetches the semester and recalculates all averages. This is the current visual baseline.

### Schedule
- **Phone:** week/day view; empty day; add-class form (subject, day, start, end, room); class details.
- **Desktop:** weekly calendar grid; add-class dialog; empty week.
- **States:** populated week, empty day, empty week, conflict/overlap (behavior pending), invalid time range, saving, error.

### Settings — needs spec
- Only the navigation entry is confirmed. Full page content and controls must be specified before implementation.

### Semester GWA — needs spec
- Placement, card design, and detailed states must be specified. Rules are in `GRADING_RULES.md`.

### Target Grade Calculator — needs spec
- Screen, inputs, assumptions, result states, and unreachable-target messaging must be specified before implementation.

## 11. State matrix

Every data surface must intentionally handle:

| State | Expectation |
|---|---|
| Loading | Skeleton or inline spinner; stable layout |
| Empty | Mascot/icon, short explanation, one action; never fake data |
| Incomplete | `No Grade Yet` / `GWA Pending` with plain-language reason |
| Error | Inline, actionable message; retry where possible |
| Success | Clear confirmation without blocking the next action |
| Offline (later phase) | Visible connection/sync status; no silent data loss |
| Saving | Disable conflicting actions; show progress |

## 12. Accessibility

- Body text and controls meet WCAG AA contrast.
- Visible focus ring in orange on every interactive element.
- Keyboard path for all dialogs, menus, nav, and expandable cards.
- Touch targets at least 44×44px.
- Status is conveyed by text plus color.
- Form errors are announced and linked to their field.
- Respect reduced motion and allow text zoom without clipped content.

## 13. Design governance

- `DESIGN.md` is the visual source of truth for the rebuild.
- No external design application is required to implement a screen.
- If a visual value or state is not specified here, propose a clear baseline, label it as a proposal, and ask for approval before treating it as final.
- Do not claim a proposal came from an approved design.
- When a screen is implemented, compare it against the relevant section of this document and record any deliberate deviations.

## 14. Missing design work

These still need approved specifications before implementation:

- Settings page and controls.
- Semester GWA card/section and states.
- Target Grade Calculator.
- Tablet-specific refinements.
- Conversion-table management UI.
- Schedule overlap and conflict presentation.
- Exact final token values (colors, typography, shadows) if the proposed baselines are not approved.
