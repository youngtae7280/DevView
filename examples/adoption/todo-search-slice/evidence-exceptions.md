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
- `examples/adoption/todo-search-slice/maintainability-graph-read-model.json`
- `examples/adoption/todo-search-slice/parity-check.md`
- `examples/adoption/compatibility-mismatch-slice/evidence-exceptions.md`
- `docs/concept/check-evidence-policy.md`
- `docs/concept/control-node-policy.md`

## Exception Records

| ID            | Check                                                                       | Evidence status | Reason                                                                                                                                                              | Residual risk                                                                                        | User judgment / later remedy                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EX-SEARCH-001 | Fresh command output for `npm test -- todo-search` in this repository task. | exception       | Existing evidence snapshot says the command passed, but this evidence-strengthening task ran the bounded Vitest fixture instead.                                    | Historical product command output may not represent a live Todo app execution here.                  | Later review can run the historical command or explicitly accept bounded fixture Evidence as sufficient.                                                          |
| EX-SEARCH-002 | Screenshot or visual artifact for no-result empty state.                    | partial         | `EV-SEARCH-REVIEW` is a manual review note, not a screenshot.                                                                                                       | Visual state cannot be independently inspected from an image.                                        | Add screenshot evidence if visual review becomes promotion-relevant.                                                                                              |
| EX-SEARCH-003 | Evidence freshness after title + note Product Patch.                        | partial         | `PP-001` is confirmed; fresh bounded fixture Evidence now covers title + note/content behavior.                                                                     | Historical title-only evidence remains partial as a source of full-product proof.                    | Keep `EV-SEARCH-NOTE-TEST` linked and decide later whether full product/runtime evidence is required.                                                             |
| EX-SEARCH-004 | Real selected-slice compatibility mismatch.                                 | not-applicable  | No `.pbe/blueprint/*`, ACEP package, or task-card-only mismatch exists in the selected Todo slice folder.                                                           | Compatibility scenario is covered by supplemental slice, not by Todo product behavior.               | Keep supplemental compatibility evidence separate from Todo Search product evidence.                                                                              |
| EX-SEARCH-005 | Generated graph/read-model output.                                          | partial         | `maintainability-graph-read-model.json` and `parity-check.md` now provide manual equivalent read-model parity output; no generator/CLI-backed graph builder exists. | Limited pilot graph parity is reviewable, but repeatable generated graph parity is not demonstrated. | Treat manual parity output as sufficient for limited pilot readiness discussion; create generated output later if full promotion or CI repeatability requires it. |
| EX-SEARCH-006 | Note/content search automated test output.                                  | resolved        | `npx vitest run examples/adoption/todo-search-slice/runtime-fixture` passed 1 file and 6 tests.                                                                     | Fixture proof is bounded and not a full Todo app implementation.                                     | Treat `EV-SEARCH-NOTE-TEST` as present/fresh for the representative demo, with limitations visible.                                                               |
| EX-SEARCH-007 | Renewed Acceptance for title + note/content search.                         | resolved        | User approved renewed Acceptance in the parent orchestration chat on 2026-06-24 with warnings retained.                                                             | Retained warnings must not be lost before promotion readiness review.                                | Carry retained warnings into Graph-source Promotion Readiness Review.                                                                                             |

## AI Self-Report Exclusion

AI statements such as "checked", "works", or "aligned" do not count as Evidence. Each exception above points to a
reviewable file, missing artifact, or later remedy condition.

## Non-Promotion Statement

These exception records do not change runtime source authority and do not promote Maintainability Graph.
