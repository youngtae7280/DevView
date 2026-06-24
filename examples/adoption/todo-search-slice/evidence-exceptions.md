# Todo Search Evidence Exceptions

Status: demo-support evidence snapshot

This file records missing, partial, stale, or not-applicable evidence for the representative demo. An exception is not
proof. It is a visible limitation that supports user judgment.

## Source References

- `examples/adoption/todo-search-slice/evidence-tree.json`
- `examples/adoption/todo-search-slice/product-patch-tree.json`
- `examples/adoption/todo-search-slice/change-tree.json`
- `examples/adoption/todo-search-slice/impact-tree.json`
- `examples/adoption/todo-search-slice/compatibility-review.md`
- `docs/concept/check-evidence-policy.md`
- `docs/concept/control-node-policy.md`

## Exception Records

| ID            | Check                                                                       | Evidence status | Reason                                                                                                              | Residual risk                                                                            | User judgment / later remedy                                                                                 |
| ------------- | --------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| EX-SEARCH-001 | Fresh command output for `npm test -- todo-search` in this repository task. | exception       | Existing evidence snapshot says the command passed, but this evidence-strengthening task did not run product tests. | Command output may not represent a live Todo app execution in this repo.                 | Later demo execution can run or attach fresh command output if a runnable Todo fixture exists.               |
| EX-SEARCH-002 | Screenshot or visual artifact for no-result empty state.                    | partial         | `EV-SEARCH-REVIEW` is a manual review note, not a screenshot.                                                       | Visual state cannot be independently inspected from an image.                            | Add screenshot evidence if visual review becomes promotion-relevant.                                         |
| EX-SEARCH-003 | Evidence freshness after title + note Product Patch.                        | stale           | `PP-001` is proposed and unconfirmed; existing evidence proves title-only behavior.                                 | If PP-001 is confirmed, title-only evidence is partial/stale for expanded search target. | Confirm/apply Product Patch, update tests, rerun evidence, and renew acceptance.                             |
| EX-SEARCH-004 | Real selected-slice compatibility mismatch.                                 | not-applicable  | No `.pbe/blueprint/*`, ACEP package, or task-card-only mismatch exists in the selected slice folder.                | Compatibility scenario is policy-reviewed but not exercised by a real mismatch.          | Use supplemental compatibility slice if promotion readiness requires a real mismatch path.                   |
| EX-SEARCH-005 | Generated graph/read-model output.                                          | exception       | This demo uses manual Maintainability Graph read/alignment interpretation only.                                     | Generated graph parity is not demonstrated.                                              | Later implementation may create generated read-model evidence after source-transition prerequisites are met. |

## AI Self-Report Exclusion

AI statements such as "checked", "works", or "aligned" do not count as Evidence. Each exception above points to a
reviewable file, missing artifact, or later remedy condition.

## Non-Promotion Statement

These exception records do not change runtime source authority and do not promote Maintainability Graph.
