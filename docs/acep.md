# ACEP

ACEP means Autonomous Codex Execution Pack.

It is the handoff from planning to implementation.

## Output

ACEP is generated under:

```text
.pbe/codex-execution-pack/
```

It contains policy, blueprint summaries, traceability matrix, UI/UX spec, task cards, validation commands, evidence rules, completion criteria, recovery guidance, final coverage check, final report template, execution strategy, and an execution manifest.

## Required Contract Files

```text
00-readme.md
01-autonomous-execution-policy.md
02-project-blueprint.md
03-requirement-tree.md
04-traceability-matrix.md
04-traceability-matrix.json
05-ui-ux-spec.md
05-ui-ux-spec.json
06-ui-ux-preview.md
07-ui-ux-confirmation.md
08-work-roadmap.md
09-verification-plan.md
10-codex-operating-loop.md
11-task-cards/
12-validation-commands.md
13-completion-criteria.md
14-failure-recovery.md
15-ui-ux-evidence-checklist.md
16-final-coverage-check.md
17-final-report-template.md
18-execution-strategy.md
execution-manifest.json
```

## Contract Rules

- No requirement without task.
- No task without verification.
- No verification without evidence.
- No UI screen without state coverage.
- No final completion without coverage check.
- No UI implementation without UI/UX confirmation.
- No accepted status from Codex.
- No parallel group without an integration task.
- No parallel execution planning without WPD WorkGraph and Module Boundary Check.
- No RPD requirement node copied directly into a Codex coding task.

## Autonomy Level

The default autonomy level is:

```text
autonomous_until_stop
```

Codex should keep working through task cards without asking the user unless a stop condition occurs.

## Stop Conditions

Stop when work requires:

- credentials, tokens, secrets, or private accounts
- deployment, billing, or external infrastructure changes
- destructive data migration
- out-of-scope behavior
- unresolved product intent
- repeated validation failure after three attempts
- unavailable dependency or environment that prevents meaningful progress

## Runner Behavior

ACEP Runner reads:

```text
00-readme.md
execution-manifest.json
18-execution-strategy.md
04-traceability-matrix.json
05-ui-ux-spec.json
10-codex-operating-loop.md
11-task-cards/
15-ui-ux-evidence-checklist.md
16-final-coverage-check.md
```

It executes manifest phases in order. Sequential phases run task by task. Parallel phases run by declared parallel group, or sequentially as a fallback when actual parallel execution is unavailable. Every parallel group must complete its integration task before Codex moves to the next phase. The runner validates after focused changes, records evidence, updates UI/UX evidence when needed, completes final coverage, and writes a final report only when technical completion criteria are satisfied. It then prepares result review as `submitted_for_review`.
