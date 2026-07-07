# VD Quality Rubric

## Purpose

Verification Design is not satisfied by the existence of a Test Tree. A test must prove a concrete observable result
from an Acceptance Criteria item.

Core principles:

- "A test exists" is weaker than "the test proves the AC."
- Rubric first, validator later.
- Do not turn natural-language quality judgment into an immediate hard validator failure.

## Bad VD Smells

Bad example:

```json
{
  "title": "검색 테스트",
  "manualChecks": ["검색이 잘 되는지 확인"]
}
```

Why this is weak:

- It does not say which input is tested.
- It does not say which fixture or data is required.
- It does not say which result must be visible.
- It has no failure condition.
- It has no empty, no-result, or negative case.
- It does not connect to the AC `observableResult`.
- Its evidence type is unclear.

Other smells:

- A test title names only a feature area, not behavior.
- Manual checks say "verify it works" or "check no UI issues."
- Pass criteria restate the feature instead of observable output.
- Evidence required does not match the work type.
- Edge cases are ignored without a deferral note.

## Good Test Node Requirements

A good Test node should include:

- a specific behavior title
- linked Product, Work, and Acceptance Criteria IDs
- concrete scenario using Given/When/Then or equivalent
- pass criteria with observable results
- at least one concrete input/output pair where applicable
- evidence required that matches the work type
- explicit deferral or out-of-scope notes for relevant uncovered cases

## AC To Test Mapping

Each executable Acceptance Criteria item should map to at least one Test node that proves its observable result.

For each AC, check:

- What observable result must be proven?
- Which Test node proves it?
- What scenario triggers the result?
- What pass criteria distinguish success from failure?
- What evidence type will prove the result?

## Scenario / Pass Criteria

Prefer Given/When/Then or an equivalent structure.

Good example:

```json
{
  "id": "T-SEARCH-001",
  "type": "manual_ui_check",
  "title": "Todo title search filters visible rows by query",
  "status": "planned",
  "verifiesAcceptanceCriteriaIds": ["AC-SEARCH-001"],
  "scenario": {
    "given": ["Todo list contains: Buy milk, Read book, Milk tea recipe"],
    "when": ["User enters 'milk' into the search input"],
    "then": [
      "Only todos whose title contains 'milk' are visible",
      "Buy milk and Milk tea recipe are visible",
      "Read book is not visible"
    ]
  },
  "passCriteria": [
    "The visible Todo rows exactly match the expected filtered result",
    "Non-matching Todo rows are hidden",
    "The search input remains editable"
  ],
  "evidenceRequired": ["screenshot", "manual_check_result"]
}
```

## Edge Case Coverage

For search features, consider:

- positive match
- negative filtering
- empty query
- no result / empty state
- case sensitivity policy
- regression for existing list behavior

Not every feature requires every edge case. Choose cases based on Product AC, user risk, implementation risk, and
current slice scope. If a relevant case is intentionally not covered, record it as deferred or out of scope.

## Evidence Type Matching

Match evidence to work type:

- UI work: screenshot, manual visual evidence, UI automation output, or review note.
- CLI work: command output and exit code.
- Documentation work: doc excerpt and formatting/validation output.
- API or service work: automated test output, integration logs, or request/response evidence.
- Data migration work: migration logs, before/after data sample, rollback evidence, or dry-run output.

## UI Verification

UI Test nodes should identify the screen, state, user action, expected visible result, and evidence required.

Include screenshot/manual visual evidence when UI appearance, layout, state, or interaction is part of the AC.

## CLI Verification

CLI Test nodes should include:

- command to run
- relevant options
- expected exit code
- expected stdout/stderr or JSON fields
- evidence as command output

## Documentation Verification

Documentation Test nodes should include:

- target document path
- exact concept that must be present
- expected reader action or decision supported by the doc
- evidence as doc excerpt plus formatting/validation output

## Hardware Or Environment-limited Verification

When full verification depends on hardware, credentials, external services, OS-specific behavior, or unavailable
environments:

- record what was verified
- record what was not verified
- use mock/fake/substitute evidence where acceptable
- mark remaining verification as `manual_not_verified`, deferred, or blocked when it affects acceptance

Do not imply certification when only a substitute check ran.

## Examples

Bad:

```json
{
  "title": "검색 테스트",
  "manualChecks": ["검색이 잘 되는지 확인"]
}
```

Better:

```json
{
  "id": "T-SEARCH-001",
  "type": "manual_ui_check",
  "title": "Todo title search filters visible rows by query",
  "status": "planned",
  "verifiesAcceptanceCriteriaIds": ["AC-SEARCH-001"],
  "scenario": {
    "given": ["Todo list contains: Buy milk, Read book, Milk tea recipe"],
    "when": ["User enters 'milk' into the search input"],
    "then": [
      "Only todos whose title contains 'milk' are visible",
      "Buy milk and Milk tea recipe are visible",
      "Read book is not visible"
    ]
  },
  "passCriteria": [
    "The visible Todo rows exactly match the expected filtered result",
    "Non-matching Todo rows are hidden",
    "The search input remains editable"
  ],
  "evidenceRequired": ["screenshot", "manual_check_result"]
}
```

## Future Validator Candidates

These are future candidates only. Do not implement them until dogfooding shows repeated deterministic failures with low
false-positive risk.

- `VD_TEST_TOO_GENERIC`
- `VD_MANUAL_CHECK_TOO_VAGUE`
- `VD_PASS_CRITERIA_MISSING`
- `VD_EVIDENCE_TYPE_MISMATCH`
- `VD_EDGE_CASE_PLAN_MISSING`
