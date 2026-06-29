# Todo Search Runtime Evidence

Status: bounded representative fixture evidence / refreshed for whitespace-normalized query behavior

This evidence record supports the `Todo Search Adoption + Product Meaning Feedback` representative runtime feasibility
demo after `PP-001` confirmation. It is a bounded fixture result, not a full Todo application implementation, not PBE
runtime implementation, not Graph-source promotion, and not enforcement. Renewed user Acceptance is recorded separately
in `acceptance-tree.json`.

## Context

- Date: 2026-06-29
- Observed command: `npx vitest run examples/adoption/todo-search-slice/runtime-fixture`
- Basis commit before this evidence update: `0c151fc`
- Selected slice: `Todo Search Adoption + Product Meaning Feedback`
- Product Patch: `PP-001`
- Dogfood behavior change: repeated whitespace inside multi-word queries is normalized before matching.

## Linked Nodes

| Layer      | IDs                                                                |
| ---------- | ------------------------------------------------------------------ |
| Product    | `PT-SEARCH-001`, `AC-SEARCH-001`, `AC-SEARCH-002`, `AC-SEARCH-003` |
| Project    | `PJ-TODO-LIST-SURFACE`, `PJ-TODO-SEARCH-HELPER`                    |
| Work       | `WT-SEARCH-001`                                                    |
| Test       | `TT-SEARCH-001`, `TT-SEARCH-002`, `TT-SEARCH-004`                  |
| Evidence   | `EV-SEARCH-NOTE-TEST`                                              |
| Change     | `CH-001`, `PP-001`                                                 |
| Impact     | `IM-SEARCH-001`                                                    |
| Acceptance | `AT-ROOT`                                                          |

## Command Evidence

Command:

```bash
npx vitest run examples/adoption/todo-search-slice/runtime-fixture
```

Observed result:

```text
examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js (7 tests)

Test Files  1 passed (1)
Tests       7 passed (7)
```

## Test File

- `examples/adoption/todo-search-slice/runtime-fixture/todo-search.test.js`
- `examples/adoption/todo-search-slice/runtime-fixture/todo-search.js`

## Covered Checks

| Check                                                       | Evidence status | Notes                                                               |
| ----------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| Query matches Todo title.                                   | present / fresh | Covered by `matches Todo title text`.                               |
| Query matches Todo note.                                    | present / fresh | Covered by `matches Todo note text`.                                |
| Repeated whitespace in multi-word query is normalized.      | present / fresh | Covered by `normalizes repeated whitespace in multi-word queries`.  |
| Query matches Todo content.                                 | present / fresh | Covered by `matches Todo content text`.                             |
| Query with no title/note/content match returns empty array. | present / fresh | Covers behavior-level no-match result, not a UI screenshot.         |
| Tag/date are not selected search targets.                   | present / fresh | Covered by `does not treat tag or date as selected search targets`. |
| Blank query returns the full Todo list.                     | present / fresh | Covered by `returns the full Todo list for a blank query`.          |

## Limitations

- This is a bounded representative fixture, not a complete Todo app runtime.
- It does not implement UI rendering or screenshot evidence for the no-result empty state.
- It does not run the historical `npm test -- todo-search` command named in the earlier evidence snapshot.
- It does not create generated Maintainability Graph read-model output by itself.
- It did not close renewed Acceptance by itself; the later user approval is recorded in `acceptance-tree.json`.
- It does not change source authority, enable enforcement, or retire tree-native artifacts.

## Evidence Status Update

`EV-SEARCH-NOTE-TEST` remains `present_fresh` for the bounded title + note/content runtime fixture because the linked
Vitest command passed with the added whitespace-normalized query behavior. Remaining exceptions are still visible in
`evidence-exceptions.md`.
