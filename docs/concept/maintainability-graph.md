# Maintainability Graph

Status: canonical candidate

## Document Purpose

Maintainability Graph names the conceptual traceability view that keeps PBE understandable and reviewable as projects
move through requirements, work, tests, evidence, review, change, and acceptance.

It narrows older "Knowledge Graph" language into a PBE-specific concept.

## Scope

This document defines the graph's conceptual nodes, edges, and guardrails.

It does not define a stored graph file, query engine, visualization, schema, validator, or migration script.

## Current Definition

The Maintainability Graph is a read model over existing PBE sources of truth. It connects:

- Product, Project, Work, Test, Cycle, Change, Impact, Evidence, and Acceptance nodes
- acceptance criteria
- human decisions
- scope classifications
- execution contracts
- validation and evidence links
- reopened or invalidated branches

The graph is maintainability-focused because it answers questions such as:

- Why does this work exist?
- Which Product branch does it satisfy?
- Which tests and evidence prove it?
- Which acceptance criteria remain uncovered?
- Which completed nodes are stale after feedback?
- Which compatibility views are projections rather than sources of truth?

## Target Graph-First Model

The target Graph-first architecture treats Maintainability Graph as the future source model only after explicit
Graph-source promotion.

In that target:

```text
Graph = source model
Tree = task or human-readable projection
View Tree Pack = task-scoped projection
```

The core of Graph-first PBE is not simply that nodes exist. The core is the durable semantic relationship between nodes.
Maintaining edge meaning is what lets PBE answer why work exists, what implements it, what verifies it, what evidences
it, what became stale, and which user decision controls acceptance or source authority.

Node, Edge, and Tag responsibilities are defined in
[graph-node-edge-tag-policy.md](graph-node-edge-tag-policy.md):

- Node = durable target
- Edge = durable semantic relationship
- Tag = temporary role inside a View Instance

Meaningful relationships belong to Edges, not Tags. For example:

- `code implements behavior` is an `implements` edge.
- `check verifies behavior` is a `verifies` edge.
- `evidence evidences check` is an `evidences` edge.
- `finding reports-on code` is a `reports-on` edge.

[view-tree-pack.md](view-tree-pack.md) defines how a task-scoped projection can be assembled from tree-native artifacts
today and from Maintainability Graph after a future explicit promotion.

## Retrofit Bootstrap

Existing projects that did not start with PBE should not be forced into complete upfront graph reconstruction.

[retrofit-graph-bootstrap.md](retrofit-graph-bootstrap.md) defines the progressive path:

```text
structural bootstrap
-> behavior inference
-> finding / unknown records
-> task-driven expansion
-> verified graph growth
```

Observed Behavior is not Product Requirement. Inferred edges must keep confidence and freshness/status visible. AI
self-report is not Evidence.

## Source Promotion Target

Maintainability Graph is currently a canonical read model over tree-native source artifacts.

The long-term target is to promote it into the source model after the required policies, compatibility mapping, and
representative feasibility demonstration are complete.

Until then, it must not silently override Product Tree, Work Tree, Test Tree, Evidence Tree, Acceptance Tree, or
confirmed user decisions.

Graph-source promotion requires explicit user approval after:

1. Approval Brief policy is complete.
2. Check / Evidence policy is complete.
3. Control Node lifecycle policy is complete.
4. Legacy Compatibility Map is complete.
5. Runtime Feasibility Demonstration policy is complete, the representative demo slice is selected, and an actual
   representative demo result has passed with observable Evidence and no hidden partial/blocking gaps.
6. Source Transition Path policy is complete and the source authority matrix is agreed.
7. Rollback / Compatibility Strategy policy is complete.

The concept-level feasibility standard is defined in
[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md).
The representative slice and Evidence review criteria are defined in
[representative-runtime-feasibility-demo.md](representative-runtime-feasibility-demo.md).
The current manual actual demo result is recorded in
[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md). Its `demonstrated` judgment for
the representative demo slice records retained warnings and does not satisfy promotion readiness by itself. Supplemental
compatibility mismatch Evidence, PP-001 confirmation, bounded runtime fixture Evidence, and user-renewed Acceptance
strengthen the compatibility and stale/reopen paths, but generated read-model output, full-product/runtime scope
judgment, and cleanup judgment remain unresolved for promotion approval.
The promotion readiness review is recorded in
[graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md). It classifies retained warnings
and records that the earlier reviewable-with-warnings limited pilot recommendation has now been refreshed under the
Graph-first Node/Edge/Tag taxonomy for limited pilot review. Promotion state remains `Decision required`; the review does
not promote Maintainability Graph or change source authority.

The limited pilot user judgment surface is recorded in
[limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md). It is now refreshed for the
Node/Edge/Tag baseline, and the user approved the bounded `Approve limited pilot promotion decision` option for the Todo
Search selected slice. The resulting bounded record is
[limited-pilot-transition-record.md](limited-pilot-transition-record.md). These records do not make Maintainability
Graph the current source model.

[scoped-limited-pilot-transition-execution-plan.md](scoped-limited-pilot-transition-execution-plan.md) defines the
execution-mode choices. The user selected the dry-run / review-only path, and the observation is recorded in
[dry-run-scoped-limited-pilot-observation-record.md](dry-run-scoped-limited-pilot-observation-record.md) as
`usable-with-warnings`. It exercises Maintainability Graph as a read/alignment model without source authority change.

[scoped-source-authority-pilot-preparation-package.md](scoped-source-authority-pilot-preparation-package.md) records the
user-approved preparation package for a possible scoped source-authority pilot. It recommends generated builder /
CLI-backed read-model output before authority-bearing execution and keeps current source authority unchanged.

[scoped-source-authority-pilot-execution-record.md](scoped-source-authority-pilot-execution-record.md) records the later
user-approved bounded execution for `examples/adoption/todo-search-slice` only. In that scoped pilot, generated
read-model Evidence is accepted as the bounded pilot interpretation record for Node/Edge/Tag interpretation and 7 Core
View traversal, while tree-native selected-slice artifacts remain fallback/reference. This is not full Maintainability
Graph promotion and does not make the graph the repository-wide source model.

[scoped-source-authority-pilot-review.md](scoped-source-authority-pilot-review.md) records a later review-only
observation of that bounded pilot. The review outcome is `scoped-pilot-review-pass-with-retained-warnings`; it confirms
parity stability and fallback readiness without expanding source authority.

[scoped-source-authority-pilot-active-observation.md](scoped-source-authority-pilot-active-observation.md) records the
current `keep-active-with-retained-warnings` stance. The pilot remains bounded to the Todo Search selected slice while
observation triggers determine whether the next user decision is continued observation, validator/CI-backed Evidence,
public-doc cleanup, broader promotion review, rollback, or deferral.

[validator-ci-backed-read-model-evidence-design.md](validator-ci-backed-read-model-evidence-design.md) records the
design for that validator/CI-backed Evidence branch. It keeps validation Evidence distinct from source authority and user
approval.

[ci-backed-read-model-evidence-workflow-design.md](ci-backed-read-model-evidence-workflow-design.md) records the CI
workflow integration design for read-model Evidence. The first implementation is manual and non-enforcing, and it does
not add CI enforcement or broaden Maintainability Graph source authority. Run `28151296796` is reviewed as
`ci-evidence-pass` for the Todo Search selected slice only.

[multi-slice-read-model-validation-design.md](multi-slice-read-model-validation-design.md) records the next design step
for validation beyond the Todo Search slice. It treats multi-slice validation as Evidence-only, selects
`examples/valid/todo-app-pbe-run` as the next structural candidate, and requires Todo Search hardcoding to be isolated
behind a future slice profile/config before implementation.

[generated-read-model-evidence-requirement.md](generated-read-model-evidence-requirement.md) records the user's decision
to require generated builder / CLI-backed read-model Evidence before actual scoped execution. It is an Evidence
prerequisite, not builder implementation and not source authority change.

[cli-backed-read-model-evidence-output-design.md](cli-backed-read-model-evidence-output-design.md) records the user's
design-first choice. It defines conceptual command surfaces, output artifacts, comparison rules, mismatch severity, and
gate relationships. A bounded Todo Search generated read-model builder now implements that design for selected-slice
Evidence only; it does not change source authority.

The representative slice now includes manual equivalent read-model parity artifacts:

- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`

These artifacts now separate durable Node kinds, durable Edge types, and view-scoped Tags for the 7 Core Views. They
resolve the Graph-first parity refresh blocker for limited pilot review only. They do not implement a generated graph
builder and do not make Maintainability Graph the current source model.
The concept-level authority transition policy is defined in [source-transition-path.md](source-transition-path.md).
The concept-level recovery and compatibility safety policy is defined in
[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md).

## Confirmed Decisions

- Maintainability Graph is currently not a replacement for Product, Project, Work, Test, or control trees.
- Maintainability Graph is the long-term source promotion candidate.
- Maintainability Graph is edge-centric: durable semantic relationships are Edges, not Tags.
- View Tree Pack is a projection over source records, not source authority.
- It is not a generic knowledge graph.
- It must preserve traceability back to Product truth and user-controlled acceptance.
- It must not infer new product meaning without a Product or Change node.

## Conceptual Edges

| Edge                   | Meaning                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| Product -> Project     | Product meaning derives architecture boundaries and surfaces.    |
| Project -> Work        | Architecture ownership derives executable work.                  |
| Work -> Test           | Work nodes require verification.                                 |
| Test -> Evidence       | Verification requires proof or a not-runnable explanation.       |
| Cycle -> Contract      | Selected scope is packaged before execution.                     |
| Change -> Impact       | Feedback or drift maps to affected nodes.                        |
| Impact -> Reopen       | Affected completed nodes become stale, invalidated, or reopened. |
| Evidence -> Acceptance | Current proof supports user-controlled acceptance.               |

## Legacy Term Mapping

`Knowledge Graph` is a legacy or general phrase. Use `Maintainability Graph` when describing this PBE-specific
traceability view.

## Remaining Open Questions

- OQ-001: When should Maintainability Graph be promoted from canonical read model to source model?
- OQ-026: Which existing tree-native artifacts are sufficient inputs for future generated/read-model support?
- OQ-027: Should graph checks become validators, evidence reports, documentation-only review aids, or a combination?
- OQ-052: Does full Graph-source promotion require an actual generated graph builder or CLI-backed read-model output?
- OQ-071: What active-observation trigger should cause validator/CI-backed Evidence, public-doc cleanup, broader
  promotion review, rollback/defer, or continued observation?
- OQ-054: Should `task` and `view-instance` be first-class node kinds or durable records outside node kind?

## Related Gate

This document passes the Phase 1-2 outline threshold by defining purpose, current decisions, and open questions. It does
not pass or require detailed design.
