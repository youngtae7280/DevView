# Read-Model Validation Report

Status: validation-pass

Evidence level: validator-backed

## Run Identity

- Validated at: 2026-06-26T00:52:01.533Z
- Command identity: `pbe graph read-model validate --slice examples/adoption/todo-search-slice`
- Source commit: 0148311
- Source slice: `examples/adoption/todo-search-slice`
- Profile id: `todo-search-selected-slice`
- Source layout: flat-demo-support
- Policy level: pilot-marker-backed
- Scope level: scoped-slice-validation

## Boundary

Validator-backed Evidence checks the bounded Todo Search read-model outputs only. It does not change source authority.

Validation pass is Evidence only. It does not promote Maintainability Graph, expand pilot scope, retire tree-native
artifacts, introduce CI enforcement, or replace user approval.

## Per-Slice Independence Contract

- Report unit: per-slice-validation-report
- Expected nodes: 40
- Expected edges: 59
- Expected validation checks: 20
- Generated read-model: examples/adoption/todo-search-slice/generated/generated-read-model.json
- Parity requirement: pass (examples/adoption/todo-search-slice/generated/read-model-parity-report.json)
- Pilot marker requirement: present
  (examples/adoption/todo-search-slice/generated/scoped-source-authority-pilot-marker.json)
- Runtime fixture requirement: present
- Fallback/reference count: 8
- Missing fallback/reference count: 0

Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend on
another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact is
declared by this profile.

## Summary

- Checks: 20
- Passed: 20
- Warnings: 0
- Blocking: 0
- Decision required: 0

## Checks

| Status | Severity | Check                                                              | Message       |
| ------ | -------- | ------------------------------------------------------------------ | ------------- |
| pass   | info     | Generated read-model exists and parses                             | Check passed. |
| pass   | info     | Parity report exists and parses                                    | Check passed. |
| pass   | info     | Evidence manifest exists and parses                                | Check passed. |
| pass   | info     | Scoped pilot marker exists and parses                              | Check passed. |
| pass   | info     | Source input artifacts exist or are explicitly represented         | Check passed. |
| pass   | info     | Generated/manual parity is comparison-pass                         | Check passed. |
| pass   | info     | Mismatch, blocking, and decision-required counts are zero          | Check passed. |
| pass   | info     | Node/Edge/Tag taxonomy is valid                                    | Check passed. |
| pass   | info     | viewScopedTags uses allowed role tags only                         | Check passed. |
| pass   | info     | View membership is separated from tags                             | Check passed. |
| pass   | info     | 7 Core View coverage is present                                    | Check passed. |
| pass   | info     | Confidence and freshness/status are separated                      | Check passed. |
| pass   | info     | Check/Evidence mapping is present                                  | Check passed. |
| pass   | info     | Source authority boundary is present and bounded                   | Check passed. |
| pass   | info     | Non-promotion statement is present                                 | Check passed. |
| pass   | info     | Retained warnings are visible                                      | Check passed. |
| pass   | info     | Fallback/reference artifacts are present                           | Check passed. |
| pass   | info     | User acceptance authority is not replaced by Codex/PBE             | Check passed. |
| pass   | info     | Supplemental compatibility warning boundary is preserved           | Check passed. |
| pass   | info     | No statement implies repo-wide promotion or tree-native retirement | Check passed. |

## Retained Warnings

- RW-BOUNDED-FIXTURE: acceptable-warning - Bounded fixture Evidence is not full Todo app implementation.
- RW-PARTIAL-UI: acceptable-warning - UI screenshot/manual visual Evidence remains partial for the no-result empty
  state.
- RW-GENERATED-BUILDER: generated-present-for-bounded-slice - Generated read-model output and scoped validator-backed
  Evidence now exist for the bounded Todo Search slice; CI/full promotion repeatability remains later.
- RW-ACEP-CLEANUP: deferred-cleanup - ACEP task-card public-doc cleanup remains deferred.

## Fallback / Reference Status

- examples/adoption/todo-search-slice/product-tree.json: present
- examples/adoption/todo-search-slice/project-tree.json: present
- examples/adoption/todo-search-slice/work-tree.json: present
- examples/adoption/todo-search-slice/test-tree.json: present
- examples/adoption/todo-search-slice/evidence-tree.json: present
- examples/adoption/todo-search-slice/acceptance-tree.json: present
- examples/adoption/todo-search-slice/maintainability-graph-read-model.json: present
- examples/adoption/todo-search-slice/view-instance-manifest.json: present

## Recommended Next Decision Surface

- Continue active observation
- Design CI workflow integration before broader enforcement
- Apply scoped validator to another explicitly approved slice
- Perform public-doc cleanup
- Prepare broader Graph-source promotion review
- Rollback or defer scoped pilot
