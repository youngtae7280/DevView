# Generated Read-Model Evidence

Status: generated-present / evidence-only / source-authority-unchanged

## Run Identity

- Generated at: 2026-06-29T08:29:54.778Z
- Command identity: `pbe graph read-model generate --slice examples/valid/todo-app-pbe-run`
- Source commit: 0c151fc
- Source slice: `examples/valid/todo-app-pbe-run`

## Boundary

Canonical .pbe tree/control/execution/evidence artifacts remain current operational source for this structure-only
fixture.

Generated structure-only output is reviewable Evidence only. It does not change source authority, create a pilot marker,
require parity, introduce CI enforcement, retire .pbe artifacts, or approve promotion.

## Source Inputs

- examples/valid/todo-app-pbe-run/.pbe/tree/product-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/tree/project-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/tree/work-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/control/acceptance-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/control/change-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/control/impact-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/execution/cycle-tree.json: present
- examples/valid/todo-app-pbe-run/.pbe/execution/cycle-contract.md: present
- examples/valid/todo-app-pbe-run/.pbe/blueprint/work-graph.json: present
- examples/valid/todo-app-pbe-run/.pbe/blueprint/source-of-truth-matrix.md: present
- examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt: present
- examples/valid/todo-app-pbe-run/.pbe/blueprint/pbe-state.json: present
- examples/valid/todo-app-pbe-run/graph-source.json: present

## Node / Edge / Tag Summary

- Nodes: 22
- Edges: 38
- Node kinds: requirement,code,task,check,evidence,decision,change,finding,document,log,view-instance
- Edge types: targets,requires,satisfies,touches,verifies,evidences,approves,preserves,reports-on,derives-view
- Allowed view-scoped tags: target, context, candidate, guard, required, stale, blocked, output

View membership is separated from `viewScopedTags` through `includedInViewIds` and `coreViewCoverage`.

## 7 Core View Coverage

| View                       | Status  | Nodes | Edges |
| -------------------------- | ------- | ----- | ----- |
| Intent View                | present | 4     | 3     |
| Behavior View              | present | 4     | 3     |
| Structure View             | present | 5     | 3     |
| Scope / Execution View     | present | 5     | 3     |
| Impact View                | present | 5     | 3     |
| Verification View          | present | 5     | 4     |
| Evidence / Acceptance View | present | 4     | 3     |

## Check / Evidence Mapping

| Check | Evidence | Summary                                                                                 |
| ----- | -------- | --------------------------------------------------------------------------------------- |
| TT-1  |          | Check node records the verification obligation; Evidence nodes record observable proof. |

## Retained Warnings

- RW-STRUCTURE-ONLY: structure-only-limitation - This profile validates canonical .pbe structure only; no manual parity
  artifact, pilot marker, CI-backed Evidence, or source-authority pilot is required or claimed.
- RW-NO-RUNTIME-FIXTURE: accepted-structure-only-limitation - The fixture contains attached test-output Evidence but no
  runnable app/runtime fixture is required for structure-only validation.

## Compatibility Warning Carry-Forward
