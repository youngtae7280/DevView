# Contract Source Authority Gap Preview

Status: v0.2 preview / non-enforcing / remaining-loss triage only

## Purpose

Output Requirement Source Authority now preserves generated `outputRequirements` for the current Todo Search dry-run
fixture. The remaining compiler gap is no longer output reporting; it is the source authority behind the other contract
fields that still differ from the hand-written comparison fixture.

This preview records those remaining differences as source-authority gaps before adding another resolver.

## Artifact

The compiler writes:

```text
examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json
```

The artifact records:

- remaining semantic and policy loss counts;
- field-level gaps for `allowedScope`, `forbiddenScope`, `requiredContext`, `requiredEvidence`, `knownRisks`, and
  `stopConditions`;
- missing and extra ids from the generated candidate;
- candidate source-authority type for each field;
- whether a resolver is required;
- the next recommended resolver.

## Current Recommendation

The current preview recommends:

```text
policy-forbidden-scope-source-authority
```

This is selected because policy-loss remains in `forbiddenScope`. It is the narrowest next resolver candidate before
attempting broader context, Evidence, risk, or stop-condition resolution.

## Boundaries

This preview does not:

- execute AI;
- apply graph deltas;
- mutate code;
- make the generated candidate authoritative;
- prove equivalence;
- enable required checks;
- configure branch protection;
- automate user acceptance;
- retire tree-native artifacts;
- widen `changeType` support;
- implement every remaining resolver at once.

`compilerPromotionReadiness` remains `compiler-promotion-not-ready`, and `equivalenceProven` remains `false`.
