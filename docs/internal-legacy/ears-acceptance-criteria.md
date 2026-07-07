# EARS Acceptance Criteria

PBE uses EARS inside RPD to convert natural language into testable Product Tree criteria. EARS does not replace PBE; it
gives RPD a disciplined way to decide whether a requirement can be executed.

Acceptance Criteria are Product Tree contract units. Work exists to satisfy them, Tests exist to verify them, Evidence
proves them, and Change/Impact/Reopen records how they were changed or invalidated.

## Rule

If user intent cannot be converted into acceptance criteria, the Product node is not ready for executable
selected/foundation work.

Keep legacy `acceptance` strings as summaries, but use `acceptanceCriteria` for traceability.

## Formats

Use one of:

```text
ubiquitous
event_driven
state_driven
optional_feature
unwanted_behavior
complex
plain
```

Examples:

```text
WHEN USB device is connected,
THE SYSTEM SHALL show Connected in the status panel.
```

```text
IF USB status lookup fails,
THE SYSTEM SHALL show an error state and a retry-capable action.
```

## Product Tree Shape

```json
{
  "acceptanceCriteria": [
    {
      "id": "AC-P1-1",
      "format": "EARS",
      "type": "event_driven",
      "condition": "USB device is connected",
      "system": "THE SYSTEM",
      "shall": "SHALL show Connected in the status panel",
      "systemResponse": "show Connected in the status panel",
      "observableResult": "Connected is visible in the status panel",
      "verificationMethod": "manual_screenshot",
      "requiredEvidence": ["test_log", "screenshot"],
      "statement": "WHEN USB device is connected, THE SYSTEM SHALL show Connected in the status panel.",
      "status": "confirmed",
      "source": {
        "type": "user_interview",
        "sourceNodeId": "P1",
        "decisionId": "DQ-001"
      },
      "verification": {
        "required": true,
        "method": "manual_screenshot",
        "suggestedTestNodeIds": [],
        "evidenceTypes": ["test_log", "screenshot"]
      }
    }
  ]
}
```

## Structured Gate Requirements

For confirmed executable Product nodes, PBE treats acceptance criteria as pass/fail contracts, not prose summaries. Each
required criterion must include:

- `id`
- condition or trigger information, such as `condition`, `trigger`, or an EARS `WHEN`/`IF`/`WHILE` statement
- expected behavior, such as `shall`, `expectedBehavior`, or existing `systemResponse`
- observable result, such as `observableResult` or `expectedResult`
- verification method, such as `verificationMethod` or `verification.method`
- required evidence, such as `requiredEvidence`, `evidenceRequired`, or existing `verification.evidenceTypes`

Abstract quality terms such as `clean`, `nice`, `fast`, `stable`, `intuitive`, `깔끔하게`, `보기 좋게`, `빠르게`,
`안정적으로`, or `직관적으로` block RPD close until converted into observable target, condition, behavior, result,
exception, and verification details.

UI-related criteria must require screenshot or manual UI evidence, such as `manual_screenshot`, `screenshot`, or
`manual_check`.

## Traceability

Work nodes should reference criteria with `satisfiesAcceptanceCriteriaIds`.

Test nodes should reference criteria with `verifiesAcceptanceCriteriaIds`.

Evidence nodes should reference criteria with `evidenceForAcceptanceCriteriaIds`.

Change and Impact nodes should reference criteria with `affectedAcceptanceCriteriaIds` when acceptance meaning changes.

If a Product node is documentation-only or metadata-only, use `acceptanceNotRequiredReason` instead of inventing fake
criteria.
