# AGENTS.md

## DevView Operating Boundary

DevView is the canonical product identity for this repository. It compiles Maintainability Graph context into View
Trees, Context Packs, AI-facing instructions, evidence records, Graph Delta proposals, and guarded graph update
readiness reports.

Use DevView terminology in active guidance, public docs, examples, command examples, and completion reports. Historical
tree-control material lives under internal legacy archives and is migration context only.

DevView is optimized for safe, reviewable, staged maintenance. It is not a provider caller, daemon, GUI surface, or
automatic approval engine. Generated reports are advisory until a later explicitly approved lifecycle records a human
decision or guarded update result.

After approved DevView repository changes, run the relevant validation, commit the finished work, and push to
`origin/main` unless the user explicitly asks not to push.

## Core Flow

```text
Maintainability Graph
-> View Tree
-> Context Pack
-> AI Work Plan
-> Runtime Evidence
-> Graph Delta
-> Guarded Graph Update
```

## Source And Authority Rules

- Treat the Maintainability Graph as the canonical source model when a task is about DevView graph context.
- Treat View Trees and Context Packs as bounded projections, not source authority.
- Treat Instruction Packs as AI execution guidance, not approval.
- Treat Runtime Evidence as candidate proof until a human evidence decision and accepted evidence record exist.
- Treat accepted evidence as distinct from runtime obligation satisfaction.
- Treat equivalence, Scope/CI readiness, hook readiness, and apply readiness as report-only unless an explicitly approved
  lifecycle says otherwise.
- Never infer user approval, evidence acceptance, runtime satisfaction, equivalence, or enforcement from green tests,
  smoke output, generated reports, or Codex judgment.

## Work Planning

Before making code or artifact changes:

- Identify the user request, selected scope, expected files, forbidden files, validation path, and rollback risk.
- Prefer the smallest deterministic slice that preserves existing behavior.
- Keep generated outputs, test fixtures, docs, and source authority artifacts separate.
- Use sequential execution when shared files, generated outputs, state, or evidence paths could collide.
- Ask the user only when the answer changes product meaning, risk, scope, UX, verification strategy, or accepted work.

## File And Artifact Safety

- Do not overwrite source artifacts, graph source files, generated reports, evidence, review packets, policy boundaries,
  hook configuration, or project memory unless the task explicitly targets them.
- Keep output guards conservative: unsafe Markdown output should block JSON output too.
- Preserve hidden legacy storage protection for old user repositories and migration fixtures.
- Do not remove legacy guard behavior merely because active public docs are clean.

## Human Decision And Evidence

- Human approval must come from explicit human decision records.
- Codex must not self-approve, self-accept evidence, or automate user acceptance.
- Evidence decision records do not create accepted evidence unless the accepted-evidence lifecycle explicitly does so.
- Accepted evidence does not prove equivalence and does not satisfy runtime obligations by itself.
- Runtime evidence satisfaction, equivalence proof, and Scope/CI enforcement remain separate lifecycles.

## Graph Delta And Updates

- Graph Delta proposals are not graph-source mutation.
- Approved apply dry-runs are readiness previews, not permission to mutate.
- Guarded graph update commands must revalidate current graph source identity, proposal provenance, policy boundaries,
  backup, rollback, and post-mutation validation.
- Never infer mutation operations from prose, summaries, review packets, changed files, or dry-run reports.

## Validation

Use focused validation first, then broader validation when the slice touches shared behavior.

Common checks:

```text
npm run build:cli
npm run validate:devview
npm run format:check
git -c core.longpaths=true diff --check
git -c core.longpaths=true diff --cached --check
```

For public terminology cleanup, also run the public docs/examples grep checks requested by the task and the legacy audit
or cleanup dry-run command.

## Reporting

Completion reports should include:

- commit hash and push status
- changed files
- validation results
- safety/non-goal confirmation
- any remaining documented allowlist or blocker

Keep reports factual. Do not claim approval, evidence acceptance, runtime satisfaction, equivalence proof, graph mutation,
or enforcement unless the relevant lifecycle artifact explicitly records it.
