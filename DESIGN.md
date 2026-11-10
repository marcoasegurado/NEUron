# NEUming — Design Specification

**Status:** Approved visual direction, expanded into an implementation-ready specification. No external design tool is required to build from this document.
**Source of truth:** Consolidated visual specification for the NEUming rebuild. Derived from the original master brief (Part 3 and relevant product context), which has since been removed at the user's request, with the visual direction elaborated here. This file is now the visual reference; raise conflicts instead of guessing.

> This is the visual contract for the rebuild. Implement screens from the descriptions, tokens, components, and screen specs below. Where a value is not yet approved, use the proposed baseline and label it as a proposal rather than presenting it as final.

---

## 1. Design concept

NEUming should feel like a friendly study companion, not a corporate grade portal.

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
| `--color-bg-page` | Warm cream page background | `#FBF4E3` |
| `--color-bg-surface` | Card and panel surface | `#FFFFFF` |
| `--color-bg-elevated` | Dialog / popover surface | `#FFFFFF` |
| `--color-bg-note` | Highlight/status banner surface | `#FBF0CF` |
| `--color-primary` | Primary actions, active navigation | `#F97316` |
| `--color-primary-hover` | Primary hover/pressed | `#E5600D` |
| `--color-primary-soft` | Tinted primary backgrounds | `#FDE7D6` |
| `--color-accent-gold` | Highlights, grade accents, stickers | `#F5B82E` |
| `--color-accent-gold-soft` | Soft gold tints | `#FBE7A9` |
| `--color-text` | Primary warm-brown text | `#3D2B1F` |
| `--color-text-secondary` | Secondary labels | `#8A7361` |
| `--color-text-muted` | Hints, placeholders | `#B3A091` |
| `--color-border` | Default soft border | `#F6E4CB` |
| `--color-border-strong` | Focused/selected border | `#F3C48F` |
| `--color-success` | Complete / healthy status | `#2E7D4F` |
| `--color-warning` | Needs attention | `#B45309` |
| `--color-danger` | Errors, destructive actions | `#D62828` |
| `--color-info` | Neutral informational status | `#4A7C8C` |

### Grade and status colors

Grade colors communicate meaning, not decoration. Use tinted pill backgrounds with darker text, never saturated full-card fills.

| Status / grade band (proposal) | Text / accent | Tint background |
|---|---|---|
| Strong (roughly 1.00–1.75) | `#2E7D4F` | `#D9F2E1` |
| Good (roughly 1.76–2.25) | `#5F7F1F` | `#EAF3D4` |
| Fair (roughly 2.26–2.75) | `#B45309` | `#FBE7A9` |
| Low (roughly 2.76–3.50) | `#D9480F` | `#FBDFD2` |
| At risk (roughly 3.51–5.00) | `#D62828` | `#FAD3D3` |
| No Grade Yet / pending | `#8A7361` | `#EDE5D8` |

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
- Sidebar structure: cat mark plus a two-tone `NEUming` wordmark at top, primary nav in the middle, and a bottom footer with a cream profile card and an outlined `Log out` pill. The active nav item is a filled app-orange pill with white icon/label and a darker orange bottom edge; inactive items are muted brown with no background.
- Main content: max width ~1120px, page padding 32–48px.
- Page header: title and supporting text at upper-left; semester switcher and primary action at upper-right on the same row where space allows.
- Home uses a responsive card grid (2–3 columns). Subjects uses a single expandable list. Schedule uses a wide calendar grid at `1024px` and above, and a week strip plus day agenda below that.

### Phone

- No shrunken sidebar. Use a compact single-column layout.
- Every route below desktop width shows a locked top bar: cat mascot + two-tone `NEUming` wordmark on the left and an orange `Sign out` action on the right. It stays pinned while the page scrolls.
- Bottom navigation with three items: Home, Subjects, Schedule.
- Bottom nav height ~64px plus safe-area padding; the active item is an orange rounded pill with white icon/label, inactive items are muted brown with no background.
- Home starts with a cat mascot beside a pale-yellow encouragement bubble, then a bordered semester pill (`label` + `Switch`), then the `Current grades` title.
- Home subject cards are single-column rows: name, `units | professor`, a status line (`All categories scored`, `Needs: <categories>`, or `Add a score to get started.`), and a tinted percentage tile on the right. Pending subjects show `—` in the beige tile.
- The main Home action is a fixed circular orange `+` button above the bottom nav; the phone layout has no header `Add Score` button.
- Page headers on other pages stay stacked: title, then subtitle, then actions.
- Dialogs become bottom sheets with 28px top corners and a grabber. The Add score sheet stacks every field full-width and shows only the full-width `Save score` action.

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
- The Add/Edit score dialog shows the cat mascot beside the title, cream fields with light-orange borders, an outlined `Cancel` pill, and a filled orange `Save score` action with a darker bottom edge. It is about `610px` wide on desktop. The layout is two columns (`Subject`/`Category`), full-width `Title`, then `Score` / `Total items` separated by a slash. There is no date field or corner close button; Escape, overlay click, and `Cancel` close the dialog. Below `600px` it becomes the standard bottom sheet.
- Primary action on the right/bottom; destructive action visually distinguished.
- Overlay uses a warm dark scrim, not pure black.
- Focus is trapped; Escape/back closes; restore focus on close.

### Navigation

**Sidebar (desktop)**
- Brand block with cat mark and two-tone "NEUming" wordmark.
- Nav items as pill rows with icon + label; the active item is a filled app-orange pill with white icon/label, while inactive items are muted brown with no background.
- Bottom footer with a cream profile card (gold avatar + bold name) and an outlined orange `Log out` pill.

**Bottom nav (phone)**
- Three items with icon + short label.
- Active item orange; inactive muted brown.
- Safe-area aware; never cover content or dialogs.

**Phone account bar (proposal)**
- Authenticated phone screens show a compact bar above the page header with the NEUming mark and a text Sign out action, so sign-out is reachable without adding a fourth bottom-nav item.
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

## 7. Brand mark, mascot, and illustration usage

### Brand mark (logo)

- The official NEUming logo is the cat head: a container-free, front-facing orange cat with dark outlines, pink inner ears and cheeks, a cream muzzle, whiskers, and gold sparkles. It ships as the inline `CatMascot` SVG component (`src/components/brand/CatMascot.tsx`), which is the single source of the artwork for the brand mark and the favicon.
- **Name:** NEUming (NEU + *mingming*, Filipino for kitty). The mascot is named **Ming**.
- **Colors:** orange `#F97316` head and ears; pink `#F7A8A2` inner ears and cheeks; cream `#FFF6E8` muzzle; warm brown `#3D2B1F` outlines, eyes, nose, and whiskers; deeper orange `#E5600D` forehead stripes; gold `#F5B82E` sparkles.
- **Sizes:** `52px` beside the desktop sidebar wordmark, `48px` in the locked phone bar, `152px` phone / `168px` desktop as the auth-panel mascot, and `56px` phone / `64px` desktop inside dialogs.
- **Clear space:** keep at least `8%` of the mark's width clear on all sides; never crop the ears, whiskers, or face.
- **Pairing:** the mark sits to the left of the `NEUming` wordmark in the sidebar and locked phone bar; the app chrome does not repeat the `Grade Encoder` tagline.
- **Favicon:** the same cat head on a rounded tile filled with the page cream (`#FBF4E3`), so the browser-tab and installed-app icon match the in-app mark instead of using a separate drawing. The artwork is scaled to keep the `8%` clear space inside the tile.
- Do not recolor, outline, or replace the mark with a generic placeholder without approval.

### Mascot and illustration

- The cat mascot is the NEUming study buddy: friendly, encouraging, never mocking.
- Place it in the login brand panel, onboarding/setup, empty states, and gentle status banners.
- Sizes: small 48–64px for inline banners; medium 96–140px for empty states; large for hero/brand panels.
- Do not place the mascot behind text, inside inputs, or over grade figures.
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
- **Phone:** centered brand header with the `CatMascot` illustration, `NEU`-orange + `ming`-brown `NEUming` wordmark, and the muted tagline `Your grades, always in sight.` above the form card. The card uses `24px` radius, cream `16px`-radius inputs with orange borders, and a `52px` primary button. Decorative pale-yellow and peach circles sit at the top-right and bottom-left of the page.
- **Desktop (1024px+):** two-panel layout. The app-orange left panel centers a cream halo behind the mascot, the wordmark (`NEU` cream, `ming` brown), the statement `Track every quiz, exam and project, and always know where you stand.`, and three translucent feature pills. The cream right panel centers the form card over decorative circles.
- **Mascot note:** the auth panel and the sidebar/phone-bar brand marks all use the detailed `CatMascot` (`src/components/brand/CatMascot.tsx`, `152px` phone / `168px` desktop on the auth panel, `52px` sidebar, `48px` locked phone bar).
- Auth fields use the shared `Input` component with visible labels and field-level errors; auth-specific sizing is applied through the layout CSS, not duplicated components.
- Auth screens never reveal whether an email is registered.

### Login
- **Phone:** centered cat mascot, wordmark, and `Your grades, always in sight.` tagline above the form card; `Welcome back!` title, `Log in to see how your semester is going.` description, email-or-username field, password field with visibility control and `Enter your password` placeholder, primary Log in button, and forgot-password link.
- **Desktop:** the two-panel auth layout above, with the form card centered on the cream side.
- The Figma `New here? Create an account` line is omitted until a real registration flow exists.
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
- **Phone:** page title, active semester, Semester GWA card, compact grade rows/cards, bottom navigation, Add Score.
- **Desktop:** page title/description, status banner, semester switcher, Add Score, Semester GWA card, multi-column grade cards.
- **States:** complete grades, incomplete subject, pending/complete/empty Semester GWA, no subjects, no scores, loading, error, Add Score default/validation/saved.
- **Implemented (Phase 5):** the header holds the semester switcher and Add Score. A persistent status banner states that percentages are exact while numeric grades are pending official NEU thresholds. Subject cards show the exact percentage, a `Grade Pending` chip, and category-completion progress; incomplete subjects show `No Grade Yet` plus the categories still missing scores. The grid uses two columns at `720px` and three at `1024px`. Add Score opens a centered dialog on desktop and a bottom sheet below `600px`, with Escape/overlay close and contained keyboard focus. At `640px+` the header Add Score control uses a compact `40px` height so it sits closer to the semester switcher. Below `640px` Home switches to the dedicated phone layout: mascot + encouragement bubble, semester pill, `Current grades` title, single-column subject rows with tinted percentage tiles, and a fixed circular `+` button above the bottom nav. The phone layout uses a CSS-sticky top bar instead of a scroll-tracked sticky page header, so scrolling does not re-render the dashboard. This is the current visual baseline.

### Subjects
- **Phone:** subject list; expanded subject with categories, weights, averages, activities; empty-score state; delete-score confirmation.
- **Desktop:** expandable subject rows/cards with the same content; empty-score and delete-confirmation states.
- **States:** collapsed, expanded, no scores in a category, no subjects, loading, error, deleting.
- **Implemented (Phase 6):** a single-column list of subject cards, collapsed by default. The subject header is a full-width expand button with a rotating chevron; the summary shows units, professor, active-category count, and the exact percentage with `Grade Pending`, or `No Grade Yet` when incomplete. Expanded content lists every grading category with its weight, exact average or `No scores yet`, and newest-first activity rows (name, date, earned/total, activity percentage). Active categories have an Add score action; every activity has Edit and Delete actions. Delete opens a confirmation modal that names the activity and score. Inactive categories stay visible with an `Inactive` chip and no Add score action. The shared dialog is centered on desktop and becomes a bottom sheet below `600px`. On phone widths the page header sticks to the top of the viewport while the list scrolls, so the page title and semester context stay visible. At `640px+` the per-category Add score control uses a compact `36px` height; phone keeps the `44px` touch target. Every successful change refetches the semester and recalculates all averages. The page header exposes an `Add Subject` action, and the no-subjects empty state offers it next to `Set up semester`. It opens an add-subject dialog with subject name, units, optional professor, and grading categories whose weights must total 100%; saving refetches the semester so Home and Schedule include the new subject. This is the current visual baseline.

### Schedule
- **Phone:** week/day view; empty day; add-class form (subject, day, start, end, room); class details.
- **Desktop:** weekly calendar grid; add-class dialog; empty week.
- **States:** populated week, empty day, empty week, conflict/overlap warning, invalid time range, saving, deleting, error.
- **Implemented (Phase 7):** the week runs Monday–Saturday. The page header shows the active semester label and class count with a compact Add class action, and sticks to the top on phone widths.
  - **Phone (below `1024px`):** a six-column day strip shows each short day name and its class count; the current day is marked with a gold dot and the selected day uses the soft-orange active treatment. Below it, the selected day's agenda lists class tiles with start/end time, subject, optional room, and an overlap note. Tapping a tile opens class details. An empty day shows `No classes on <Day>.` with its own Add class action, and the rest of the week stays reachable.
  - **Desktop (`1024px`+):** the day strip and agenda are replaced by a weekly grid: a time column of hour labels, six day columns, and absolutely positioned class blocks sized to their start/end times. The grid scales from the earliest class start to the latest end, using `8:00 AM`–`6:00 PM` when the week is empty. Blocks show time, subject, and optional room; the current day header is orange.
  - **Subject tones:** five soft background/border pairs (orange, green, gold, terracotta, blue) assigned by subject order so the same subject keeps the same color in both views.
  - **Conflict warning:** overlapping classes are saved. Each involved class shows an `Overlaps with <subject>` note in the agenda, an `!` badge in the grid, and a conflict paragraph in the details dialog. Nothing blocks the save.
  - **Add/edit dialog:** subject, day, start time, end time, and optional room (`120` characters maximum). The subject must belong to the active semester; the end time must be later than the start time. A live overlap warning appears as soon as a draft conflicts. The dialog reuses the shared modal and becomes a bottom sheet below `600px`.
  - **Details and delete:** details show day, time, and room with Close, Edit, and Delete. Delete opens a confirmation modal that repeats the subject, day, time, and room. Successful changes refetch the schedule and recalculate conflicts.
  - This is the current visual baseline; it follows the shared tokens and reuses the shared `Card`, `Modal`, `Input`, `Select`, `Button`, `Badge`, and `EmptyState` components.

### Settings — needs spec
- Only the navigation entry is confirmed. Full page content and controls must be specified before implementation.

### Semester GWA
- **Placement:** Home, directly below the page header and status banner and above the subject grid. Phone and desktop use the same card; only the internal arrangement changes. No GWA navigation item is added.
- **Content:** heading `Semester GWA`, the primary value, a supporting stats line, and a reason line when the value is pending.
- **Complete state:** the converted GWA to two decimals (for example `1.80`), without a percent sign. The supporting line reads `<units> units · <n> subjects`. The caption names the active semester. Never show more than two decimals.
- **Pending state:** the value reads `GWA Pending` with a `Pending` badge. The reason line names the subjects still missing grades. If the blocker is that official NEU grade thresholds are not configured, the reason line says so instead; do not name subjects that are only waiting on the thresholds. Never show a partial GWA or a placeholder number.
- **Empty state:** when the semester has no subjects, the card reads `Add subjects to calculate your GWA` with a setup action. Never show `0.00`.
- **Loading and error:** use the existing Home page-level loading and error states; the card does not render a skeleton or fallback value.
- **Visual:** cream card surface, soft orange border, and an orange accent (icon or left bar). The GWA value uses neutral body text, not the percentage grade-tone colors, because GWA is on a different scale and its color thresholds are not approved. Pending is conveyed by the badge text plus the reason line, never by color alone.
- **Phone:** full-width card; heading, value, stats, and reason stack vertically. The value uses the display size.
- **Desktop:** wide card; heading and reason span the full width, the value sits at the left, and the units/subject stats align to the right.
- **Calculation:** rules and examples are in `GRADING_RULES.md` §7. The card reads from a shared GWA function; it does not compute a formula inline.
- **Dependency:** until the official NEU percentage-to-grade thresholds are configured, every subject grade is pending, so the card correctly stays at `GWA Pending`. The complete state is still implemented and tested with a fixture conversion table.
- **Implemented and verified (Phase 8):** `buildSemesterGwa` in `src/features/home/view-model.ts` calls the shared `calculateSemesterGwa` and returns complete, pending, or empty. The card sits before the subject grid on phone and desktop, uses a soft orange border with an orange left bar, stacks on phone, and keeps the units/subject stats right-aligned on desktop. Loading and error stay at the page level, so the card never renders a skeleton or fallback value. Production shows `GWA Pending` with the thresholds reason; the `1.80` complete example is covered by a fixture conversion table in tests. Production QA passed on 2026-11-10 at phone and desktop widths for placement, pending and empty states, accessibility, refresh persistence, and live score/unit updates. The complete state remains fixture-tested until the shared conversion table exists in Phase 10. This is the current visual baseline.

### Target Grade Calculator
- **Entry point:** in each expanded subject card on Subjects, a secondary `Target grade` action sits beside the subject's pending or graded note. No new navigation item and no Home surface are added.
- **Input:** a target percentage from `0` to `100`, step `0.01`, with a trailing `%`. Percentage targets are available now; grade targets (`1.0–5.0`) wait for the approved NEU conversion table in Phase 10.
- **Assumptions:** all unscored active-category weight is one remaining bucket, scored as a single average; scored categories keep their current averages; inactive categories are ignored; the calculator is read-only.
- **Summary:** current percentage, remaining weight, and scored weight.
- **States:**
  - **Prompt:** empty input reads `Enter a target percentage to see what you need.`
  - **Invalid:** `Enter a target between 0 and 100.`
  - **Blocked:** no active categories, weights not totaling 100%, or an invalid activity. Explain the blocker and do not show a required score.
  - **Reached:** `Target already reached` with the current percentage. When no weight remains, say every category already has scores.
  - **Required:** `X%` needed on the remaining `Y%` of the grade, with the current percentage.
  - **Unreachable:** `Not reachable`, with the reason: no remaining weight, or a required average above 100%.
- **Copy:** the modal is titled `Target grade`, but the result always describes a percentage, never a converted grade.
- **Accessibility:** the result uses `aria-live="polite"`, the input has a visible label, pending/blocked/unreachable states are conveyed by text, and the shared `Modal` handles focus.
- **Visual:** cream surface, orange left accent, tabular numerals. The result value uses neutral body text, not the percentage grade-tone colors.
- **Implemented (Phase 9):** the action opens the shared modal from the expanded subject body, the pure calculation lives in `calculateTargetPercentage`, and the modal updates live as the target changes. This is the current visual baseline.

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
- Target Grade Calculator.
- Tablet-specific refinements.
- Conversion-table management UI.
- Exact final token values (colors, typography, shadows) if the proposed baselines are not approved.
