# NEUming — Grading and GWA Rules

**Status:** Calculation rules are finalized and implemented in `src/lib/grading/` with automated tests. The official NEU percentage-to-grade threshold values still require verification and are not approved for hard-coding; no production conversion defaults exist.
**Source of truth:** Consolidated grading and GWA rules for the NEUming rebuild. Derived from the original master brief (Part 4), which has since been removed at the user's request. This file is now the reference for grading behavior.

> This section is authoritative. All screens and features must call the same reusable grading logic. UI components must not implement their own formulas.

---

## 1. Core decisions already confirmed

- Every subject has its own grading categories and category weights.
- Active category weights must total exactly 100% before the grading configuration can be saved or used.
- A subject has no computed grade until every active grading category has at least one recorded activity score.
- There is one **global percentage-to-grade conversion table shared by all subjects**. There are no subject-specific conversion tables.
- Semester GWA is weighted by subject units.
- GWA displays **GWA Pending** until every active subject in that semester has a computed grade.
- Computations keep full precision internally. Rounding is for display only.

## 2. Subject configuration

Every subject stores:

- Subject name — required.
- Units — required and greater than zero. Decimal units are allowed.
- Professor — optional text.
- Grading categories — at least one active category.
- Category weight — a positive percentage for every active category.

The sum of active category weights must equal exactly 100%, allowing only a tiny numeric tolerance for floating-point representation. Show the current total in the UI and explain whether it is below or above 100%.

A grading configuration that does not total 100% cannot be saved or used for grade calculation.

## 3. Activity fields and validation

Each activity belongs to exactly one category and stores:

- Activity name (for example, Quiz 1, Midterm, Project 1).
- Category ID.
- Score earned.
- Total possible points.
- Activity date.

Validation rules:

- Earned score must be a finite number greater than or equal to zero.
- Total possible points must be a finite number greater than zero.
- Earned score cannot exceed total possible points in v1.
- Decimal scores are allowed.
- A recorded score of `0` is valid and counts as a recorded score.
- An activity that has not been recorded is not automatically treated as zero.
- Editing or deleting an activity recalculates its category, subject percentage/grade, and semester GWA state/value.

## 4. Category average

Use a points-weighted average within each category:

`categoryAverage = sum(scoreEarned) / sum(totalPossible) * 100`

Do not use a simple average of the individual activity percentages.

Example:

| Activity | Score |
|---|---:|
| Quiz 1 | 18 / 20 |
| Quiz 2 | 40 / 50 |
| **Total** | **58 / 70** |

`categoryAverage = 58 / 70 * 100 = 82.857142...%`

If an active category has no recorded activity, that category is incomplete and the subject is `No Grade Yet`.

## 5. Subject percentage

For a complete subject, multiply each category average by its category weight expressed as a decimal, then add the contributions:

`subjectPercentage = sum(categoryAverage * (categoryWeight / 100))`

Example:

| Category | Average | Weight | Contribution |
|---|---:|---:|---:|
| Quizzes | 82.857142...% | 20% | 16.571428... |
| Exams | 92% | 40% | 36.8 |
| Projects | 90% | 30% | 27 |
| Attendance | 100% | 10% | 10 |
| **Total** | | **100%** | **90.371428...%** |

The exact value remains full precision internally. The UI may display two decimal places (for example, `90.37%`). Do not round it to a whole number before grade conversion.

A subject is `No Grade Yet` if any active category has no recorded activity or if the grading weights are invalid. A recorded zero is still a completed category.

## 6. One global percentage-to-grade conversion table

There is exactly one conversion table shared by all subjects for the applicable global scope. Every subject uses the same table.

The table must:

- Map percentage thresholds to numerical grades on the NEU 1.0–5.0 scale.
- Cover the complete percentage range from 0% through 100%.
- Have unique, non-overlapping threshold start values.
- Contain only valid percentage boundaries in the 0–100 range.
- Be ordered by minimum percentage, highest to lowest, for evaluation.
- Use inclusive minimum thresholds: choose the row with the highest `minimumPercentage` that is less than or equal to the exact subject percentage.
- Be validated before saving; invalid or incomplete coverage prevents conversion.

Suggested data shape (illustrative only):

```js
[
  { minimumPercentage: 98, grade: 1.0 },
  { minimumPercentage: 95, grade: 1.25 },
  // Remaining verified thresholds...
  { minimumPercentage: 0, grade: 5.0 }
]
```

**Do not treat these example numbers as the official NEU conversion table.** The actual NEU thresholds and grade steps must be checked against a current official NEU document or confirmed by the user. Do not copy the old repository's conversion values as official by default.

### Conversion-table ownership still needs a data decision

Confirmed: one table is shared by all subjects.
Not yet confirmed: whether the table is configurable per student account or centrally managed across all NEUming accounts.

The Settings proposal assumes the table can be managed in a settings area, but the coding agent must not decide its ownership scope or permissions without user approval.

Changing the global table may change every affected subject grade and the semester GWA. The UI should clearly warn the user before saving a change.

It is also unresolved whether a conversion-table edit should recalculate historical semesters or preserve a historical snapshot/version. Do not silently choose either behavior.

## 7. Semester GWA

Use a units-weighted average:

`GWA = sum(subjectGrade * subjectUnits) / sum(subjectUnits)`

Rules:

- Calculate GWA separately for each semester.
- Include every active subject configured in that semester.
- Use exact numerical subject grades returned by the global conversion table.
- Do not round subject grades or intermediate products before computing GWA.
- Display the final GWA rounded to two decimal places.
- If any active subject has `No Grade Yet`, display `GWA Pending` instead of a partial GWA.
- If a semester has no subjects, show an empty state such as `Add subjects to calculate your GWA`; do not show zero.

Example:

| Subject | Grade | Units | Grade × Units |
|---|---:|---:|---:|
| Math | 1.75 | 3 | 5.25 |
| English | 2.25 | 3 | 6.75 |
| Science | 1.50 | 4 | 6.00 |
| **Total** | | **10** | **18.00** |

`GWA = 18.00 / 10 = 1.80`

## 8. Target percentage calculator

Phase 9 supports a **percentage target only**. Grade targets (1.0–5.0) wait for the approved conversion table in Phase 10.

Input: a target percentage `T` that is finite and satisfies `0 <= T <= 100`.

Assumptions:

- Every unscored active category is treated as one remaining-weight bucket.
- The remaining work is scored as a single average. No per-activity or per-category split is assumed.
- Categories that already have scores keep their current averages.
- A category with any activity, including a recorded zero, counts as scored.
- Inactive categories are ignored.
- The calculator is read-only and never changes a saved score.

Definitions:

- `P` is the current subject percentage from scored categories only, using the same weighted category averages as Section 4.
- `R` is the total weight, in percentage points, of active categories with no activities.
- Scored weight is `100 - R`.

Required average on the remaining work:

`required = ((T - P) / R) * 100` when `R > 0`.

Results:

- `invalid-target` when `T` is not finite or is outside `0–100`.
- `blocked` when the subject has no active categories, active weights do not total 100%, or an active activity is invalid.
- `reached` when `P >= T` within tolerance, including when `R = 0`.
- `unreachable` when `R = 0` and `P < T`, or when `required > 100` within tolerance.
- `required` otherwise. A required average of exactly 100% is reachable.

Display the current percentage, remaining weight, and required average to two decimal places. Do not round intermediate values.

Examples:

| Case | Values | Result |
|---|---|---|
| Partial remaining weight | Quizzes 20% scored at 90%, Final 80% unscored, target 85% | `P = 18`, `R = 80`, required `83.75%` |
| Target already reached | Same subject, target 15% | `P = 18 >= 15` → reached |
| No remaining weight | Quizzes 50% scored at 80%, Final 50% scored at 70%, target 80% | `P = 75`, `R = 0` → unreachable |
| All unscored | Target 90% | required `90%` |
| Required above 100 | `P = 45`, `R = 10`, target 60% | required `150%` → unreachable |

## 9. Recalculation triggers

Recalculate affected values whenever any of the following changes:

- Activity added, edited, or deleted.
- Category added, edited, removed, or weight changed.
- Subject units changed.
- Global percentage-to-grade conversion table changed.

Home, Subjects, GWA, and Target Grade Calculator must use the same reusable grading functions. Do not duplicate formulas inside page components.

## 10. Required grading test cases

| Case | Input / condition | Expected result |
|---|---|---|
| Weighted category average | Activities are 18/20 and 40/50 | 82.857142...% |
| Missing category score | At least one active category has no activities | Subject shows `No Grade Yet` |
| Recorded zero | A category has an activity scored 0/10 | Category is complete; average is 0% |
| Invalid maximum | Activity has 10/0 | Reject validation |
| Score above maximum | Activity has 11/10 | Reject validation in v1 |
| Invalid weights | Active category weights total 90% or 110% | Reject configuration |
| Exact threshold | Subject percentage equals a conversion threshold | Use the grade on that threshold row |
| Between thresholds | Percentage falls between two threshold starts | Use the row with the next lower minimum threshold |
| Incomplete semester | One active subject has no computed grade | GWA is `GWA Pending` |
| Unit-weighted GWA | Grades 1.75 (3 units), 2.25 (3 units), 1.50 (4 units) | GWA = 1.80 |
| Display rounding | Exact GWA is 1.804... | Display 1.80; retain exact value internally |
| Target with remaining weight | `P = 18`, `R = 80`, target 85% | Required 83.75% |
| Target already reached | `P = 18`, `R = 80`, target 15% | Reached |
| No remaining weight | `R = 0`, `P = 75`, target 80% | Unreachable |
| Required above 100 | `P = 45`, `R = 10`, target 60% | Unreachable at 150% |
| Invalid target | Target 101% | Invalid target |

## 11. Out of scope / unresolved grading behaviors

Do not invent behavior for these cases:

- Grade targets (1.0–5.0) in the Target Grade Calculator; percentage targets are specified in Section 8 and grade targets wait for the approved conversion table.
- Withdrawn/dropped subjects and whether they are excluded from GWA.
- Special subject treatment, if any, in the official NEU GWA calculation.
- Historical conversion-table versioning and whether past semesters retain earlier mappings.
- Category deletion when there are already activities assigned to it.
- Whether scores above the total points should ever be allowed as bonus points in a future version. In v1 they are rejected.
