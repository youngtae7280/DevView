# CI Validate-All Integration Design

Status: ci-validate-all-integration-design / workflow-switch-implemented / manual-and-pr-review-completed /
non-enforcing

## Design Purpose

This document defines and records how the existing non-enforcing manual and PR informational read-model Evidence
workflow switched from an explicit command sequence to the local registry-backed command:

```text
node dist/cli/index.js graph read-model validate --all --json
```

The switch is implemented in `.github/workflows/read-model-evidence.yml`, manually reviewed in run `28210541509`, and
reviewed through `pull_request` informational smoke runs `28210904900` and `28213236499`. It remains non-enforcing. It
does not add required checks, add branch protection, expand source authority, perform public-doc cleanup, promote Todo
App PBE Run beyond `structure-only`, or approve full Graph-source promotion.

After PR #1, PR #2, and PR #3 satisfied the initial observation run-count threshold, the path-filter and
failure-semantics refinement decision surface was recorded in
[pr-informational-path-filter-refinement.md](pr-informational-path-filter-refinement.md). The recommendation is to keep
the current validate-all-centered PR informational workflow unchanged until observed noise, cost, missed drift, or
blocked Evidence behavior justifies a separate implementation decision.

## Prior CI Mode

Prior workflow triggers:

- `workflow_dispatch`
- non-enforcing `pull_request` informational trigger with path filters

Prior explicit read-model command sequence:

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

Reviewed prior baselines:

- manual dispatch run `28207696557`: success after PR informational implementation
- first real PR informational run `28207822252`: success and reviewed
- local `validate --all`: implemented and verified as `aggregate-pass`

## Implemented Validate-All Mode

Implemented command sequence:

1. `npm run build:cli`
2. `node dist/cli/index.js graph read-model validate --all --json`
3. focused read-model Evidence tests
4. Todo Search runtime fixture tests
5. `npm run validate:pbe`
6. `npm run validate:pbe:v2`
7. CI manifest writing, Step Summary writing, artifact upload

The sequence keeps the same non-enforcing CI mode. It changes only how read-model Evidence files are produced inside the
workflow.

Current projection-contract observation:

- Validate-all JSON is captured as
  `examples/read-model-aggregate/generated/read-model-validate-all-output.json`.
- CI manifest and Step Summary now expose `projectionContractStatus`.
- Todo Search is expected to report `projection-contract-pass`; Todo App PBE Run remains `not-configured`.
- Missing or corrupt projection artifacts can block the non-enforcing CI Evidence status without adding required checks,
  branch protection, or merge enforcement.
- Manual run `28218687289` and PR #4 run `28218854329` reviewed this capture path as `ci-evidence-pass`.

Reviewed manual run after switch:

| Field        | Value                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Run ID       | `28210541509`                                                                                          |
| Run URL      | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210541509>             |
| Event        | `workflow_dispatch`                                                                                    |
| Commit       | `972dbc1674e1e083f20dc76808a71903b6a1ea95`                                                             |
| Conclusion   | `success`                                                                                              |
| Manifest     | `ci-evidence-pass`; `validateAllStatus: aggregate-pass`; `aggregateStatus: aggregate-pass`             |
| Review state | recorded in [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md) |

Reviewed PR informational run after switch:

| Field        | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| PR           | `#2`; draft smoke PR; closed without merge                                                              |
| Run ID       | `28210904900`                                                                                           |
| Run URL      | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28210904900>              |
| Event        | `pull_request`                                                                                          |
| Head SHA     | `dadc1fd415a57342e7e1084c561868e242b39c54`                                                              |
| Manifest ref | `refs/pull/2/merge`                                                                                     |
| Manifest     | `ci-evidence-pass`; `pull_request-informational`; `validateAllStatus: aggregate-pass`; `aggregate-pass` |
| Review state | recorded in [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md)  |

Third PR informational observation after switch:

| Field        | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| PR           | `#3`; draft smoke PR; closed without merge                                                              |
| Run ID       | `28213236499`                                                                                           |
| Run URL      | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28213236499>              |
| Event        | `pull_request`                                                                                          |
| Head SHA     | `b9f2048541b884fb6eb74234f7fecd844102abc8`                                                              |
| Manifest ref | `refs/pull/3/merge`                                                                                     |
| Manifest     | `ci-evidence-pass`; `pull_request-informational`; `validateAllStatus: aggregate-pass`; `aggregate-pass` |
| Review state | recorded in [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md)  |

Projection-contract manual observation:

| Field        | Value                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Run ID       | `28218687289`                                                                                                             |
| Run URL      | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218687289>                                |
| Event        | `workflow_dispatch`                                                                                                       |
| Commit       | `a968d3661f22f7c06647080310e8ea1f87e79d0a`                                                                                |
| Manifest     | `ci-evidence-pass`; `projectionContractStatus` present; Todo Search `projection-contract-pass`; Todo App `not-configured` |
| Artifacts    | `read-model-validate-all-output.json` and `graph-source-read-model-projection.json` present                               |
| Review state | recorded in [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md)                    |

Projection-contract PR informational observation:

| Field        | Value                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| PR           | `#4`; draft smoke PR; closed without merge                                                                          |
| Run ID       | `28218854329`                                                                                                       |
| Run URL      | <https://github.com/youngtae7280/Project-Blueprint-Engine-Plugin/actions/runs/28218854329>                          |
| Event        | `pull_request`                                                                                                      |
| Head SHA     | `38c8ef4b0a631b9a1e95fca55c171d3a58abc58a`                                                                          |
| Manifest ref | `refs/pull/4/merge`                                                                                                 |
| Manifest     | `ci-evidence-pass`; `pull_request-informational`; Todo Search `projection-contract-pass`; Todo App `not-configured` |
| Artifacts    | `read-model-validate-all-output.json` and `graph-source-read-model-projection.json` present                         |
| Review state | recorded in [ci-backed-read-model-evidence-run-review.md](ci-backed-read-model-evidence-run-review.md)              |

## Command Sequence Comparison

| Concern                         | Prior explicit sequence                           | Validate-all sequence                                                             |
| ------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Slice selection                 | Hardcoded commands in workflow                    | Registry-driven via `examples/read-model-aggregate/read-model-slices.json`        |
| Todo Search generate            | Explicit command                                  | Covered by registry profile `todo-search-selected-slice`                          |
| Todo Search compare             | Explicit command                                  | Covered by required `compare` command in registry                                 |
| Todo Search validate            | Explicit command                                  | Covered by required `validate` command in registry                                |
| Todo App generate               | Explicit command                                  | Covered by registry profile `todo-app-pbe-run-structure-only`                     |
| Todo App validate               | Explicit command                                  | Covered by required `validate` command in registry                                |
| Aggregate summarize             | Explicit command over per-slice reports           | Covered after registry profile commands complete                                  |
| Todo Search graph projection    | Not present                                       | Captured as `projectionContractStatus` from validate-all JSON output              |
| Focused tests                   | Outside read-model command sequence               | Still outside validate-all and still explicit                                     |
| Runtime fixture tests           | Outside read-model command sequence               | Still outside validate-all and still explicit                                     |
| PBE plugin validation           | Outside read-model command sequence               | Still outside validate-all and still explicit                                     |
| PBE v2 tree validation          | Outside read-model command sequence               | Still outside validate-all and still explicit                                     |
| Artifact upload                 | Workflow-managed                                  | Workflow-managed                                                                  |
| CI manifest / Step Summary      | Workflow-managed                                  | Workflow-managed, with validate-all status added                                  |
| Failure display                 | Individual command step failures identify command | validate-all JSON provides per-slice/per-command status for comparable visibility |
| Workflow source of slice policy | Workflow command list plus in-code profiles       | Registry plus validate-all output                                                 |
| Source authority boundary       | Summary/manifest wording                          | Same Evidence-only / non-promotion / non-enforcement boundaries                   |

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

The workflow switch keeps the existing artifact bundle reviewable:

| Artifact family        | Required after switch? | Notes                                                                   |
| ---------------------- | ---------------------- | ----------------------------------------------------------------------- |
| Todo Search generated  | yes                    | `generated-read-model.json/.md` and `read-model-evidence-manifest.json` |
| Todo Search parity     | yes                    | `read-model-parity-report.json/.md` remains present.                    |
| Todo Search validation | yes                    | `read-model-validation-report.json/.md` remains present.                |
| Todo Search marker     | yes                    | `scoped-source-authority-pilot-marker.json` remains uploaded.           |
| Todo App generated     | yes                    | Structure-only generated output and evidence manifest remain uploaded.  |
| Todo App validation    | yes                    | Structure-only validation report remains uploaded.                      |
| Aggregate summary      | yes                    | `read-model-aggregate-summary.json/.md` remains uploaded.               |
| CI manifest            | yes                    | Records trigger, run, commit/ref, and PR metadata when present.         |

The switch does not remove retained warning visibility or hide accepted limitations behind a single aggregate status.

## CI Manifest Requirements

The CI manifest preserves current fields and adds validate-all specific fields:

- `status`: `ci-evidence-pass`, `ci-evidence-warning`, `ci-evidence-blocked`, or `decision-required`
- `evidenceLevel`: `ci-backed`
- `eventName`
- `triggerMode`: `workflow_dispatch` or `pull_request-informational`
- `runId`
- `runAttempt`
- `sourceCommit`
- `sourceRef`
- PR number/head/base metadata when event is `pull_request`
- `sourceMode: registry-backed validate-all`
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

Negative fixtures are not part of this workflow mode. Storage policy for future invalid read-model fixtures is recorded
in [read-model-negative-fixture-storage-decision.md](read-model-negative-fixture-storage-decision.md); running invalid
fixtures in CI would require a separate non-enforcing or enforcement design.
That separate decision surface is now recorded in
[read-model-invalid-fixture-ci-policy.md](read-model-invalid-fixture-ci-policy.md), with a current recommendation to
keep invalid fixtures local-only.

## Step Summary Requirements

The Step Summary remains readable without opening artifacts:

- event and trigger mode
- PR metadata when present
- included slices
- Todo Search validation/parity status
- Todo App structure-only validation status
- validate-all status
- aggregate status and warning/blocking/decision-required counts
- retained warning visibility
- explicit text:

```text
Informational only. Not a required check. No branch protection. No source authority expansion. No full promotion.
```

## Failure Semantics

| Case                                      | CI behavior                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `validate --all` process/runtime failure  | Job fails because the Evidence command did not complete.                                                   |
| Registry malformed or unsupported profile | Job fails; manifest/summary can still name the issue if the workflow reaches the always-run summary steps. |
| Per-slice command failure                 | Job fails through validate-all result unless a later non-enforcing policy explicitly downgrades it.        |
| Aggregate `aggregate-blocked`             | Job fails in manual mode; PR informational mode may fail the job but remains non-required/non-enforcing.   |
| `decision-required`                       | Prefer job failure or explicit red signal until a later policy defines warning-only handling.              |
| `aggregate-warning`                       | Job may succeed with visible warning if artifacts are complete and retained warnings are visible.          |
| Artifact upload failure                   | Job fails because CI-backed Evidence bundle is incomplete.                                                 |
| Focused test/runtime/PBE validation fail  | Job fails; these remain outside validate-all and are still required supporting gates.                      |

The important boundary: job failure in PR informational mode is still not merge enforcement unless branch protection or
required checks are separately approved.

## Migration / Compatibility Result

Implemented migration result:

1. Keep the explicit workflow command sequence until a separate implementation task is approved. Completed.
2. Implement the non-enforcing workflow switch on `main` without changing triggers or enforcement. Completed.
3. Run one manual workflow dispatch and review the artifact bundle. Completed by run `28210541509`.
4. Compare output equivalence with the prior explicit workflow. Completed for the required baseline:
   - same included slices
   - Todo Search 40 nodes / 59 edges
   - Todo Search `comparison-pass`
   - Todo Search `validation-pass` with 20 checks
   - Todo App 22 nodes / 38 edges
   - Todo App `validation-pass` with 16 checks
   - aggregate `aggregate-pass`
   - retained warnings visible
   - manifest/summary boundaries present
5. Observe at least one real PR informational run after the switch. Still pending.
6. Keep enforcement, required checks, branch protection, source authority expansion, and full promotion as separate
   decision surfaces.

## Relationship To Current PR Observation

This switch does not reset the PR observation counter. The workflow-mode change is recorded here and should be observed
under [pr-informational-observation-policy.md](pr-informational-observation-policy.md) when the first post-switch PR run
exists. The append-only review surface is
[pr-informational-observation-log.md](pr-informational-observation-log.md).

Path filters were not widened or narrowed as part of this switch.

## Non-Scope

This design and implementation do not:

- create a PR
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
Keep PR informational workflow non-enforcing and observe.
```

Alternative choices:

1. Continue non-enforcing PR observation.
2. Refine output-equivalence checklist only if future post-switch PR runs differ from manual/PR review.
3. Defer additional workflow simplification until another slice is added.
4. Reopen path-filter refinement after observation data supports it.
5. Design required-check / enforcement policy only after explicit user approval.
6. Reject further validate-all workflow integration and return to explicit CI commands.

## Gate Self-Check

| Gate                               | Result | Notes                                                                     |
| ---------------------------------- | ------ | ------------------------------------------------------------------------- |
| Non-Enforcing Implementation Gate  | PASS   | Workflow switch is implemented without enforcement or trigger change.     |
| Manual Review Gate                 | PASS   | Run `28210541509` reviewed the switched workflow as `ci-evidence-pass`.   |
| PR Informational Review Gate       | PASS   | PR #2 run `28210904900` reviewed the switched workflow on `pull_request`. |
| Workflow Boundary Gate             | PASS   | Existing manual and PR informational triggers are preserved.              |
| Validate-All Coverage Gate         | PASS   | Defines what validate-all covers and what remains outside it.             |
| Artifact Bundle Preservation Gate  | PASS   | Existing uploaded artifact families remain present.                       |
| Manifest / Summary Continuity Gate | PASS   | Trigger/run/PR/status/boundary metadata remains visible.                  |
| Failure Semantics Gate             | PASS   | Distinguishes command failure, aggregate status, and PR visibility.       |
| Source Authority Boundary Gate     | PASS   | Validate-all CI integration remains Evidence-only.                        |
| Non-Full-Promotion Gate            | PASS   | Full Graph-source promotion remains separate.                             |
| User Approval Boundary Gate        | PASS   | CI pass remains non-acceptance and non-promotion.                         |

## Final Statement

This record defines and documents the implemented non-enforcing CI workflow switch to local registry-backed
`validate --all` while preserving artifact, manifest, summary, and boundary semantics. It does not enforce checks,
expand source authority, approve promotion, or replace user acceptance.
