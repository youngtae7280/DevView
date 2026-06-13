# RPD Interview Summary

## Raw User Request

Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.

## Draft Product Tree Candidate

- 사용자는 Todo 목록에서 검색어를 입력할 수 있어야 한다.
- 검색어가 입력되면 Todo title에 검색어가 포함된 항목만 보여야 한다.
- 검색어가 비어 있으면 전체 Todo 목록이 보여야 한다.
- 검색 결과가 없으면 empty state가 보여야 한다.

## Suggested First Slice

Todo title search only.

## Ambiguity / Missing Decisions

| ID    | Topic            | Why it matters                                          | Suggested question                                     |
| ----- | ---------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| A-001 | Search target    | Determines Product acceptance and implementation scope. | 이번 첫 slice에서는 Todo title만 검색 대상으로 할까요? |
| A-002 | Case sensitivity | Changes matching behavior and tests.                    | 기본 검색을 대소문자 무시로 처리할까요?                |
| A-003 | Empty state      | Changes UI evidence requirements.                       | 검색 결과가 없을 때 별도 empty state를 보여줄까요?     |

## Risks

| ID    | Risk                                    | Why it matters                                              | Mitigation                               |
| ----- | --------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| R-001 | Scope creep into tag/date/server search | Existing project adoption should stay small.                | Defer non-title search targets.          |
| R-002 | Product meaning changes after accept    | Title-only evidence becomes stale if search target expands. | Use Product Patch Proposal and Revision. |

## Recommended Single Question

이번 첫 slice에서는 Todo title만 검색 대상으로 할까요?

## Current Non-Scope / Deferred Candidates

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search

## Confirmation Needed

User confirmation is needed before marking the title-only Product node confirmed.

## Next CLI Command

`pbe rpd check`
