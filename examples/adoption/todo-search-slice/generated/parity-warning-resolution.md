# Generated / Manual Parity Warning Resolution

Status: review Evidence for scoped pilot decision preparation

This document reviews the five generated/manual `stale/freshness mismatch` warnings that appeared after the first
bounded generated read-model run. It is review Evidence only. It does not change source authority, does not approve
scoped source-authority pilot execution, does not promote Maintainability Graph, and does not retire tree-native
selected-slice artifacts.

## Source Authority Boundary

- Current operational source remains the tree-native selected-slice artifacts under
  `examples/adoption/todo-search-slice`.
- `maintainability-graph-read-model.json` remains a manual parity/reference artifact.
- `generated-read-model.json` and `read-model-parity-report.json` remain generated Evidence.
- Mismatches were reviewed and resolved by updating generated freshness mapping only where source artifacts showed the
  generated status was too conservative. No source artifact or manual parity artifact was auto-fixed.

## Warning Review

| Subject                            | Original generated | Manual | Judgment                         | Rationale                                                                                                                                                  | Resolution                                                                                                      |
| ---------------------------------- | ------------------ | ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `AC-SEARCH-003`                    | `stale`            | fresh  | `manual-correct-generator-stale` | `product-tree.json` records the criterion as current after `PP-001`. The visual review warning belongs to Evidence/Check state, not Product criterion age. | Generator now treats `confirmed_runtime_behavior_present_visual_review_pending` requirements as fresh.          |
| `TT-SEARCH-003`                    | `stale`            | fresh  | `manual-correct-generator-stale` | `test-tree.json` records the check as current and partial. The stale/partial condition is carried by `EV-SEARCH-REVIEW` and `FIND-PARTIAL-UI`.             | Generator now treats `partial_runtime_behavior_present_visual_review_pending` checks as current obligations.    |
| `CCN-ACEP-TASK-CARD-AUTHORITY-001` | `unknown`          | fresh  | `manual-correct-generator-stale` | `compatibility-control-node.md` is a current supplemental compatibility warning. Cleanup is deferred, but the control record itself is reviewable.         | Generator now marks the compatibility control candidate freshness as fresh.                                     |
| `FIND-PARTIAL-UI`                  | `unknown`          | stale  | `manual-correct-generator-stale` | `evidence-exceptions.md` records UI screenshot/manual visual Evidence as partial. The finding reports stale/partial visual Evidence and should say so.     | Generator now marks this finding as stale while keeping it a retained warning.                                  |
| `FIND-ACEP-CLEANUP-DEFERRED`       | `unknown`          | fresh  | `manual-correct-generator-stale` | The ACEP cleanup warning is a current deferred cleanup record from the supplemental compatibility slice.                                                   | Generator now marks this deferred cleanup finding as fresh while preserving its compatibility warning boundary. |

## Final Parity Result

After regeneration:

- parity status: `comparison-pass`
- mismatch count: `0`
- blocking count: `0`
- decision-required count: `0`

## Remaining Boundaries

- The generated builder and parity report still do not execute scoped source-authority pilot transition.
- Source authority remains with the tree-native selected-slice artifacts.
- Public-doc cleanup remains deferred.
- Validator/CI-backed Evidence remains a future question.
- Actual scoped source-authority pilot execution still requires explicit user approval.
