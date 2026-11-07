# NEUron

NEUron is a responsive grade-monitoring web app for New Era University students. It is designed to help students configure subject grading systems, record scores, monitor grades, manage schedules, and calculate their semester GWA.

> **Status: In active development.** The app is currently being rebuilt and is not feature-complete. Authentication is available in the deployed build, while academic setup, grade tracking, schedule management, and related APIs are still being implemented.

## Live app

[Open the NEUron live preview](https://neuron.marcoeduardo-asegurado.workers.dev)

The live deployment is intended for preview and development validation. Do not rely on it as a complete production academic record system yet.

## Current progress

- React and Vite application shell
- Cloudflare Workers deployment with static assets
- Cloudflare D1 database binding
- Login with username or email
- Session-based authentication and sign-out
- Forgot-password and reset-password screens
- Protected application routes
- Initial semester and academic-structure schema
- Responsive design foundation and shared UI components
- PWA manifest and app metadata

## Planned features

- Semester setup workflow
- Subject and grading-category configuration
- Activity score entry and editing
- Category, subject, and semester grade calculations
- Shared percentage-to-grade conversion table
- Semester GWA calculation
- Weekly class schedule management
- Target-grade calculator
- Cross-device synchronization and supported offline behavior

## Tech stack

- React 19
- TypeScript
- Vite
- React Router
- Cloudflare Workers
- Cloudflare D1
- Vitest and Testing Library
- oxlint

## Getting started

### Requirements

- Node.js
- npm
- Cloudflare Wrangler access for Worker and D1 development

### Install dependencies

```bash
npm install
```

### Start the local frontend

```bash
npm run dev
```

### Build the application

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Run linting

```bash
npm run lint
```

### Run the Cloudflare development server

```bash
npm run cf:dev
```

Deployment is intentionally not documented as an automatic setup step. Confirm the target environment and obtain approval before deploying changes.

## Project documentation

- [Project plan](./PLAN.md) — scope, phases, roadmap, and completion criteria
- [Design specification](./DESIGN.md) — visual direction, tokens, layouts, and screen states
- [Grading rules](./GRADING_RULES.md) — calculation behavior and unresolved grading decisions
- [Data model](./DATA_MODEL.md) — entities, ownership, and Cloudflare D1 constraints
- [Agent workflow](./AGENTS.md) — project development and safety rules

## Repository structure

```text
src/
  app/                 Application shell, routing, guards, and shared layout
  components/ui/      Reusable interface components
  features/           Authentication and product feature screens
  lib/                Client helpers and grading logic
  server/             Worker API handlers, validation, auth, and database access
  styles/             Global styles and design tokens
migrations/            Cloudflare D1 database migrations
public/                Static assets and PWA metadata
scripts/               Development utilities
```

## Development notes

- The browser communicates with D1 through the Cloudflare Worker; it must not query D1 directly.
- Student data is intended to be isolated by authenticated user ownership.
- Grading formulas should remain centralized in the shared grading library.
- Official percentage-to-grade thresholds still require verification before they are treated as final.
- Some planned data-model and product decisions remain open; see [PLAN.md](./PLAN.md) and [DATA_MODEL.md](./DATA_MODEL.md).

## License

No license has been declared for this project yet.
