# Contract Source Authority Gap Preview

Status: v0.2 preview / non-enforcing / source-authority preservation triage only

## Purpose

Source Authority resolvers now preserve generated `outputRequirements`, `forbiddenScope`, `stopConditions`,
`requiredEvidence`, `requiredContext`, `knownRisks`, and `allowedScope` for the current Todo Search dry-run fixture.
The remaining compiler question is no longer a field-level source-authority gap; it is whether and when review-only
diffs can count as an equivalence candidate.

This preview records those remaining differences as source-authority gaps before adding another resolver.

## Artifact

The compiler writes:

```text
examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json
```

The artifact records:

- remaining semantic and policy loss counts;
- `allowedScope` as preserved for the current fixture after target-scope source authority resolution;
- `forbiddenScope` as preserved for the current fixture after policy source authority resolution;
- `stopConditions` as preserved for the current fixture after stop-condition source authority resolution;
- `requiredEvidence` as preserved for the current fixture after Evidence source authority resolution;
- `requiredContext` as preserved for the current fixture after context source authority resolution;
- `knownRisks` as preserved for the current fixture after risk source authority resolution;
- missing and extra ids from the generated candidate;
- candidate source-authority type for each field;
- whether a resolver is required;
- the next recommended resolver.

## Current Recommendation

The current preview recommends:

```text
none
```

This is selected because `forbiddenScope` is generated from `policySnapshot.forbiddenScopeRules[]`, `stopConditions`
are generated from `stopConditionSources[]`, required Evidence is generated from `evidenceIndex.entries[]` plus
`policySnapshot.evidenceCheckMappings[]`, required context is generated from `graphSnapshot.artifacts[]`, known risks
are generated from `riskSources[]`, and allowed scope is generated from `targetScopeCandidates[]`. Policy-loss,
semantic-loss, evidence-chain mismatch, context semantic-loss, risk semantic-loss, and allowed-scope conservative review
debt are currently zero for this fixture.

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

`compilerPromotionReadiness` remains review-only, and `equivalenceProven` remains `false`.
