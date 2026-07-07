# Source-Authority Expansion Design Package

Status: design-package-used / limited-source-authority-expanded / repo-wide-promotion-not-executed

## Purpose

This package defines the source-authority expansion shape used for the limited Graph-source promotion branch.

The limited execution is recorded in
[broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). This package
does not execute repo-wide promotion, retire tree-native artifacts, change workflow behavior, change CLI behavior, add
enforcement, or replace user acceptance.

## Current Authority Baseline

Current operational source authority is now scoped:

| Area                                         | Current role                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product / Project / Work Trees               | Current source outside promoted scopes; maintained compatibility / fallback / reference for promoted Todo Search selected-slice scope.                |
| Test / Evidence / Acceptance Trees           | Current source outside promoted scopes; maintained verification/evidence/acceptance fallback/reference for promoted Todo Search selected-slice scope. |
| Cycle Contract / Node Execution Contracts    | Current bounded execution authority for selected/foundation scope and required Evidence.                                                              |
| Todo Search generated read-model             | Generated projection/Evidence for the limited promoted Todo Search graph-source scope; not independent source authority.                              |
| Todo App DevView Run generated read-model    | Structure-only Evidence over a canonical `.pbe` fixture; not parity-backed, pilot-marker-backed, or source-authority-bearing.                         |
| Read-model parity / validation / aggregate   | Evidence and review signals only. They do not approve source authority expansion, enforcement, promotion, or user acceptance.                         |
| CI evidence manifest and PR informational CI | Non-enforcing Evidence only. They do not create required checks, branch protection, enforcement, or source authority consequences.                    |
| Public docs and concept docs                 | Public explanation and concept records. They do not become product source authority or promotion approval by describing candidate future behavior.    |

Current state:

```text
limited graph-source promoted for Todo Search selected-slice; tree-native source elsewhere
```

Current non-state:

```text
repository-wide graph-source promoted
```

## Candidate Future Authority Roles

A future promotion decision should classify every artifact family into one of these roles:

| Role                                         | Meaning                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| source authority                             | The artifact/model treated as operational source for a defined scope after explicit user approval.                                             |
| projection / read model                      | A derived or aligned view used for inspection, validation, planning, or traceability, but not source by itself.                                |
| compatibility view                           | A maintained bridge or legacy-readable artifact retained for transition, review continuity, external users, or rollback reference.             |
| fallback / reference                         | A retained source or snapshot used when a candidate transition is rejected, deferred, rolled back, or needs comparison.                        |
| generated Evidence                           | Report, manifest, parity result, validation result, CI artifact, or aggregate summary used to support review, not authority or acceptance.     |
| retired / deprecated after explicit approval | Artifact or wording class intentionally removed from active use only after explicit user approval and satisfied compatibility/rollback checks. |

## Candidate Authority Matrix

This matrix is a design surface for review. It is not an approved promotion matrix.

| Artifact family                           | Current role                                                                          | Candidate broader role after explicit approval                                      | Required boundary before any change                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Product Tree                              | source authority                                                                      | graph source record or maintained projection from graph source                      | Product meaning, acceptance criteria, UX decisions, and non-scope must remain traceable and user-controlled.              |
| Project Tree                              | source authority derived from Product Tree                                            | graph source records or maintained architecture projection                          | Ownership, boundaries, surfaces, and dependencies must retain parity and conflict handling.                               |
| Work Tree                                 | source authority for executable work scope                                            | graph source records or maintained Work View projection                             | Selected/foundation/deferred/blocked/out-of-scope scope must not silently change.                                         |
| Test Tree                                 | source authority for verification obligations                                         | graph source records or maintained Test View projection                             | Checks and acceptance-criteria coverage must remain explicit.                                                             |
| Evidence Tree                             | source authority for Evidence records                                                 | graph source records or maintained Evidence View projection                         | Evidence status, freshness, exception, and linked Check scope must not be hidden.                                         |
| Acceptance Tree                           | source authority for user-controlled acceptance                                       | graph source records or maintained Acceptance View projection                       | User acceptance authority must remain user-controlled and cannot be replaced by generated or CI Evidence.                 |
| Maintainability Graph                     | source model for promoted Todo Search scope; canonical read/alignment model elsewhere | candidate source model only after explicit promotion approval for any broader scope | Promotion package must define exact scope, conflict handling, rollback/fallback, compatibility period, and user approval. |
| Generated read-model                      | generated Evidence                                                                    | projection/read model or source-derived generated view after approved promotion     | Generated output must remain freshness-scoped and cannot silently override source records.                                |
| View Instance Manifest                    | review Evidence for Core View coverage                                                | projection manifest or compatibility review aid                                     | View membership and role tags must remain separate from source facts.                                                     |
| Read-model parity / validation reports    | generated Evidence                                                                    | Evidence for parity, policy compliance, and source/projection drift                 | Pass status is not acceptance, promotion, or enforcement by itself.                                                       |
| Aggregate read-model summary              | Evidence-only cross-slice summary                                                     | Evidence-only summary unless a later enforcement policy is explicitly approved      | Aggregate pass remains non-promotional and must keep per-slice warnings visible.                                          |
| CI evidence manifest                      | non-enforcing CI Evidence                                                             | Evidence for repeatability; possible future required signal only after approval     | Required checks, branch protection, and enforcement need separate user decision.                                          |
| ACEP execution pack                       | compatibility package over contracts and evidence                                     | compatibility/execution package or generated projection after approved promotion    | ACEP must remain Cycle Contract / Node Execution Contract packaging, not standalone source authority.                     |
| Task-card views                           | compatibility/execution views                                                         | compatibility/execution views or generated projections from approved source records | Task cards must remain views/carriers of contract obligations, not source authority.                                      |
| Cycle Contract / Node Execution Contracts | execution authority for bounded scope                                                 | execution authority remains required regardless of source model                     | Source change must not authorize silent scope expansion or missing Evidence.                                              |
| Public docs                               | user-facing explanation                                                               | explanation of current and future states                                            | Must not claim promotion before approval or hide compatibility/public-doc cleanup caveats.                                |
| Concept docs                              | concept records and decision history                                                  | concept records and decision history                                                | Historical decisions remain visible; concept docs are not themselves operational source authority.                        |

## Proposed Staged Expansion Path

1. Execute the limited Todo Search Graph-source promotion with fallback retained.
2. Keep broader candidate source boundaries using the matrix above, including explicit source/projection/fallback roles.
3. Use [source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md) as the concrete
   rollback/fallback review input for trigger categories, precedence, snapshots, recovery paths, and
   compatibility-retirement conditions.
4. For any scope beyond the executed Todo Search branch, prepare a promotion decision package that shows Evidence,
   warnings, conflicts, public-doc cleanup status, enforcement status, and user approval choices.
5. Only after explicit user approval, execute any additional authority change with source, projection, fallback,
   compatibility, and Evidence obligations named.

## Risks And Caveats

| Risk / caveat                              | Required handling before promotion                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Tree-native vs graph/read-model conflict   | Define conflict classification, source precedence, review path, and when user judgment is required.                      |
| Stale generated Evidence                   | Keep freshness/sourceCommit visible and block hidden promotion from stale reports.                                       |
| Compatibility view confusion               | Label compatibility views, task-card views, generated read-models, and public docs as non-authoritative unless approved. |
| Acceptance/user approval boundary          | Preserve Acceptance Tree and user approval as user-controlled; CI/generation cannot self-accept.                         |
| Rollback/fallback requirements             | Review the concrete rollback/fallback plan before execution; implementation and approval remain separate.                |
| Todo App DevView Run structure-only status | Do not treat the second profile as source-authority-bearing without separate parity/pilot/authority artifacts.           |
| Invalid fixture local-only policy          | Keep negative fixtures local-only unless a separate CI invalid-fixture mode is approved.                                 |
| Enforcement ambiguity                      | Keep CI informational/non-enforcing unless required checks and branch protection are explicitly approved.                |
| Public-doc cleanup or waiver               | Batch A/B/C/D cleanup is reviewable, but waiver or sufficiency still needs explicit promotion-decision treatment.        |

## Non-Scope

This package does not:

- expand source authority beyond the executed limited scope
- approve repo-wide Graph-source promotion
- retire tree-native artifacts
- migrate artifacts
- modify public docs
- modify workflow, code, CLI, tests, or generated artifacts
- create a PR or dispatch GitHub Actions
- add required checks, branch protection, or enforcement
- add invalid fixtures to CI
- promote Todo App DevView Run beyond `structure-only`
- replace user acceptance authority

## Related Rollback / Fallback Plan

The concrete rollback/fallback plan is recorded in
[source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md). It defines fallback precedence,
rollback triggers, trigger-specific actions, snapshot/reference requirements, and compatibility-retirement guardrails.
It does not execute rollback, expand source authority, approve promotion, or retire artifacts.

## Recommended Next Decision Surface

Follow-on decision surface:

```text
broader Graph-source promotion decision package prepared
```

Rationale:

- public-doc cleanup batches A/B/C/D are now mostly addressed as review inputs
- the candidate authority matrix is now explicit
- the concrete rollback/fallback review surface is now explicit
- [broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md) now collects
  this design, the rollback/fallback plan, Evidence inventory, and decision options into a user-facing decision surface
- actual promotion still needs explicit user approval and a separate scoped execution step before any authority change
  can execute
