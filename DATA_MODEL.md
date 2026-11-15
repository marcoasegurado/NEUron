# NEUming — Data Model

**Status:** Logical entities and relationships are identified. The storage target is Cloudflare D1, and the `neuron` database is created and bound as `DB`. Auth is defined in `migrations/0001_auth.sql` and `migrations/0002_add_username.sql`; academic structure is defined in `migrations/0003_academic_structure.sql`; activities are defined in `migrations/0004_activities.sql`; schedules are defined in `migrations/0005_schedule.sql`; the central conversion table and subject dropped-status column are defined in `migrations/0006_conversion_and_subject_status.sql`; account status, roles, and the single-demo constraint are defined in `migrations/0007_accounts_and_roles.sql`. Auth, academic structure, activities, and schedules are applied locally and remotely; `0006` is applied remotely only (local application needs workerd, which requires macOS 13.5+). `0007` is applied to local D1 and is pending remote application. The Phase 3, Phase 5, and Phase 6 APIs are deployed, Phase 7 is deployed as version `e0dfb7d1-ddd0-46c3-a56b-c2a4f588e47b`, Phase 9 is deployed as `e1fe0b8f-3387-40d9-8eba-45f7eb71e4a7`, and Phase 10 is deployed as `d5957195-c327-4e5d-9751-7706e3cd6860`. Conversion-table ownership and historical behavior are resolved in Phase 10; the threshold values themselves remain unapproved. Self-registration with owner approval and the shared demo account are resolved in Phase 13.
**Source of truth:** Consolidated data model for the NEUming rebuild. Derived from the original master brief (Part 6 and relevant rules from Parts 1 and 4), which has since been removed at the user's request. This file is now the reference for entities, relationships, and data decisions.

> Add remaining D1 tables and migrations only after reviewing the current `neuron` schema and confirming the unresolved decisions with the user. Do not choose a schema that makes unresolved decisions difficult to change.

---

## 1. Account and isolation context

- Primary user: an individual NEU student monitoring their own academic records.
- Each student signs in using a personal account, or explores a single shared demo account.
- A student's semesters, subjects, scores, and schedule must be associated with the authenticated user account.
- Data from one student must never be readable or writable by another student. The demo account is a deliberate exception: it is one shared account whose sample data every visitor may edit.
- The owner is a normal account with `role = 'owner'` and can approve or reject pending registrations. The owner cannot read another student's academic records.
- The application is not an admin/teacher grade-entry portal in the current scope.
- D1 is not reachable from the browser. All reads and writes go through the Cloudflare Worker, which enforces ownership.

## 2. Entities

### 2.1 User

- `id` — UUID primary key and ownership key for all student data.
- `username` — unique, case-insensitive, normalized to lowercase; 3-32 characters using letters, numbers, dots, underscores, or hyphens; usable as a login identifier.
- `email` — unique, case-insensitive, normalized to lowercase; any valid email domain.
- `display_name` — trimmed display name, 1-80 characters.
- `password_hash` — encoded PBKDF2-HMAC-SHA256 hash: `pbkdf2-sha256$iterations$salt$hash`.
- `status` — `active`, `pending`, or `rejected` (Phase 13). Defaults to `active`. Only active accounts can sign in; `pending` accounts are waiting for the owner, and `rejected` accounts are kept so the same email or username is not silently reusable.
- `role` — `student` or `owner` (Phase 13). Defaults to `student`. `owner` unlocks the account-administration API and the Settings `Account requests` card.
- `is_demo` — `0` or `1` (Phase 13). Defaults to `0`; a partial unique index allows exactly one `1`.
- `created_at`, `updated_at` — ISO timestamps.
- User preferences only when their behavior has been specified.

Accounts are created in one of three ways (Phase 13):

- **Self-registration** — `POST /api/auth/register` creates a `pending` student with no session. The visitor cannot sign in until the owner approves.
- **Owner approval** — the owner calls `POST /api/admin/accounts/:id/approve` or `/reject` from the Settings card. Approving sets `active`; rejecting sets `rejected`.
- **Manual provisioning** — the owner still uses `npm run cf:account:create` to create an already-active student directly.

Each account is separate and owns its own student data; D1 does not need to be resized for the current single-user scope. Login accepts either `username` or `email`. The owner role is granted only by `npm run cf:account:promote`, never by the app.

Do not store plaintext passwords. The current custom provider stores only the encoded PBKDF2 hash with a per-user random salt. The baseline is 10,000 iterations, chosen by the user to fit the Workers Free CPU budget; this is below common OWASP guidance, so add login rate limiting and revisit the cost if the plan changes. Changing the iteration count requires a documented migration or rehash-on-login strategy.

**Shared demo account (Phase 13).** Exactly one row may have `is_demo = 1`, enforced by a partial unique index on `users (is_demo) WHERE is_demo = 1`. The demo is an ordinary `active`, `student` account that owns its own sample semester, subjects, scores, and classes. `POST /api/auth/demo` looks up that row and opens a normal session; no password is stored for public use and none is exposed. `npm run cf:demo:reset` (`scripts/seed-demo.mjs`) deletes and recreates the demo account, its sample semester (1 semester, 4 subjects, 15 scores, 7 class meetings), and its sessions in one ordered statement file. The demo row is excluded from every admin listing and cannot be promoted or approved.

**Registration and approval lifecycle (Phase 13).**

1. `POST /api/auth/register` validates and normalizes the display name, username, email, and password, rejects an existing email or username with `409`, and inserts a `pending` student. It returns `201` with a message and sets no session cookie.
2. Login checks the password first, then the status: `pending` returns `403` with `Your account is waiting for owner approval.` and `rejected` returns `403` with `This account was not approved. Contact the NEUming owner.` Checking status after the password keeps the response from revealing whether an identifier exists.
3. `GET /api/admin/accounts` lists `pending` students for the owner. `POST /api/admin/accounts/:id/approve` and `/reject` require `role = 'owner'`, reject the demo row, return `404` for an unknown or already-decided request, and delete any sessions on rejection.
4. `getSessionUser` joins only `users.status = 'active'`, so a session for a non-active account is treated as signed out on the next request.

Public registration and the demo endpoint have no rate limiting yet; see §5.

### 2.2 Session

- `id` — UUID primary key.
- `user_id` — foreign key to `users.id` with cascade delete.
- `token_hash` — SHA-256 hash of the random session token; the raw token exists only in the browser cookie.
- `created_at`, `expires_at` — ISO timestamps; baseline lifetime is 7 days.
- Indexed by `token_hash`, `user_id`, and `expires_at`.

The session cookie is `neuron_session`, `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and `Path=/`. Signing out deletes the session row and clears the cookie. Password reset deletes all sessions for the user. Session reads join `users` with `status = 'active'`, so a pending or rejected account cannot use an existing session.

### 2.3 Password reset token

- `id` — UUID primary key.
- `user_id` — foreign key to `users.id` with cascade delete.
- `token_hash` — SHA-256 hash of the emailed reset token; raw tokens are never stored.
- `created_at`, `expires_at` — ISO timestamps; baseline lifetime is 1 hour.
- `used_at` — nullable audit field; tokens are deleted after a successful reset.
- Indexed by `token_hash`, `user_id`, and `expires_at`.

Requesting a new reset link deletes the user's previous reset tokens. Reset links are single-use, and a successful reset ends all existing sessions.

### 2.4 Semester

- Semester ID.
- Academic year (for example, `2026–2027`).
- Term (for example, `1st Semester`, `2nd Semester`, `Summer`).
- Display label (for example, `1st Sem 2026–27`).
- Status/active marker; at most one active semester per user.
- Created/updated timestamps.

A user can have multiple semesters. Historical semesters must remain separated and accessible. The same academic-year/term pair is unique per user.

### 2.5 Subject

- Subject ID.
- Subject name.
- Units (number greater than zero; decimal values are allowed).
- Professor (optional).
- Dropped marker (`is_active = 0` means dropped/withdrawn; default `1`).
- Sort order, if needed for display.

Each subject belongs to one semester and has its own grading categories and activities. A dropped subject keeps its rows and scores but contributes no units and no grade to the semester GWA (`GRADING_RULES.md` §7).

### 2.6 Grading Category

- Category ID.
- Category name (for example, Quizzes, Exams, Projects, Attendance, or custom names).
- Weight percentage; decimal values are allowed.
- Active status.
- Sort order.

Each category belongs to one subject. Active category weights for that subject must total 100%.

### 2.7 Activity / Score

- Activity ID.
- Activity name.
- Category ID.
- Earned score.
- Total possible points.
- Activity date.
- Created/updated timestamps.

Each activity belongs to one category, and ownership is validated through category → subject → semester → user. Preserve the parent relationship so access rules can validate ownership.

**Implemented (Phase 5):** `activities` stores `id`, `category_id`, `name`, `score_earned`, `total_points`, `activity_date`, and created/updated timestamps. Checks enforce `score_earned >= 0`, `total_points > 0`, and `score_earned <= total_points`; the category foreign key cascades on delete. The API defaults an omitted date to today and only accepts active categories. Subject percentages and pending states are derived on every read rather than cached.

**Implemented (Phase 6):** `PATCH /api/activities/:id` updates only `name`, `score_earned`, `total_points`, and `activity_date`; the parent category cannot be changed. `DELETE /api/activities/:id` removes the activity. Both endpoints validate ownership through activity → category → subject → semester → user and return `404` when the activity is not owned. Reads continue to derive category and subject percentages on every request, so no cached totals need invalidation after edits or deletes.

### 2.8 Class Meeting / Schedule Entry

- Schedule entry ID.
- Semester ID, so a schedule read is scoped to one semester.
- Required subject ID from that same semester.
- Day of the week: `1`–`6` for Monday–Saturday.
- Start time and end time stored as `HH:MM` (`00:00`–`23:59`); the end time must be later than the start time.
- Room/location (optional text, up to 120 characters).
- Created/updated timestamps.

One record represents one meeting. A class that meets Monday, Wednesday, and Friday becomes three entries and is edited or deleted one meeting at a time.

**Implemented (Phase 7):** `migrations/0005_schedule.sql` creates `class_schedules` with `id`, `semester_id`, `subject_id`, `day_of_week`, `start_time`, `end_time`, `room`, and created/updated timestamps. Checks enforce `day_of_week BETWEEN 1 AND 6` and `start_time < end_time`. `semester_id` and `subject_id` cascade on delete so removing a semester or subject cannot leave orphan classes, and indexes cover `(semester_id, day_of_week, start_time)` and `subject_id`. `src/server/schedule.ts` enforces ownership through semester → user and verifies that the subject belongs to the same semester before a write. `src/server/schedule-validation.ts` rejects malformed times and inverted ranges and normalizes a blank room to `null`.

**Overlap policy (confirmed):** overlaps are stored normally, not rejected. Conflict detection is derived on read: two entries conflict when they share `day_of_week` and their time ranges intersect (`a.start < b.end` and `b.start < a.end`). Both views and the editor surface the conflicting subject names, but no database constraint or Worker rejection blocks the save. Nothing is cached, so editing or deleting an entry immediately changes the conflict set on the next read.

### 2.9 Percentage-to-Grade Conversion Table

- A list of minimum percentage thresholds and corresponding numerical grades.
- One table is shared by every subject and every account (resolved in Phase 10), stored as one application-wide row set with no `user_id` and no `semester_id`.
- Read-only to students; created and changed only by owner tooling (migration or script).
- Validation and historical behavior follow `GRADING_RULES.md` §6.

Planned schema (`migrations/0006_conversion_and_subject_status.sql`), applied to remote D1 on 2026-11-11:

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key |
| `minimum_percentage` | REAL | Unique, `>= 0` and `<= 100`; one row must be `0` |
| `grade` | REAL | `>= 1.0` and `<= 5.0` |
| `created_at` | TEXT | Not null |
| `updated_at` | TEXT | Not null |

No snapshot/version table exists: one live table drives every semester, so a change recalculates past results (resolved in Phase 10).

## 3. Relationship summary

- One authenticated user owns multiple semesters.
- One semester contains multiple subjects and schedule entries.
- One subject has multiple grading categories and activities.
- Each activity belongs to exactly one category.
- One applicable global conversion table is used to convert every complete subject percentage.
- Semester GWA is computed from all active subjects in that semester and their units.
- Exactly one user row may be the shared demo account; it owns data like any other student.
- Owner-role accounts can read and decide pending account requests; students and the demo cannot.

## 4. Cloudflare D1 design and security requirements

When designing concrete tables and migrations:

- Ensure every student record is scoped to the authenticated user's stable ID, unless a specific centrally managed read-only configuration is approved.
- Enforce ownership inside Worker on every request; hiding UI elements is not security.
- Validate user ownership and parent-child relationships (semester → subject → category → activity) before writing or reading.
- Use parameterized SQL only; never interpolate user input into query strings.
- Avoid unbounded JSON blobs for activity history; normalize records so updates stay small and queryable.
- Define primary keys, foreign keys, indexes, timestamps, and a migration/versioning strategy.
- Review the existing D1 database before adding or changing tables; do not assume it is empty.
- Do not store calculated values as a second source of truth unless there is a clear reason. Prefer deriving grades from validated source records; if cached values are used, define how they stay consistent.
- Never put Cloudflare API tokens, D1 credentials, session secrets, or privileged data in client-readable code or responses.
- Store only hashes of session and password-reset tokens; never store or log raw tokens.
- Normalize and validate emails and usernames before lookup or insert; enforce uniqueness in the Worker and D1 indexes.
- Use same-origin checks for state-changing auth requests in addition to `SameSite=Lax` cookies. Registration, demo login, and admin decisions all call `assertSameOrigin`.
- Enforce `role = 'owner'` in the Worker for every admin route; the Settings card is a convenience, not a security boundary. The shared demo row is excluded from admin listings and decisions.
- Auth rate limiting and account lockout are not implemented yet; add Cloudflare rate limiting or equivalent before production if brute-force protection is required.
- Public registration and the demo endpoint are not rate limited yet. A visitor can submit repeated registration requests or open repeated demo sessions; add rate limiting or a Cloudflare Turnstile-style challenge before a public launch.
- Manual provisioning relies on the owner-supplied email and does not prove ownership of the mailbox. Add email verification if that risk must be closed.

## 5. Unresolved data decisions

These must be resolved with the user before the dependent implementation work:

| Decision | Current status | Needed before |
|---|---|---|
| D1 database and binding | `neuron` created in APAC and bound as `DB`; `0001_auth.sql` through `0005_schedule.sql` are applied locally and remotely; `0006_conversion_and_subject_status.sql` is applied remotely (local application blocked by workerd on macOS 12.6); `0007_accounts_and_roles.sql` is applied locally and pending remote application | Resolved locally for Phase 13; remote apply at the deploy gate |
| Exact D1/SQL schema and migrations | Auth, academic-structure, activity, and schedule schemas are defined in `0001`–`0005`; the conversion table and subject dropped-status column are defined in `0006`; account status, role, and `is_demo` are defined in `0007` | Resolved for Phase 13 |
| Authentication provider and stable user ID | Resolved: custom email/password with UUID user IDs and D1 sessions | Resolved |
| Password hashing and session lifetime | Resolved baseline: PBKDF2-HMAC-SHA256 at 10,000 iterations; 7-day sessions; 1-hour reset tokens | Resolved |
| Workers plan and hashing CPU cost | Lower-iteration path chosen for Workers Free; production login succeeded with 10,000 iterations. Add rate limiting before relying on it for real accounts | Resolved for Phase 2; rate limiting remains a hardening task |
| Account provisioning | Resolved (Phase 13): self-registration creates a `pending` account that the owner approves in Settings; `npm run cf:account:create` remains for manual active provisioning; `npm run cf:account:promote` grants the owner role | Resolved (Phase 13) |
| Shared demo account | Resolved (Phase 13): one writable `is_demo = 1` account, no exposed password, one-click `POST /api/auth/demo`, reset with `npm run cf:demo:reset` | Resolved (Phase 13) |
| Approval/rejection notification email | Not implemented; Resend is unconfigured, so the owner and applicant are not emailed | Optional before public launch |
| Resend account and sender | API key and verified `AUTH_EMAIL_FROM` are not configured | Before password-reset production test |
| Auth rate limiting / email ownership verification | Not specified or implemented; registration and demo are public and unthrottled | Before hardening / public launch |
| Conversion table ownership | Resolved: one application-wide table read by every account, read-only to students, changed only by owner tooling | Resolved (Phase 10) |
| Historical conversion table changes | Resolved: one live table with no snapshot; changes recalculate past semesters too | Resolved (Phase 10) |
| Dropped/withdrawn subjects | Resolved: `subjects.is_active = 0` means dropped; excluded from GWA units and grades, scores stay visible | Resolved (Phase 10) |
| Schedule day range | Resolved: Monday–Saturday, stored as `day_of_week` `1`–`6` | Resolved |
| Schedule overlap behavior | Resolved: overlaps are saved and flagged; no blocking constraint | Resolved |
| Multi-day class storage | Resolved: one `class_schedules` row per meeting day | Resolved |
| Schedule subject link | Resolved: `subject_id` is required and must belong to the same semester | Resolved |
| Category deletion with existing activities | Not finalized | Phase 3 / Phase 6 |
| Categories/activities: separate tables vs JSON columns | Not decided | Data-model approval / Phase 3 |
| Cached computed values vs always-derived grades | Not decided | Data-model approval / Phase 4 |
