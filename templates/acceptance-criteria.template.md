# Acceptance Criteria

Use this template when RPD converts user intent into executable Product Tree acceptance criteria.

## Requirement

- Product node:
- Source:
- Ambiguity status:
- Confirmation decision:

## EARS Criteria

```text
WHEN <condition>,
THE SYSTEM SHALL <observable response>.
```

```text
IF <unwanted condition or failure>,
THE SYSTEM SHALL <safe/error/retry behavior>.
```

## Structured Form

```json
{
  "id": "AC-<PRODUCT-ID>-1",
  "format": "EARS",
  "type": "event_driven",
  "condition": "",
  "systemResponse": "",
  "statement": "",
  "status": "confirmed",
  "source": {
    "type": "user_interview",
    "sourceNodeId": "",
    "decisionId": ""
  },
  "verification": {
    "required": true,
    "suggestedTestNodeIds": [],
    "evidenceTypes": []
  }
}
```

## Rules

- A confirmed executable Product node must have at least one structured criterion unless `acceptanceNotRequiredReason` explains why not.
- Keep legacy `acceptance` strings only as compatibility summaries.
- Work, Test, and Evidence trees should link to the criterion ID whenever possible.
