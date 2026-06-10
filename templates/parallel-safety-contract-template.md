# Parallel Safety Contract

If parallel safety cannot be proven, do not parallelize.

## Required For Parallel Tasks

- `dependencyResolved: true`
- `writeSetKnown: true`
- `rollbackPathAvailable: true`
- `expectedFiles` is non-empty and specific
- `unknownFileTouchRisk` is `none` or `low`
- no same-file overlap
- no shared file overlap
- no shared contract overlap
- focused validation available
- integration task assigned
- conflict risk is low or explicitly approved medium

## Parallel Group Requirements

- `integrationEvidenceRequired: true`
- `groupCannotCompleteWithoutIntegrationPass: true`
- group size follows policy or has human approval

## Default

Sequential.

## Forbidden

- unknown write set
- shared type or schema changes
- build or package configuration changes
- auth, permission, migration, payment, deployment, billing, or secret handling
- foundation work unless documentation/test-fixture only
