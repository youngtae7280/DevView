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
and now recommends `ready for limited pilot promotion decision with warnings` after manual equivalent parity artifacts
were added. It does not promote Maintainability Graph or change source authority.

The representative slice now includes manual equivalent read-model parity artifacts:

- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`

These artifacts resolve the read-model output blocker for limited pilot promotion decision preparation only. They do not
implement a generated graph builder and do not make Maintainability Graph the current source model.
The concept-level authority transition policy is defined in [source-transition-path.md](source-transition-path.md).
The concept-level recovery and compatibility safety policy is defined in
[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md).

## Confirmed Decisions

- Maintainability Graph is currently not a replacement for Product, Project, Work, Test, or control trees.
- Maintainability Graph is the long-term source promotion candidate.
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

## Related Gate

This document passes the Phase 1-2 outline threshold by defining purpose, current decisions, and open questions. It does
not pass or require detailed design.
