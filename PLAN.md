# NEUron — Project Plan

**Status:** Phases 0 and 1 are complete. The app is deployed on Cloudflare Workers at `https://neuron.marcoeduardo-asegurado.workers.dev`, with static assets, a Worker API, and a Cloudflare D1 binding. Phase 2 authentication is implemented, migrated to remote D1, deployed, and smoke-tested in production. It is pending Resend configuration, password-reset email delivery verification, and final phone/desktop QA. Phase 3 is implemented, migrated to remote D1, deployed as version `56a065d7-3419-494b-9493-a70486c876a1`, and smoke-tested in production. The authenticated production setup flow still needs testing with a real account. Phase 4's grading engine is implemented in `src/lib/grading/` with automated tests; no production conversion thresholds are set. Phase 5's Home dashboard and score-entry API are implemented, and `migrations/0004_activities.sql` is applied locally and remotely. Production is deployed as version `ad69da18-a1fa-4cba-a796-a6edf883d5f1` with unauthenticated smoke tests passing; authenticated production QA and phone/desktop visual checks are still pending.
**Source of truth:** Consolidated project plan for the NEUron rebuild. It was derived from the original master brief (Parts 1, 2, 5, 7, and 8), which has since been removed at the user's request. This file is now the reference for purpose, scope, phases, and open decisions.

> This document covers the project purpose, scope, phase order, task checklists, Done When criteria, technical direction, and open decisions. Design details live in `DESIGN.md`, grading rules in `GRADING_RULES.md`, data design in `DATA_MODEL.md`, and agent workflow rules in `AGENTS.md`.

---

## 1. Product context

### 1.1 What is NEUron?

NEUron is a responsive grade-monitoring web application for New Era University (NEU) students. It helps a student monitor academic performance throughout a semester by letting them configure a grading system for every subject, record activity scores, see computed grades, manage class schedules, and calculate their semester General Weighted Average (GWA).

The central product idea is that professors may use different grading categories and weights for different subjects. NEUron must therefore let students customize the grading categories and weights separately for each subject while using one shared percentage-to-grade conversion table across that student's subjects.

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
- The application is not an admin/teacher grade-entry portal in the current scope.

### 1.4 Core navigation and feature scope

The approved design direction includes:

1. **Home** — current grade overview, grade status, semester switcher, and Add Score action.
2. **Subjects** — expandable subject cards with categories, weights, averages, activity records, and score-management actions.
3. **Schedule** — weekly class timetable, Add Class action, class details, and empty states.
4. **Settings** — navigation is visible in the desktop layout, but a complete Settings page has not yet been identified. Its contents must be specified before implementation.

Additional planned capabilities:

- Login with username or email, and Forgot Password.
- Manual account creation; no public registration screen.
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
| Authentication | Custom email/password auth in the Worker; D1-backed sessions; manual account creation (no public registration); login accepts username or email; any valid email domain; Resend for password-reset email |
| Password hashing | PBKDF2-HMAC-SHA256, 10,000 iterations, per-user random salt; stored as `pbkdf2-sha256$iterations$salt$hash` |
| Sessions | Random 32-byte token in an `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS) cookie; SHA-256 token hash in D1; 7-day lifetime |
| Database | Cloudflare D1 `neuron`, bound as `DB`; auth tables defined in `migrations/0001_auth.sql` and `migrations/0002_add_username.sql`; remaining application schema still needs confirmation |
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
- The Add Score dialog collects subject, active category, activity name, earned score, total points, and an optional date that defaults to today. It validates before submitting, supports Escape/overlay close and keyboard focus containment, and refreshes Home after saving.
- `src/features/home/HomePage.test.tsx`, `view-model.test.ts`, `score-form.test.ts`, and `src/server/activity-validation.test.ts` cover the dashboard, switching, form validation, payloads, mapping, and API validation.
- Migration `0004` is applied locally and remotely. The Phase 5 build is deployed as version `ad69da18-a1fa-4cba-a796-a6edf883d5f1`; production health, asset delivery, and unauthenticated API rejection were verified. Authenticated production score entry and phone/desktop visual checks remain.

**Done when:** Home is responsive and visually checked against the `DESIGN.md` spec; score entries save correctly; invalid data is blocked; all grade values match the grading engine; refresh preserves saved records.

### Phase 6 — Subjects page and score management

**Goal:** Provide detailed category and activity history for each subject.

Tasks:
- [ ] Implement Subjects based on the phone and desktop specs in `DESIGN.md`.
- [ ] Display subjects with current percentage and converted grade/status.
- [ ] Implement expand/collapse.
- [ ] Display categories, weights, averages, and activities.
- [ ] Add, edit, and delete activity scores.
- [ ] Add/edit subject details only as permitted by approved data rules.
- [ ] Implement empty-score and delete-confirmation states.
- [ ] Recalculate values after every change.

**Done when:** Subject details/history are accurate; add/edit/delete persists; Home and Subjects show the same grade; phone and desktop layouts match the `DESIGN.md` spec.

### Phase 7 — Schedule

**Goal:** Let students manage and view weekly classes.

Tasks:
- [ ] Resolve whether schedule includes Monday–Friday or Monday–Saturday before implementation.
- [ ] Implement weekly schedule for phone and desktop.
- [ ] Add a class linked to an existing subject where appropriate.
- [ ] Store day(s), start time, end time, and optional room/location.
- [ ] Implement class details, edit/delete, and empty states.
- [ ] Validate time range and implement approved overlap behavior.

**Done when:** Students can add/view/edit/delete classes; agreed day range and time placement work correctly; phone and desktop match approved references.

### Phase 8 — Semester GWA

**Goal:** Show the semester GWA using the approved units-weighted formula.

Tasks:
- [ ] Implement `GWA = sum(subject grade × subject units) / sum(subject units)`.
- [ ] Include every active subject in the semester.
- [ ] Use exact converted subject grades and units; do not round intermediate values.
- [ ] Show `GWA Pending` if any active subject has no computed grade.
- [ ] Show an empty state if there are no subjects; do not show zero.
- [ ] Display GWA to two decimal places.
- [ ] Design the GWA card/section before implementation if it is not yet in `DESIGN.md`.

**Done when:** GWA matches the `GRADING_RULES.md` examples; incomplete subjects cause pending state; activity/weight/unit/conversion changes update GWA.

### Phase 9 — Target Grade Calculator

**Goal:** Help a student estimate what scores are needed to reach a target grade.

Tasks:
- [ ] Finalize assumptions before implementation.
- [ ] Define handling for future activities, empty categories, remaining category weights, and target input.
- [ ] Let student choose a subject and target grade or percentage, subject to the approved design.
- [ ] Show the required score or explain when the target is mathematically unreachable.
- [ ] Clearly label estimates and assumptions.
- [ ] Never modify actual saved activity scores.
- [ ] Design the screen/states before implementation if not present in `DESIGN.md`.

**Done when:** Calculator outputs have test cases; calculations reuse the same grading rules and conversion table; no actual grade records are modified.

### Phase 10 — Settings and semester management

**Goal:** Manage account-level and semester-level settings.

Tasks:
- [ ] Design/spec the Settings page; only the navigation item is confirmed in the approved screen inventory.
- [ ] Finalize conversion-table ownership scope (per-account or centrally managed).
- [ ] Implement the one shared conversion table in the approved settings location.
- [ ] Warn before saving changes that may affect every subject grade and semester GWA.
- [ ] Support viewing and switching semesters.
- [ ] Define creation of a new semester and retention of past semesters.
- [ ] Resolve historical conversion-table behavior before enabling edits that can alter past results.
- [ ] Add other account/settings actions only after their behavior is specified.

**Done when:** Approved settings are manageable through UI; conversion validation works; table changes affect the intended grades; historical semesters remain accessible and follow the approved versioning rule.

### Phase 11 — Offline support, sync, and PWA polish

**Goal:** Support temporary connectivity loss and reliable multi-device behavior.

Tasks:
- [ ] Choose and document the offline cache/queue strategy for D1-backed data and supported browser behavior.
- [ ] Add online/offline/sync-status indicators.
- [ ] Implement the agreed offline read/write behavior.
- [ ] Define conflict handling when the same record is edited on multiple devices.
- [ ] Verify pending writes sync when connectivity returns.
- [ ] Complete PWA installability, icons, manifest, and service-worker behavior.
- [ ] Test sign-in, sign-out, and account switching on shared devices.

**Done when:** The app reports connection/sync state; supported offline changes sync without silent data loss; multi-device behavior is documented/tested; installability works on supported devices.

### Phase 12 — Final QA and release

**Goal:** Verify the complete app before calling the rebuild ready.

Tasks:
- [ ] Test account sign-in by username/email, create semester, add scores, view grades, manage subjects, view schedule, and sign out.
- [ ] Test complete/incomplete subject grades and GWA states.
- [ ] Test account data isolation and Worker/D1 authorization checks.
- [ ] Test phone, tablet, and desktop layouts.
- [ ] Test refresh, browser restart, and supported offline scenarios.
- [ ] Check labels, keyboard navigation, focus indicators, and readable contrast.
- [ ] Check console errors, failed requests, and production build output.
- [ ] Deploy release build to Cloudflare Workers and verify the production URL.
- [ ] Update README with actual features, stack, local setup, environment variables, and deployment.

**Done when:** Critical flows pass; no known critical data-loss, access-control, or grading defects remain; production deployment is verified; README describes the rebuilt app accurately.

---

## 5. Open decisions and dependencies

These are intentionally unresolved. The coding agent must not silently choose an answer. Resolve each item before implementing the phase that depends on it.

| Decision | Current status | Needed before |
|---|---|---|
| D1 application schema and migrations | Auth tables are defined in `0001_auth.sql` and `0002_add_username.sql`; semester, subject, and category tables are defined in `0003_academic_structure.sql` and applied remotely; activity, schedule, and conversion-table tables are still undefined | Phase 4+ / data-model approval |
| Authentication provider | Resolved: custom email/password in the Worker with D1 sessions, manual accounts, username-or-email login, any valid email domain, and Resend reset email | Resolved |
| Account provisioning | Resolved: the owner creates accounts manually; no public registration. Use `npm run cf:account:create -- --email <email> --username <username> --name <name>` | Resolved |
| Password hashing and session policy | Resolved baseline: PBKDF2-HMAC-SHA256 at 10,000 iterations, 7-day sessions, 1-hour reset tokens | Resolved |
| Cloudflare Workers plan and auth CPU cost | User chose the lower-iteration path to fit the Workers Free CPU budget. Production login succeeded with 10,000 iterations. This is below common OWASP guidance, so add rate limiting before relying on it for real accounts | Resolved for Phase 2; rate limiting remains a hardening task |
| Resend account and sender | Resend API key and a verified sender (`AUTH_EMAIL_FROM`) are not configured yet | Before password-reset production test |
| Official NEU percentage-to-grade thresholds | Not yet verified; old repository values are not approved defaults | Phase 4 / Phase 10 |
| Login and Forgot Password UI | Resolved: both reuse the auth layout and are specified in `DESIGN.md`; there is no public Register screen | Resolved |
| Settings page and controls | Settings navigation exists; complete page design not identified | Phase 10 |
| GWA card/section design | Not identified in reviewed frames | Phase 8 |
| Target Grade Calculator assumptions | Not finalized | Phase 9 |
| Schedule day range | `DESIGN.md` does not specify the day range; the old README says Monday–Saturday | Phase 7 |
| Conversion table ownership | One shared table across subjects is confirmed; whether per account or central across users is not | Phase 10 / data-model approval |
| Historical conversion table changes | Recalculate past semesters or preserve prior table version is undecided | Phase 10 |
| Dropped/withdrawn subjects | Whether/how excluded from GWA is undecided | Phase 8 / Phase 10 |
| Schedule overlap behavior | Not finalized | Phase 7 |
| Category deletion with existing activities | Not finalized | Phase 3 / Phase 6 |
| Target grade calculation method | Future score assumptions and category behavior need agreement | Phase 9 |
| Tablet layout | No dedicated tablet frames identified | Phase 12 |

Do not block unrelated work on decisions that are only needed in a later phase. For example, the app foundation can be prepared before target-calculator assumptions are finalized, but the calculator itself cannot be implemented.

---

## 6. Final status snapshot

### Confirmed

- Product: NEUron, a grade-monitoring web app for NEU students.
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
- Preferred stack: React + Vite, Cloudflare Workers with static assets, and Cloudflare D1.
- Deployment URL: `https://neuron.marcoeduardo-asegurado.workers.dev`.
- Phase 1 deployment verified: `/`, `/home`, `/manifest.webmanifest`, and `/api/health` return 200 on the production URL.
- Phase 2 auth is deployed and production-smoke-tested; the temporary test account was removed.
- Firebase Authentication and Firestore are no longer part of the stack.
- Authentication is custom email/password in the Worker with D1-backed sessions.
- Any valid email domain is allowed.
- Accounts are created manually by the owner; there is no public registration. Each account has a unique username, display name, email, and password.
- Login accepts either the username or the email, plus the password.
- Passwords are hashed with PBKDF2-HMAC-SHA256 at 10,000 iterations and a per-user salt. This is below common OWASP guidance; login rate limiting is still required, and the cost should be revisited if the Workers plan changes.
- Sessions use a random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (HTTPS) cookie and expire after 7 days.
- Password-reset emails are sent through Resend; reset tokens expire after 1 hour and are single-use.
- Login, Forgot Password, and Reset Password reuse the specified auth layout.
- Auth tables are in `migrations/0001_auth.sql`; `migrations/0002_add_username.sql` adds the unique username used for login.
- Semester, subject, and grading-category tables are defined in `migrations/0003_academic_structure.sql`. Category weights accept decimal percentages; each user can have only one active semester.
- Preferred coding workflow: OpenCode with DeepSeek in VS Code; GitHub Copilot may be secondary.
- Work one phase at a time and do not modify GitHub remotely without explicit instruction.

### Not yet confirmed

- Official NEU percentage-to-grade threshold values.
- Whether conversion-table ownership is per student or centrally managed.
- Whether changing conversion thresholds recalculates historical semesters or preserves old versions.
- Whether Schedule includes Saturday.
- Settings, GWA, and Target Calculator screen designs.
- Target Grade Calculator assumptions.
- Dropped/withdrawn subject treatment in GWA.
- Schedule overlap behavior.
- Category deletion behavior when activities already exist.
- Remaining D1 schema and migrations for semesters, subjects, categories, activities, schedules, and conversion tables.
- Whether login rate limiting and email-ownership verification are required before real accounts.
- Resend account, verified sender, and API key configuration.

**Current instruction:** Phase 2 auth is deployed and production-smoke-tested. Next: add the Resend secret and verified sender, verify reset-email delivery, and complete phone/desktop QA. Do not mark Phase 2 complete until those steps pass.
