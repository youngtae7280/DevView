# VD Quality Checklist

## Target Product / Work

...

## Acceptance Criteria Covered

| AC ID | Observable Result | Test ID | Pass Criteria | Evidence Type |
| ----- | ----------------- | ------- | ------------- | ------------- |
| ...   | ...               | ...     | ...           | ...           |

## Test Quality Checks

- [ ] Test title describes a specific behavior, not a generic area.
- [ ] Test has concrete Given/When/Then or equivalent scenario.
- [ ] Test pass criteria describe observable results.
- [ ] Test checks at least one concrete input/output pair where applicable.
- [ ] Negative/empty/error/permission cases were considered.
- [ ] Evidence type matches the work type.
- [ ] UI changes require screenshot or manual visual evidence.
- [ ] CLI changes require command output evidence.
- [ ] Documentation changes require doc excerpt evidence.
- [ ] Hardware/environment-limited checks have mock/fake/manual_not_verified explanation.

## Generic Test Smell Check

Bad examples:

- "검색 테스트"
- "검색이 잘 되는지 확인"
- "UI 문제 없는지 확인"

Rewrite as:

- "When query is 'milk', only Todo titles containing 'milk' remain visible."
- "When query is empty, all Todo rows remain visible."
- "When no Todo matches query, the empty result state is shown."

## Deferred Verification

...

## Remaining Risks

...
