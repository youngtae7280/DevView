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
feasibility demonstration are complete.

Until then, it must not silently override Product Tree, Work Tree, Test Tree, Evidence Tree, Acceptance Tree, or
confirmed user decisions.

Graph-source promotion requires explicit user approval after:

1. Approval Brief policy is complete.
2. Check / Evidence policy is complete.
3. Control Node lifecycle policy is complete.
4. Legacy Compatibility Map is complete.
5. Representative runtime feasibility demonstration is complete.
6. Tree-native artifacts to Graph-source transition path is defined.
7. Rollback or compatibility strategy is defined.

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

- When should Maintainability Graph be promoted from canonical read model to source model?
- If generated, which existing tree files are sufficient inputs?
- Should graph checks become validators, evidence reports, or documentation-only review aids?

## Related Gate

This document passes the Phase 1-2 outline threshold by defining purpose, current decisions, and open questions. It does
not pass or require detailed design.
