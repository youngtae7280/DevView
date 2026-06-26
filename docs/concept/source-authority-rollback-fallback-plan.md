# Source-Authority Rollback / Fallback Plan

Status: rollback-fallback-plan / docs-only / no-rollback-execution / no-source-authority-change

## Purpose

This plan defines how PBE should recover, defer, or stop if candidate broader source-authority expansion fails,
conflicts, becomes stale, or is rejected.

It is based on the candidate authority matrix in
[source-authority-expansion-design-package.md](source-authority-expansion-design-package.md). It does not execute
rollback, expand source authority, promote Maintainability Graph, retire tree-native artifacts, modify workflows,
modify CLI behavior, regenerate artifacts, or replace user acceptance.

Recommended readiness status:

```text
rollback-fallback-plan-ready-for-promotion-package-with-caveats
```

This means the rollback/fallback review surface is ready to feed a future promotion decision package. It does not mean
rollback is implemented, promotion is approved, or source authority has changed.

## Rollback / Fallback Scope

The plan covers these review surfaces:

| Scope area                                | Covered boundary                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Todo Search scoped pilot                  | Preserve bounded pilot fallback/reference artifacts and stop broader promotion if pilot signals fail.     |
| Candidate broader source-authority matrix | Apply fallback rules to every artifact family before any source role changes.                             |
| Positive read-model registry              | Keep `validate --all` scoped to declared positive profiles unless a separate registry change is approved. |
| Validate-all reports and aggregate        | Treat generated, validation, parity, and aggregate reports as Evidence only until promotion approval.     |
| Public-doc cleanup state                  | Keep Batch A/B/C/D cleanup as review input; unresolved waiver/sufficiency questions can defer promotion.  |
| CI Evidence and PR informational runs     | Use manual/PR CI as repeatability Evidence, not rollback enforcement or source authority.                 |
| Todo App PBE Run structure-only profile   | Prevent structure-only Evidence from being interpreted as source-bearing or parity-backed.                |

## Fallback Precedence

If candidate authority expansion conflicts with existing records or user judgment, fallback precedence is:

1. User decision and Acceptance authority.
2. Tree-native Product / Project / Work / Test / Evidence / Acceptance artifacts.
3. Cycle Contract and Node Execution Contracts for bounded execution.
4. Retained manual parity, scoped-pilot, and read-model reference artifacts.
5. Generated read-model, validation, aggregate, and CI Evidence as review Evidence only.

Generated Evidence can support diagnosis and revalidation, but it must not outrank user acceptance or tree-native
operational source until a later explicit promotion decision changes authority.

## Rollback Triggers

| Trigger                                       | Meaning                                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| parity mismatch / blocked / decision-required | Generated/manual parity no longer supports the scoped or broader authority claim.                          |
| validation or aggregate blocked               | Per-slice validation, validate-all, or aggregate summary reports blocking status.                          |
| stale or missing generated Evidence           | Required generated Evidence is missing, stale, unreproducible, or points to the wrong commit.              |
| source-authority boundary ambiguity           | Users, docs, reports, or tooling make source/projection/Evidence roles unclear.                            |
| user acceptance authority confusion           | Any artifact or workflow appears to replace user-controlled Acceptance.                                    |
| public-doc cleanup insufficiency              | Cleanup is judged insufficient or a requested waiver is rejected.                                          |
| CI Evidence missing or non-repeatable         | Manual/PR CI cannot reproduce the expected validate-all/Evidence bundle.                                   |
| compatibility view confusion                  | Compatibility views, task-card views, or execution packs are read as source authority.                     |
| Todo App structure-only misread               | Todo App PBE Run is treated as parity-backed, pilot-marker-backed, CI-backed authority, or source-bearing. |
| invalid fixture boundary leakage              | Local invalid fixtures are accidentally included in positive registry, aggregate, or CI Evidence.          |

## Actions By Trigger

| Trigger family                                       | Required action                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Parity, validation, or aggregate blocking            | Stop promotion path; keep or restore tree-native authority; classify blocker; require review.                      |
| Stale or missing generated Evidence                  | Stop authority claim; regenerate/revalidate only if safe; keep stale output as historical Evidence.                |
| Source-boundary ambiguity                            | Mark graph/read-model output as Evidence-only; require source role clarification before proceeding.                |
| User acceptance confusion                            | Stop promotion path; restore user decision precedence; require explicit user judgment.                             |
| Public-doc cleanup insufficiency or waiver rejection | Defer promotion package; update caveat; do not treat cleanup as implicitly waived.                                 |
| CI repeatability failure                             | Keep CI as failed Evidence; do not convert failure into source authority; decide whether to fix workflow or defer. |
| Compatibility view confusion                         | Re-label compatibility/view artifacts; keep tree-native source; open compatibility control review.                 |
| Todo App structure-only misread                      | Restore `structure-only` classification; block any source-bearing claim until separate artifacts exist.            |
| Invalid fixture leakage                              | Remove invalid fixtures from positive path; preserve local-only policy unless explicitly changed.                  |

## Snapshot And Reference Requirements

Before any future authority change can execute, these artifacts must be retained or explicitly snapshotted:

| Artifact family                                                               | Requirement                                                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Tree-native Product / Project / Work / Test / Evidence / Acceptance artifacts | Retain as fallback/reference until retirement is explicitly approved.                                        |
| Cycle Contract / Node Execution Contracts                                     | Retain the execution scope used for any authority-bearing decision.                                          |
| Todo Search selected-slice support artifacts                                  | Retain scoped pilot source/reference artifacts, manual read-model, parity, validation, and marker artifacts. |
| Todo App PBE Run structure-only artifacts                                     | Retain as structure-only Evidence, not source authority.                                                     |
| Positive slice registry                                                       | Retain registry version and included profile IDs used for validate-all Evidence.                             |
| Generated read-model / parity / validation / aggregate reports                | Retain with freshness/sourceCommit visible; reproducibility is required but source authority is not implied. |
| CI evidence manifest                                                          | Retain run id, run attempt, source ref, source commit, event, trigger mode, and included slices.             |
| Public-doc cleanup records                                                    | Retain Batch A/B/C/D cleanup records and any later explicit waiver or sufficiency judgment.                  |

Generated reports must remain reproducible enough to support review, but they are not source authority by themselves.

## Compatibility-Retirement Guardrails

- No tree-native artifact retirement until rollback/fallback is reviewable and explicitly approved.
- No public-doc cleanup waiver, compatibility-view retirement, task-card view retirement, or execution-pack retirement
  without a visible user decision.
- Compatibility views must remain labeled as views/projections unless a later source matrix explicitly changes their
  role.
- Retired/deprecated status must name the replacement, retained fallback, and review point.
- Any retirement that affects accepted or verified work requires Change/Impact/Evidence/Acceptance review.

## Relation To Enforcement

CI enforcement is not rollback policy.

Manual CI, PR informational CI, validate-all, and aggregate summaries are repeatability Evidence. They can show that a
candidate transition is healthy or blocked, but they do not decide rollback, approve fallback, enforce merge blocking,
or change source authority.

Required checks, branch protection, and enforcement remain separate future decisions.

## Readiness Recommendation

Current recommendation:

```text
rollback-fallback-plan-ready-for-promotion-package-with-caveats
```

Ready because:

- fallback precedence is explicit
- trigger categories are named
- actions by trigger are defined
- snapshot/reference requirements are visible
- compatibility-retirement guardrails are recorded

Caveats:

- no rollback implementation exists
- no source authority change is approved
- no promotion package is approved
- no concrete artifact snapshot command exists
- no enforcement policy is approved
- Todo App PBE Run remains `structure-only`
- user acceptance authority remains user-controlled

## Non-Scope

This plan does not:

- execute rollback
- expand source authority
- approve Graph-source promotion
- retire tree-native artifacts
- modify public docs
- modify workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- add invalid fixtures to CI
- promote Todo App PBE Run beyond `structure-only`
- replace user acceptance authority

## Recommended Next Decision Surface

Follow-on decision surface:

```text
broader Graph-source promotion decision package prepared
```

[broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md) now combines
the matured Evidence stack, public-doc cleanup status, candidate authority matrix, this rollback/fallback plan,
enforcement status, retained caveats, and explicit user approval choices without executing promotion.

Any actual rollback, fallback, source authority expansion, promotion, artifact retirement, or enforcement change still
requires a later explicit user decision and a separate scoped execution package.
