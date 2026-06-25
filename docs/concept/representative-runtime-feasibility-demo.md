# Representative Runtime Feasibility Demo

Status: concept readiness artifact

## Document Purpose

Representative Runtime Feasibility Demo defines the slice-selection and Evidence review criteria for a future
evidence-bearing Runtime Feasibility Demonstration.

It answers this question:

```text
Which representative PBE lifecycle slice should be used before actual demo execution can produce meaningful feasibility
Evidence?
```

This document provides no runtime feasibility Evidence by itself.

The current manual Evidence result for this selected slice is recorded separately in
[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md). That result is
`demonstrated` for the representative demo slice with retained warnings and does not promote Maintainability Graph. It
now includes selected-slice demo-support Project/Contract, Change/Impact, Approval Brief, Compatibility Review, Evidence
Exception artifacts, supplemental compatibility mismatch evidence, PP-001 confirmation, bounded runtime fixture Evidence,
and user-renewed Acceptance.

The promotion readiness review is recorded in
[graph-source-promotion-readiness-review.md](graph-source-promotion-readiness-review.md). It classifies retained warnings
and now records the Graph-first Node/Edge/Tag parity refresh for limited pilot review. It does not approve Graph-source
promotion.

The representative slice now also has manual equivalent read-model parity artifacts:

- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.md`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/todo-search-slice/view-instance-manifest.json`
- `examples/adoption/todo-search-slice/view-instance-manifest.md`

These artifacts now support renewed limited pilot user decision preparation with warnings under the Node/Edge/Tag
taxonomy, but they are not generated builder implementation and do not promote source authority.

The user judgment surface for that decision is recorded in
[limited-pilot-promotion-decision-package.md](limited-pilot-promotion-decision-package.md). The user approved the
bounded limited pilot option for the Todo Search selected slice, and
[limited-pilot-transition-record.md](limited-pilot-transition-record.md) records that decision. This is not full
promotion execution or broad source authority change.

This document is not:

- actual demo execution
- a CLI command design
- a schema, TypeScript model, or validator specification
- test automation
- a generated artifact specification
- a coding prompt
- a migration script
- a rollback command design
- a Graph-source promotion declaration

The current operational source remains tree-native artifacts. Maintainability Graph remains a canonical read/alignment
model and long-term source-model candidate until a separate source promotion phase receives explicit user approval.

## Core Definition

Representative Runtime Feasibility Demo:

```text
A pre-execution readiness artifact that selects a representative lifecycle slice and defines what observable Evidence
must exist before a future runtime feasibility demo can be treated as meaningful.
```

It is not proof of the entire PBE implementation. It is a bounded way to inspect whether one lifecycle slice can connect:

```text
Product intent
-> Project / Work
-> Test / Evidence
-> Approval Brief
-> Acceptance
-> Change / Impact
-> Control Nodes
-> Legacy compatibility interpretation
```

The selected slice must be strong enough to test the conceptual chain without moving source authority to Maintainability
Graph.

## Slice Selection Criteria

A representative slice must satisfy all of these criteria during actual demo execution:

| Criterion                     | Required Meaning                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Product intent and acceptance | User intent, acceptance meaning, selected scope, deferred scope, and non-scope are visible.                           |
| Traceability                  | Product -> Project -> Work -> Test -> Evidence -> Acceptance can be reviewed without hidden links.                    |
| Contract boundary             | Cycle Contract and Node Execution Contract can explain included, foundation, deferred, and forbidden work.            |
| Happy path                    | Selected work can move through execution, verification, Approval Brief, and user review.                              |
| Stale/reopen path             | Change or drift can mark affected work, test, Evidence, or Acceptance stale/invalidated/reopened.                     |
| Evidence exception            | Missing, stale, partial, or exception Evidence can be represented without being treated as proof.                     |
| Decision required             | User scope, risk, defer, product-patch, or acceptance judgment can be represented as a required decision.             |
| Compatibility mismatch        | At least one legacy/canonical mismatch exists or is explicitly simulated without changing source authority.           |
| Scope boundary                | Out-of-contract discovery or forbidden scope can be represented as stop/change/decision rather than silent expansion. |
| Graph read/alignment          | Maintainability Graph interpretation can be shown as read/alignment only, without source promotion.                   |

A slice that only proves happy-path execution is not sufficient. A slice that requires proving the entire PBE runtime is
too broad.

## Candidate Slice Review

The candidate review uses existing public docs and example snapshots only. It does not run a demo, create fixtures,
execute CLI commands, or write `.pbe` artifacts.

### Candidate A: Todo Search Adoption + Product Meaning Feedback

Source documents and snapshots:

- [../dogfooding-existing-project.md](../dogfooding-existing-project.md)
- [../../examples/adoption/todo-search-slice/README.md](../../examples/adoption/todo-search-slice/README.md)
- [../../examples/adoption/todo-search-slice/product-tree.json](../../examples/adoption/todo-search-slice/product-tree.json)
- [../../examples/adoption/todo-search-slice/work-tree.json](../../examples/adoption/todo-search-slice/work-tree.json)
- [../../examples/adoption/todo-search-slice/test-tree.json](../../examples/adoption/todo-search-slice/test-tree.json)
- [../../examples/adoption/todo-search-slice/evidence-tree.json](../../examples/adoption/todo-search-slice/evidence-tree.json)
- [../../examples/adoption/todo-search-slice/acceptance-tree.json](../../examples/adoption/todo-search-slice/acceptance-tree.json)
- [../../examples/adoption/todo-search-slice/product-patch-tree.json](../../examples/adoption/todo-search-slice/product-patch-tree.json)

Summary:

```text
An existing Todo app adopts PBE for the next small slice: title-only Todo search. After user acceptance, the user changes
product meaning by saying search should include note content.
```

Coverage strengths:

- Shows rough request, ambiguity, selected first slice, deferred search targets, and user confirmation pressure.
- Has illustrative Product, Work, Test, Evidence, Acceptance, and Product Patch snapshots.
- Demonstrates Product -> Work -> Test -> Evidence -> Acceptance links for title-only search.
- Provides natural stale/reopen pressure when accepted title-only search changes to title + note search.
- Shows Decision required behavior through title-only scope confirmation and product patch confirmation.
- Has clear scope boundary candidates: tag/date/fuzzy/server/saved search and note search before product patch.
- Supports Evidence exception or partial Evidence when manual empty-state review is missing, stale, or insufficient.

Missing scenario coverage:

- Project Tree and Cycle/Node Execution Contract snapshots are not present in the adoption example; actual demo execution
  must add or reference reviewable Project and Contract records.
- Compatibility mismatch is not explicit and must be found in real compatibility artifacts or marked as simulated.
- Change/Impact records for the product meaning feedback are proposed conceptually; actual demo execution must name
  affected Product/Work/Test/Evidence/Acceptance records and classify stale/invalidated/reopened/unaffected/refreshed.

Risk of becoming too broad:

- Moderate. The slice must stay title-only until the product patch is explicitly approved.
- Do not expand into tag/date/server/fuzzy search, full existing-project adoption, or all Todo app behavior.

Evidence observability:

- High for Product, Work, Test, Evidence, Acceptance, and Product Patch snapshots already present.
- Partial for Project/Contract, Change/Impact, and compatibility mismatch until actual demo execution provides or marks
  those records.

Compatibility usefulness:

- Medium-high. It bridges public dogfooding docs, tree-native snapshots, RPD/WPD/VD/Revision compatibility terms, and
  future compatibility mismatch handling.

Recommendation:

```text
Recommended primary representative slice.
```

### Candidate B: USB Selected, Ethernet Deferred Foundation

Source documents:

- [../golden-scenarios.md](../golden-scenarios.md)
- [../workflow.md](../workflow.md)
- [../tree-model.md](../tree-model.md)
- [../execution-contracts.md](../execution-contracts.md)
- [../evidence-and-coverage.md](../evidence-and-coverage.md)
- [../result-review.md](../result-review.md)

Summary:

```text
User selects USB status for the current slice, defers Ethernet behavior, and allows only the Ethernet foundation needed
for future compatibility.
```

Coverage strengths:

- Best scope-boundary story: selected, deferred, required foundation, and architecture runway decision.
- Naturally exercises execution contract boundaries and deferred work not counted as failure.
- Useful for foundation-only work, dependency impact, and out-of-contract Ethernet behavior.

Missing scenario coverage:

- Prose-only in current docs; no linked Product/Work/Test/Evidence/Acceptance fixture was found.
- Stale/reopen path, Evidence exception, and compatibility mismatch must be added or simulated.
- Concrete graph read/alignment Evidence would need future artifact support.

Risk of becoming too broad:

- High. It can sprawl into hardware, connection architecture, parallel safety, UI, future Ethernet behavior, and rollback
  readiness all at once.

Evidence observability:

- Low-medium now because it is scenario text rather than artifact snapshot.

Compatibility usefulness:

- High conceptually because Source of Truth Matrix, Foundation Contract, Parallel Safety Contract, ACEP, and task-card
  compatibility can be discussed.

Recommendation:

```text
Use as scope-boundary fallback or stress slice, not the primary representative slice.
```

### Candidate C: Todo Add Golden Run + Negative Fixture Lenses

Source documents and snapshots:

- [../../examples/valid/todo-app-pbe-run/README.md](../../examples/valid/todo-app-pbe-run/README.md)
- [../tree-model.md](../tree-model.md)
- [../traceability.md](../traceability.md)
- [../evidence-and-coverage.md](../evidence-and-coverage.md)
- [../user-acceptance.md](../user-acceptance.md)

Summary:

```text
Tiny Todo add flow with Product, Project, Work, Test, Cycle, Evidence, Acceptance, and compatibility blueprint views.
```

Coverage strengths:

- Cleanest full tree-native happy path with `.pbe` layout and compatibility blueprint views.
- Strong calibration baseline for Product -> Project -> Work -> Test -> Evidence -> Acceptance.
- Good for source artifact reference and compatibility view visibility.

Missing scenario coverage:

- Too happy-path by itself.
- Weak on decision required, product meaning feedback, compatibility mismatch, and stale/reopen unless paired with
  separate negative or revision fixtures.

Risk of becoming too broad:

- High if turned into a matrix of all valid and invalid examples instead of one representative slice.

Evidence observability:

- Very high for happy path, fragmented for stress paths.

Compatibility usefulness:

- High as calibration baseline because it contains v2 tree-native layout plus `.pbe/blueprint/*` compatibility views.

Recommendation:

```text
Use as calibration baseline for missing Project/Cycle/Contract evidence, not the primary representative slice.
```

## Recommended Representative Slice

### Slice Name

```text
Todo Search Adoption + Product Meaning Feedback
```

### Source Documents Referenced

- [../dogfooding-existing-project.md](../dogfooding-existing-project.md)
- [../workflow.md](../workflow.md)
- [../tree-model.md](../tree-model.md)
- [../execution-contracts.md](../execution-contracts.md)
- [../traceability.md](../traceability.md)
- [../evidence-and-coverage.md](../evidence-and-coverage.md)
- [../result-review.md](../result-review.md)
- [../revision-flow.md](../revision-flow.md)
- [../change-impact-revision.md](../change-impact-revision.md)
- [../user-acceptance.md](../user-acceptance.md)
- [../acep.md](../acep.md)
- [../../examples/adoption/todo-search-slice/README.md](../../examples/adoption/todo-search-slice/README.md)

### Included Lifecycle Claims

The future demo should attempt to show:

1. Product intent records original title-only Todo search and confirmed PP-001 title + note/content revision meaning.
2. Deferred/non-scope search targets are explicit: tag, date, fuzzy, server-side, saved search, and note/content behavior
   beyond the confirmed title + note/content semantics.
3. Product -> Work -> Test -> Evidence -> Acceptance links are reviewable from existing adoption snapshots.
4. Project Tree and Cycle/Node Execution Contract boundaries are added or referenced during actual demo execution.
5. Work scope includes `src/todo-list.tsx` and `src/todo-search.ts`, while forbidding `src/tag-filter.ts` and
   `src/server-search.ts`.
6. Test and Evidence records verify title query filtering, empty query restore, and no-result empty state.
7. Approval Brief summarizes intent, result, verification, remaining judgment, and user approval choice.
8. User acceptance remains separate from Codex submission.
9. Product meaning feedback changes the accepted title-only behavior toward title + note search.
10. Change/Impact handling marks affected Product/Work/Test/Evidence/Acceptance records stale, invalidated, reopened,
    unaffected, or refreshed.
11. Evidence exception can be represented if manual empty-state review is missing, stale, or insufficient after feedback.
12. Decision Control Node can represent title-only scope confirmation or Product Patch confirmation.
13. Compatibility Control Node candidate can represent old ACEP/task-card or `.pbe/blueprint/*` wording that would
    otherwise imply task-card-only authority.
14. Maintainability Graph can read and align the slice without becoming source.

### Non-Scope Claims

The future demo should not claim:

- all PBE runtime features are implemented
- Graph-source promotion is ready or approved
- Maintainability Graph is current source authority
- all Todo app behavior is under PBE
- tag/date/fuzzy/server-side/saved search is implemented
- note/description search is implemented before user-confirmed Product Patch
- visual UI parity is demonstrated
- generated graph artifacts, validators, or CLI commands exist
- compatibility artifacts are retired
- rollback mechanics exist

### Required Observable Evidence Categories

A future demo result should include or reference:

- source artifact references for tree-native Product, Project, Work, Test, Evidence, and Acceptance records
- Cycle Contract and Node Execution Contract excerpts or explicit `missing/partial` status if not present
- traceability matrix or equivalent Product -> Work -> Test -> Evidence path
- Product Patch or Change/Impact records for the title-to-note meaning shift
- validation or command output when available
- static inspection note for source authority and compatibility wording
- Evidence status summary showing `present`, `missing`, `stale`, `partial`, `not-applicable`, or `exception`
- Approval Brief draft or review surface
- Control Node summary for decision, evidence, impact/reopen, acceptance, and compatibility situations
- Legacy Compatibility Map interpretation note for ACEP/task-card or `.pbe/blueprint/*` mismatch
- rollback/compatibility readiness note using concept labels only

### Required Control / Approval Situations

The future demo should include:

| Situation                | Required Meaning                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Ready for approval       | Title-only Todo search has sufficient Evidence or explicit not-applicable handling.                                     |
| Review with warning      | Non-blocking Evidence exception or partial/stale Evidence is visible.                                                   |
| Decision required        | User must confirm title-only scope, Product Patch, risk/defer decision, or Evidence exception.                          |
| Blocked                  | Required selected-scope Evidence is missing and no valid exception or decision exists.                                  |
| Change / Impact          | Product meaning feedback affects current Evidence or Acceptance and triggers stale/invalidated/reopened classification. |
| Compatibility candidate  | Legacy/compatibility wording could affect execution authority or review judgment.                                       |
| Rollback readiness label | Rollback status is named only as concept review note, such as `rollback-not-needed` or `rollback-blocked`.              |

### Expected Demo Result Statuses

The future demo may report these feasibility statuses per claim:

- `demonstrated` for Product -> Work -> Test -> Evidence -> Acceptance traceability if linked records are present
- `demonstrated` for user acceptance separation if review/acceptance records are present
- `partially demonstrated` for Project/Cycle/Node Contract boundary if actual demo execution cannot provide the missing
  adoption snapshots
- `partially demonstrated` for compatibility mismatch if the mismatch is simulated rather than found in real artifacts
- `deferred` for visual UI parity, full Todo app adoption, generated graph artifacts, validators, and Graph-source
  promotion mechanics
- `blocked` for any selected title-search behavior that lacks required Evidence and lacks valid exception
- `not-applicable` for claims outside the selected slice

Avoid `rollback-ready` or `rollback-complete` unless future Evidence includes authority state, snapshots/projections,
Acceptance impact, open Control Nodes, and user judgment. The likely readiness label for this slice is
`rollback-not-needed` or `rollback-blocked`, depending on observed gaps.

### Known Limitations

- The slice is representative, not exhaustive.
- Existing adoption snapshots do not include Project Tree, Cycle Contract, Node Execution Contract, or full
  Change/Impact records.
- Actual demo execution must name affected Product/Work/Test/Evidence/Acceptance records for stale/reopen claims.
- Compatibility mismatch may need to be simulated; if simulated, the compatibility claim should be only
  `partially demonstrated`.
- The slice does not prove visual UI parity, generated graph artifacts, validators, migration, rollback mechanics, or
  Graph-source promotion readiness by itself.

### Why This Is A Good Pre-Execution Slice

This slice is the best current representative candidate because it combines:

- a small existing-project adoption story
- confirmed Product intent and acceptance criteria
- selected and deferred scope
- linked Work/Test/Evidence/Acceptance snapshots
- user acceptance authority
- product meaning feedback after acceptance
- natural stale/reopen pressure
- room for Evidence exception and compatibility mismatch checks
- Maintainability Graph read/alignment without source authority movement

It is strong enough to prepare actual demo execution, but still narrow enough to avoid becoming an all-runtime proof.

## Demo Evidence Review Checklist

A future demo result may count as evidence-bearing only if all required items below are reviewable.

This checklist is review criteria. It is not a validator specification, schema, CLI output contract, or test automation
plan.

| Checklist Item                    | Acceptance Criterion                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Source references                 | Source artifact references are explicit and distinguish tree-native source from compatibility views.                 |
| Graph read/alignment              | Maintainability Graph interpretation is shown without mutating source authority.                                     |
| Traceability                      | Product -> Project -> Work -> Test -> Evidence -> Acceptance path is reviewable.                                     |
| Contract boundary                 | Cycle Contract and Node Execution Contract boundary is reviewable, including forbidden/deferred scope.               |
| Check/Evidence separation         | Required Checks, Evidence categories, Evidence status, and Evidence exceptions are distinct.                         |
| Approval Brief                    | Result is summarized as user-facing intent/result/verification/remaining judgment/approval choice.                   |
| Control Node visibility           | Only user-relevant blocker, decision, stale/reopen, evidence, acceptance, and compatibility situations are surfaced. |
| Legacy compatibility              | Legacy Compatibility Map is used when ACEP/task-card or `.pbe/blueprint/*` mismatch appears.                         |
| Rollback / Compatibility Strategy | Rollback/compatibility readiness labels are concept labels only and do not imply rollback implementation.            |
| Evidence safety                   | AI self-report is not treated as Evidence.                                                                           |
| Non-promotion statement           | Demo output explicitly states that slice selection and demo success do not promote Maintainability Graph.            |

If any required item is missing, the demo result must report `partially demonstrated`, `blocked`, `deferred`, or
`not-applicable` rather than presenting the slice as fully demonstrated.

## Demo Output Shape

A future demo result should report:

1. selected slice name
2. source documents and source artifacts referenced
3. scenario coverage matrix
4. Evidence references
5. unresolved gaps
6. feasibility status per claim
7. Check/Evidence status summary
8. Control Node and Approval Brief summary
9. rollback/compatibility readiness notes
10. explicit non-promotion statement

This output shape is conceptual. It is not a generated artifact specification, CLI output specification, validator output
specification, or template implementation.

## Promotion Boundary

Representative slice selection is not actual demo execution.

Actual demo execution must still produce observable Evidence and linked records before feasibility can be described as
`demonstrated`.

Even if the future demo passes, Graph-source promotion still requires:

- Source Transition Path prerequisites
- Rollback / Compatibility Strategy conditions
- projection/parity expectations
- conflict handling
- Approval Brief or equivalent user judgment surface
- explicit user approval

Partial, blocked, or deferred demo results must become promotion blockers, open questions, or visible risks until
resolved. They must not be hidden behind AI summary.

## Relationship To Existing Concept Policies

### Runtime Feasibility Demonstration

[runtime-feasibility-demonstration.md](runtime-feasibility-demonstration.md) defines what a future demo must prove. This
readiness artifact selects the representative slice and Evidence review checklist for that future demo.

The current manual result is recorded in
[actual-runtime-feasibility-demo-result.md](actual-runtime-feasibility-demo-result.md). It confirms the selected slice is
demonstrated with retained warnings: selected-slice Project/Contract/Change/Impact evidence has been strengthened,
Product Patch confirmation and fresh bounded runtime fixture Evidence are recorded, and renewed Acceptance is approved by
the user. A supplemental compatibility mismatch slice covers the real mismatch path outside the Todo Search product
slice. The later readiness review treated the manual read-model parity artifact as sufficient for limited pilot decision
preparation in the earlier review cycle, while generated builder output remains a full-promotion/repeatability question.
After the Graph-first Node/Edge/Tag refresh, the parity artifact can support a renewed limited pilot user decision while
full promotion approval remains separate. The user has approved the bounded limited pilot option only.

### Source Transition Path

[source-transition-path.md](source-transition-path.md) requires representative feasibility Evidence before source
promotion can be reviewed. This document does not satisfy the Evidence requirement by itself; it prepares the future
demo.

### Rollback / Compatibility Strategy

[rollback-compatibility-strategy.md](rollback-compatibility-strategy.md) defines rollback/fallback and compatibility
view safety. The future demo should include rollback/compatibility readiness notes only as concept labels.

### Maintainability Graph

[maintainability-graph.md](maintainability-graph.md) remains read/alignment model only. The future demo may show graph
interpretation of the slice, but not source promotion.

### PBE Runtime Architecture

[pbe-runtime-architecture.md](pbe-runtime-architecture.md) defines the current tree-native runtime authority. The
representative slice is selected to observe that authority, not replace it.

### Check / Evidence, Approval Brief, And Control Node Policies

[check-evidence-policy.md](check-evidence-policy.md), [approval-brief.md](approval-brief.md), and
[control-node-policy.md](control-node-policy.md) define proof, user judgment surface, and control visibility. The future
demo must reuse them rather than inventing separate demo-only proof rules.

### Legacy Compatibility Map

[legacy-compatibility-map.md](legacy-compatibility-map.md) defines how ACEP, task cards, `.pbe/blueprint/*`, and older
terms should be read. Compatibility mismatch in the demo must use that map before becoming a Compatibility Control Node
candidate.

## Scope Boundaries

This readiness artifact does not implement:

- actual demo execution
- source code changes
- CLI commands
- schemas or TypeScript models
- validators
- test automation
- generated artifacts
- migration scripts
- rollback mechanics
- Graph-source promotion

Those remain later concept or implementation questions.

## Remaining Open Questions

- Should the future demo result be a generated artifact or a manual Evidence pack?
- How should future demo Evidence connect to CI or validators?
- Does promotion review need a specialized Approval Brief template?
- After the usable-with-warnings dry-run, will the user proceed to scoped source-authority pilot preparation, require
  prerequisites first, run another dry-run, defer, or reject the scoped pilot?
- Will the user accept ACEP task-card public-doc cleanup as deferred cleanup, or require cleanup before promotion
  approval?
- Does full Graph-source promotion require an actual generated graph builder or CLI-backed read-model output?

## Related Gate

This document satisfies the representative slice selection condition before actual Runtime Feasibility Demonstration
execution.

The separate actual demo result records a strengthened manual Evidence pack demonstrated for the representative slice
with retained warnings. This document still does not complete generated result design, validation automation, source
promotion approval, or Graph-source promotion.
