# Read-Model Validation Report

Status: validation-pass

Evidence level: validator-backed

## Run Identity

- Validated at: 2026-06-29T08:46:09.957Z
- Command identity: `devview graph read-model validate --slice examples/valid/todo-app-devview-run`
- Source commit: a1c4f10
- Source slice: `examples/valid/todo-app-devview-run`
- Profile id: `todo-app-devview-run-structure-only`
- Source layout: canonical-devview
- Policy level: structure-only
- Scope level: scoped-slice-validation

## Boundary

Validator-backed Evidence checks structure-only generated read-model outputs for this canonical .devview fixture. It does
not change source authority.

Structure-only validation pass is Evidence only. It does not promote Maintainability Graph, create a source-authority
pilot, require parity, introduce CI enforcement, retire .devview artifacts, or replace user approval.

## Per-Slice Independence Contract

- Report unit: per-slice-validation-report
- Expected nodes: 22
- Expected edges: 38
- Expected validation checks: 16
- Generated read-model: examples/valid/todo-app-devview-run/generated/generated-read-model.json
- Parity requirement: not-required (not-required-for-structure-only)
- Pilot marker requirement: not-required (not-required-for-structure-only)
- Runtime fixture requirement: attached-evidence-only
- Fallback/reference count: 15
- Missing fallback/reference count: 0

Validation uses the target slice profile, generated artifacts, and declared source inputs only. It must not depend on
another slice generated directory, manual parity artifact, pilot marker, or runtime fixture unless that artifact is
declared by this profile.

## Summary

- Checks: 16
- Passed: 16
- Warnings: 0
- Blocking: 0
- Decision required: 0

## Checks

| Status | Severity | Check                                                                              | Message       |
| ------ | -------- | ---------------------------------------------------------------------------------- | ------------- |
| pass   | info     | Generated read-model exists and parses                                             | Check passed. |
| pass   | info     | Evidence manifest exists and parses                                                | Check passed. |
| pass   | info     | Canonical .devview source input artifacts exist                                    | Check passed. |
| pass   | info     | Node/Edge/Tag taxonomy is valid                                                    | Check passed. |
| pass   | info     | viewScopedTags uses allowed role tags only                                         | Check passed. |
| pass   | info     | View membership is separated from tags                                             | Check passed. |
| pass   | info     | 7 Core View coverage is present for structure-only validation                      | Check passed. |
| pass   | info     | Confidence and freshness/status are separated                                      | Check passed. |
| pass   | info     | Check/Evidence mapping is present where source inputs support it                   | Check passed. |
| pass   | info     | Source authority boundary is present and bounded                                   | Check passed. |
| pass   | info     | Non-promotion statement is present                                                 | Check passed. |
| pass   | info     | Structure-only limitations are visible                                             | Check passed. |
| pass   | info     | Fallback/reference source artifacts are present                                    | Check passed. |
| pass   | info     | User acceptance authority is not replaced by Codex/DevView                         | Check passed. |
| pass   | info     | Supplemental compatibility slice is not source scope for structure-only validation | Check passed. |
| pass   | info     | No statement implies repo-wide promotion or tree-native retirement                 | Check passed. |

## Retained Warnings

- RW-STRUCTURE-ONLY: structure-only-limitation - This profile validates canonical .devview structure only; no manual parity
  artifact, pilot marker, CI-backed Evidence, or source-authority pilot is required or claimed.
- RW-NO-RUNTIME-FIXTURE: accepted-structure-only-limitation - The fixture contains attached test-output Evidence but no
  runnable app/runtime fixture is required for structure-only validation.

## Fallback / Reference Status

- examples/valid/todo-app-devview-run/.devview/tree/product-tree.json: present
- examples/valid/todo-app-devview-run/.devview/tree/project-tree.json: present
- examples/valid/todo-app-devview-run/.devview/tree/work-tree.json: present
- examples/valid/todo-app-devview-run/.devview/tree/test-tree.json: present
- examples/valid/todo-app-devview-run/.devview/evidence/evidence-tree.json: present
- examples/valid/todo-app-devview-run/.devview/control/acceptance-tree.json: present
- examples/valid/todo-app-devview-run/.devview/control/change-tree.json: present
- examples/valid/todo-app-devview-run/.devview/control/impact-tree.json: present
- examples/valid/todo-app-devview-run/.devview/execution/cycle-tree.json: present
- examples/valid/todo-app-devview-run/.devview/execution/cycle-contract.md: present
- examples/valid/todo-app-devview-run/.devview/blueprint/work-graph.json: present
- examples/valid/todo-app-devview-run/.devview/blueprint/source-of-truth-matrix.md: present
- examples/valid/todo-app-devview-run/.devview/evidence/test-results/todo-add.txt: present
- examples/valid/todo-app-devview-run/.devview/blueprint/devview-state.json: present
- examples/valid/todo-app-devview-run/graph-source.json: present

## Recommended Next Decision Surface

- Continue active observation
- Design CI workflow integration before broader enforcement
- Apply scoped validator to another explicitly approved slice
- Perform public-doc cleanup
- Prepare broader Graph-source promotion review
- Rollback or defer scoped pilot
