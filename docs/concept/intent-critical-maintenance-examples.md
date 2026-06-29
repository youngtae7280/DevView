# Intent-Critical Maintenance Examples

Status: bounded examples / focused validation / non-enforcing

## Purpose

Graph-source PBE exists to preserve more than generated shape. It should keep the development-time intent that prevents
AI-assisted maintenance from changing behavior just because a simpler rewrite looks plausible.

The edge-level vocabulary decision is recorded in
[edge-level-intent-vocabulary-design.md](edge-level-intent-vocabulary-design.md). These examples align to that decision:
intent is represented as graph edge annotation, not as a separate source ledger.

The first intent-critical examples are:

- `examples/intent-critical/native-pbe-maintenance`
- `examples/intent-critical/retrofit-pbe-maintenance`

## Native PBE Example

The native fixture records intent before maintenance begins.

Risk:

- Empty Todo search can be incorrectly changed to show no results.

Captured intent:

- empty search restores the full list
- hiding all todos is a non-goal
- runtime/validation Evidence should prove clear-search behavior
- task-card or read-model projections must not weaken acceptance meaning
- edge claim: `empty search restores the full list after clearing a query`

## Retrofit PBE Example

The retrofit fixture records recovered intent from existing artifacts before cleanup proceeds.

Risk:

- A compatibility export can be deleted as duplicate after graph-source projection appears to cover the same fields.

Captured intent:

- compatibility export remains rollback/fallback/audit reference
- retirement needs an explicit decision
- generated graph-source projections do not authorize deleting compatibility artifacts
- maintenance review should compare both generated projection and retained compatibility evidence
- edge claim: `compatibility export stays until explicit retirement approval`

## Focused Validation

`cli/src/__tests__/intent-critical-examples.test.ts` checks both fixtures for:

- edge-level `intent.kind`, `risk`, `claim`, `confidence`, `enforcement`, and anchors
- projection preservation through `generated/edge-intent-read-model-projection.json`
- regeneration through `graph read-model project-intent --graph-source <path> --output <path> --json`
- claim text preserved as project-specific text rather than replaced by enum/table values
- maintenance scenario and vibe-coding risk
- intent statement
- maintenance risk if missing
- preservation rule
- non-goal
- fallback reason
- evidence reason
- compatibility reason
- read-model projection boundary
- user-approval and non-promotion boundaries

## Boundaries

These examples do not add tree retirement, enforcement, required checks, branch protection, invalid-fixture CI, or
repo-wide source authority expansion.
