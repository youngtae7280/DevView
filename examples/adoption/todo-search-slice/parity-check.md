# Maintainability Graph Read-Model Parity Check

Status: manual parity check

This parity check evaluates whether the Maintainability Graph read-model artifact resolves the generated/read-model
blocker from Graph-source Promotion Readiness Review.

It is not Graph-source promotion, not source authority change, and not a generated graph builder implementation.

## Source References

- `maintainability-graph-read-model.json`
- `maintainability-graph-read-model.md`
- `product-tree.json`
- `project-tree.json`
- `work-tree.json`
- `test-tree.json`
- `evidence-tree.json`
- `acceptance-tree.json`
- `change-tree.json`
- `impact-tree.json`
- `cycle-contract.md`
- `node-execution-contracts/wt-search-001.md`
- `approval-brief.md`
- `evidence-exceptions.md`
- `examples/adoption/compatibility-mismatch-slice/compatibility-control-node.md`

## Parity Questions

| Question                                                                                   | Result | Evidence                                                                                            |
| ------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------- |
| Does the artifact show Product -> Project -> Work -> Test -> Evidence -> Acceptance trace? | yes    | JSON nodes and edges preserve `PT-SEARCH-001` through `AT-ROOT`.                                    |
| Does it include Change/Impact stale-reopen history?                                        | yes    | `PP-001`, `CH-001`, `IM-SEARCH-001`, affected nodes, and renewed Acceptance are represented.        |
| Does it preserve Execution Contract boundary?                                              | yes    | `CYCLE-TODO-SEARCH` and `NEC-WT-SEARCH-001` are represented as contract nodes and boundary edges.   |
| Does it preserve Approval Brief and user acceptance authority?                             | yes    | `AB-TODO-SEARCH` summarizes `AT-ROOT`; user approval remains separate from graph output.            |
| Does it carry compatibility warning / deferred cleanup?                                    | yes    | `CCN-ACEP-TASK-CARD-AUTHORITY-001` remains visible as a compatibility warning.                      |
| Does it avoid source authority change?                                                     | yes    | Metadata states tree-native artifacts remain source and `treeNativeArtifactsReclassified` is false. |
| Does it provide a generated graph builder output?                                          | no     | The artifact is manual equivalent parity output; no generator/CLI/schema/runtime is implemented.    |
| Does it hide partial/missing/exception relationships?                                      | no     | Partial UI Evidence and generated-builder absence remain explicit warnings.                         |

## Readiness Blocker Judgment

Prior blocker:

```text
Generated Maintainability Graph/read-model output missing.
```

Updated judgment:

```text
resolved_for_limited_pilot_readiness_with_warning
```

Reason:

- `maintainability-graph-read-model.json` is an observable read-model parity output.
- It preserves node categories, edges, parity status, warnings, and source-authority boundary.
- It is reviewable without implementing a generator or changing source authority.

Remaining limitation:

```text
generated_builder_missing_for_full_promotion_or_repeatable_ci
```

This limitation should be treated as a later implementation requirement or full-promotion prerequisite, not as a blocker
to preparing a limited pilot promotion decision surface.

## Remaining Partial / Missing / Exception Items

| Item                                 | Status   | Treatment                                                               |
| ------------------------------------ | -------- | ----------------------------------------------------------------------- |
| Full Todo app runtime implementation | partial  | Acceptable warning for limited pilot; full promotion may require more.  |
| UI screenshot/manual visual evidence | partial  | Acceptable warning unless full UI/product parity is in scope.           |
| Generated graph builder / CLI output | missing  | Later implementation requirement for repeatability or full promotion.   |
| ACEP task-card public-doc cleanup    | deferred | Deferred cleanup; user must accept or require cleanup before promotion. |
| Graph-source promotion approval      | missing  | Must remain missing until explicit user promotion decision.             |

## Non-Promotion Statement

This parity check does not promote Maintainability Graph, does not change source authority, does not mark tree-native
artifacts as projections, and does not close any future promotion decision.
