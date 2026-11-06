# NEUron — Project Plan

**Status:** Planning baseline; Phase 0 documentation lock is being finalized. A React + Vite shell and an untracked grading module already exist in the working tree, but no phase is complete and none should be marked complete yet.
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
- A student's semesters, subjects, scores, and schedule must be associated with the authenticated Firebase user.
- Data from one student must never be readable or writable by another student.
- The application is not an admin/teacher grade-entry portal in the current scope.

### 1.4 Core navigation and feature scope

The approved design direction includes:

1. **Home** — current grade overview, grade status, semester switcher, and Add Score action.
2. **Subjects** — expandable subject cards with categories, weights, averages, activity records, and score-management actions.
3. **Schedule** — weekly class timetable, Add Class action, class details, and empty states.
4. **Settings** — navigation is visible in the desktop layout, but a complete Settings page has not yet been identified. Its contents must be specified before implementation.

Additional planned capabilities:

- Login, Register, and Forgot Password.
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
- A planned Firebase migration.

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
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Cloudflare Pages |
| App format | Responsive web app, progressively enhanced as a PWA |
| Design reference | `DESIGN.md` (standalone visual specification) |

Do not add a major dependency, framework, backend, state library, component library, or alternative hosting platform without explaining the need and obtaining approval when it changes this direction.

### 3.2 Environment and secrets

- Use environment variables for Firebase client configuration and any deployment-specific settings.
- Do not commit `.env`, service-account private keys, admin credentials, tokens, or other secrets.
- Do not place Firebase Admin credentials in browser code.
- Add an `.env.example` containing placeholder names only when the actual environment variable names have been agreed.
- Document local setup and deployment steps in the eventual README.

### 3.3 Hosting and deployment approach

- Deploy a minimal working React + Vite shell to Cloudflare Pages early in Phase 1.
- Verify local development, production build, preview deployment, and production URL before implementing the full app.
- Keep Firebase Authentication and Firestore configuration separate from frontend source code.
- Do not claim deployment is successful until the deployed URL has been checked.

### 3.4 Offline and PWA approach

Offline behavior belongs to a dedicated later phase. Before implementation, explicitly choose and document the Firestore web offline-persistence behavior, browser support, and synchronization/conflict expectations.

Do not assume that offline persistence is enabled automatically. The app should eventually communicate whether it is online, offline, or waiting for pending writes to synchronize.

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
- [x] Review the open decisions in Section 5 and identify which block the next phases. None block Phase 1 (foundation), because Phase 1 only needs Firebase configuration, not the final Firestore layout or product decisions. Later-phase decisions stay open in Section 5.

**Done when:** All five documentation files exist, agree with one another, and clearly label any still-open decisions. No essential calculation or data behavior is left for the coding agent to invent.

### Phase 1 — Project foundation and first deployment

**Goal:** Create a clean React + Vite foundation and verify deployment early.

Tasks:
- [ ] Inspect local repository status, current branch, remotes, and uncommitted changes before modifying anything.
- [ ] Create/use a separate rebuild branch (suggested name: `rebuild`) only after confirming current repository state.
- [ ] Keep `main` unchanged; do not delete the old application.
- [ ] Set up React + Vite and an agreed project structure.
- [ ] Add only the minimum code-quality and test tooling needed.
- [ ] Add the initial responsive app shell using verified tokens from `DESIGN.md`.
- [ ] Configure Firebase Authentication and Firestore for local development.
- [ ] Configure environment variables safely.
- [ ] Add basic PWA manifest and metadata; full offline behavior belongs to Phase 11.
- [ ] Deploy the empty but working app to Cloudflare Pages.
- [ ] Verify local dev server, production build, and deployment.

**Done when:** The app runs locally, production build succeeds, Cloudflare Pages URL loads, Firebase config is separated from source code, and `main` has not been overwritten.

### Phase 2 — Authentication

**Goal:** Give each student a secure personal account.

Tasks:
- [ ] Implement Login using Firebase Authentication.
- [ ] Implement Register.
- [ ] Implement Forgot Password/password reset.
- [ ] Add loading, validation, success, and error states.
- [ ] Protect authenticated routes.
- [ ] Add sign-out behavior.
- [ ] Design/spec missing auth screens before implementing their exact UI.

**Done when:** A new user can register and sign in; an existing user can sign in/out; password reset works; signed-out users cannot access private student data; phone and desktop layouts pass QA.

### Phase 3 — Semester setup and subject configuration

**Goal:** Let a student create a semester and configure all subjects.

Tasks:
- [ ] Follow the approved setup flow: three steps on phone and two on desktop.
- [ ] Collect academic year/term and semester label.
- [ ] Add/remove subjects during setup.
- [ ] Collect subject name and units; professor remains optional.
- [ ] Add custom grading categories per subject.
- [ ] Allow category weights to be edited and show live total.
- [ ] Prevent saving unless active category weights total 100%.
- [ ] Save semester and subject configuration to Firestore under the authenticated user.
- [ ] Support reviewing/editing configuration where approved.

**Done when:** A student can create a semester with multiple subjects; each subject retains units, optional professor, categories, and weights; invalid totals cannot be saved; data persists and remains account-isolated; setup matches the `DESIGN.md` spec at phone and desktop sizes.

### Phase 4 — Grading engine and automated tests

**Goal:** Implement calculations independently of the UI.

Tasks:
- [ ] Implement the rules in `GRADING_RULES.md` as reusable functions.
- [ ] Validate finite, non-negative earned score; positive total points; earned score not greater than total in v1.
- [ ] Calculate points-weighted category averages.
- [ ] Treat recorded zero as a real score and missing score as missing.
- [ ] Mark subject `No Grade Yet` if any active category has no scores.
- [ ] Calculate exact weighted subject percentage without rounding before conversion.
- [ ] Implement one global conversion table shared by all subjects.
- [ ] Validate table coverage and thresholds.
- [ ] Keep full precision internally; round only for display.
- [ ] Add automated tests for all `GRADING_RULES.md` test cases.
- [ ] Do not set production conversion defaults until official NEU thresholds are verified.

**Done when:** All grading tests pass; formulas are centralized; invalid settings/scores are rejected; official conversion thresholds are approved before becoming production defaults.

### Phase 5 — Home dashboard and score entry

**Goal:** Build the main grade-monitoring screen.

Tasks:
- [ ] Implement Home using the phone and desktop specs in `DESIGN.md`.
- [ ] Show active semester and switcher where specified.
- [ ] Show each subject's grade and percentage/status consistently.
- [ ] Show incomplete subjects clearly.
- [ ] Implement Add Score interaction from Home.
- [ ] Validate score entries and associate each with the correct subject/category.
- [ ] Persist changes to Firestore and refresh calculated values.

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
- [ ] Choose and document Firestore web offline persistence and supported browser behavior.
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
- [ ] Test register, sign in, create semester, add scores, view grades, manage subjects, view schedule, and sign out.
- [ ] Test complete/incomplete subject grades and GWA states.
- [ ] Test account data isolation and Firestore security rules.
- [ ] Test phone, tablet, and desktop layouts.
- [ ] Test refresh, browser restart, and supported offline scenarios.
- [ ] Check labels, keyboard navigation, focus indicators, and readable contrast.
- [ ] Check console errors, failed requests, and production build output.
- [ ] Deploy release build to Cloudflare Pages and verify the production URL.
- [ ] Update README with actual features, stack, local setup, environment variables, and deployment.

**Done when:** Critical flows pass; no known critical data-loss, access-control, or grading defects remain; production deployment is verified; README describes the rebuilt app accurately.

---

## 5. Open decisions and dependencies

These are intentionally unresolved. The coding agent must not silently choose an answer. Resolve each item before implementing the phase that depends on it.

| Decision | Current status | Needed before |
|---|---|---|
| Official NEU percentage-to-grade thresholds | Not yet verified; old repository values are not approved defaults | Phase 4 / Phase 10 |
| Register and Forgot Password UI | No dedicated frames identified in the reviewed inventory | Phase 2 |
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
- Preferred stack: React + Vite, Firebase Authentication, Cloud Firestore, Cloudflare Pages.
- Preferred coding workflow: OpenCode with DeepSeek in VS Code; GitHub Copilot may be secondary.
- Work one phase at a time and do not modify GitHub remotely without explicit instruction.

### Not yet confirmed

- Official NEU percentage-to-grade threshold values.
- Whether conversion-table ownership is per student or centrally managed.
- Whether changing conversion thresholds recalculates historical semesters or preserves old versions.
- Whether Schedule includes Saturday.
- Detailed Register, Forgot Password, Settings, GWA, and Target Calculator screen designs.
- Target Grade Calculator assumptions.
- Dropped/withdrawn subject treatment in GWA.
- Schedule overlap behavior.
- Category deletion behavior when activities already exist.
- Exact Firestore document/collection layout.

**Current instruction:** The Phase 0 documentation audit is complete and no open decision blocks Phase 1. Do not start a new phase or mark one complete without user instruction; Phase 1 is the recommended next task.
