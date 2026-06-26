# CI Validate-All Integration Design

Status: ci-validate-all-integration-design / design-only / no-workflow-change / non-enforcing

## Design Purpose

This document defines how the existing non-enforcing manual and PR informational read-model Evidence workflow could
later switch from an explicit command sequence to the local registry-backed command:

```text
node dist/cli/index.js graph read-model validate --all --json
```

The design is intentionally not a workflow change. It does not edit `.github/workflows/read-model-evidence.yml`, dispatch
GitHub Actions, create a PR, introduce required checks, add branch protection, expand source authority, perform
public-doc cleanup, promote Todo App PBE Run beyond `structure-only`, or approve full Graph-source promotion.

## Current CI Mode

Current workflow:

```text
.github/workflows/read-model-evidence.yml
```

Current triggers:

- `workflow_dispatch`
- non-enforcing `pull_request` informational trigger with path filters

Current command sequence:

1. `npm run build:cli`
2. `node dist/cli/index.js graph read-model generate --slice examples/adoption/todo-search-slice --json`
3. `node dist/cli/index.js graph read-model compare --generated examples/adoption/todo-search-slice/generated/generated-read-model.json --manual examples/adoption/todo-search-slice/maintainability-graph-read-model.json --json`
4. `node dist/cli/index.js graph read-model validate --slice examples/adoption/todo-search-slice --json`
5. `node dist/cli/index.js graph read-model generate --slice examples/valid/todo-app-pbe-run --json`
6. `node dist/cli/index.js graph read-model validate --slice examples/valid/todo-app-pbe-run --json`
7. `node dist/cli/index.js graph read-model summarize --slices examples/adoption/todo-search-slice,examples/valid/todo-app-pbe-run --json`
8. focused read-model Evidence tests
9. Todo Search runtime fixture tests
10. `npm run validate:pbe`
11. `npm run validate:pbe:v2`
12. CI manifest writing, Step Summary writing, artifact upload

Current reviewed baseline:

- manual dispatch run `28207696557`: success after PR informational implementation
- first real PR informational run `28207822252`: success and reviewed
- local `validate --all`: implemented and verified as `aggregate-pass`

## Future Candidate Mode

Candidate command sequence:

1. `npm run build:cli`
2. `node dist/cli/index.js graph read-model validate --all --json`
3. focused read-model Evidence tests
4. Todo Search runtime fixture tests
5. `npm run validate:pbe`
6. `npm run validate:pbe:v2`
7. CI manifest writing, Step Summary writing, artifact upload

The candidate sequence keeps the same non-enforcing CI mode. It changes only how read-model Evidence files are produced
inside the workflow.

## Command Sequence Comparison

| Concern                         | Current explicit sequence                                 | Future validate-all sequence                                                          |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Slice selection                 | Hardcoded commands in workflow                            | Registry-driven via `examples/read-model-aggregate/read-model-slices.json`            |
| Todo Search generate            | Explicit command                                          | Covered by registry profile `todo-search-selected-slice`                              |
| Todo Search compare             | Explicit command                                          | Covered by required `compare` command in registry                                     |
| Todo Search validate            | Explicit command                                          | Covered by required `validate` command in registry                                    |
| Todo App generate               | Explicit command                                          | Covered by registry profile `todo-app-pbe-run-structure-only`                         |
| Todo App validate               | Explicit command                                          | Covered by required `validate` command in registry                                    |
| Aggregate summarize             | Explicit command over per-slice reports                   | Covered after registry profile commands complete                                      |
| Focused tests                   | Outside read-model command sequence                       | Still outside validate-all and should remain explicit                                 |
| Runtime fixture tests           | Outside read-model command sequence                       | Still outside validate-all and should remain explicit                                 |
| PBE plugin validation           | Outside read-model command sequence                       | Still outside validate-all and should remain explicit                                 |
| PBE v2 tree validation          | Outside read-model command sequence                       | Still outside validate-all and should remain explicit                                 |
| Artifact upload                 | Workflow-managed                                          | Workflow-managed                                                                      |
| CI manifest / Step Summary      | Workflow-managed                                          | Workflow-managed, with validate-all status added                                      |
| Failure display                 | Individual command step failures identify failing command | validate-all JSON must provide per-slice/per-command status for comparable visibility |
| Workflow source of slice policy | Workflow command list plus in-code profiles               | Registry plus validate-all output                                                     |
| Source authority boundary       | Current summary/manifest wording                          | Must remain identical or stricter                                                     |

## What Validate-All Covers

`validate --all` covers only the configured read-model Evidence path:

- registry loading and normalization
- included profile selection
- Todo Search generate / compare / validate
- Todo App PBE Run generate / validate
- aggregate summary generation
- per-slice status summary
- Evidence-only / non-promotion / non-enforcement boundary statements

It does not cover:

- focused test execution
- Todo Search runtime fixture tests
- `npm run validate:pbe`
- `npm run validate:pbe:v2`
- artifact upload
- CI manifest creation
- GitHub Step Summary creation
- GitHub trigger semantics
- required check or branch protection policy

## Artifact Bundle Requirements

A workflow switch to validate-all must keep the existing artifact bundle reviewable:

| Artifact family        | Required after switch? | Notes                                                                   |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------- |
| Todo Search generated  | yes                    | `generated-read-model.json/.md` and `read-model-evidence-manifest.json` |
| Todo Search parity     | yes                    | `read-model-parity-report.json/.md` must still be present.              |
| Todo Search validation | yes                    | `read-model-validation-report.json/.md` must still be present.          |
| Todo Search marker     | yes                    | `scoped-source-authority-pilot-marker.json` remains uploaded.           |
| Todo App generated     | yes                    | Structure-only generated output and evidence manifest remain uploaded.  |
| Todo App validation    | yes                    | Structure-only validation report remains uploaded.                      |
| Aggregate summary      | yes                    | `read-model-aggregate-summary.json/.md` remains uploaded.               |
| CI manifest            | yes                    | Must record trigger, run, commit/ref, PR metadata when present.         |

The switch must not remove retained warning visibility or hide accepted limitations behind a single aggregate status.

## CI Manifest Requirements

The CI manifest should preserve current fields and add validate-all specific fields:

- `status`: `ci-evidence-pass`, `ci-evidence-warning`, `ci-evidence-blocked`, or `decision-required`
- `evidenceLevel`: `ci-backed`
- `eventName`
- `triggerMode`: `workflow_dispatch` or `pull_request-informational`
- `runId`
- `runAttempt`
- `sourceCommit`
- `sourceRef`
- PR number/head/base metadata when event is `pull_request`
- `validateAllStatus`
- `aggregateStatus`
- `includedSlices`
- per-slice profile id, policy level, node count, edge count, validation status, check count
- Todo Search parity status
- Todo App parity status as `not-required`
- retained warning visibility
- source authority boundary
- non-enforcement statement
- non-promotion statement

## Step Summary Requirements

The Step Summary should remain readable without opening artifacts:

- event and trigger mode
- PR metadata when present
- command mode: `registry-backed validate-all`
- registry path
- included slices and policy levels
- Todo Search validation/parity status
- Todo App structure-only validation status
- aggregate status and warning/blocking/decision-required counts
- retained warning visibility
- explicit text:

```text
Informational only. Not a required check. No branch protection. No source authority expansion. No full promotion.
```

## Failure Semantics

| Case                                      | Recommended CI behavior                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `validate --all` process/runtime failure  | Job fails because the Evidence command did not complete.                                                           |
| Registry malformed or unsupported profile | Job fails; manifest/summary should name the registry/profile issue if the workflow can still write a partial note. |
| Per-slice command failure                 | Job fails through validate-all result unless intentionally downgraded by a later non-enforcing policy.             |
| Aggregate `aggregate-blocked`             | Job should fail in manual mode; PR informational mode may fail the job but remains non-required/non-enforcing.     |
| `decision-required`                       | Prefer job failure or explicit red signal until a later policy defines warning-only handling.                      |
| `aggregate-warning`                       | Job may succeed with visible warning if artifacts are complete and retained warnings are visible.                  |
| Artifact upload failure                   | Job fails because CI-backed Evidence bundle is incomplete.                                                         |
| Focused test/runtime/PBE validation fail  | Job fails; these remain outside validate-all and are still required supporting gates.                              |

The important boundary: job failure in PR informational mode is still not merge enforcement unless branch protection or
required checks are separately approved.

## Migration / Compatibility Strategy

Recommended migration path:

1. Keep the current explicit workflow command sequence until a separate implementation task is approved.
2. Implement the non-enforcing workflow switch on a branch without changing triggers or enforcement.
3. Run one manual workflow dispatch and review the artifact bundle.
4. Compare output equivalence with the prior explicit workflow:
   - same included slices
   - Todo Search 40 nodes / 59 edges
   - Todo Search `comparison-pass`
   - Todo Search `validation-pass` with 20 checks
   - Todo App 22 nodes / 38 edges
   - Todo App `validation-pass` with 16 checks
   - aggregate `aggregate-pass`
   - retained warnings visible
   - manifest/summary boundaries present
5. Only after manual review, observe at least one real PR informational run if PR mode is still active.
6. Keep enforcement, required checks, branch protection, source authority expansion, and full promotion as separate
   decision surfaces.

## Relationship To Current PR Observation

This design does not reset the PR observation counter. A future workflow switch to validate-all should be logged as a
workflow-mode change in [pr-informational-observation-log.md](pr-informational-observation-log.md), then observed under
[pr-informational-observation-policy.md](pr-informational-observation-policy.md).

Path filters should not be widened or narrowed as part of the validate-all switch unless a separate path-filter decision
is made from observed PR data.

## Non-Scope

This design does not:

- modify `.github/workflows/read-model-evidence.yml`
- dispatch GitHub Actions
- create a PR
- regenerate generated artifacts
- change workflow triggers
- add required checks
- add branch protection
- introduce CI enforcement
- expand source authority
- approve full Graph-source promotion
- perform public-doc cleanup
- promote Todo App PBE Run beyond `structure-only`
- make CI pass equivalent to user acceptance

## Recommended Next Decision Surface

Recommended next action:

```text
Implement non-enforcing workflow switch to validate-all, then run one manual workflow review.
```

Alternative choices:

1. Continue explicit workflow sequence while observing more PRs.
2. Implement workflow switch to validate-all and review manual run.
3. Design output-equivalence checklist in more detail before implementation.
4. Defer workflow simplification until another slice is added.
5. Reopen path-filter refinement before workflow simplification.
6. Reject validate-all workflow integration and keep explicit CI commands.

## Gate Self-Check

| Gate                               | Result | Notes                                                                  |
| ---------------------------------- | ------ | ---------------------------------------------------------------------- |
| Design-Only Gate                   | PASS   | No workflow/code/generated artifacts are changed by this design.       |
| Non-Enforcing Gate                 | PASS   | Required checks, branch protection, and enforcement remain unapproved. |
| Workflow Boundary Gate             | PASS   | Current workflow stays unchanged.                                      |
| Validate-All Coverage Gate         | PASS   | Defines what validate-all covers and what remains outside it.          |
| Artifact Bundle Preservation Gate  | PASS   | Existing uploaded artifact families must remain present.               |
| Manifest / Summary Continuity Gate | PASS   | Trigger/run/PR/status/boundary metadata must remain visible.           |
| Failure Semantics Gate             | PASS   | Distinguishes command failure, aggregate status, and PR visibility.    |
| Source Authority Boundary Gate     | PASS   | Validate-all CI integration remains Evidence-only.                     |
| Non-Full-Promotion Gate            | PASS   | Full Graph-source promotion remains separate.                          |
| User Approval Boundary Gate        | PASS   | CI pass remains non-acceptance and non-promotion.                      |

## Final Statement

This design defines how a future non-enforcing CI workflow could use local registry-backed `validate --all` while
preserving artifact, manifest, summary, and boundary semantics. It does not change the workflow, run Actions, enforce
checks, expand source authority, approve promotion, or replace user acceptance.
