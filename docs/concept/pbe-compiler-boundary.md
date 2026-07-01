# PBE Compiler Boundary

Status: MVP implemented / Contract Fixture Validator hardened / local report surface / non-enforcing

## Purpose

This document records the first Compiler Boundary MVP for graph-based PBE.

The goal is to stop treating AI prose as execution authority. AI may propose candidates and render readable text, but
execution-affecting facts must come from graph, policy, schema, validators, digests, timestamps, and human decisions.

```text
AI output is advisory.
Compiler output is authoritative.
Human decides.
```

## Current MVP

The MVP adds a machine-readable boundary package:

- `examples/read-model-aggregate/compiler-boundary-task-registry.json`
- `examples/read-model-aggregate/execution-contract-schema.json`
- `examples/read-model-aggregate/generated/execution-contract-dry-run.json`

The local report command is:

```powershell
node dist/cli/index.js graph read-model report-compiler-boundary --json
```

The command validates the task registry, the Execution Contract MVP schema, and a dry-run contract for the Todo Search
whitespace-normalization dogfood. This current layer is a Contract Fixture Validator: it proves that registry, schema,
and one dry-run contract have compiler-owned shape and boundary metadata. It is not the Actual Contract Compiler yet.

It is local Evidence only and does not execute AI, enable required checks, configure branch protection, apply graph
deltas, accept work, or retire tree-native artifacts.

## Compiler-Required Work

Compiler-required tasks affect execution scope, verification, Evidence, human decision requirements, acceptance, graph
delta facts, or later traceability. These cannot be finalized by AI.

The MVP registry currently covers:

- Change Node creation
- Change Type routing
- View Tree Pack extraction
- allowed/forbidden scope calculation
- Execution Contract compilation
- required Check selection
- required Evidence selection

## AI-Advisory Work

AI-advisory tasks may improve discovery or readability, but they do not carry execution authority.

The MVP registry currently covers:

- question rendering
- narrative summary
- optional test idea suggestion

AI advisory output must remain candidate or rendering material until a compiler, validator, policy checker, or human
decision promotes it.

## Execution Contract MVP

The MVP schema fixes the minimum fields that an execution contract must carry:

- `changeId`
- `changeType`
- `goal`
- `allowedScope`
- `forbiddenScope`
- `requiredContext`
- `requiredChecks`
- `requiredEvidence`
- `knownRisks`
- `openUnknowns`
- `humanDecisions`
- `stopConditions`
- `outputRequirements`

The Contract Fixture Validator currently blocks:

- missing goal
- missing allowed scope
- missing forbidden scope
- code scope without required checks
- missing required Evidence
- registry status or boundary-principle drift
- schema status, field source, field authority, or non-enforcement drift
- dry-run contract status or source-mode drift
- allowed/forbidden scope entries without paths or graph/policy derivation
- required checks without command or validation target
- required Evidence not linked to an existing required Check
- required Evidence with unknown freshness policy
- stop conditions without an action
- stop conditions with unknown action policy
- open critical or blocking unknowns
- critical, high, or blocking risks without a matching accepted or mitigated human decision
- human decisions that do not point at a known risk, unknown, scope, or change id
- human decisions with status outside `accepted`, `mitigated`, `rejected`, or `deferred`
- schema field authority values outside the current compiler-boundary vocabulary

The report preserves the original top-level status fields and also exposes `validationBuckets` for task registry,
contract schema, and dry-run contract issues. Buckets keep failures attributable without relying on string matching.

High, critical, and blocking risks cannot self-declare safety through `risk.status = mitigated`. They require an explicit
`humanDecisions[]` entry whose `decides` value points at the risk id and whose status is `accepted` or `mitigated`.

## Health And E2E Integration

Compiler Boundary MVP status is included in:

- `graph read-model report-health --json`
- `npm run test:read-model:e2e`

The health surface reports:

- `compilerBoundary.status`
- `compilerBoundary.taskRegistryStatus`
- `compilerBoundary.contractSchemaStatus`
- `compilerBoundary.contractValidatorStatus`
- `compilerBoundary.dryRunContractStatus`

## Boundaries

This MVP does not:

- enable required checks;
- configure branch protection;
- execute AI automatically;
- accept product work;
- apply graph deltas;
- expand source authority;
- retire tree-native artifacts.

It only proves that the first compiler-boundary package can be read, validated, and observed through existing local
Graph-source health and E2E surfaces.

## Next Layer

The next layer after this MVP is the [Compiler Input Model](compiler-input-model.md). It defines the machine-readable
request, graph snapshot, pack schema, policy snapshot, evidence index, and target scope candidate inputs that a future
Actual Contract Compiler may consume.

The Actual Contract Compiler would then derive request, scope, checks, Evidence, unknowns, risks, and stop conditions
from graph and policy inputs. The current MVP does not perform that derivation; it only validates committed fixture
artifacts that model the expected compiler boundary.
