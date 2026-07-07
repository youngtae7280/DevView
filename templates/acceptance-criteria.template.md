# Acceptance Criteria

Use this template when product-intake converts user intent into executable Product Tree acceptance criteria.

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
  "system": "THE SYSTEM",
  "shall": "SHALL <observable response>",
  "systemResponse": "",
  "observableResult": "",
  "verificationMethod": "manual_check",
  "requiredEvidence": ["manual_check"],
  "statement": "",
  "status": "confirmed",
  "source": {
    "type": "user_interview",
    "sourceNodeId": "",
    "decisionId": ""
  },
  "verification": {
    "required": true,
    "method": "manual_check",
    "suggestedTestNodeIds": [],
    "evidenceTypes": ["manual_check"]
  }
}
```

## Rules

- A confirmed executable Product node must have at least one structured criterion unless `acceptanceNotRequiredReason` explains why not.
- A confirmed criterion must include a condition/trigger, expected behavior, observable result, verification method, and required evidence.
- UI criteria must require screenshot or manual UI evidence.
- Abstract quality terms such as `clean`, `nice`, `fast`, `stable`, `intuitive`, `깔끔하게`, `보기 좋게`, `빠르게`, `안정적으로`, or `직관적으로` must be resolved before product-intake closes.
- Keep legacy `acceptance` strings only as compatibility summaries.
- Work, Test, and Evidence trees should link to the criterion ID whenever possible.
