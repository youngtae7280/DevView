# Contract Compiler Dry-Run v0.1

Status: implemented / deterministic candidate compiler / generated-vs-hand-written diff / local non-enforcing report

## Purpose

The Contract Fixture Validator answers: "Is this contract-shaped artifact safe?"

The Compiler Input Model answers: "Are the inputs grounded in graph, policy, Evidence, and bounded vocabulary?"

Contract Compiler Dry-Run v0.1 answers the next narrow question:

"Can PBE deterministically compile one contract candidate from those validated inputs, then send that candidate back
through the Contract Fixture Validator and compare it against the hand-written dry-run fixture?"

## Current Scope

The current dry-run compiler supports only the committed Todo Search whitespace-normalization `bug_fix` fixture:

- input: `examples/read-model-aggregate/generated/compiler-input-model-dry-run.json`
- output candidate: `examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json`
- hand-written comparison target: `examples/read-model-aggregate/generated/execution-contract-dry-run.json`
- diff report: `examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`
- validator: `validateExecutionContract`

The local command is:

```powershell
node dist/cli/index.js graph read-model compile-contract --dry-run --json
```

## Deterministic Mapping

The compiler candidate is derived without AI prose:

- `humanRequest.text` becomes `goal`.
- `packSchema.changeType` becomes `changeType`.
- `targetScopeCandidates[]` becomes `allowedScope[]`.
- `graphSnapshot.artifacts[]` becomes `requiredContext[]`.
- `policySnapshot.evidenceCheckMappings[]` maps `evidenceIndex.entries[]` into `requiredEvidence[]`.
- `policySnapshot.forbiddenScopeRules[]` becomes `forbiddenScope[]`.
- fixed local checks cover runtime fixture, validate-all, health report, and E2E smoke.

After compilation, the candidate must pass the existing Contract Fixture Validator. A candidate that does not validate is
blocked and is not treated as executable.

The compiler-produced candidate uses `sourceMode: contract-compiler-dry-run-v0`. The hand-written fixture keeps
`sourceMode: compiler-boundary-mvp-dry-run`, so the diff report is expected to show the intentional boundary between the
manual fixture and the compiler-produced candidate.

## Diff Report

The diff report is review Evidence only. It compares the generated candidate with the hand-written dry-run contract
across contract-level fields such as source mode, scopes, context, checks, Evidence, risks, stop conditions, and output
requirements.

Expected current status:

- `candidateStatus`: `contract-candidate-pass`
- `candidateDiff.status`: `contract-diff-detected`
- `candidateDiff.reviewStatus`: `non-blocking-review-diff`
- `candidateDiff.equivalenceStatus`: `compiler-equivalence-not-proven`
- `candidateDiff.differingFields`: visible fields to review before relying on the generated candidate

`contract-compiler-dry-run-pass` means the compiler candidate was produced and passed the Contract Fixture Validator.
It does not mean the compiler-produced candidate is semantically equivalent to the hand-written contract. While
`candidateDiff.status` remains `contract-diff-detected`, the generated candidate is reviewable but equivalence is not
proven.

The diff report keeps field-level status and id-based summaries for:

- `allowedScope`
- `forbiddenScope`
- `requiredChecks`
- `requiredEvidence`

The diff report now also classifies those id-based differences as semantic review metadata:

- `semanticDiffs[]`
- `semanticClassificationCounts`
- `highestReviewSeverity`
- `compilerPromotionReadiness`

Current dry-run v0.1 classifications are small fixture-specific rules, not a general policy engine. For the current
Todo Search whitespace-normalization fixture, missing required Evidence is classified as `semantic-loss`, missing
forbidden scope is classified as `policy-loss`, and the generated candidate remains
`compiler-promotion-not-ready`. This status is review metadata only; it does not enable promotion, required checks,
branch protection, or execution.

## Boundaries

This is not an executor.

This dry-run does not:

- execute AI;
- perform the requested code change;
- apply graph deltas;
- approve or accept work;
- enable required checks;
- configure branch protection;
- retire tree-native artifacts;
- support arbitrary change types.

It only proves the first closed loop:

```text
Compiler Input Model
-> deterministic contract candidate
-> Contract Fixture Validator
-> generated-vs-hand-written diff report
```

## Next Layer

The next layer should either widen supported pack schemas carefully or introduce a real source-authority resolver for
choosing checks, Evidence, risks, and stop conditions from graph/policy inputs. It should not jump directly to AI
executor automation.
