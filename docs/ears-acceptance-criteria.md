# EARS Acceptance Criteria

PBE uses EARS inside RPD to convert natural language into testable Product Tree criteria. EARS does not replace PBE; it gives RPD a disciplined way to decide whether a requirement can be executed.

## Rule

If user intent cannot be converted into acceptance criteria, the Product node is not ready for executable selected/foundation work.

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
      "systemResponse": "show Connected in the status panel",
      "statement": "WHEN USB device is connected, THE SYSTEM SHALL show Connected in the status panel.",
      "status": "confirmed",
      "source": {
        "type": "user_interview",
        "sourceNodeId": "P1",
        "decisionId": "DQ-001"
      },
      "verification": {
        "required": true,
        "suggestedTestNodeIds": [],
        "evidenceTypes": ["test_log", "screenshot"]
      }
    }
  ]
}
```

## Traceability

Work nodes should reference criteria with `satisfiesAcceptanceCriteriaIds`.

Test nodes should reference criteria with `verifiesAcceptanceCriteriaIds`.

Evidence nodes should reference criteria with `evidenceForAcceptanceCriteriaIds`.

If a Product node is documentation-only or metadata-only, use `acceptanceNotRequiredReason` instead of inventing fake criteria.
