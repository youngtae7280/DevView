# Generated Read-Model Evidence

Status: generated-present / evidence-only / source-authority-unchanged

## Run Identity

- Generated at: 2026-06-25T07:57:32.932Z
- Command identity: `pbe graph read-model generate --slice examples/adoption/todo-search-slice`
- Source commit: 16d15c1
- Source slice: `examples/adoption/todo-search-slice`

## Boundary

Tree-native selected-slice artifacts remain current operational source.

Generated output is reviewable Evidence only and cannot change source authority without later explicit user approval.

## Source Inputs

- examples/adoption/todo-search-slice/product-tree.json: present
- examples/adoption/todo-search-slice/project-tree.json: present
- examples/adoption/todo-search-slice/work-tree.json: present
- examples/adoption/todo-search-slice/test-tree.json: present
- examples/adoption/todo-search-slice/evidence-tree.json: present
- examples/adoption/todo-search-slice/acceptance-tree.json: present
- examples/adoption/todo-search-slice/change-tree.json: present
- examples/adoption/todo-search-slice/impact-tree.json: present
- examples/adoption/todo-search-slice/product-patch-tree.json: present
- examples/adoption/todo-search-slice/cycle-contract.md: present
- examples/adoption/todo-search-slice/node-execution-contracts/wt-search-001.md: present
- examples/adoption/todo-search-slice/runtime-evidence.md: present
- examples/adoption/todo-search-slice/approval-brief.md: present
- examples/adoption/todo-search-slice/evidence-exceptions.md: present
- examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json: present
- docs/concept/scoped-source-authority-pilot-execution-record.md: present
- docs/concept/scoped-source-authority-pilot-review.md: present
- docs/concept/scoped-source-authority-pilot-active-observation.md: present
- examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md: present

## Node / Edge / Tag Summary

- Nodes: 40
- Edges: 59
- Node kinds: task,requirement,behavior,code,data,check,evidence,decision,change,finding,document,view-instance
- Edge types:
  targets,requires,satisfies,preserves,touches,implements,reads,takes-input,returns,verifies,evidences,approves,invalidates,reports-on,derives-view
- Allowed view-scoped tags: target, context, candidate, guard, required, stale, blocked, output

View membership is separated from `viewScopedTags` through `includedInViewIds` and `coreViewCoverage`.

## 7 Core View Coverage

| View                       | Status  | Nodes | Edges |
| -------------------------- | ------- | ----- | ----- |
| Intent View                | present | 7     | 6     |
| Behavior View              | present | 7     | 7     |
| Structure View             | present | 5     | 1     |
| Scope / Execution View     | present | 5     | 5     |
| Impact View                | present | 7     | 5     |
| Verification View          | present | 8     | 5     |
| Evidence / Acceptance View | present | 9     | 9     |

## Check / Evidence Mapping

| Check         | Evidence                            | Summary                                                                                 |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| TT-SEARCH-001 | EV-SEARCH-TEST, EV-SEARCH-NOTE-TEST | Check node records the verification obligation; Evidence nodes record observable proof. |
| TT-SEARCH-002 | EV-SEARCH-TEST, EV-SEARCH-NOTE-TEST | Check node records the verification obligation; Evidence nodes record observable proof. |
| TT-SEARCH-003 | EV-SEARCH-REVIEW                    | Check node records the verification obligation; Evidence nodes record observable proof. |
| TT-SEARCH-004 | EV-SEARCH-NOTE-TEST                 | Check node records the verification obligation; Evidence nodes record observable proof. |

## Retained Warnings

- RW-BOUNDED-FIXTURE: acceptable-warning - Bounded fixture Evidence is not full Todo app implementation.
- RW-PARTIAL-UI: acceptable-warning - UI screenshot/manual visual Evidence remains partial for the no-result empty
  state.
- RW-GENERATED-BUILDER: generated-present-for-bounded-slice - Generated read-model output and scoped validator-backed
  Evidence now exist for the bounded Todo Search slice; CI/full promotion repeatability remains later.
- RW-ACEP-CLEANUP: deferred-cleanup - ACEP task-card public-doc cleanup remains deferred.

## Compatibility Warning Carry-Forward

- CCN-ACEP-TASK-CARD-AUTHORITY-001: Legacy ACEP/task-card wording remains a compatibility warning, not pilot source
  scope.
