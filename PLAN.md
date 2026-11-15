# NEUming — Project Plan

**Status:** Phases 0 and 1 are complete. The app is deployed on Cloudflare Workers at `https://neuron.marcoeduardo-asegurado.workers.dev`, with static assets, a Worker API, and a Cloudflare D1 binding. Phase 2 authentication is implemented, migrated to remote D1, deployed, and smoke-tested in production. It is pending Resend configuration, password-reset email delivery verification, and final phone/desktop QA. Phase 3 is implemented, migrated to remote D1, deployed as version `56a065d7-3419-494b-9493-a70486c876a1`, and smoke-tested in production. The authenticated production setup flow still needs testing with a real account. Phase 4's grading engine is implemented in `src/lib/grading/` with automated tests; no production conversion thresholds are set. Phase 5's Home dashboard and score-entry API are implemented, and `migrations/0004_activities.sql` is applied locally and remotely. Production is deployed and has passed authenticated production QA and the phone/desktop visual check, so Phase 5 is complete. Phase 6's Subjects page and score management are implemented, pushed, deployed as version `abe26cda-8beb-452b-be3f-4426fe039591`, and have passed authenticated production QA and the phone/desktop visual check, so Phase 6 is complete. Phase 7's weekly schedule is implemented, committed as `4051ed4`, pushed to `origin/main`, with `migrations/0005_schedule.sql` applied locally and remotely, and deployed as version `e0dfb7d1-ddd0-46c3-a56b-c2a4f588e47b`. Production health, asset delivery, and unauthenticated API rejection were verified for Phases 6 and 7. Phase 7 also passed authenticated production CRUD QA and the phone/desktop visual check and is complete. Phases 5 and 6 have also passed authenticated production QA and the phone/desktop visual checks. A UI polish pass (reference palette, phone Home redesign, locked mobile top bar, toast, Add score bottom sheet) was committed as `bd428d8`, pushed to `origin/main`, and deployed as version `fea5f0d2-d023-4580-b9f9-68203270d4b2`. Phases 0–8 are complete. Phase 8's Semester GWA card is implemented in Home using the shared grading engine and is deployed as version `827d8f1e-6288-41b5-89ab-f65139ac7185` (from `49ccec8`; the Phase 8 app code was first deployed as `1257fb13-9285-47e5-a3c7-cae238d978d1`). Production QA passed for placement, pending and empty states, responsive layout, accessibility, and live score/unit updates; the pending state is shown in production because the official NEU conversion thresholds are still unapproved. Complete-state and conversion-driven GWA checks are deferred to Phase 10 with the shared conversion table. Phase 9's percentage-target calculator is implemented in the shared grading engine and the Subjects page, with tests, and is deployed as version `e1fe0b8f-3387-40d9-8eba-45f7eb71e4a7`; production QA is pending. Phase 10 is code-complete, deployed as version `d5957195-c327-4e5d-9751-7706e3cd6860`, and passed authenticated production QA. Phase 11 (read-only offline, active-semester API cache, PNG install icons) plus the motion and dropdown polish is committed as `4a8542c`, pushed to `origin/main`, and deployed as version `8d725553-5fd0-4daa-9af4-d913c969bd8d`; automated production checks pass, and the owner browser QA passed on 2026-11-14. Phase 12 is in progress: the API-level and UI QA passes, skeleton loading, mobile Settings entry, and pre-mount splash are committed as `d6ecc11`, pushed to `origin/main`, and deployed as version `66a41a73-a1e9-4bac-8dc0-a7ec98ee6a86`. Phase 13 (public demo access and owner-approved registration) is implemented, committed as `06e3899`, pushed to `origin/main`, deployed as version `48e0804b-f292-4710-b1d0-216f5021fe62`, migrated to remote D1, seeded with the shared demo, and smoke-tested in production on 2026-11-15.
**Source of truth:** Consolidated project plan for the NEUming rebuild. It was derived from the original master brief (Parts 1, 2, 5, 7, and 8), which has since been removed at the user's request. This file is now the reference for purpose, scope, phases, and open decisions.

> This document covers the project purpose, scope, phase order, task checklists, Done When criteria, technical direction, and open decisions. Design details live in `DESIGN.md`, grading rules in `GRADING_RULES.md`, data design in `DATA_MODEL.md`, and agent workflow rules in `AGENTS.md`.

---

## 1. Product context

### 1.1 What is NEUming?

NEUming is a responsive grade-monitoring web application for New Era University (NEU) students. It helps a student monitor academic performance throughout a semester by letting them configure a grading system for every subject, record activity scores, see computed grades, manage class schedules, and calculate their semester General Weighted Average (GWA).

The central product idea is that professors may use different grading categories and weights for different subjects. NEUming must therefore let students customize the grading categories and weights separately for each subject while using one shared percentage-to-grade conversion table across that student's subjects.

### 1.2 Main product goals

- Give students a clear view of their current grade in every subject.
- Allow custom grading categories and weights per subject.
- Record, edit, and delete quiz, exam, project, attendance, and other activity scores.
- Automatically calculate category averages, subject percentages, and converted 1.0–5.0 grades.
- Calculate a semester GWA weighted by subject units.
- Provide a target-grade calculator after its calculation assumptions are finalized.
- Let students create and manage a weekly class schedule.
- Provide personal accounts and cloud data synchronization across devices.
- Support phone, tablet, and desktop layouts.
- Progress toward installable PWA behavior and supported offline use.

### 1.3 Primary users and account model

- Primary user: an individual NEU student monitoring their own academic records.
- Each student signs in using a personal account.
- A student's semesters, subjects, scores, and schedule must be associated with the authenticated user account.
- Data from one student must never be readable or writable by another student.
- Visitors can explore the app through one shared, writable demo account without registering.
- Anyone can request an account from the public Register screen. A request stays `pending` and cannot sign in until the owner approves it.
- The owner reviews requests in Settings. The owner role is granted only through owner tooling.
- The application is not an admin/teacher grade-entry portal in the current scope.

### 1.4 Core navigation and feature scope

The approved design direction includes:

1. **Home** — current grade overview, grade status, semester switcher, and Add Score action.
2. **Subjects** — expandable subject cards with categories, weights, averages, activity records, and score-management actions.
3. **Schedule** — weekly class timetable, Add Class action, class details, and empty states.
4. **Settings** — navigation is visible in the desktop layout, but a complete Settings page has not yet been identified. Its contents must be specified before implementation.

Additional planned capabilities:

- Login with username or email, a one-click demo, and Forgot Password.
- Self-registration with owner approval; the owner keeps `cf:account:create` for manual provisioning.
- Owner-only account requests card in Settings.
- Multi-step semester setup.
- Semester GWA display.
- Target Grade Calculator.
- Global percentage-to-grade conversion table management.
- Semester switching and historical semester access.
- Offline support, synchronization status, and PWA installation.

Do not invent additional modules, roles, or features without the user's approval.

---

## 2. Project history and source of truth

### 2.1 Why this is a rebuild

A previous implementation attempt in VS Code did not match the intended UI. The user identified two main problems:

- The generated interface did not follow the approved design direction.
- The design-reference workflow did not reliably give the coding agent the correct visual target.

The user did not push the rejected local UI changes to GitHub because they were dissatisfied with the result. The existing GitHub repository is therefore a reference for the earlier product implementation and requirements, not an instruction to preserve its visual direction.

### 2.2 Existing GitHub repository

Repository: https://github.com/marcoasegurado/NEUron

The repository's current README describes an older implementation with:

- Plain HTML, CSS, and JavaScript.
- Browser `localStorage` as the current storage mechanism.
- A demo login rather than real authentication.
- A green/mint/coral visual direction called **Campus Studio**.
- An older planned Firebase migration (now superseded by Cloudflare D1).

That visual direction is outdated for the rebuild. Do not copy its colors, components, layouts, or visual styling into the new implementation.

Some older functional concepts may be useful as historical reference, but inspect and validate them against this brief before reuse. In particular, do not blindly reuse the old conversion-table values as official NEU grading rules.

### 2.3 Source-of-truth priority

Use the following priority when information conflicts:

1. Explicit decisions made by the user in the current project conversation.
2. This plan and the other project documents (`DESIGN.md`, `GRADING_RULES.md`, `DATA_MODEL.md`, `AGENTS.md`).
3. `DESIGN.md` and the approved visual direction, for visual behavior and appearance.
4. The current GitHub repository, for historical context only.
5. The coding agent's assumptions — assumptions must never override confirmed requirements.

If a required behavior is not specified or two authoritative references conflict, stop and ask one focused question. Do not guess.

### 2.4 The written design specification is the visual source of truth

`DESIGN.md` is a standalone visual specification: it expands the approved orange/cream/cat-mascot direction into tokens, components, responsive behavior, screen layouts, and states. No external design application is required to implement a screen.

Implement from `DESIGN.md` together with the screen inventory in this plan. If a visual value or state is missing, propose a clear baseline, label it as a proposal, and ask for approval before treating it as final.

---

## 3. Technical direction

### 3.1 Agreed stack and tools

| Area | Decision / direction |
|---|---|
| Main environment | VS Code |
| Primary coding agent | OpenCode |
| Preferred model family | DeepSeek, using the model configured by the user in OpenCode |
| Secondary assistant | GitHub Copilot, optional; not the primary implementation driver |
| Frontend | React + Vite |
| Backend API | Cloudflare Worker (server-side D1 access) |
| Authentication | Custom email/password auth in the Worker; D1-backed sessions; self-registration with owner approval; one-click shared demo account; owner role for account administration; login accepts username or email; any valid email domain; Resend for password-reset email |
| Password hashing | PBKDF2-HMAC-SHA256, 10,000 iterations, per-user random salt; stored as `pbkdf2-sha256$iterations$salt$hash` |
| Sessions | Random 32-byte token in an `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS) cookie; SHA-256 token hash in D1; 7-day lifetime |
| Database | Cloudflare D1 `neuron`, bound as `DB`; auth tables are defined in `migrations/0001_auth.sql` and `migrations/0002_add_username.sql`; account status, the owner role, and the single-demo constraint are in `migrations/0007_accounts_and_roles.sql` |
| Hosting | Cloudflare Workers; existing URL `https://neuron.marcoeduardo-asegurado.workers.dev` |
| App format | Responsive web app, progressively enhanced as a PWA |
| Design reference | `DESIGN.md` (standalone visual specification) |

Do not add a major dependency, framework, backend, state library, component library, or alternative hosting platform without explaining the need and obtaining approval when it changes this direction.

### 3.2 Environment and secrets

- Use Cloudflare bindings (for example, the D1 `DB` binding) and environment variables for any deployment-specific settings.
- Do not commit `.env`, `.dev.vars`, Cloudflare API tokens, database credentials, session secrets, or other secrets.
- The browser must never receive D1 credentials or query D1 directly; all database access goes through the Cloudflare Worker.
- Add a `.dev.vars.example` or `.env.example` containing placeholder names only when the actual variable names have been agreed.
- Document local setup, D1 binding, and deployment steps in the eventual README.
- Auth configuration: `RESEND_API_KEY` is a Worker secret; `AUTH_EMAIL_FROM` is the verified Resend sender; `APP_ORIGIN` is optional and overrides the reset-link origin.

### 3.3 Hosting and deployment approach

- Deploy a minimal working React + Vite shell to Cloudflare Workers at `https://neuron.marcoeduardo-asegurado.workers.dev` early in Phase 1.
- Verify local development, production build, preview deployment, and production URL before implementing the full app.
- Keep the D1 binding and all database access inside the Cloudflare Worker, separate from frontend source code.
- Do not claim deployment is successful until the deployed URL has been checked.

### 3.4 Offline and PWA approach

Offline behavior belongs to a dedicated later phase. D1 has no built-in browser offline persistence, so the offline strategy (local cache and/or queued writes synced through Worker), browser support, and synchronization/conflict expectations must be chosen and documented before implementation.

Do not assume offline persistence exists automatically. The app should eventually communicate whether it is online, offline, or waiting for pending writes to synchronize.

---

## 4. Development roadmap

Complete phases in order. Work on **one phase at a time**. Do not begin a later phase just because its files, routes, or navigation placeholders exist.

### Phase 0 — Planning and requirements lock

**Goal:** Make product, design, grading, data, and agent instructions clear before application implementation.

Tasks:
- [x] Record the product purpose and initial feature scope.
- [x] Review the existing GitHub README and mark its green/mint/coral design direction as outdated.
- [x] Review the approved visual direction and identify the core screen groups and states.
- [x] Finalize the grading and GWA formulas/rules in `GRADING_RULES.md`.
- [x] Split the original master brief into `PLAN.md`, `DESIGN.md`, `GRADING_RULES.md`, `DATA_MODEL.md`, and `AGENTS.md`.
- [x] Verify that the split files do not contradict one another. Cross-document audit completed 2026-11-06; stale references and the schedule-source citation were corrected.
- [x] Review the open decisions in Section 5 and identify which block the next phases. Phase 1 needs the existing D1 database name/ID (or placeholder binding) but not the final SQL schema or product decisions. Later-phase decisions stay open in Section 5.

**Done when:** All five documentation files exist, agree with one another, and clearly label any still-open decisions. No essential calculation or data behavior is left for the coding agent to invent.

### Phase 1 — Project foundation and first deployment

**Goal:** Create a clean React + Vite foundation and verify deployment early.

Tasks:
- [x] Inspect local repository status, current branch, remotes, and uncommitted changes before modifying anything.
- [x] Recorded the user's explicit decision to work on `main` instead of a separate `rebuild` branch (commit `0eb4b27`).
- [x] Recorded the user's explicit decision to replace the legacy app; legacy files were removed in commit `0eb4b27`.
- [x] Set up React + Vite and an agreed project structure.
- [x] Add only the minimum code-quality and test tooling needed.
- [x] Add the initial responsive app shell using verified tokens from `DESIGN.md`.
- [x] Create the dedicated D1 database `neuron` and configure the `DB` binding for local development.
- [x] Add a minimal Cloudflare Worker API for server-side D1 access.
- [x] Configure bindings and secrets safely; keep D1 out of the browser bundle.
- [x] Add basic PWA manifest and metadata; full offline behavior belongs to Phase 11.
- [x] Deploy the empty but working app to Cloudflare Workers.
- [x] Verify the local Cloudflare dev server and production build.
- [x] Verify the Cloudflare Workers deployment, including `/api/health`, SPA routing, and the PWA manifest.

**Done when:** The app runs locally, production build succeeds, the Cloudflare Workers URL loads, D1 is reachable only through the Worker, and the agreed Git branch policy is respected.

### Phase 2 — Authentication

**Goal:** Give each student a secure personal account.

Tasks:
- [x] Implement Login using the approved authentication provider.
- [x] Support login with a unique username or any valid email.
- [x] Replace public registration with manual account creation.
- [x] Implement Forgot Password/password reset.
- [x] Add loading, validation, success, and error states.
- [x] Protect authenticated routes.
- [x] Add sign-out behavior.
- [x] Design/spec missing auth screens before implementing their exact UI.

Implementation status:
- Auth API, D1 schema, session cookies, manual account creation, React screens, route guards, and sign-out are implemented.
- Login accepts a unique username or any valid email address; public registration is removed and `/register` redirects to `/login`.
- Local verification passed for login by username/email, logout, invalid credentials, session lookup, password reset, reset-token reuse, cross-origin rejection, and SPA route serving.
- `0001_auth.sql` and `0002_add_username.sql` are applied to the remote `neuron` D1 database.
- The Worker is deployed at `https://neuron.marcoeduardo-asegurado.workers.dev` (version `60c701b1-9ba7-4609-9c1a-5f6c04217942`).
- Production smoke test passed for the new flow: username login, email login, session lookup, logout, wrong-password rejection, public-registration `404`, forgot-password `202` for an arbitrary email, and the `Secure`/`HttpOnly`/`SameSite=Lax` cookie. The temporary QA account was deleted; production has `0` users and `0` sessions.
- Pending before Phase 2 is complete: configure Resend (`RESEND_API_KEY`, verified `AUTH_EMAIL_FROM`), verify real reset-email delivery, and complete phone/desktop QA.
- The reduced PBKDF2 cost is below common OWASP guidance; add login rate limiting and revisit the cost if the Workers plan changes.

**Done when:** A manually created account can sign in by username or email; the account can sign out; password reset works; signed-out users cannot access private student data; phone and desktop layouts pass QA.

### Phase 3 — Semester setup and subject configuration

**Goal:** Let a student create a semester and configure all subjects.

Tasks:
- [x] Follow the approved setup flow: three steps on phone and two on desktop.
- [x] Collect academic year/term and semester label.
- [x] Add/remove subjects during setup.
- [x] Collect subject name and units; professor remains optional.
- [x] Add custom grading categories per subject.
- [x] Allow category weights to be edited and show live total.
- [x] Prevent saving unless active category weights total 100%.
- [x] Save semester and subject configuration to D1 through the Worker API under the authenticated user.
- [x] Support reviewing/editing configuration where approved.

Implementation status:
- `migrations/0003_academic_structure.sql` defines `semesters`, `subjects`, and `grading_categories`, with cascade ownership and one active semester per user.
- The migration is applied locally and remotely; its uniqueness, active-semester, and cascade constraints are verified locally.
- `src/server/academic.ts` defines the D1 row types, API-facing types, and row mappers.
- `src/server/academic-validation.ts` validates semester fields, subjects, units, duplicate names, decimal weights, and the 100% total.
- `src/server/semesters.ts` implements `POST /api/semesters`, `GET /api/semesters`, and `GET /api/semesters/:id` with atomic batch writes and automatic activation.
- `src/features/setup/` implements the phone three-step and desktop two-step setup UI, live weight totals, validation, review, unsaved-changes warning, saving, and success states.
- `npm run build`, `npm run lint`, and `npm test` pass (59 tests, including setup draft and setup-page integration tests).
- Local API smoke tests pass: create `201`, list/detail, decimal weights and units, duplicate `409`, invalid weights `400`, active-semester switching, and unknown semester `404`.
- Production deployment `56a065d7-3419-494b-9493-a70486c876a1` serves the app and rejects signed-out semester requests; authenticated setup still needs a real-account check.

**Done when:** A student can create a semester with multiple subjects; each subject retains units, optional professor, categories, and weights; invalid totals cannot be saved; data persists and remains account-isolated; setup matches the `DESIGN.md` spec at phone and desktop sizes.

### Phase 4 — Grading engine and automated tests

**Goal:** Implement calculations independently of the UI.

Tasks:
- [x] Implement the rules in `GRADING_RULES.md` as reusable functions.
- [x] Validate finite, non-negative earned score; positive total points; earned score not greater than total in v1.
- [x] Calculate points-weighted category averages.
- [x] Treat recorded zero as a real score and missing score as missing.
- [x] Mark subject `No Grade Yet` if any active category has no scores.
- [x] Calculate exact weighted subject percentage without rounding before conversion.
- [x] Implement one global conversion table shared by all subjects.
- [x] Validate table coverage and thresholds.
- [x] Keep full precision internally; round only for display.
- [x] Add automated tests for all `GRADING_RULES.md` test cases.
- [x] Do not set production conversion defaults until official NEU thresholds are verified.

Implementation status:
- `src/lib/grading/grading.ts` provides the centralized category-average, subject-percentage, subject-grade, conversion, and semester-GWA functions; `types.ts` defines their inputs and result states.
- Activity validation rejects negative or non-finite scores, non-positive or non-finite totals, and scores above the total. Recorded zero remains valid and counts as complete.
- Weight validation ignores inactive categories and rejects active totals outside 100% and invalid weights.
- Conversion validation enforces the 0–100 threshold range, unique thresholds, full coverage from 0%, and NEU grades within 1.0–5.0. Evaluation uses the highest inclusive threshold at or below the exact percentage.
- Subject results are `pending` for missing categories, invalid weights, invalid activities, incomplete categories, or an unusable conversion table. Inactive categories and their activities do not affect grading.
- Semester GWA ignores inactive subjects, is units-weighted, preserves full precision, and returns pending or empty states instead of partial or zero values.
- `src/lib/grading/grading.test.ts` has 38 passing tests covering all 11 required cases plus validation and edge cases.
- No production conversion table or default thresholds exist; ownership stays unresolved until the user decides.
- Phase 5, 6, and 8 UI work must import these functions rather than reimplementing formulas.

**Done when:** All grading tests pass; formulas are centralized; invalid settings/scores are rejected; official conversion thresholds are approved before becoming production defaults.

### Phase 5 — Home dashboard and score entry

**Goal:** Build the main grade-monitoring screen.

Tasks:
- [x] Implement Home using the phone and desktop specs in `DESIGN.md`.
- [x] Show active semester and switcher where specified.
- [x] Show each subject's percentage and pending status consistently.
- [x] Show incomplete subjects clearly.
- [x] Implement Add Score interaction from Home.
- [x] Validate score entries and associate each with the correct subject/category.
- [x] Persist changes to D1 through the Worker API and refresh calculated values.

Implementation status:
- `migrations/0004_activities.sql` adds the normalized `activities` table with ownership through `grading_categories`, score checks, cascade delete, and category/date indexes.
- `src/server/activities.ts` exposes `POST /api/activities` with same-origin, session, subject/category ownership, and active-category checks. `src/server/activity-validation.ts` reuses the grading engine's activity validation and normalizes an optional date to today.
- `POST /api/semesters/:id/activate` switches the single active semester for the authenticated account.
- Semester detail responses include each category's activities so `src/features/home/view-model.ts` can derive percentages from the Phase 4 engine on every read.
- Home shows exact percentages, a shared `Grade Pending` banner, `No Grade Yet` for incomplete subjects, category completion progress, and per-subject pending explanations. No numeric grade or GWA is shown while official thresholds are unverified.
- Below `1024px` every route shares a locked top bar (cat mascot, two-tone `NEUming` wordmark, orange `Sign out`) that stays pinned while scrolling. Home uses a dedicated phone layout below `640px` — mascot hero bubble, semester pill, `Current grades` title, single-column subject rows with tinted percentage tiles, and a floating `+` button — while desktop keeps the page header with the semester switcher and a compact Add Score control. There is no scroll-triggered header collapse, so scrolling does not re-render the dashboard. The same locked top bar applies on Subjects, Schedule, and Settings.
- The Add Score dialog collects subject, active category, activity name, earned score, total points, and an optional date that defaults to today. It validates before submitting, supports Escape/overlay close and keyboard focus containment, and refreshes Home after saving.
- `src/features/home/HomePage.test.tsx`, `view-model.test.ts`, `score-form.test.ts`, and `src/server/activity-validation.test.ts` cover the dashboard, switching, form validation, payloads, mapping, and API validation.
- Migration `0004` is applied locally and remotely. The Phase 5 build is deployed as version `ad69da18-a1fa-4cba-a796-a6edf883d5f1`; production health, asset delivery, and unauthenticated API rejection were verified. Authenticated production score entry and the phone/desktop visual check passed, so Phase 5 is complete.

**Done when:** Home is responsive and visually checked against the `DESIGN.md` spec; score entries save correctly; invalid data is blocked; all grade values match the grading engine; refresh preserves saved records.

### Phase 6 — Subjects page and score management

**Goal:** Provide detailed category and activity history for each subject.

Tasks:
- [x] Implement Subjects based on the phone and desktop specs in `DESIGN.md`.
- [x] Display subjects with current percentage and converted grade/status.
- [x] Implement expand/collapse.
- [x] Display categories, weights, averages, and activities.
- [x] Add, edit, and delete activity scores.
- [x] Add a subject and its grading categories to the active semester from the Subjects page.
- [ ] Add/edit subject details only as permitted by approved data rules. Subject editing remains unapproved and is not implemented.
- [x] Implement empty-score and delete-confirmation states.
- [x] Recalculate values after every change.

Implementation status:
- `PATCH /api/activities/:id` and `DELETE /api/activities/:id` were added to `src/server/activities.ts`. Both resolve ownership through activity → category → subject → semester → user, so a signed-in account cannot change another account's score. Updates accept only name, earned score, total points, and date; subject and category stay fixed.
- `src/server/activity-validation.ts` now exposes `parseActivityUpdate`, reusing the same score, name, and date rules as creation.
- `src/lib/academic-api.ts` exposes `updateActivity` and `deleteActivity`; `src/lib/academic-grading.ts` holds the single API-to-grading adapter used by both Home and Subjects.
- The score dialog moved to `src/features/activities/ActivityDialog.tsx` and now supports create and edit modes on top of the shared `Modal` component. Edit mode shows the subject and category as locked context. Home imports the same dialog.
- `src/features/subjects/view-model.ts` derives each subject summary from the Home view model and adds category averages plus newest-first activity percentages, so Home and Subjects cannot disagree.
- `src/features/subjects/SubjectsPage.tsx` renders collapsed subject cards that expand into categories and activities. Each active category has an Add score action; each activity has Edit and Delete actions. Delete requires confirmation in a modal. Empty categories show an explicit no-scores state.
- Every successful create, update, or delete refetches the active semester from the Worker API, so the Subjects view and later Home visits recalculate from the Phase 4 engine.
- `POST /api/semesters/:id/subjects` adds one subject to the signed-in user's semester. It enforces ownership, the 30-subject cap, case-insensitive duplicate names, and the same category/100%-weight rules as semester setup. The Subjects header (and the no-subjects empty state) exposes `Add Subject`, which opens `src/features/subjects/SubjectDialog.tsx`; a successful save refetches the semester so Home and Schedule show the new subject.
- Numeric grades and GWA remain deferred. Subjects shows exact percentages with `Grade Pending` while official NEU thresholds are unverified.
- Test coverage was added in `src/features/subjects/view-model.test.ts`, `src/features/subjects/SubjectsPage.test.tsx`, `src/features/subjects/subject-form.test.ts`, `src/features/activities/score-form.test.ts`, and `src/server/activity-validation.test.ts`.

**Done when:** Subject details/history are accurate; add/edit/delete persists; Home and Subjects show the same grade; phone and desktop layouts match the `DESIGN.md` spec.

### Phase 7 — Schedule

**Goal:** Let students manage and view weekly classes.

Tasks:
- [x] Resolve the day range: Monday–Saturday.
- [x] Implement weekly schedule for phone and desktop.
- [x] Require every class to link to an existing subject in the active semester.
- [x] Store day, start time, end time, and optional room/location.
- [x] Implement class details, edit/delete, and empty states.
- [x] Validate the time range and warn about, but allow, overlapping classes.

Implementation status:
- Migration `migrations/0005_schedule.sql` creates `class_schedules` with `id`, `semester_id`, `subject_id`, `day_of_week` (`1`–`6` for Monday–Saturday), `start_time` and `end_time` as `HH:MM`, optional `room`, and timestamps. Checks enforce the day range and `start_time < end_time`; both foreign keys cascade on delete and indexes cover semester/day ordering and subject lookups.
- `src/server/schedule.ts` serves `GET /api/semesters/:id/schedule`, `POST /api/schedule`, `PATCH /api/schedule/:id`, and `DELETE /api/schedule/:id`. Every handler resolves ownership through semester → user, and create/update reject a subject that does not belong to that semester.
- `src/server/schedule-validation.ts` rejects missing IDs, days outside `1`–`6`, malformed times, an end time that is not later than the start time, and rooms longer than 120 characters. An omitted or blank room becomes `null`.
- `src/lib/academic-api.ts` exposes `getSchedule`, `createScheduleClass`, `updateScheduleClass`, and `deleteScheduleClass`.
- `src/features/schedule/ClassDialog.tsx` creates and edits one meeting: subject, day, start time, end time, and optional room. It validates before submitting and shows a live overlap warning while still allowing the save.
- `src/features/schedule/SchedulePage.tsx` loads the active semester, its subjects, and its schedule. Phones use a six-day week strip and the selected day's agenda; from `1024px` the same data renders as a weekly grid with time rows and subject-colored blocks. Class details offer Edit and Delete, and delete requires confirmation in a modal.
- `src/features/schedule/view-model.ts` owns day/time formatting, sorting, conflict detection, and grid positioning. `src/features/schedule/class-form.ts` owns form defaults, validation, payloads, and draft conflicts.
- Empty states cover no active semester, a semester without subjects, and a week without classes; a single empty day shows its own message without hiding the rest of the week.
- Overlaps are stored normally and marked in both views with the conflicting subject names. Nothing blocks a conflict.
- Test coverage was added in `src/features/schedule/view-model.test.ts`, `src/features/schedule/class-form.test.ts`, `src/features/schedule/SchedulePage.test.tsx`, and `src/server/schedule-validation.test.ts`.
- Full suite at deployment: 17 files and 148 tests passing; `npm run lint` clean. Migration `0005` is applied locally and remotely. The Phase 7 build is deployed as version `e0dfb7d1-ddd0-46c3-a56b-c2a4f588e47b`; production health, asset delivery, and unauthenticated API rejection were verified.
- Authenticated production QA passed against a temporary account that was removed afterward: login, semester setup, empty schedule, create, overlapping create, reload persistence, ordering, edit, reload, inverted time (`400`), day 7 (`400`), unknown subject (`404`), unknown class edit (`404`), foreign semester read (`404`), delete, repeat delete (`404`), and full data cleanup. The phone/desktop visual pass was completed by the user and passed.

**Done when:** Students can add/view/edit/delete classes; the Monday–Saturday range and time placement work correctly; phone and desktop match the `DESIGN.md` spec.

### Phase 8 — Semester GWA

**Goal:** Show the semester GWA using the approved units-weighted formula.

Tasks:
- [x] Implement `GWA = sum(subject grade × subject units) / sum(subject units)`.
- [x] Include every active subject in the semester.
- [x] Use exact converted subject grades and units; do not round intermediate values.
- [x] Show `GWA Pending` if any active subject has no computed grade.
- [x] Show an empty state if there are no subjects; do not show zero.
- [x] Display GWA to two decimal places.
- [x] Add the approved Semester GWA card to Home, above the subject grid, with complete, pending, and empty states from `DESIGN.md`; page-level loading and error states cover the card.
- [x] Reuse the shared GWA function from `src/lib/grading/grading.ts`; do not compute the formula inline.
- [x] Test the complete state with a fixture conversion table and the pending state against the unconfigured production thresholds.

Implementation status:
- `buildSemesterGwa` in `src/features/home/view-model.ts` maps API subjects through the existing adapter and calls the shared `calculateSemesterGwa`; it never computes the formula inline.
- The card renders only in the ready state. Home's existing page-level loading and error states cover the card, so no skeleton or fallback value is shown.
- Complete state shows the two-decimal GWA with units, subject count, and the active semester caption. Pending state distinguishes incomplete subjects (named) from unconfigured conversion thresholds (plain-language reason, no subject names). Empty state offers `Set up semester` and never shows `0.00`.
- `view-model.test.ts` covers the `GRADING_RULES.md` 1.80 example with a fixture conversion table, the threshold-pending state with an empty table, incomplete-subject naming, and the empty semester. `HomePage.test.tsx` covers the pending card in the dashboard.
- Deployed as version `827d8f1e-6288-41b5-89ab-f65139ac7185` from `49ccec8` (2026-11-10; app code unchanged from the `459e39f` build first deployed as `1257fb13-9285-47e5-a3c7-cae238d978d1`). Authenticated production QA passed on 2026-11-10 at desktop and phone widths: card placement, `GWA Pending` with the thresholds reason, no fabricated value, refresh persistence, the empty state, and score add/edit/delete plus unit changes without errors.

**Done when (production):** The Home card matches the `DESIGN.md` placement, pending, empty, visual, responsive, and accessibility spec; no fabricated or partial GWA is shown; pending and empty states survive a refresh; score add/edit/delete and unit changes keep the card consistent without errors.

**Deferred to Phase 10 (conversion-dependent):** The complete state matches the `GRADING_RULES.md` 1.80 example against a configured conversion table; incomplete-subject pending naming; conversion-table changes update GWA. These require the shared conversion table and approved NEU thresholds, which are Phase 10 deliverables. Fixture tests cover them until then.

### Phase 9 — Target Grade Calculator

**Goal:** Help a student estimate what scores are needed to reach a target grade.

Tasks:
- [x] Finalize assumptions before implementation.
- [x] Define handling for future activities, empty categories, remaining category weights, and target input.
- [x] Let student choose a subject and target grade or percentage, subject to the approved design.
- [x] Show the required score or explain when the target is mathematically unreachable.
- [x] Clearly label estimates and assumptions.
- [x] Never modify actual saved activity scores.
- [x] Design the screen/states before implementation if not present in `DESIGN.md`.

Implementation status:
- Decisions: percentage targets first; all unscored active weight is one remaining bucket; the calculator opens from an expanded subject card on Subjects; standard edge-case messages. Grade targets (`1.0–5.0`) wait for the approved conversion table in Phase 10.
- `calculateTargetPercentage` in `src/lib/grading/grading.ts` returns `invalid-target`, `blocked`, `reached`, `required`, or `unreachable`. It reuses `calculateCategoryAverage` and `validateWeights`; the UI never computes the formula inline.
- `TargetGradeDialog` opens from the expanded subject card, calculates live as the target changes, shows the current percentage, remaining weight, and required average, and is read-only.
- Tests cover the `GRADING_RULES.md` 83.75% example, already-reached, no remaining weight, above-100% unreachable, the exact 100% boundary, invalid targets, blocked states, inactive categories, and recorded zero. `SubjectsPage.test.tsx` covers opening the dialog and the reached state.
- Build and the full test suite pass. Deployed as version `e1fe0b8f-3387-40d9-8eba-45f7eb71e4a7`.
- **Production QA waived by the user on 2026-11-11** so Phase 10 could start. Phase 9 is therefore implemented and deployed but not marked complete; if the calculator is QA'd later, close it here.

**Done when:** Calculator outputs have test cases; calculations reuse the same weighted category averages as the grading engine; percentage targets work without the conversion table; grade targets remain deferred to Phase 10; no actual grade records are modified.

### Phase 10 — Settings and semester management

**Goal:** Manage account-level and semester-level settings.

Tasks:
- [x] Design/spec the Settings page; only the navigation item is confirmed in the approved screen inventory. → Semester, Grade scale, and Account cards specified in `DESIGN.md` as a proposal awaiting approval.
- [x] Finalize conversion-table ownership scope (per-account or centrally managed). → Central application-wide table, read-only to students.
- [x] Implement the one shared conversion table in the approved settings location.
- [x] Warn before saving changes that may affect every subject grade and semester GWA. → No in-app editing exists; `npm run cf:conversion:load` prints the affected semester and subject counts and writes only with `--apply`.
- [x] Support viewing and switching semesters.
- [x] Define creation of a new semester and retention of past semesters. → Creation stays in the existing Setup flow; every past semester is retained and listed in Settings.
- [x] Resolve historical conversion-table behavior before enabling edits that can alter past results. → One live table, no snapshot; changes recalculate past semesters.
- [x] Add other account/settings actions only after their behavior is specified. → Phase 10 adds Sign out only.
- [x] Add dropped/withdrawn subject support: `subjects.is_active = 0`, excluded from GWA units and grade, scores stay visible.

Implementation status (2026-11-11, deployed as `d5957195-c327-4e5d-9751-7706e3cd6860`, authenticated QA pending):
- `migrations/0006_conversion_and_subject_status.sql` creates the central `conversion_rows` table and adds `subjects.is_active`. It deliberately seeds no rows, because the official NEU thresholds are still unapproved.
- `GET /api/settings/conversion` returns the table with `configured`, `valid`, and `errors`; it is read-only and answers other methods with `405`.
- `PATCH /api/subjects/:id` accepts `{ active }`, validates subject → semester → user, and returns `404` for subjects the caller does not own.
- `GET /api/semesters` now also returns `units` and `subjectCount`, counting only non-dropped subjects.
- `SettingsPage` implements the Semester, Grade scale, and Account cards, including the switch confirmation modal and the not-configured grade-scale state.
- Dropped subjects show a `Dropped` badge and a Restore action on Subjects, keep their scores, and are excluded from Home's grid and from GWA units.
- `npx tsc -b`, `npm run build`, and `npx vitest run src` (193 tests) pass. `0006` is applied to **remote** D1 (verified: `conversion_rows` exists, `subjects.is_active` present, table count 10). Applying it locally is blocked on this machine because `wrangler d1 execute --local` needs workerd, which refuses to run on macOS 12.6 (minimum 13.5).
- Deployed as version `d5957195-c327-4e5d-9751-7706e3cd6860`. Production checks pass: `/api/health` returns `{"ok":true}`, `/api/settings/conversion` and `/api/semesters` return `401` when unauthenticated, `PATCH /api/subjects/:id` returns `401` when unauthenticated, `POST /api/settings/conversion` returns `405`, and `/`, `/settings`, and `/manifest.webmanifest` return `200`.
- Authenticated production QA on 2026-11-11 passed: the Settings page, the `Official NEU thresholds not set` grade-scale state, semester switching, and dropping/restoring a subject all behave as specified. The empty grade scale is correct because no threshold rows are approved yet.
- `scripts/set-conversion-table.mjs` (`npm run cf:conversion:load`) is the owner path for loading thresholds: it validates an approved JSON file, prints the affected semester and subject counts, writes nothing without `--apply`, and replaces the table in one transaction. Verified against remote D1: an invalid file is rejected with per-row errors, a valid dry run prints the table and `1 semester(s) and 8 subject(s)`, and `conversion_rows` still contains 0 rows afterward.
- Committed as `d6be225` and pushed to `origin/main`.
- Residual item: the official NEU threshold values are still unapproved, so the conversion table is empty. Grades, GWA, and grade targets stay pending until `npm run cf:conversion:load -- --file <path> --apply` runs with verified rows. This is a data dependency, not missing code.

**Done when:** Approved settings are manageable through UI; conversion validation works; table changes affect the intended grades; historical semesters remain accessible and follow the approved versioning rule.

**Status: complete (code) as of 2026-11-11.** All eight tasks are done, committed as `d6be225`, deployed as `d5957195-c327-4e5d-9751-7706e3cd6860`, and production-QA'd. The one Done When clause that cannot be shown yet is "table changes affect the intended grades", because the official NEU threshold values are still unapproved. That is an owner data item, not missing code: `npm run cf:conversion:load -- --file <path> --apply` loads verified rows, and fixture tests already prove the conversion and GWA path.

### Phase 11 — Offline support, sync, and PWA polish

**Goal:** Support temporary connectivity loss and reliable multi-device behavior.

**Status: complete as of 2026-11-14.**

Tasks:
- [x] Choose and document the offline cache/queue strategy for D1-backed data and supported browser behavior. → Read-only offline, no write queue; app shell + active-semester GET responses cached; API network-first with cached fallback.
- [x] Add online/offline/sync-status indicators. → `useOnlineStatus` drives a persistent offline banner in the app shell.
- [x] Implement the agreed offline read/write behavior. → Cached Home/Subjects/Schedule/Settings stay viewable; all write entry points are disabled offline and `apiRequest` rejects non-GET requests.
- [x] Define conflict handling when the same record is edited on multiple devices. → Not applicable: no offline writes are queued, so conflicts cannot arise from this device.
- [x] Verify pending writes sync when connectivity returns. → No pending writes exist by design; reconnect simply re-enables writes and refetches.
- [x] Complete PWA installability, icons, manifest, and service-worker behavior. → `public/sw.js`, PNG 192/512/maskable icons, apple-touch-icon, updated manifest.
- [x] Test sign-in, sign-out, and account switching on shared devices. → The API cache is cleared on sign-in, sign-out, and semester switch, so no account or semester data outlives the session.
- [x] Add motion polish ahead of Phase 12: branded boot splash that cross-fades into the app, route fades, card/dialog entrances, and reduced-motion coverage. → Catalogued in `DESIGN.md` §9 "Implemented motion set". CSS only, no new dependencies.
- [x] Rebuild dropdowns as an accessible animated listbox and add button hover/press motion. → Shared `src/components/ui/Dropdown.tsx` replaces every native select (Home phone + desktop, Setup term, score and class dialogs) with keyboard, typeahead, Escape, outside-click, and disabled-option handling. `Dropdown.test.tsx` added; two feature tests updated from `selectOptions` to click-through.

**Done when:** The app reports connection state; cached read-only data remains viewable offline with no possibility of silent data loss (no offline writes are queued by design); multi-device/share-device behavior is documented and cache clearing is tested; installability works on supported devices.

**Deployment (2026-11-14):** committed as `14821e0` on top of `c6c85c3` (boot-veil keyframe escape fix), pushed to `origin/main`, and deployed as version `8d725553-5fd0-4daa-9af4-d913c969bd8d`. The earlier `4a8542c` build had deployed as `05381638-34cb-4d76-8110-d9be4aa58a5b` and included a blank-page-after-sign-in bug caused by CSS Modules scoping the shared keyframe names; `c6c85c3` escapes them with `global(...)` so the cream boot veil now fades out. Gate result: `npx vitest run` 27 files / 211 tests pass, `npm run lint` clean, `npm run build` succeeds, and `dist/` contains `sw.js`, the manifest, and all four icons. Because this machine has 2 CPUs and jsdom setup dominates the run (462s of 695s), the setup-flow tests were timing out under load at vitest's default 5s ceiling, so `vite.config.ts` raises `testTimeout`/`hookTimeout` to 20s; no assertion was relaxed and the assertions themselves are unchanged. Production checks pass: `/sw.js` serves the committed file byte-for-byte as `text/javascript`, `/manifest.webmanifest` returns `application/manifest+json` with the 192/512/maskable/apple-touch icons, each icon returns `200 image/png`, `/`, `/home`, `/subjects`, `/schedule`, and `/settings` serve the SPA, `/api/health` returns `{"ok":true}`, and `/api/semesters`, `/api/settings/conversion`, and `/api/auth/me` return `401` when signed out. The deployed CSS is byte-identical to the local build and contains the unscoped `animation:veil-out` rule, confirming the fix is live. The production bundle registers `/sw.js` and deletes `neuming-api-*` caches on sign-out and on semester change.

**Browser QA (owner, 2026-11-14): passed.** Online load, offline reload of cached Home/Subjects/Schedule/Settings, disabled write controls with the offline banner, reconnect behavior, the desktop install prompt, and the iOS home-screen icon were all confirmed against the deployed build. Phase 11 is closed.

### Phase 12 — Final QA and release

**Goal:** Verify the complete app before calling the rebuild ready.

Tasks:
- [x] Test account sign-in by username/email, create semester, add scores, view grades, manage subjects, view schedule, and sign out. → API-level end-to-end pass on the local Worker + D1 (75 checks) plus the UI pass recorded below.
- [ ] Test complete/incomplete subject grades and GWA states. → Percentages and pending states verified; the complete GWA state is blocked by the unapproved grade scale.
- [x] Test account data isolation and Worker/D1 authorization checks. → 18 checks passed, including cross-account `404`s, cross-origin `403`, and signed-out `401`s.
- [x] Test phone, tablet, and desktop layouts. → Headless-Chrome pass on the local Worker at `1440×900`, `834×1112`, and `390×844` (plus `320px` and `360px` spot checks) across login, Home, Subjects, Schedule, and Settings; no horizontal overflow, no clipped controls, and every skeleton captured at each width.
- [ ] Test refresh, browser restart, and supported offline scenarios. → Refresh verified (boot splash, then splash-to-app handoff); offline was verified by the Phase 11 owner QA. A full browser-restart and installed-app pass is still open.
- [ ] Check labels, keyboard navigation, focus indicators, and readable contrast. → Labels, heading order, `main`/`nav` landmarks, and Tab focus rings (3px orange) pass with zero unlabelled buttons; a numeric contrast audit is still open.
- [x] Check console errors, failed requests, and production build output. → Build output checked (no debug logging, no TODO markers, bundle `373 kB` / `112 kB` gzip); browser console has no warnings or page errors, only the expected signed-out `401` resource entries.
- [x] Deploy release build to Cloudflare Workers and verify the production URL. → Deployed as version `66a41a73-a1e9-4bac-8dc0-a7ec98ee6a86`; `/` serves `index-DQdyc4PL.js` / `index-B4JfYLjx.css` with the static splash and `mobile-web-app-capable`, and the health, manifest, service-worker, icon, and signed-out `401` checks all pass.
- [x] Update README with actual features, stack, local setup, environment variables, and deployment.

Implementation status (2026-11-14):
- Local D1 was missing `0006_conversion_and_subject_status.sql`; it is now applied locally, so every migration `0001`–`0006` exists in both local and remote D1.
- A two-account QA script drove the real Worker against local D1: sign-in by email and username, wrong password, cross-origin rejection, session cookie flags, semester creation with two subjects, score create/edit/delete/re-delete, exact percentages (`90` and `85`, recomputed independently from API payloads), score validation rejections, recorded zero accepted, schedule create/overlap/inverted/day-7/blank-room/edit/delete, drop and restore, semester switching, and sign-out with post-logout `401`. Result: 75/75 checks passed.
- Account isolation passed: a second account sees no semesters and receives `404` for another account's semester, schedule, score edits, class deletes, and subject changes; a class cannot reference a subject from a different semester.
- `AppShell` now removes the boot veil on a native `animationend` listener with a 1s fallback timer, so a missed animation can no longer leave the full-screen overlay covering the app. Two tests cover the animation path and the fallback path.
- `README.md` was rewritten around the shipped app: features, grade-scale status, stack, local setup, migration order, account provisioning, grade-scale loading, deployment, environment variables, structure, and known limitations.

UI pass and skeleton loading (2026-11-15):
- Page-level loads now use shared skeletons instead of text placeholders: `Skeleton` (shimmer bar) and `PageSkeleton` (`list`, `grid`, `schedule` layouts). Home renders the GWA summary card plus the real 1/2/3-column grid, Subjects and Settings render full-width stacked cards, and Schedule renders the weekly board at `1024px+` with agenda rows below it. Each wrapper is `role="status"` with `aria-live="polite"` and `aria-busy="true"`; the bars are `aria-hidden`. Covered by `PageSkeleton.test.tsx` and a Home loading-state test.
- Fixed a navigation defect found by the UI pass: Settings was only reachable from the sidebar, which is hidden below `1024px`. The locked phone/tablet top bar now carries a `44px` Settings icon link next to `Sign out`, so the bottom nav keeps its three specified items. Covered by an `AppShell` test.
- Added a static splash inside `#root` in `index.html` (cream background, mascot, wordmark, `Checking your session…`) so the first paint is the splash instead of blank cream before React parses; the first React render replaces it. Verified on a cold phone-width load: splash at ~130ms, app shell by ~500ms.
- Added `mobile-web-app-capable` next to the deprecated `apple-mobile-web-app-capable`, which cleared the Chrome console warning.
- Fixed two narrow-phone overflows: the three 92px bottom-nav pills widened a 320px layout viewport (now 76px below `360px`), and the phone semester pill pushed past 320px (now capped at `max-width: 100%` with ellipsis). At `320px` the top bar also shrinks the mascot/wordmark so the full `NEUming` wordmark stays visible.
- Remaining before close: the complete-grade and complete-GWA states stay blocked until verified NEU thresholds are loaded; a numeric contrast audit and a browser-restart/installed-app pass are still open.

**Done when:** Critical flows pass; no known critical data-loss, access-control, or grading defects remain; production deployment is verified; README describes the rebuilt app accurately.

### Phase 13 — Public demo and owner-approved registration

**Goal:** Let visitors try NEUming immediately, and let anyone request a personal account that the owner must approve before it can sign in.

Tasks:
- [x] Add `migrations/0007_accounts_and_roles.sql`: `users.status` (`active` / `pending` / `rejected`), `users.role` (`student` / `owner`), `users.is_demo`, a status index, and a partial unique index that allows only one demo account. Existing accounts default to active students.
- [x] Add `POST /api/auth/register` (creates a pending account, returns no session), `POST /api/auth/demo` (starts a session for the shared demo account), and login gating that rejects pending and rejected accounts with a clear message. `getSessionUser` returns only active accounts.
- [x] Add owner-only admin routes in `src/server/accounts.ts`: `GET /api/admin/accounts` lists pending requests, `POST /api/admin/accounts/:id/approve`, and `POST /api/admin/accounts/:id/reject`. Every route checks `role === 'owner'`; the demo account is never listed.
- [x] Frontend: public `/register` page, `Try the demo` button and `Create an account` link on Login, an owner-only `Account requests` card in Settings with Approve/Reject actions, and a shared-demo banner in `AppShell`.
- [x] Add `scripts/seed-demo.mjs` (`cf:demo:reset`) to create or reset the demo account and its sample semester, and `scripts/promote-account.mjs` (`cf:account:promote`) to grant the owner role.
- [x] Tests: `RegisterPage` (validation, normalized request, taken-account error), `LoginPage` (demo entry, pending rejection), Settings owner card (approve flow, hidden from students), and the shared-demo banner.
- [x] Apply `0007` to remote D1, push, deploy, and run the production smoke test after approval. → Committed as `06e3899`, pushed to `origin/main`, deployed as version `48e0804b-f292-4710-b1d0-216f5021fe62`; remote D1 migrated, the demo seeded, and the owner promoted on 2026-11-15.

Implementation status (2026-11-15):
- Local D1 has `0007` applied and the demo seed created 1 semester, 4 subjects, 15 scores, and 7 class meetings for the `demo` account. The demo is a normal writable student account, so visitors can add or edit scores; `npm run cf:demo:reset` restores the sample data.
- A local Worker API pass returned 27/27 checks: demo login and seeded reads, demo/non-owner `403`s on admin routes, signed-out `401`, pending registration without a session, duplicate-email `409`, pending login `403`, owner listing, approve, approved login, reject, rejected login `403`, unknown request `404`, and wrong admin method `405`.
- A headless-Chrome pass at `1440×900` and `390×844` returned 23/23 checks with no console or page errors: Login shows the demo and registration entry points, demo login lands on Home with the shared-data banner, the demo cannot see owner controls, registration shows the approval state, pending login is blocked with the approval message, the owner approves from Settings, the request leaves the list, and the approved account signs in. No horizontal overflow on Login, Register, or Settings.
- Narrow-width follow-up: Login, Register, and owner Settings have no horizontal overflow at `320px` or `360px`; Settings section order is Semester → Account requests → Grade scale → Account.
- Gate status: 30 test files / 227 tests pass, `tsc -b` and `oxlint` are clean, and the production build succeeds.
- Production (2026-11-15): `0007` applied to remote D1 with all five statements; `orcam` (`marcoeduardo.asegurado@neu.edu.ph`) promoted to `owner`, and the demo seeded with 1 semester, 4 subjects, 15 scores, and 7 classes. A 20/20 smoke pass covered health, the app shell on `/login`, `/register`, and `/home`, demo login and seeded reads, demo/non-owner `403`s and signed-out `401` on admin routes, registration `201` without a session, pending login `403`, and the generic wrong-password `401`. The smoke registration was deleted afterward. A 15/15 production UI pass at `1440×900` and `390×844` confirmed the Login demo entry point, the demo banner on Home with seeded data, the Register page, no overflow, and no console or page errors.
- Still open: the owner should confirm the in-app approval flow with their own production password, and public endpoints still have no rate limiting.

**Done when:** A visitor can open the shared demo in one click; anyone can submit a registration request; a pending or rejected account cannot sign in; the owner can approve or reject requests in Settings; the demo reset and owner promote commands work; and the deployed app passes the production smoke test.

---

## 5. Open decisions and dependencies

These are intentionally unresolved. The coding agent must not silently choose an answer. Resolve each item before implementing the phase that depends on it.

| Decision | Current status | Needed before |
|---|---|---|
| D1 application schema and migrations | Auth tables are defined in `0001_auth.sql` and `0002_add_username.sql`; academic structure is in `0003_academic_structure.sql`; activities are in `0004_activities.sql`; schedules are in `0005_schedule.sql`; the central conversion table and `subjects.is_active` are in `0006_conversion_and_subject_status.sql`; account status, roles, and the single-demo constraint are in `0007_accounts_and_roles.sql` | Resolved |
| Authentication provider | Resolved: custom email/password in the Worker with D1 sessions, self-registration with owner approval, a one-click shared demo, username-or-email login, any valid email domain, and Resend reset email | Resolved (Phase 13) |
| Account provisioning | Resolved: anyone can request an account, but it stays `pending` until the owner approves it in Settings. The owner keeps `npm run cf:account:create` for manual provisioning and uses `npm run cf:account:promote` to grant the owner role | Resolved (Phase 13) |
| Shared demo account | Resolved: one writable demo account, no exposed password, started with `POST /api/auth/demo`; `npm run cf:demo:reset` restores its sample data | Resolved (Phase 13) |
| Password hashing and session policy | Resolved baseline: PBKDF2-HMAC-SHA256 at 10,000 iterations, 7-day sessions, 1-hour reset tokens | Resolved |
| Cloudflare Workers plan and auth CPU cost | User chose the lower-iteration path to fit the Workers Free CPU budget. Production login succeeded with 10,000 iterations. This is below common OWASP guidance, so add rate limiting before relying on it for real accounts | Resolved for Phase 2; rate limiting remains a hardening task |
| Resend account and sender | Resend API key and a verified sender (`AUTH_EMAIL_FROM`) are not configured yet | Before password-reset production test |
| Official NEU percentage-to-grade thresholds | Not yet verified; old repository values are not approved defaults | Phase 4 / Phase 10 |
| Login, Register, and Forgot Password UI | Resolved: all reuse the auth layout and are specified in `DESIGN.md`; Login also offers the one-click demo | Resolved (Phase 13) |
| Settings page and controls | Resolved: Semester (list + switch), read-only Grade scale, Account cards, and an owner-only Account requests card, specified in `DESIGN.md` | Resolved (Phase 10, extended in Phase 13) |
| Registration and demo rate limiting | Not implemented; public registration and the demo endpoint can be called repeatedly | Before relying on them for a public launch |
| GWA card/section design | Resolved: Home card above the subject grid with complete, pending, empty, loading, and error states specified in `DESIGN.md` | Resolved |
| Target Grade Calculator assumptions | Resolved: percentage target, one remaining-weight bucket, Subjects-page modal, standard edge-case messages | Resolved |
| Schedule day range | Resolved: Monday–Saturday, stored as `day_of_week` `1`–`6` | Resolved |
| Conversion table ownership | Resolved: one application-wide table shared by every account and subject, read-only to students, changed only by owner tooling | Resolved (Phase 10) |
| Historical conversion table changes | Resolved: one live table with no snapshot; a change recalculates past semesters too | Resolved (Phase 10) |
| Dropped/withdrawn subjects | Resolved: `subjects.is_active = 0` marks a dropped subject; it is excluded from GWA units and grade while its scores stay visible | Resolved (Phase 10) |
| Schedule overlap behavior | Resolved: overlaps are allowed and saved, with a visible conflict warning in both views and the editor | Resolved |
| Multi-day class storage | Resolved: one entry per day; a MWF class is three entries | Resolved |
| Offline capability | Resolved: read-only offline; cached data is viewable, every write is blocked while offline, and no write queue exists | Resolved (Phase 11) |
| Offline cache scope | Resolved: active semester only; the API cache is cleared on sign-in, sign-out, and semester change | Resolved (Phase 11) |
| PWA install icons | Resolved: generated PNG 192, 512, 512 maskable, and apple-touch-icon, committed as static files | Resolved (Phase 11) |
| Schedule subject link | Resolved: every class must reference a subject in the same semester | Resolved |
| Phone schedule layout | Resolved: week strip plus the selected day's agenda | Resolved |
| Category deletion with existing activities | Not finalized | Phase 3 / Phase 6 |
| Target grade calculation method | Resolved: `required = ((T - P) / R) * 100`; grade targets wait for the approved conversion table | Resolved |
| Tablet layout | No dedicated tablet frames identified | Phase 12 |

Do not block unrelated work on decisions that are only needed in a later phase. For example, the app foundation can be prepared before target-calculator assumptions are finalized, but the calculator itself cannot be implemented.

---

## 6. Final status snapshot

### Confirmed

- Product: NEUming, a grade-monitoring web app for NEU students.
- Rebuild is intended; the rejected local UI changes were not pushed.
- The orange/cream/cat-mascot design in `DESIGN.md` is the visual source of truth.
- Primary navigation: Home, Subjects, Schedule; Settings is visible but needs a full-page specification.
- Semester setup is multi-step: three steps on phone, two on desktop.
- Custom grading categories and weights per subject.
- Active category weights must total 100%.
- Category average is points-weighted.
- Missing category score means `No Grade Yet`; recorded zero is a valid score.
- Subject percentage is calculated from weighted category averages without rounding before conversion.
- One global percentage-to-grade table is shared across all subjects.
- GWA is weighted by subject units.
- GWA stays pending until every active subject has a computed grade.
- GWA display uses two decimal places.
- Target Grade Calculator: percentage target only in Phase 9; all unscored active weight is one remaining bucket; `required = ((target - current) / remainingWeight) * 100`; the calculator is read-only. Grade targets wait for the approved conversion table.
- Preferred stack: React + Vite, Cloudflare Workers with static assets, and Cloudflare D1.
- Deployment URL: `https://neuron.marcoeduardo-asegurado.workers.dev`.
- Phase 1 deployment verified: `/`, `/home`, `/manifest.webmanifest`, and `/api/health` return 200 on the production URL.
- Phase 2 auth is deployed and production-smoke-tested; the temporary test account was removed.
- Firebase Authentication and Firestore are no longer part of the stack.
- Authentication is custom email/password in the Worker with D1-backed sessions.
- Any valid email domain is allowed.
- Accounts are created by self-registration with owner approval, or manually by the owner. A registered account stays `pending` and cannot sign in until the owner approves it. Each account has a unique username, display name, email, and password.
- Visitors can open a shared, writable demo account in one click from Login. The demo has sample data, no exposed password, and an in-app banner; `npm run cf:demo:reset` restores it.
- The owner role is granted only with `npm run cf:account:promote` and unlocks the Settings `Account requests` card.
- Login accepts either the username or the email, plus the password.
- Passwords are hashed with PBKDF2-HMAC-SHA256 at 10,000 iterations and a per-user salt. This is below common OWASP guidance; login rate limiting is still required, and the cost should be revisited if the Workers plan changes.
- Sessions use a random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS) cookie and expire after 7 days.
- Password-reset emails are sent through Resend; reset tokens expire after 1 hour and are single-use.
- Login, Register, Forgot Password, and Reset Password reuse the specified auth layout.
- Auth tables are in `migrations/0001_auth.sql`; `migrations/0002_add_username.sql` adds the unique username used for login; `migrations/0007_accounts_and_roles.sql` adds `status`, `role`, `is_demo`, and the single-demo index.
- Semester, subject, and grading-category tables are defined in `migrations/0003_academic_structure.sql`. Category weights accept decimal percentages; each user can have only one active semester.
- Activity scores are stored in `migrations/0004_activities.sql`; weekly classes are stored in `migrations/0005_schedule.sql`. Both migrations are applied locally and remotely.
- Phase 6 is deployed as version `abe26cda-8beb-452b-be3f-4426fe039591`.
- Phase 7 is committed as `4051ed4`, pushed to `origin/main`, and deployed as version `e0dfb7d1-ddd0-46c3-a56b-c2a4f588e47b`. Production health, static assets, and unauthenticated rejection of `/api/auth/me`, `/api/semesters`, and the schedule list endpoint were verified. Authenticated production CRUD QA and the phone/desktop visual check passed, so Phase 7 is complete.
- Phase 8 is committed as `459e39f`, pushed to `origin/main`, and deployed as version `1257fb13-9285-47e5-a3c7-cae238d978d1`; the documentation close-out commit `49ccec8` is deployed as version `827d8f1e-6288-41b5-89ab-f65139ac7185` with the same app code. Authenticated production QA passed at desktop and phone widths for card placement, pending and empty states, accessibility, refresh persistence, and live score/unit updates. Complete-state and conversion-driven GWA checks are deferred to Phase 10 with the shared conversion table, so Phase 8 is complete for the states production can produce.
- Phase 9 is committed as `fba5831`, pushed to `origin/main`, and deployed as version `e1fe0b8f-3387-40d9-8eba-45f7eb71e4a7`. The percentage-target calculator lives in `src/lib/grading/grading.ts` with `TargetGradeDialog` on the Subjects page; grading and page tests pass. Production QA is pending.
- The weekly schedule covers Monday–Saturday (`day_of_week` `1`–`6`), stores one entry per meeting day, and requires a subject from the same semester.
- Overlapping classes are saved normally and flagged with a conflict warning rather than rejected.
- The phone schedule uses a six-day week strip plus the selected day's agenda; from `1024px` it becomes a weekly time grid.
- Preferred coding workflow: OpenCode with DeepSeek in VS Code; GitHub Copilot may be secondary.
- Work one phase at a time and do not modify GitHub remotely without explicit instruction.

### Not yet confirmed

- Official NEU percentage-to-grade threshold values.
- Category deletion behavior when activities already exist.
- Whether login, registration, and demo rate limiting plus email-ownership verification are required before real accounts.
- Resend account, verified sender, and API key configuration.
- Whether approved/rejected applicants should receive an email notification (Resend is not configured).
- Browser verification of offline reads, disabled offline writes, and PWA installation (Phase 11 close-out). → Resolved 2026-11-14; owner browser QA passed on the deployed build.

Resolved since Phase 10/11 and kept here for traceability: conversion-table ownership (one central application-wide table, read-only to students), historical threshold changes (one live table, no snapshot), Settings screen design (Semester, read-only Grade scale, Account cards), dropped subjects (`subjects.is_active = 0`, excluded from GWA units and grade, scores retained), and the shared conversion-table migration (`0006_conversion_and_subject_status.sql`). Resolved in Phase 13: self-registration with owner approval, one writable shared demo account with a reset command, the owner role and in-app Account requests card, and migration `0007_accounts_and_roles.sql`.

**Current instruction:** Phases 0–8 are complete and deployed. Phase 9's percentage-target calculator is committed as `fba5831`, pushed, and deployed as version `e1fe0b8f-3387-40d9-8eba-45f7eb71e4a7`; its tests pass, but the user waived production QA on 2026-11-11, so Phase 9 stays unclosed. Phase 10 (Settings and semester management) is code-complete: committed as `d6be225`, deployed as version `d5957195-c327-4e5d-9751-7706e3cd6860`, and authenticated production QA passed for Settings, semester switching, the empty grade scale, and drop/restore. The official NEU threshold rows remain unapproved, so the grade scale is empty and grades stay pending; that is an owner data item, not missing code. Do not invent threshold data. Phase 11 (read-only offline, active-semester cache, PNG install icons) plus motion polish and the shared animated dropdown is committed as `4a8542c`, pushed to `origin/main`, and deployed as version `05381638-34cb-4d76-8110-d9be4aa58a5b`. Phase 11 is complete: code committed as `14821e0` (with the `c6c85c3` boot-veil fix), pushed to `origin/main`, deployed as version `8d725553-5fd0-4daa-9af4-d913c969bd8d`, and the owner browser QA passed. Phase 12 (final QA and release) is in progress: the API-level end-to-end and authorization pass, the README rewrite, and the boot-veil hardening are committed as `1693ed4`; the UI pass, skeleton loading, mobile Settings entry, and pre-mount splash are committed as `d6ecc11`, pushed to `origin/main`, and deployed as version `66a41a73-a1e9-4bac-8dc0-a7ec98ee6a86` (219/219 tests green). Still open before Phase 12 closes: the complete-grade and complete-GWA states are blocked until verified NEU thresholds are loaded, and a numeric contrast audit plus a browser-restart/installed-app pass remain. Phase 13 (public demo and owner-approved registration) is deployed: migration `0007`, register/demo/admin APIs, Register page, Login demo entry, owner Account requests card, demo banner, `cf:demo:reset`, and `cf:account:promote`; local API QA passed 27/27 checks, the UI QA passed 23/23 at `1440×900` and `390×844`, the gate passed 227/227 tests, and production smoke passed 20/20 with 15/15 UI checks. The owner account `orcam` holds the owner role and the demo is seeded in production. Remaining: the owner should confirm the in-app approval flow with their own password, and public registration/demo rate limiting is still unbuilt.
