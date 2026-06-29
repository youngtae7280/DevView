# Source Transition Path

Status: concept policy

## Document Purpose

Source Transition Path defines the concept-level authority policy for transitions from tree-native operational source
artifacts to Maintainability Graph as the source model.

It explains what must be true before source authority can change, who can approve that change, and how tree-native
artifacts, graph records, projections, contracts, user judgment, and compatibility views must remain separated during
the transition.

This document is not:

- a migration plan
- a migration script
- a CLI command design
- a schema, TypeScript model, or validator specification
- a runtime implementation
- a generated artifact design
- an implementation roadmap
- a repo-wide Graph-source promotion declaration

The current operational source is now split by explicit scope: Maintainability Graph is promoted for the Todo Search
selected-slice authority surface, Todo App PBE Run is confirmed graph-source-backed for its `structure-only` read-model
slice, and tree-native artifacts remain compatibility/fallback/reference records unless a later explicit retirement
decision changes that role.

## Core Definition

Source Transition Path:

```text
A concept-level authority transition policy describing the stages, prerequisites, invariants, and judgment boundaries
required before Maintainability Graph can be considered for source-model promotion.
```

The path exists to prevent accidental promotion. It does not move source authority by itself.

## Term Boundaries

Use these terms narrowly:

| Term                              | Boundary                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source authority change           | A user-approved change to which artifact/model is treated as operational source. This policy describes prerequisites only.                                 |
| promotion readiness               | A state where prerequisites are reviewable. It is not promotion approval.                                                                                  |
| promotion                         | Explicit user-approved source authority change. This document does not declare promotion.                                                                  |
| projection                        | A view derived from a source model. It is not product truth by itself.                                                                                     |
| generated projection              | Future possible projection produced by tooling. This policy does not design that tooling.                                                                  |
| maintained compatibility view     | Future possible compatibility artifact kept for transition, review, or rollback. It is not automatically source.                                           |
| rollback / compatibility strategy | Required policy explaining recovery and compatibility behavior. It is defined in [rollback-compatibility-strategy.md](rollback-compatibility-strategy.md). |
| migration boundary                | The line between conceptual authority change and actual artifact/model migration work. Actual migration mechanics are out of scope.                        |
| non-migration boundary            | A decision that some artifacts may remain views or compatibility records rather than being migrated. The decision is future-phase.                         |

## Transition Stages

These stages are concept labels. They are not CLI commands, migration steps, Autoflow states, schema states, or an
implementation roadmap.

| Stage                                   | Source Authority Meaning                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| current tree-native source              | Product, Project, Work, Test, Evidence, and Acceptance Trees remain the current operational source. Maintainability Graph is only a read/alignment model.                                                                 |
| graph read-model alignment              | Maintainability Graph explains and cross-checks tree-native artifacts. No source authority changes.                                                                                                                       |
| representative feasibility demonstrated | Runtime Feasibility Demonstration criteria are satisfied for a representative lifecycle slice with observable Evidence. No source authority changes.                                                                      |
| transition candidate                    | Graph-source promotion can be evaluated as a candidate only if projection/parity expectations, conflict handling, Rollback / Compatibility Strategy, source authority matrix, and promotion review Evidence are prepared. |
| explicit promotion decision             | The user explicitly approves source promotion through Approval Brief or an equivalent user judgment surface. Codex/PBE cannot self-approve.                                                                               |
| limited graph-source promoted           | Maintainability Graph is source model for an explicitly named bounded scope; tree-native artifacts remain maintained compatibility / fallback / reference artifacts for that scope.                                       |
| graph-source promoted                   | Future broader state where Maintainability Graph is the source model and trees/views may be projected from it. This document describes the broader state but does not declare it repo-wide active.                        |
| post-promotion compatibility period     | Tree-native artifacts may remain as projections, views, compatibility artifacts, or transitional records according to the approved promotion and rollback/compatibility policy.                                           |

Current state:

```text
  limited graph-source promoted for Todo Search selected-slice; confirmed structure-only graph-source-backed for Todo App PBE Run; tree-native artifacts retained as compatibility/fallback/reference
```

Current non-state:

```text
repository-wide graph-source promoted
```

Current review-input note:

```text
promotion-review-inputs-ready-with-caveats
```

The read-model Evidence stack was packaged in
[broader-graph-source-promotion-review-inputs.md](broader-graph-source-promotion-review-inputs.md). That package is a
review input surface. It supported the later limited execution record, but it does not approve repo-wide
`graph-source promoted` or retire tree-native artifacts.

Current decision-package note:

```text
promotion-decision-package-ready / preparation-complete-with-user-decision-required
```

The broader decision surface is packaged in
[broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md). That package
means the pre-promotion preparation materials were collected for user judgment. The selected limited branch is executed
by the execution record below; repo-wide promotion, tree-native retirement, enforcement, and user acceptance replacement
remain out of scope.

The limited execution record is packaged in
[broader-graph-source-promotion-execution-record.md](broader-graph-source-promotion-execution-record.md). That record
moves the Todo Search selected-slice authority surface into `limited graph-source promoted`, keeps tree-native
selected-slice artifacts as maintained compatibility / fallback / reference artifacts, and leaves repo-wide promotion,
tree-native retirement, CI enforcement, invalid-fixture CI, and Todo App promotion out of scope.

The post-promotion observation runbook is packaged in
[post-promotion-observation-runbook.md](post-promotion-observation-runbook.md). It defines health criteria, observation
records, escalation triggers, and the initial observation window for this limited promoted scope.

The next implementation branch decision surface is packaged in
[graph-source-artifact-storage-projection-design.md](graph-source-artifact-storage-projection-design.md). It recommends
Graph source artifact/storage plus projection generation, without creating artifacts or changing CLI/workflow behavior.

One remaining caveat is public-doc cleanup sufficiency or explicit waiver. The decision package is recorded in
[public-doc-cleanup-waiver-decision-package.md](public-doc-cleanup-waiver-decision-package.md). Batch A, Batch B, and
Batch C cleanup are now implemented as review candidates, and optional Batch D is reviewed and implemented only where
needed. Waiver approval remains open. [public-doc-cleanup-implementation-plan.md](public-doc-cleanup-implementation-plan.md)
records the staged cleanup sequence for that caveat; it does not change the transition stage or source authority.

The candidate broader source-authority expansion design package is recorded in
[source-authority-expansion-design-package.md](source-authority-expansion-design-package.md). It defines artifact-family
roles and a staged expansion path for future review, but it does not change the current transition stage, source
authority matrix, rollback/fallback obligations, or user approval requirements.

The concrete rollback/fallback plan for that candidate matrix is recorded in
[source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md). It defines fallback precedence,
rollback triggers, actions, snapshots, and compatibility-retirement guardrails, but it does not execute rollback or
change source authority.

The repo-wide transition mechanics status is recorded in
[repo-wide-graph-source-transition-mechanics.md](repo-wide-graph-source-transition-mechanics.md) and
`examples/read-model-aggregate/graph-source-transition-status.json`. That artifact records Graph-source as confirmed for
the configured read-model slices while preserving tree-native compatibility/fallback/reference roles, no tree
retirement, no required checks, no CI enforcement, no invalid-fixture CI, and no Todo App promotion beyond
`structure-only`. It now also records tree-native retirement readiness criteria and current per-slice readiness:
Todo Search is closer but not retirement-ready without explicit retirement approval, and Todo App is not
retirement-ready because source authority beyond `structure-only` is not approved.

The explicit retirement approval surface is prepared in
[tree-native-retirement-approval-package.md](tree-native-retirement-approval-package.md). It does not execute
retirement; it records Todo Search as a narrow approval candidate, Todo App as structure-only not ready, and repo-wide
retirement as not ready.

## Source Authority Matrix

This matrix is conceptual. It does not define files, generators, validators, or migration behavior.

| Item                                                 | Current Tree-Native Source                                                                                                                | Transition Candidate                                                                                                                                      | Post-Promotion Compatibility Period                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Product Tree                                         | Current product truth outside unconverted scopes; maintained fallback/reference for configured graph-source-backed slices.                | Must be mapped to graph Product/Intent records with no loss of acceptance criteria, UX decisions, or non-scope.                                           | May become projection/view/compatibility artifact only after explicit promotion; user-approved product meaning must remain traceable. |
| Project Tree                                         | Current operational architecture/ownership source outside unconverted scopes; maintained fallback/reference for configured slices.        | Must map architecture boundaries, surfaces, dependencies, and ownership into graph records or projections.                                                | May become projected architecture view if parity and rollback expectations are defined.                                               |
| Work Tree                                            | Current executable work source outside unconverted scopes; maintained fallback/reference for configured graph-source-backed slices.       | Must map selected/foundation/deferred/blocked/out-of-scope Work scope and dependency boundaries.                                                          | May become projected Work View; executable scope must still be bounded by contracts.                                                  |
| Test Tree                                            | Current verification source outside unconverted scopes; maintained fallback/reference for configured graph-source-backed slices.          | Must map Test, Check, criteria, and required Evidence links without weakening Check/Evidence policy.                                                      | May become projected Test/Verification View; required verification obligations must remain explicit.                                  |
| Evidence Tree                                        | Current operational proof/evidence record outside unconverted scopes; maintained fallback/reference for configured graph-source slices.   | Must preserve Evidence category, status, freshness, exception, and linked Check scope.                                                                    | May become projected Evidence View or compatibility record; Evidence gaps must not be hidden.                                         |
| Acceptance Tree                                      | Durable user-controlled acceptance state; maintained fallback/reference for promoted scope and never replaced by graph automation.        | Must preserve accepted, deferred, rejected, reopened, and invalidated acceptance state.                                                                   | User acceptance authority remains durable and cannot be replaced by Codex/PBE or graph automation.                                    |
| Maintainability Graph                                | Source model for promoted Todo Search selected-slice scope and confirmed structure-only source for Todo App PBE Run; candidate elsewhere. | Candidate source model only after feasibility Evidence, authority matrix, projection/parity, conflict, and rollback/compatibility expectations are ready. | Future source model only after explicit promotion decision; still must preserve Product-to-Acceptance traceability.                   |
| View Tree Pack                                       | Conceptual projection over tree-native artifacts; not source.                                                                             | Helps inspect candidate projections and context boundaries.                                                                                               | May become projection pack from graph source if approved; still not product truth by itself.                                          |
| Cycle Contract / Node Execution Contract             | Current execution boundary for selected/foundation scope and required Evidence.                                                           | Must remain the execution boundary regardless of source-model candidate.                                                                                  | Remains the bounded execution contract concept after promotion; source model change does not authorize silent scope expansion.        |
| Approval Brief                                       | User-facing judgment surface, not source artifact.                                                                                        | Must summarize promotion readiness, Evidence, blockers, remaining judgment, and approval choice.                                                          | Remains user judgment surface; does not replace acceptance or source records.                                                         |
| Control Nodes                                        | Conceptual control records for decisions, impact, evidence gaps, acceptance, and compatibility.                                           | Must surface blocker, decision, stale/reopen, evidence exception, and compatibility mismatch relevant to promotion.                                       | Remain control records, not authority source; closure still requires proper Evidence, decision, or compatibility disposition.         |
| `.pbe/blueprint/*` and `.pbe/codex-execution-pack/*` | Compatibility views/packages over tree-native source artifacts.                                                                           | Must be interpreted through Legacy Compatibility Map when conflicts or promotion judgments arise.                                                         | May remain compatibility artifacts or be retired only under approved compatibility policy; not silently deleted or treated as source. |

## Promotion Prerequisites

Graph-source promotion may not be requested as ready unless all of these are true:

1. Concept policies through Rollback / Compatibility Strategy are complete.
2. Representative Runtime Feasibility Demo slice selection is complete and actual Runtime Feasibility Demonstration has
   passed with observable Evidence and no hidden partial/blocking gaps.
3. No `partially demonstrated`, `blocked`, or `deferred` feasibility result is hidden from promotion review.
4. Active decisions have no unresolved conflict with the proposed authority change.
5. Rollback/fallback triggers, compatibility-retirement conditions, Evidence obligations, and control-record handling
   are reviewable under Rollback / Compatibility Strategy.
6. Source authority matrix is agreed for current, transition candidate, and post-promotion roles.
7. Node/Edge/Tag responsibilities are reflected in the candidate graph or read-model parity artifact.
8. Projection/parity expectations are defined at the level needed for promotion review.
9. Conflict resolution rules are defined for tree-native/graph mismatch.
10. Check/Evidence obligations for promotion review are defined.
11. Approval Brief, Limited Pilot Promotion Decision Package, or equivalent user judgment surface is prepared for the
    intended promotion decision scope.
12. Explicit user approval is obtained.

None of these prerequisites may be replaced by AI self-report.

## Transition Invariants

These invariants apply before, during, and after any approved source transition:

- No silent source authority switch.
- No Codex/PBE self-approval.
- No AI self-report as Evidence.
- No loss of Product -> Work -> Test -> Evidence -> Acceptance traceability.
- No hidden stale, reopened, invalidated, partial, missing, or exception Evidence state.
- No legacy/canonical mismatch silently ignored.
- No tree-native artifact marked superseded before explicit promotion.
- No loss of user-controlled Acceptance Tree authority.
- No accepted or verified branch silently revalidated by source transition alone.
- No deferred, blocked, or out-of-scope work promoted into selected scope by transition alone.
- Source transition must preserve bounded execution through Cycle Contract and Node Execution Contract.
- Source transition must preserve Control Node visibility for blockers, decisions, impact, Evidence gaps, and
  compatibility concerns that affect user judgment.

## Conflict And Drift Handling

### Current / Mixed Phase

When a tree-native artifact and Maintainability Graph read/alignment model disagree outside an explicitly promoted
scope:

```text
tree-native artifact = operational source
Maintainability Graph = alignment signal
```

The mismatch must not be silently fixed by graph interpretation.

When the disagreement is inside the limited promoted Todo Search selected-slice scope:

```text
promoted Maintainability Graph source model = scoped operational source
tree-native selected-slice artifacts = maintained compatibility / fallback / reference
```

The mismatch still must not be hidden. The fallback/reference artifacts remain reviewable, and any authority-affecting
conflict must use the rollback/fallback plan and user judgment before changing accepted product meaning, evidence state,
or execution scope.

If the mismatch affects current approval, scope, verification, or user judgment, record the appropriate control or
policy item:

- Compatibility Control Node candidate for legacy/canonical mismatch
- Evidence Control Node for missing, stale, partial, or exception Evidence
- Impact Control Node for affected completed, verified, or accepted nodes
- Decision Control Node for source, scope, risk, or policy judgment
- Open Question when the correct interpretation is not yet known
- Superseded Items only for replaced directions, not active compatibility terms

### Transition Candidate Phase

In a transition candidate phase, mismatch may become:

- promotion blocker
- partial readiness finding
- deferred issue with reason and risk
- explicit compatibility exception
- required projection/parity fix
- user decision item

The mismatch still must not be hidden. A candidate graph-source transition must explain what is affected, what Evidence
exists, what remains uncertain, and who must decide.

### Post-Promotion Compatibility Period

If a future explicit promotion occurs, remaining tree-native artifacts, compatibility views, and older packages must be
handled according to the approved Rollback / Compatibility Strategy. They must not be silently deleted, silently treated
as source, or silently ignored when they affect user judgment.

## Promotion Review Surface

Promotion requires an Approval Brief or equivalent user judgment surface.

That surface must show:

- intended source authority change
- source authority matrix summary
- feasibility Evidence summary
- projection/parity status
- conflict and mismatch summary
- Rollback / Compatibility Strategy summary
- remaining risks, Unknowns, and deferred issues
- explicit approval choice

Approval of promotion must not imply approval of unrelated product work, hidden graph state, or unreviewed compatibility
cleanup.

## Relationship To Existing Concept Policies

### Maintainability Graph

[maintainability-graph.md](maintainability-graph.md) names the long-term source candidate. This policy defines the
authority path required before that candidate can be promoted.

### Runtime Feasibility Demonstration

[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md) defines the observable readiness gate. A
successful feasibility demo is required before promotion review, but it is not sufficient by itself.

### Representative Runtime Feasibility Demo

[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md) selects the recommended slice
for future demo execution. It is a readiness artifact and does not count as observable demo Evidence by itself.

[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md) records the current manual demo
Evidence result. Its `demonstrated` status for the representative demo slice now includes fresh bounded runtime fixture
Evidence for title + note/content search and user-renewed Acceptance with retained warnings. Promotion readiness still
requires generated/parity expectation Evidence, full-product/runtime scope judgment where full promotion is requested,
and compatibility cleanup/defer judgment. PP-001 confirmation, supplemental compatibility mismatch Evidence, and Batch
A/B/C/D public-doc cleanup review exist, but they do not approve waiver or change source authority.

[graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md) records the readiness review.
It records the earlier reviewable-with-warnings limited pilot recommendation and the later Graph-first Node/Edge/Tag
refresh of the Todo Search read-model parity artifact. The user later approved the bounded limited pilot decision option
for the Todo Search selected slice, while full promotion and broad source authority change remain unapproved. Source
authority remains unchanged.

[source-authority-expansion-design-package.md](source-authority-expansion-design-package.md) is the current docs-only
candidate authority matrix for any broader source-authority expansion discussion. It must be reviewed with rollback,
fallback, compatibility, and user approval decisions before any promotion package can become executable.

[source-authority-rollback-fallback-plan.md](source-authority-rollback-fallback-plan.md) provides the matching
rollback/fallback review surface. It still leaves promotion approval, rollback execution, compatibility retirement, and
artifact snapshot mechanics as future decisions.

[broader-graph-source-promotion-decision-package.md](broader-graph-source-promotion-decision-package.md) is the current
user decision surface for the broader promotion question. It packages the review inputs, authority matrix, public-doc
cleanup state, rollback/fallback plan, and decision options without executing promotion or changing this source
transition stage.

[limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md) records the user judgment
surface for that limited pilot decision. The package is refreshed for the Node/Edge/Tag baseline, and the user approved
the bounded `Approve limited pilot promotion decision` option for the Todo Search selected slice. The resulting record is
[limited-pilot-transition-record.md](limited-pilot-transition-record.md). These records do not execute source
transition, promote Maintainability Graph, or change source authority.

[scoped-limited-pilot-transition-execution-plan.md](scoped-limited-pilot-transition-execution-plan.md) separates the next
execution modes. The user selected dry-run / review-only first, and
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md) records that
review-only observation as `usable-with-warnings`. Any scoped source-authority pilot execution still requires a separate
explicit user approval and rollback/fallback/compatibility boundary.

[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md) records the
user-approved preparation package. It defines the candidate source authority boundary, source/fallback matrix, and gates
for a possible scoped execution, but it does not execute that transition.

[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md) records the user's decision
to require generated builder / CLI-backed read-model Evidence before actual scoped execution. The requirement can
strengthen Evidence and authority-readiness gates, but it does not close rollback/fallback, compatibility, or approval
gates by itself.

[cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md) records the
design-first follow-up. The bounded Todo Search builder now creates generated read-model Evidence and a parity report.
Those outputs support readiness review only; they do not execute or approve scoped authority transition.

[scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md) records the
later user-approved Todo Search scoped source-authority pilot execution. It is bounded to
`examples/adoption/todo-search-slice`, keeps tree-native selected-slice artifacts as fallback/reference, and does not
promote Maintainability Graph as the repository-wide source model.

[scoped-source-authority-pilot-review.md](scoped-source-authority-pilot-review.md) records the first review-only
observation after that bounded execution. The review confirms source-authority containment and parity stability while
leaving broader transition decisions open.

[scoped-source-authority-pilot-active-observation.md](scoped-source-authority-pilot-active-observation.md) records the
current active observation mode. It does not advance transition stages; it defines the checks and trigger conditions that
must be reviewed before any broader transition, rollback/defer, validator/CI, or cleanup decision.

[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md) defines the
validator/CI-backed Evidence design that can support broader transition review later. The scoped Todo Search validator
command now produces local validator-backed Evidence (`validation-pass`) for the bounded pilot. That Evidence does not
change transition stage, expand source authority, add CI enforcement, or replace the user approval gate.

[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md) defines a future
non-enforcing CI-backed Evidence workflow shape for the same bounded read-model checks. The first manual
`workflow_dispatch` implementation exists for Todo Search only. It does not enforce CI gates or change the Source
Transition Path. Run `28151296796` now provides reviewed CI-backed Evidence for the Todo Search selected slice, but it
does not change transition stage or source authority.

The later aggregate-enabled manual run `28156403793` reviewed Todo Search, Todo App PBE Run structure-only, and
aggregate summary artifacts as CI-backed Evidence. Post-update run `28157938343` confirmed the same aggregate-enabled
workflow after the Node 24 action/runtime update. These runs do not change transition stage or source authority.

[graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md) defines the target Graph-first responsibility split:
Nodes are durable targets, Edges are durable semantic relationships, and Tags are temporary view-scoped roles.

[retrofit-graph-bootstrap.md](retrofit-graph-bootstrap.md) defines how existing non-PBE projects should grow Graph-first
records progressively without requiring complete upfront graph reconstruction.

Manual equivalent read-model parity artifacts are now recorded for the representative slice:

- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`

After the Node/Edge/Tag refresh, the artifacts show durable node kinds, durable edge types, view-scoped tags,
confidence/freshness separation, and 7 Core View coverage. Generated builder/CLI-backed output, scoped
validator-backed Evidence, reviewed non-enforcing CI-backed Evidence, and an explicit Todo Search read-model profile now
exist for the Todo Search pilot. A second structure-only slice and aggregate CI-backed Evidence are also reviewed as
Evidence-only. CI enforcement, `validate --all`, and full promotion remain future questions. None of this is a
repository-wide source authority change.

### Rollback / Compatibility Strategy

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines the recovery and compatibility safety
policy required before promotion review. Source transition uses that policy for rollback/fallback triggers,
compatibility views, retirement boundaries, Evidence requirements, and user judgment.

### Legacy Compatibility Map

[legacy-compatibility-map.md](legacy-compatibility-map.md) defines how legacy terms, compatibility artifacts, and
superseded/deprecated directions are interpreted. Source transition must reuse that interpretation instead of silently
rewriting compatibility meaning.

### View Tree Pack

[view-tree-pack.md](view-tree-pack.md) defines projection/read views. Source transition may change where views are
projected from only after explicit promotion; the views themselves do not become product truth.

### Execution Contract

[execution-contract.md](execution-contract.md) remains the planning/execution boundary. Source transition does not permit
execution outside selected/foundation scope or without required Checks and Evidence.

### Check / Evidence Policy

[check-evidence-policy.md](check-evidence-policy.md) defines promotion review proof rules. Promotion readiness requires
observable Evidence, not AI self-report.

### Control Node Policy

[control-node-policy.md](control-node-policy.md) defines blockers, decisions, impact, Evidence gaps, acceptance, and
compatibility control records. Source transition mismatches use those control records when they affect workflow or user
judgment.

### Approval Brief

[approval-brief.md](approval-brief.md) defines the user-facing judgment surface. Source promotion requires explicit user
approval through that surface or an equivalent review mechanism.

### PBE Runtime Architecture

[pbe-runtime-architecture.md](pbe-runtime-architecture.md) defines current runtime authority. This policy does not change
that authority; it defines the conceptual path that would be required before a future change.

### Multi-Slice Follow-Up Status

Todo Search remains the only scoped source-authority pilot. A second profile, `examples/valid/todo-app-pbe-run`, now
exists at `structure-only` level with generated/validation Evidence from canonical `.pbe` inputs. That follow-up does
not expand source authority, does not add a pilot marker, does not require manual parity, and does not implement
`validate --all`. Both current validation reports carry per-slice independence metadata, and the first aggregate summary
reads those reports as Evidence-only inputs while preserving slice-specific authority boundaries.
The manual `PBE Read-Model Evidence` workflow now includes Todo App structure-only generation/validation and aggregate
summarize, and runs `28156403793` / `28157938343` reviewed the aggregate-enabled artifact bundle as non-enforcing
CI-backed Evidence. PR informational trigger behavior is implemented as a non-enforcing visibility signal, and PR run
`28207822252` reviewed it as `pull_request-informational` / `ci-evidence-pass`. The follow-up observation policy in
[pr-informational-observation-policy.md](pr-informational-observation-policy.md) defines when to revisit filters,
failure semantics, or enforcement discussion. These workflow reviews and implementation records do not add enforcement,
`validate --all`, or source authority expansion.
[read-model-validate-all-contract.md](read-model-validate-all-contract.md) defines the design-only registry and
execution-mode contract for any future all-slice validation path; it does not implement that path or change transition
authority.

## Scope Boundaries

This policy does not implement:

- migration scripts
- CLI commands
- schemas or TypeScript models
- broader validators or aggregate validation
- runtime source-model conversion
- authority-bearing generated graph or projection artifacts
- rollback mechanics
- repo-wide Graph-source promotion

Those remain later concept or implementation questions.

## Remaining Open Questions

- How formal should projection/parity expectations be before promotion review?
- When is the executed limited Graph-source promotion branch healthy enough to start the graph source artifact/storage
  implementation branch?
- What additional approval, evidence, or migration mechanics are required before any repo-wide promotion branch?
- Does promotion review need a specialized Approval Brief template?
- During Todo Search scoped pilot active observation, what trigger should cause validator/CI-backed Evidence,
  public-doc cleanup, broader promotion review, rollback/defer, or continued observation?
- Is Batch A/B/C/D public-doc cleanup sufficient for broader repo-wide promotion, or will a future waiver be needed?
- What additional evidence is required before any broader source authority transition beyond Todo Search?
- How long should a post-promotion compatibility period last?
- Where is the boundary between automatic recovery and manual judgment when tree-native artifacts and graph records
  conflict?

## Related Gate

This policy satisfies the Source Transition Path concept-policy completion condition for Graph-source promotion
readiness.

It does not complete rollback mechanics, compatibility artifact generation, projection/parity implementation, migration
mechanics, evidence strengthening after a partial actual demo result, or Graph-source promotion itself.
