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
- `requiredContext`
- `requiredChecks`
- `requiredEvidence`
- `knownRisks`
- `stopConditions`

The diff report now also classifies those id-based differences as semantic review metadata:

- `semanticDiffs[]`
- `semanticClassificationCounts`
- `highestReviewSeverity`
- `compilerPromotionReadiness`
- `semanticDiffRuleCoverage`

Current dry-run v0.1 classifications are small fixture-specific rules, not a general policy engine. For the current
Todo Search whitespace-normalization fixture, missing required Evidence is classified as `semantic-loss`, missing
forbidden scope is classified as `policy-loss`, and the generated candidate remains
`compiler-promotion-not-ready`. This status is review metadata only; it does not enable promotion, required checks,
branch protection, or execution.

Each semantic diff records the `matchedRuleId` that produced its classification. Differences without a dedicated v0.1
rule use `matchedRuleId: semantic-diff-rule-unknown`, classify as `unknown-review-required`, and prevent promotion
readiness. `compilerPromotionReadiness` is derived from the semantic diffs; it is not a manually asserted status.

Current triage closes the previous `outputRequirements` unknown by classifying it as `output-requirement-loss`: the
compiler-produced candidate replaces the hand-written changed-file and command-derived Evidence reporting obligations
with compiler-review status reporting. `sourceMode` and `nonExecutionStatement` are classified as `metadata-only`;
`requiredContext`, `knownRisks`, and `stopConditions` are compared through id-based summaries. Unknown diffs remain
possible for future fields, but the current dry-run diff set is fully classified.

## v0.1 Closeout

v0.1 proves:

- Compiler Input Model data can produce a deterministic contract candidate.
- The generated candidate can be revalidated by the Contract Fixture Validator.
- The generated candidate can be compared against the hand-written dry-run contract.
- Diff fields can be classified through explicit semantic diff rules.
- Current semantic diff unknown coverage is zero: `semantic-diff-unknowns-zero`.
- Promotion readiness is derived from semantic diffs, not asserted manually.

v0.1 does not prove:

- semantic equivalence with the hand-written contract;
- execution readiness;
- output requirement preservation;
- policy, Evidence, check, or source-authority completeness;
- support for arbitrary `changeType` values.

The current closeout status is `contract-compiler-dry-run-v0.1-classification-complete`, but
`equivalenceProven` remains `false` and `compilerPromotionReadiness` remains `compiler-promotion-not-ready` because
`semantic-loss`, `policy-loss`, and `output-requirement-loss` are still present.

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

## v0.2 Direction

The next layer should not be an executor. The recommended v0.2 candidate is Output Requirement Source Authority, or a
broader source-authority resolver, so the compiler can reconstruct output requirements from graph, policy, Evidence,
and check sources instead of replacing execution-result reporting obligations with compiler self-reporting. Pack schema
expansion should wait until that source-authority path is clearer.
