# NEUming

NEUming is a responsive grade-monitoring web app for New Era University students. It lets a student build their semester once — subjects, units, and the grading categories each professor actually uses — then record scores and watch category averages, subject percentages, and the weighted semester GWA update.

Because professors grade differently, every subject owns its own categories and weights, while one shared percentage-to-grade table converts subject percentages into NEU grades. All academic data belongs to the signed-in account and is stored in Cloudflare D1 behind a Worker API.

## Live app

[https://neuron.marcoeduardo-asegurado.workers.dev](https://neuron.marcoeduardo-asegurado.workers.dev)

## Features

**Accounts**

- Sign in with a username or any valid email address.
- No public registration: the owner provisions accounts manually.
- Password reset by email (Resend) with single-use, 1-hour tokens.
- D1-backed sessions in an `HttpOnly`, `SameSite=Lax` cookie, `Secure` over HTTPS, 7-day lifetime.
- Protected routes and sign-out; the offline cache is dropped on sign-out and on semester switch so a shared device never shows another account's data.

**Semester setup**

- Three-step flow on phones, two-step on desktop.
- Academic year, term, and semester label.
- Subjects with units and an optional professor.
- Custom grading categories per subject with live weight totals; saving is blocked unless active weights reach 100%.

**Home**

- Semester switcher, current percentage per subject, and explicit pending states.
- Add Score dialog (subject, category, name, earned score, total points, optional date defaulting to today).
- Semester GWA card with complete, pending, and empty states — no fabricated or partial value.

**Subjects**

- Expandable subject cards with categories, weights, averages, and activity history.
- Add, edit, and delete scores; delete requires confirmation.
- Add a subject (with its categories) to the active semester.
- Drop or restore a subject; dropped subjects keep their scores but leave GWA units and the Home grid.
- Percentage-target calculator that never modifies saved scores.

**Schedule**

- Weekly timetable, Monday–Saturday, one entry per meeting day.
- Phone: six-day strip plus the selected day's agenda. Desktop (`≥1024px`): weekly time grid.
- Class details with edit and delete, optional room, and a conflict warning for overlaps (overlaps are saved, not blocked).

**Settings**

- Semester list with switching and past-semester access.
- Read-only grade scale (the shared conversion table).
- Account card with sign-out.

**Platform**

- Installable PWA with PNG icons, manifest, and a service worker.
- Read-only offline mode: cached Home, Subjects, Schedule, and Settings stay viewable, every write is disabled, and no write queue exists, so offline changes cannot be lost or conflict.
- Responsive phone, tablet, and desktop layouts; reduced-motion support; keyboard-operable dialogs and dropdowns.

### Grade scale status

The official NEU percentage-to-grade thresholds have **not** been verified, so the shared conversion table is intentionally empty. Grade values and the GWA therefore report `Grade Pending` / `GWA Pending` while percentages remain exact. Load verified rows with `npm run cf:conversion:load` (see below); do not invent thresholds.

## Tech stack

| Area | Choice |
|---|---|
| Frontend | React 19, React Router, Vite, TypeScript |
| Styling | CSS modules, design tokens from `DESIGN.md` |
| API | Cloudflare Worker (`src/worker.ts`) |
| Database | Cloudflare D1 (`neuron`, binding `DB`) |
| Auth | Custom email/password, PBKDF2-HMAC-SHA256, D1 sessions |
| Email | Resend for password resets |
| Hosting | Cloudflare Workers with static assets |
| Testing | Vitest, Testing Library, jsdom |
| Linting | oxlint |

## Getting started

### Requirements

- Node.js `^20.19.0` or `>=22.12.0` (Vite's requirement) and npm
- A Cloudflare account with Wrangler authenticated (`npx wrangler login`) for D1 and deployment work

### Install

```bash
npm install
```

### Run the frontend only

```bash
npm run dev
```

Vite serves the React app, but `/api/*` requests need the Worker. Use `npm run cf:dev` when you need the full stack.

### Run the full stack locally

```bash
npm run cf:dev
```

This builds the app and starts Wrangler with the `DB` binding and static assets. Local data lives in `.wrangler/` and is separate from production.

### Checks

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
npm test        # vitest run
```

### Database migrations

Migrations are applied in order and are safe to re-run only on a fresh database:

```bash
npx wrangler d1 execute neuron --local  --file migrations/0001_auth.sql
npx wrangler d1 execute neuron --local  --file migrations/0002_add_username.sql
npx wrangler d1 execute neuron --local  --file migrations/0003_academic_structure.sql
npx wrangler d1 execute neuron --local  --file migrations/0004_activities.sql
npx wrangler d1 execute neuron --local  --file migrations/0005_schedule.sql
npx wrangler d1 execute neuron --local  --file migrations/0006_conversion_and_subject_status.sql
```

Swap `--local` for `--remote` to target production D1.

### Create an account

Accounts are provisioned by the owner; the password is typed interactively and never passed as an argument:

```bash
npm run cf:account:create -- --email you@neu.edu.ph --username yourname --name "Your Name"
npm run cf:account:create -- --local --email you@neu.edu.ph --username yourname --name "Your Name"
```

### Load the shared grade scale

Only after the thresholds have been verified against an official NEU source:

```bash
npm run cf:conversion:load -- --file path/to/verified-thresholds.json          # dry run
npm run cf:conversion:load -- --file path/to/verified-thresholds.json --apply  # write
```

The file accepts `[{ "minimumPercentage": 0, "grade": 5 }]` or `{ "rows": [...] }`. The command rejects incomplete or out-of-range tables, prints how many semesters and subjects are affected, and writes nothing without `--apply`. The table is application-wide, so a change recalculates every semester, including past ones.

### Deploy

```bash
npm run cf:deploy
```

Deployment is never automatic in this repository: confirm the target environment, run the checks above, and get approval before pushing to production.

### Environment variables

Local Worker secrets go in `.dev.vars` (copy from `.dev.vars.example`); production secrets are set with `npx wrangler secret put <NAME>`.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key used for password-reset emails |
| `AUTH_EMAIL_FROM` | Verified sender, for example `NEUming <noreply@your-domain.example>` |
| `APP_ORIGIN` | Optional. Overrides the origin used in reset links (useful behind a proxy) |

Never commit `.dev.vars`, API tokens, or database credentials. The browser never receives D1 credentials and never queries D1 directly.

## Project structure

```text
src/
  app/                 Shell, routing, auth guards, online-status hook
  components/ui/       Shared Button, Modal, Dropdown, Toast, and form controls
  features/            auth, setup, home, subjects, activities, schedule, settings
  lib/                 API client, service-worker helpers, grading engine
  server/              Worker handlers, validation, auth, D1 access
  styles/              Global styles and design tokens
migrations/            D1 schema, applied in numeric order
public/                Icons, manifest, service worker
scripts/               Owner utilities (account creation, grade scale)
```

Business rules stay out of components: grading lives in `src/lib/grading/`, and D1 access lives in `src/server/`. The browser talks only to `/api/*`.

## Documentation

- [PLAN.md](./PLAN.md) — scope, phases, status, and open decisions
- [DESIGN.md](./DESIGN.md) — visual specification, tokens, screens, and states
- [GRADING_RULES.md](./GRADING_RULES.md) — formulas, validation, and worked examples
- [DATA_MODEL.md](./DATA_MODEL.md) — entities, ownership, and D1 constraints
- [AGENTS.md](./AGENTS.md) — workflow and safety rules for coding agents

## Known limitations

- The shared grade scale is empty until verified NEU thresholds are loaded, so grades and GWA stay pending.
- Password hashing uses 10,000 PBKDF2 iterations to fit the Workers Free CPU budget, which is below common OWASP guidance; login rate limiting is still required before real accounts are relied on.
- Email ownership is not verified at account creation.
- Category deletion while activities exist is still undefined, so categories cannot be deleted.
- There is no tablet-specific layout; tablets use the phone or desktop breakpoints.

## License

No license has been declared for this project yet.
