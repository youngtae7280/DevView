# Todo Search Demo-Support Approval Brief

Status: demo-support evidence snapshot

This Approval Brief is a review surface for the representative demo evidence pack. It is not user acceptance, not
Acceptance Tree mutation, not Product Patch confirmation, and not Graph-source promotion.

## Source References

- `examples/adoption/todo-search-slice/product-tree.json`
- `examples/adoption/todo-search-slice/project-tree.json`
- `examples/adoption/todo-search-slice/work-tree.json`
- `examples/adoption/todo-search-slice/test-tree.json`
- `examples/adoption/todo-search-slice/evidence-tree.json`
- `examples/adoption/todo-search-slice/acceptance-tree.json`
- `examples/adoption/todo-search-slice/product-patch-tree.json`
- `examples/adoption/todo-search-slice/change-tree.json`
- `examples/adoption/todo-search-slice/impact-tree.json`
- `examples/adoption/todo-search-slice/evidence-exceptions.md`
- `docs/concept/approval-brief.md`
- `docs/concept/check-evidence-policy.md`

## Intent Understood

PBE is reviewing whether the `Todo Search Adoption + Product Meaning Feedback` slice has enough observable
selected-slice support artifacts to strengthen the actual runtime feasibility demo result.

## Result Summary

Added demo-support evidence snapshots for:

- Product -> Project -> Work trace
- Cycle Contract boundary
- Node Execution Contract boundary
- Change Tree record for note-content search feedback
- Impact Tree classification for stale/review/reopen pressure
- Compatibility review
- Evidence exceptions

These artifacts are evidence snapshots only. They do not implement Todo search behavior, apply Product Patch `PP-001`,
or promote Maintainability Graph.

## Verification Summary

| Check                                  | Evidence status          | Summary                                                                                                             |
| -------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Product -> Project -> Work trace       | present                  | `project-tree.json` now derives project boundary from existing Product/Work snapshots.                              |
| Cycle/Node Contract boundary           | present                  | `cycle-contract.md` and `node-execution-contracts/wt-search-001.md` define selected/deferred/forbidden scope.       |
| Change/Impact visibility               | partial                  | `change-tree.json` and `impact-tree.json` classify PP-001 pressure, but user confirmation is still false.           |
| Evidence freshness after note feedback | partial / exception      | `impact-tree.json` and `evidence-exceptions.md` record stale/partial evidence if PP-001 is confirmed.               |
| Compatibility mismatch                 | not-applicable / partial | `compatibility-review.md` records no real selected-slice mismatch found; no simulated mismatch is treated as proof. |
| AI self-report exclusion               | present                  | All strengthened evidence points to files and explicit exceptions, not AI self-report.                              |

## Remaining Judgment

- Product Patch `PP-001` still needs user confirmation before Product meaning changes.
- Stale/reopen path remains partial until Product Patch confirmation, refreshed tests/evidence, and renewed acceptance.
- Compatibility path is honest but not exercised by a real mismatch; a supplemental compatibility slice may be needed if
  promotion readiness review requires an actual mismatch scenario.

## Approval Choice

This demo-support evidence pack can be reviewed as strengthened evidence.

Available choices:

- approve the strengthened evidence pack as partial-but-useful demo support
- request Product Patch confirmation and refreshed evidence before calling stale/reopen demonstrated
- request a supplemental compatibility slice
- defer promotion readiness review

## State Label

```text
Review with warning
```

The evidence pack is materially stronger, but unresolved Product Patch confirmation and real compatibility mismatch
coverage remain visible.

## Non-Promotion Statement

This Approval Brief does not accept product results, does not close Acceptance Tree state, and does not promote
Maintainability Graph.
