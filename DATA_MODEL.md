# NEUron — Data Model

**Status:** Logical entities and relationships are identified. The storage target is Cloudflare D1, and the `neuron` database is created and bound as `DB`. Auth is defined in `migrations/0001_auth.sql` and `migrations/0002_add_username.sql`; academic structure is defined in `migrations/0003_academic_structure.sql`; activities are defined in `migrations/0004_activities.sql`. Auth and academic structure are applied locally and remotely, and the Phase 3 API and setup UI are deployed. Migration `0004` is implemented locally but not applied remotely. Schedule and conversion-table schema and global conversion-table ownership still need review before implementation.
**Source of truth:** Consolidated data model for the NEUron rebuild. Derived from the original master brief (Part 6 and relevant rules from Parts 1 and 4), which has since been removed at the user's request. This file is now the reference for entities, relationships, and data decisions.

> Add remaining D1 tables and migrations only after reviewing the current `neuron` schema and confirming the unresolved decisions with the user. Do not choose a schema that makes unresolved decisions difficult to change.

---

## 1. Account and isolation context

- Primary user: an individual NEU student monitoring their own academic records.
- Each student signs in using a personal account.
- A student's semesters, subjects, scores, and schedule must be associated with the authenticated user account.
- Data from one student must never be readable or writable by another student.
- The application is not an admin/teacher grade-entry portal in the current scope.
- D1 is not reachable from the browser. All reads and writes go through the Cloudflare Worker, which enforces ownership.

## 2. Entities

### 2.1 User

- `id` — UUID primary key and ownership key for all student data.
- `username` — unique, case-insensitive, normalized to lowercase; 3-32 characters using letters, numbers, dots, underscores, or hyphens; usable as a login identifier.
- `email` — unique, case-insensitive, normalized to lowercase; any valid email domain.
- `display_name` — trimmed display name, 1-80 characters.
- `password_hash` — encoded PBKDF2-HMAC-SHA256 hash: `pbkdf2-sha256$iterations$salt$hash`.
- `created_at`, `updated_at` — ISO timestamps.
- User preferences only when their behavior has been specified.

Accounts are provisioned manually by the owner. There is no public registration endpoint or Register screen. Each account is separate and owns its own student data; D1 does not need to be resized for the current single-user scope. Login accepts either `username` or `email`.

Do not store plaintext passwords. The current custom provider stores only the encoded PBKDF2 hash with a per-user random salt. The baseline is 10,000 iterations, chosen by the user to fit the Workers Free CPU budget; this is below common OWASP guidance, so add login rate limiting and revisit the cost if the plan changes. Changing the iteration count requires a documented migration or rehash-on-login strategy.

### 2.2 Session

- `id` — UUID primary key.
- `user_id` — foreign key to `users.id` with cascade delete.
- `token_hash` — SHA-256 hash of the random session token; the raw token exists only in the browser cookie.
- `created_at`, `expires_at` — ISO timestamps; baseline lifetime is 7 days.
- Indexed by `token_hash`, `user_id`, and `expires_at`.

The session cookie is `neuron_session`, `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and `Path=/`. Signing out deletes the session row and clears the cookie. Password reset deletes all sessions for the user.

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
- Active/inactive status, if needed for semester management.
- Sort order, if needed for display.

Each subject belongs to one semester and has its own grading categories and activities.

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

### 2.8 Class Meeting / Schedule Entry

- Schedule entry ID.
- Related subject ID, where applicable.
- Day or days of the week.
- Start time.
- End time.
- Room/location (optional text).
- Created/updated timestamps.

The day range and overlap rules are not yet finalized. A recurring class may meet on multiple days; confirm the desired shape before implementation.

### 2.9 Percentage-to-Grade Conversion Table

- A list of minimum percentage thresholds and corresponding numerical grades.
- One table is shared by every subject within its confirmed ownership scope.
- Validation and historical-version behavior follow `GRADING_RULES.md`.

The ownership scope — per user or central application-wide — is unresolved. Do not choose a table layout that makes this decision difficult to change without documenting the tradeoff.

## 3. Relationship summary

- One authenticated user owns multiple semesters.
- One semester contains multiple subjects and schedule entries.
- One subject has multiple grading categories and activities.
- Each activity belongs to exactly one category.
- One applicable global conversion table is used to convert every complete subject percentage.
- Semester GWA is computed from all active subjects in that semester and their units.

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
- Use same-origin checks for state-changing auth requests in addition to `SameSite=Lax` cookies.
- Auth rate limiting and account lockout are not implemented yet; add Cloudflare rate limiting or equivalent before production if brute-force protection is required.
- Manual provisioning relies on the owner-supplied email and does not prove ownership of the mailbox. Add email verification if that risk must be closed.

## 5. Unresolved data decisions

These must be resolved with the user before the dependent implementation work:

| Decision | Current status | Needed before |
|---|---|---|
| D1 database and binding | `neuron` created in APAC and bound as `DB`; `0001_auth.sql` and `0002_add_username.sql` are applied locally and remotely; `0003_academic_structure.sql` is applied locally and remotely; `0004_activities.sql` is implemented locally | Resolved for Phase 3; Phase 5 remote application pending |
| Exact D1/SQL schema and migrations | Auth, academic-structure, and activity schemas are defined; schedule and conversion tables are still undefined | Phase 4+ / data-model approval |
| Authentication provider and stable user ID | Resolved: custom email/password with UUID user IDs and D1 sessions | Resolved |
| Password hashing and session lifetime | Resolved baseline: PBKDF2-HMAC-SHA256 at 10,000 iterations; 7-day sessions; 1-hour reset tokens | Resolved |
| Workers plan and hashing CPU cost | Lower-iteration path chosen for Workers Free; production login succeeded with 10,000 iterations. Add rate limiting before relying on it for real accounts | Resolved for Phase 2; rate limiting remains a hardening task |
| Account provisioning | Resolved: no public registration; the owner creates separate accounts manually with `npm run cf:account:create`. Any valid email domain is allowed, and login accepts username or email | Resolved |
| Resend account and sender | API key and verified `AUTH_EMAIL_FROM` are not configured | Before password-reset production test |
| Auth rate limiting / email ownership verification | Not specified or implemented | Before hardening / production if required |
| Conversion table ownership | One shared table across subjects is confirmed; whether per account or central across users is not | Phase 10 / data-model approval |
| Historical conversion table changes | Recalculate past semesters or preserve prior table version is undecided | Phase 10 |
| Dropped/withdrawn subjects | Whether/how excluded from GWA is undecided | Phase 8 / Phase 10 |
| Schedule day range | `DESIGN.md` does not specify the day range; the old README says Monday–Saturday | Phase 7 |
| Schedule overlap behavior | Not finalized | Phase 7 |
| Category deletion with existing activities | Not finalized | Phase 3 / Phase 6 |
| Categories/activities: separate tables vs JSON columns | Not decided | Data-model approval / Phase 3 |
| Cached computed values vs always-derived grades | Not decided | Data-model approval / Phase 4 |
