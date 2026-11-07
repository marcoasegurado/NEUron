# NEUron — Data Model

**Status:** Logical entities and relationships are identified. The storage target is Cloudflare D1, and the `neuron` database is created and bound as `DB`. Exact SQL schema/migrations and global conversion-table ownership still need review before implementation.
**Source of truth:** Consolidated data model for the NEUron rebuild. Derived from the original master brief (Part 6 and relevant rules from Parts 1 and 4), which has since been removed at the user's request. This file is now the reference for entities, relationships, and data decisions.

> Turn this into concrete D1 tables and migrations only after reviewing the current `neuron` schema and confirming the unresolved decisions with the user. Do not choose a schema that makes unresolved decisions difficult to change.

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

- Authenticated user ID — primary identity. The authentication provider is still undecided; its stable user identifier is the owner key.
- Display name.
- Email address.
- Created/updated timestamps.
- User preferences only when their behavior has been specified.

Do not store plaintext passwords. Credentials belong to the approved authentication provider. If a custom provider is chosen, store only an approved password hash and document the algorithm.

### 2.2 Semester

- Semester ID.
- Academic year (for example, `2026–2027`).
- Term (for example, `1st Semester`, `2nd Semester`, `Summer`).
- Display label (for example, `1st Sem 2026–27`).
- Status/active marker, if needed.
- Created/updated timestamps.

A user can have multiple semesters. Historical semesters must remain separated and accessible.

### 2.3 Subject

- Subject ID.
- Subject name.
- Units (number greater than zero; decimal values are allowed).
- Professor (optional).
- Active/inactive status, if needed for semester management.
- Sort order, if needed for display.

Each subject belongs to one semester and has its own grading categories and activities.

### 2.4 Grading Category

- Category ID.
- Category name (for example, Quizzes, Exams, Projects, Attendance, or custom names).
- Weight percentage.
- Active status, if needed.
- Sort order.

Each category belongs to one subject. Active category weights for that subject must total 100%.

### 2.5 Activity / Score

- Activity ID.
- Activity name.
- Category ID.
- Earned score.
- Total possible points.
- Activity date.
- Created/updated timestamps.

Each activity belongs to one subject and one category. Preserve the parent relationship so access rules can validate ownership.

### 2.6 Class Meeting / Schedule Entry

- Schedule entry ID.
- Related subject ID, where applicable.
- Day or days of the week.
- Start time.
- End time.
- Room/location (optional text).
- Created/updated timestamps.

The day range and overlap rules are not yet finalized. A recurring class may meet on multiple days; confirm the desired shape before implementation.

### 2.7 Percentage-to-Grade Conversion Table

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

## 5. Unresolved data decisions

These must be resolved with the user before the dependent implementation work:

| Decision | Current status | Needed before |
|---|---|---|
| D1 database and binding | `neuron` created in APAC and bound as `DB`; it currently has no application tables | Phase 1 / Phase 3 |
| Exact D1/SQL schema and migrations | Not defined | Phase 3 / data-model approval (not needed for the Phase 1 binding) |
| Authentication provider and stable user ID | Firebase removed; no replacement chosen | Phase 2 |
| Conversion table ownership | One shared table across subjects is confirmed; whether per account or central across users is not | Phase 10 / data-model approval |
| Historical conversion table changes | Recalculate past semesters or preserve prior table version is undecided | Phase 10 |
| Dropped/withdrawn subjects | Whether/how excluded from GWA is undecided | Phase 8 / Phase 10 |
| Schedule day range | `DESIGN.md` does not specify the day range; the old README says Monday–Saturday | Phase 7 |
| Schedule overlap behavior | Not finalized | Phase 7 |
| Category deletion with existing activities | Not finalized | Phase 3 / Phase 6 |
| Categories/activities: separate tables vs JSON columns | Not decided | Data-model approval / Phase 3 |
| Cached computed values vs always-derived grades | Not decided | Data-model approval / Phase 4 |
