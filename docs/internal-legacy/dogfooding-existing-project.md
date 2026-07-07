# Dogfooding PBE on an Existing Project

This example shows how to place PBE on top of an existing project without converting the whole project at once. Start
with the next small feature slice, create enough Product/Work/Test/Evidence structure to control that slice, then use
normal review, acceptance, and revision flow.

## Scenario

An existing Todo app already lists and creates todos. The next feature request is search.

## Starting Point

- The app exists before PBE adoption.
- PBE is adopted only for the next Todo search slice.
- Existing code is not rewritten just to fit PBE.
- The first slice stays small enough to review and accept.

See also: [RPD Interview Mode](rpd-interview-mode.md), [Product Patch Proposals](product-patch-proposals.md), and the
artifact snapshot in [Todo search adoption example](../examples/internal-legacy/adoption/todo-search-slice/README.md).

## Rough User Request

> Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.

## Step 1. RPD Interview Draft

Raw request:

> Todo 목록이 많아지니까 찾기 불편해. 검색 좀 되게 해줘.

Draft Product Tree Candidate:

1. 사용자는 Todo 목록에서 검색어를 입력할 수 있어야 한다.
2. 검색어가 입력되면 Todo title에 검색어가 포함된 항목만 보여야 한다.
3. 검색어가 비어 있으면 전체 Todo 목록이 보여야 한다.
4. 검색 결과가 없으면 empty state가 보여야 한다.

Suggested first slice:

Todo title search only

Ambiguity:

- 검색 대상이 title만인지, description/tag/date까지 포함하는지 불명확하다.
- 대소문자 구분 여부가 불명확하다.
- 검색 결과 없음 UI가 필요한지 불명확하다.

Recommended single question:

이번 첫 slice에서는 Todo title만 검색 대상으로 할까요?

1. 예, title만
2. title + description
3. title + tag
4. 아직 결정하지 않음

## Step 2. Confirm First Slice

Assume the user answers: "예, title만 먼저 하자."

PBE records the first slice as title text search only. The following stay deferred/out of scope for this slice:

- tag filter
- date filter
- fuzzy search
- server-side search
- saved search
- note/description search

The Product Tree candidate is still draft until the user confirms the product meaning and `pbe rpd close` succeeds.

## Step 3. Product Tree Candidate

The selected Product branch can be represented as:

- `PT-SEARCH-001`: Todo title search
- `AC-SEARCH-001`: WHEN the user enters a search query, THE SYSTEM SHALL show todos whose title contains the query.
- `AC-SEARCH-002`: WHEN the search query is empty, THE SYSTEM SHALL show the full Todo list.
- `AC-SEARCH-003`: WHEN no Todo title matches the query, THE SYSTEM SHALL show an empty search result state.

The example artifact is in
[product-tree.json](../examples/internal-legacy/adoption/todo-search-slice/product-tree.json).

## Step 4. Work / Test / Evidence Planning

Work is scoped to the selected Product node only:

- `WT-SEARCH-001`: Add title search input and filtering behavior.
- Expected files: `src/todo-list.tsx`, `src/todo-search.ts`.
- Forbidden for this slice: backend search API changes, tag/date filter modules.

Tests cover the Product acceptance criteria:

- query filters by title
- empty query restores all todos
- no match shows empty result state

Evidence should include the test output and a small manual review note or screenshot if the UI changed.

## Step 5. Execution

Example command flow:

```bash
pbe init --profile lite --brief "Adopt PBE for Todo search slice" # create lightweight PBE artifacts for this project
pbe status # inspect current state and recommended next command
pbe rpd check # check Product Tree/RPD readiness
pbe rpd close # close RPD only after user confirms the Product candidate
pbe wpd close # verify Work Tree planning and traceability
pbe vd close # verify Test Tree and acceptance coverage
pbe scope select # record selected implementation scope
pbe acep ready # validate the execution pack
pbe execution start # enter implementation state
pbe files check # check changed files against Work/Revision scope
pbe execution complete # attach evidence and close execution
pbe review submit # submit result for user review
pbe accept # accept only after explicit user approval
```

If any command fails, follow its `suggestedFix` and `nextCommand` instead of skipping ahead.

## Step 6. Review and Acceptance

At review, PBE should show:

- selected Product node and acceptance criteria
- Work node and expected files
- Test node coverage
- Evidence proving the criteria
- File Change Guard result

Acceptance is a user decision. Codex does not mark the result accepted from its own confidence.

## Step 7. Product Meaning Feedback

After acceptance, the user says:

> 검색은 제목뿐 아니라 메모 내용에서도 되어야 해.

This changes Product meaning. Codex must not quietly edit `product-tree.json`. Use Change/Impact/Product Patch instead.

## Step 8. Product Patch Proposal

Example flow:

```bash
pbe change create --summary "Search should include todo note content"
pbe impact analyze --change CH-001
pbe product patch propose --change CH-001 --product PT-SEARCH-001 --operation update_acceptance_criteria --summary "Search target expands from title only to title and note"
```

The patch must wait for user confirmation before apply:

```json
{
  "userConfirmed": true,
  "confirmation": {
    "actor": "user",
    "confirmedAt": "2026-06-13T00:00:00.000Z"
  }
}
```

Then:

```bash
pbe product patch apply --patch PP-001
pbe revision start --change CH-001
pbe revision complete --change CH-001
```

Product Patch apply updates product meaning only after confirmation. After apply, downstream Work/Test/Evidence and
Acceptance closure must be checked again. Existing evidence may become stale or invalidated, and final accept requires
new user confirmation.

## Step 9. Revision

The revision should update only the changed meaning:

- Product: search target expands from title to title + note.
- Work: search/filter implementation updates the indexed/searchable fields.
- Test: add note-content match coverage.
- Evidence: rerun tests and attach fresh output.
- Review/Accept: submit again and wait for user approval.

## Lessons Learned

- Dogfooding starts with the next feature slice, not a full project rewrite.
- Rough requests should become draft Product candidates quickly.
- The first question should resolve the highest-impact ambiguity.
- Deferred ideas are useful because they prevent scope creep.
- Product meaning feedback after acceptance belongs in Change/Impact/Product Patch/Revision, not silent edits.

See also: [Install PBE locally](install.md) and [Troubleshooting](troubleshooting.md).
