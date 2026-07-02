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
- `equivalencePolicy`

Dry-run v0.1 classifications are small fixture-specific rules, not a general policy engine. Earlier Todo Search
whitespace-normalization diffs classified missing required Evidence as `semantic-loss` and missing forbidden scope as
`policy-loss`; v0.2 source-authority resolvers now preserve those fields for the current fixture. The generated
candidate remains review-only because non-semantic review differences still exist, but allowed scope no longer carries
conservative source-authority review debt. This status is review metadata only; it does not enable promotion, required
checks, branch protection, or execution.

Each semantic diff records the `matchedRuleId` that produced its classification. Differences without a dedicated v0.1
rule use `matchedRuleId: semantic-diff-rule-unknown`, classify as `unknown-review-required`, and prevent promotion
readiness. `compilerPromotionReadiness` is derived from the semantic diffs; it is not a manually asserted status.

Current triage previously classified `outputRequirements` as `output-requirement-loss`. v0.2 now derives generated
`outputRequirements` from `outputRequirementSources[]`, so the current generated candidate preserves the changed-file,
command-output Evidence, validation-result, and boundary reporting obligations for this fixture. `sourceMode` and
`nonExecutionStatement` are classified as `metadata-only`; `requiredEvidence`, `forbiddenScope`, `stopConditions`,
`requiredContext`, `knownRisks`, and `allowedScope` are preserved from source authority. Unknown diffs remain possible
for future fields, but the current dry-run diff set is fully classified.

The diff artifact now also includes an equivalence/readiness policy summary:

- `sourceAuthorityPreservationStatus: source-authority-preserved`
- `semanticDiffPolicyStatus: semantic-diff-clean`
- `reviewOnlyDiffStatus: review-only-diff-detected`
- `blockingSemanticLossCount: 0`
- `reviewOnlyDiffCount: 3`
- `equivalenceCandidate: true`
- `equivalenceProven: false`

This separates "major fields are source-authority preserved" from "equivalence is proven." The current candidate is an
equivalence candidate for review only; it is not an execution source.

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
`equivalenceProven` remains `false` and `compilerPromotionReadiness` remains `compiler-promotion-review-required`
because the generated candidate still differs from the hand-written fixture in review-only fields such as source mode,
check set, and non-execution wording. The v0.2 policy summary marks this as `equivalenceCandidate: true`, while keeping
`equivalenceProven: false` until a later approved equivalence policy and human review explicitly promote it.

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

## v0.2 Source-Authority Reconstruction

The next layer should not be an executor. The recommended v0.2 candidate is Output Requirement Source Authority, or a
broader source-authority resolver, so the compiler can reconstruct output requirements from graph, policy, Evidence,
and check sources instead of replacing execution-result reporting obligations with compiler self-reporting. Pack schema
expansion should wait until that source-authority path is clearer.

The first v0.2 preview is now recorded in
[output-requirement-source-authority.md](output-requirement-source-authority.md) and emitted as:

```text
examples/read-model-aggregate/generated/output-requirement-source-authority.preview.json
```

This surface maps hand-written output obligations to `outputRequirementSources[]` for comparison and now uses those
source authority entries to derive generated `outputRequirements`. The current preview reports
`generated-output-requirements-preserved` with zero unresolved output obligations. The compiler also derives
`forbiddenScope[]` from `policySnapshot.forbiddenScopeRules[]`, so the current fixture no longer carries
forbidden-scope policy-loss. It also derives `stopConditions[]` from `stopConditionSources[]`, so the current fixture no
longer carries stop-condition policy-loss. Finally, it derives `requiredEvidence[]` from `evidenceIndex.entries[]` plus
`policySnapshot.evidenceCheckMappings[]`, so the current fixture no longer carries required-Evidence semantic loss or
evidence-chain mismatch. It now derives `requiredContext[]` from `graphSnapshot.artifacts[]`, so the current fixture no
longer carries required-context semantic loss. It now derives `knownRisks[]` from `riskSources[]`, so the current
fixture no longer carries known-risk semantic loss. It now derives `allowedScope[]` from `targetScopeCandidates[]`, so
the current fixture no longer carries allowed-scope conservative review debt. This still does not prove full
equivalence because review-only diffs remain.

The remaining-loss preview is recorded in
[contract-source-authority-gap-preview.md](contract-source-authority-gap-preview.md) and emitted as:

```text
examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json
```

It explains source-authority gaps by field and currently recommends `none` for the current fixture because allowed scope
is also preserved from source authority. The policy forbidden-scope, stop-condition, Evidence, context, risk, and
allowed-scope resolvers are intentionally narrow: they derive generated fields from committed source authority entries,
not from the hand-written comparison fixture.

## v0.2 Equivalence/Readiness Policy

The current next layer is not another resolver. It is the review policy recorded in
[contract-compiler-equivalence-policy.md](contract-compiler-equivalence-policy.md).

That policy keeps these states separate:

- `source-authority-preserved`
- `semantic-diff-clean`
- `review-only-diff-detected`
- `equivalence-candidate`
- `compiler-promotion-review-required`
- `equivalence-proven`

`equivalenceProven` is not set to `true` in this stage, even if a future fixture reaches a field match. Equivalence proof
requires an explicitly approved policy and human review. The current dry-run remains non-enforcing review Evidence.

## v0.2 Promotion Review Packet

The promotion review boundary is recorded in
[contract-compiler-promotion-review-policy.md](contract-compiler-promotion-review-policy.md). `equivalenceCandidate`
means the current candidate is ready to be reviewed, not that it has been approved or accepted.

`graph read-model compile-contract --dry-run --json` now also emits:

```text
examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json
```

The packet references the generated candidate, hand-written comparison fixture, semantic diff artifact, output
requirement source-authority preview, and source-authority gap preview. It includes validation commands, review-only diff
summary, explicit non-goals, and a human checklist. The current packet status is
`promotion-review-ready-for-human`, while `approvalStatus` remains `not-approved` and `equivalenceProven` remains
`false`.

The current review-only diffs are now narrowed into:

- `source-mode-metadata-only`;
- `validation-superset-review-only`;
- `boundary-wording-review-required`.

`boundary-wording-review-required` remains a human-review item because boundary wording must preserve non-execution,
non-approval, non-enforcement, no user-acceptance, and no graph-delta-apply meanings before any later promotion
decision.

The optional decision template is:

```text
docs/templates/contract-compiler-promotion-decision.md
```

The template is for human decision records. It is not an automatic approval mechanism. The first docs-only current
fixture decision record is
[contract-compiler-promotion-decision-current-fixture.md](contract-compiler-promotion-decision-current-fixture.md).
