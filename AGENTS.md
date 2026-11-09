# NEUming — Coding Agent Operating Rules

**Source of truth:** Consolidated coding-agent operating rules for the NEUming rebuild. Derived from the original master brief (Part 9), which has since been removed at the user's request.

> These rules apply to OpenCode, DeepSeek, GitHub Copilot, and any other coding agent working on NEUming.

---

## 1. First task: documentation organization

When starting from a combined master brief, the first task is **documentation organization only**.

Create these files at the project root:

- `PLAN.md` — project purpose, scope, phase order, task checklists, and Done When criteria. Source: Parts 1, 2, 5, 7, and 8.
- `DESIGN.md` — approved design direction, design tokens, responsive behavior, screen inventories, states, and missing design work. Source: Part 3 and relevant product context.
- `GRADING_RULES.md` — all finalized grading/GWA rules, formulas, conversion-table requirements, examples, tests, and unresolved grading behavior. Source: Part 4.
- `DATA_MODEL.md` — logical entities, relationships, Cloudflare D1 design constraints, ownership, and unresolved data decisions. Source: Part 6 and relevant rules from Parts 1 and 4.
- `AGENTS.md` — all coding workflow rules, phase discipline, safety restrictions, testing requirements, and documentation-first procedure. Source: Part 9.

After generating the files:

1. Cross-check all five files against one another and against the source requirements.
2. Preserve every confirmed decision and every open decision. Do not resolve unknowns by guessing.
3. Check that formula examples, phase numbering, screen names, technology choices, and feature names are consistent.
4. Keep the source master file in the repository unless the user explicitly asks to remove it.
5. Report which files were created and any contradictions or missing information found.
6. **Stop. Do not scaffold React, install packages, create application components, modify existing application files, run a migration, or begin Phase 1.** Wait for the user to review/approve the documentation split and start the next task.

## 2. General coding-session workflow

1. Read the relevant project documentation before changing code.
2. State the current phase, the exact task, and its acceptance criteria.
3. Work on one phase and one small feature/task at a time.
4. Review the relevant screen/component specification in `DESIGN.md` before UI implementation.
5. Make small, reviewable changes; avoid unrelated refactors.
6. Reuse shared components, design tokens, and grading functions.
7. Do not implement later-phase features early unless the user explicitly changes the plan.
8. Test only at the push/deploy gate: routine file additions or modifications do not require running tests (see Section 7).
9. Report exactly what changed, what passed, what failed, and what was not tested.
10. Never mark a phase complete until its Done When checklist is satisfied.

## 3. Visual design rules

- `DESIGN.md` is the visual source of truth; no external design application is required.
- Read the relevant screen/component section of `DESIGN.md` before writing UI code.
- Reuse the shared tokens, components, and mascot/illustration guidance; do not replace the mascot with a generic placeholder without approval.
- If a visual value or state is not specified, propose a clear baseline, label it as a proposal, and ask for approval. Do not present invented values as final design.
- Compare the implementation against the relevant `DESIGN.md` section before calling UI work done.
- Report any deliberate deviation from the written design and why it was necessary.

## 4. Git and repository safety

- Inspect `git status`, active branch, remotes, and recent commit context before any file changes.
- Keep the existing `main` branch unchanged during the rebuild.
- Use a separate rebuild branch (suggested: `rebuild`) only after confirming the working tree and branch state.
- Do not delete the old application as an automatic cleanup step.
- Do not commit, push, merge, rebase, force-push, or modify GitHub remotely unless the user explicitly requests that specific action.
- Ask for explicit approval before pushing to the GitHub repository or deploying the app.
- Never overwrite user changes or discard uncommitted files.
- Before destructive commands or large replacements, explain the effect and ask for approval.

> Note: If the user explicitly instructs a deviation from these git rules (for example, a deliberate clean-up on a specific branch), the user's explicit decision takes priority. Confirm destructive actions before executing them.

## 5. Code quality and security

- Do not put business rules in UI components.
- Do not duplicate grading formulas across pages.
- Validate inputs both in the UI and in the data-writing layer as appropriate.
- Enforce data ownership in the Cloudflare Worker; the browser must never query D1 directly.
- Do not expose secrets, tokens, service-account credentials, or private keys.
- Do not create fake data and present it as the user's real academic record.
- Keep empty, loading, error, incomplete, and success states intentional and accessible.
- Do not add dependencies without explaining why they are needed.

## 6. Phase completion report

At the end of a task, report:

- Current phase and task.
- Files created/changed.
- Behaviors implemented.
- What changed after the build (files added/modified/removed and affected behavior).
- Tests/build commands run and their results.
- Known issues or skipped checks.
- Whether the relevant Done When criteria are satisfied.
- The single recommended next task, without starting it automatically.

## 7. Build, test, and deployment gate

1. **State what changed after the build.** After every build, report the files added, modified, or removed, the behaviors affected, and whether the build succeeded.
2. **Ask before pushing to GitHub.** Do not push to the GitHub repository until the user explicitly approves that specific push.
3. **Ask before deploying the app.** Do not deploy (for example, to Cloudflare Workers) until the user explicitly approves that specific deployment.
4. **Test before pushing and deploying.** Run the relevant tests and verify the app before any approved push to GitHub and before any approved deployment, then report the commands and results.
5. **No test needed for routine file changes.** If the task only modifies or adds files during normal development, testing is not required. Testing becomes mandatory at the push/deploy gate.

## 8. Documentation map

Use these files together; do not let one contradict another:

- `PLAN.md` — purpose, scope, phases, tasks, Done When, tech direction, open decisions.
- `DESIGN.md` — visual direction, design tokens, responsive layout, components, screens and states.
- `GRADING_RULES.md` — finalized formulas, validation, conversion table, tests.
- `DATA_MODEL.md` — entities, relationships, D1 constraints, unresolved data decisions.
- `AGENTS.md` — this file; workflow and safety rules.
