# Limited Pilot Promotion Decision Package

Status: DevView promotion decision package / readiness-only / no automatic promotion

This package defines the review inputs needed before a bounded read-model pilot can move beyond a local validation
role. It is intentionally non-authoritative until a later human-reviewed decision record exists.

## Decision Inputs

- Named source slice and profile.
- Current generated read-model validation result.
- Current retained warnings and known limitations.
- Runtime evidence obligations, if the promotion would depend on runtime behavior.
- Rollback and fallback expectations for rejected promotion.

## Non-Goals

- No runtime evidence satisfaction is created here.
- No equivalence proof is created here.
- No Scope/CI enforcement is created here.
- No graph-source update is applied here.
