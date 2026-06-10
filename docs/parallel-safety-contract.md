# Parallel Safety Contract

Parallel implementation is forbidden unless safety is proven.

If parallel safety cannot be proven, do not parallelize.

## Required For Parallel Tasks

- `dependencyResolved: true`
- `writeSetKnown: true`
- `rollbackPathAvailable: true`
- `expectedFiles` is non-empty and specific
- `unknownFileTouchRisk` is `none` or `low`
- no same-file overlap in the group
- no shared-file or shared-contract overlap in the group
- no forbidden domain change
- focused validation available
- integration task assigned
- conflict risk is low or explicitly approved medium

## Default Policy

```json
{
  "parallelPolicy": {
    "default": "sequential",
    "maxInitialParallelGroupSize": 2,
    "maxMatureParallelGroupSize": 3,
    "moreThanMaxRequiresHumanApproval": true
  }
}
```

## Forbidden In Parallel Groups

- unknown write set
- high conflict risk
- shared type or schema changes
- build or package configuration changes
- auth, permission, migration, payment, deployment, billing, or secret handling
- public API contract changes
- same-file changes
- foundation work unless documentation/test-fixture only

## Integration Requirement

Every parallel group must set:

```text
integrationEvidenceRequired: true
groupCannotCompleteWithoutIntegrationPass: true
```

The group cannot be considered complete until the integration task passes and records evidence.
