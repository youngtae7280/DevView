# Contract Compiler Calibration Fixtures

Status: planning / non-enforcing / second-fixture selection only

## Purpose

This note selects the second calibration fixture for DevView Contract Compiler Dry-Run generalization.

The current Todo Search whitespace-normalization `bug_fix` fixture proves that one bounded fixture can move through:

```text
Compiler Input Model
-> deterministic contract candidate
-> Contract Fixture Validator
-> semantic diff classification
-> source-authority reconstruction
-> promotion review packet
-> current-fixture human decision record
```

That does not prove the compiler generalizes. The next milestone should observe a second fixture with a different shape
before adding broad compiler support.

## Current Baseline

The current baseline remains the Todo Search whitespace-normalization `bug_fix` dry-run fixture:

- input: `examples/read-model-aggregate/generated/compiler-input-model-dry-run.json`
- generated candidate: `examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json`
- comparison fixture: `examples/read-model-aggregate/generated/execution-contract-dry-run.json`
- semantic diff: `examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`
- promotion review packet:
  `examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json`
- human decision record:
  `docs/concept/contract-compiler-promotion-decision-current-fixture.md`

Current baseline status:

- `equivalenceCandidate: true`
- `equivalenceProven: false`
- generated `approvalStatus` remains not approved
- human decision scope is current fixture, current generated candidate, and current promotion review packet only

## Candidate Scan

| Candidate                                                                  | Calibration value                                                                                                        | Decision                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Todo Search whitespace-normalization `bug_fix`                             | Baseline fixture with complete source-authority reconstruction.                                                          | Not selected because it is the baseline.                                                                       |
| `examples/valid/todo-app-pbe-run`                                          | Existing read-model structure fixture with positive validate-all coverage.                                               | Deferred because it is structure-only and lacks a different behavior/evidence contract.                        |
| `examples/retrofit/cardprinterconfig`                                      | Realistic retrofit records with UI/hardware-adjacent scope and local validation records.                                 | Deferred because it is larger, hardware-adjacent, and less suitable as the first compiler calibration fixture. |
| `examples/retrofit/open-source/kubernetes-sidecar-kep`                     | Large external design-doc retrofit with formal KEP context.                                                              | Deferred because it is read-only and too broad for the first second-fixture calibration pass.                  |
| `examples/retrofit/open-source/escape-html` plus `outputs/.../escape-html` | Existing external behavior-change dogfood with graph source, instruction pack, graph delta, proposal, and test evidence. | Selected as the second calibration fixture candidate.                                                          |

## Selected Calibration Fixture

Selected fixture:

```text
component/escape-html Symbol stringification behavior-change dogfood
```

Primary paths:

- `docs/concept/real-external-behavior-change-dogfood.md`
- `examples/retrofit/open-source/escape-html/graph-source.json`
- `examples/retrofit/open-source/escape-html/records/symbol-stringification.implemented.json`
- `examples/retrofit/open-source/escape-html/generated/compiler-input-model-calibration-draft.json`
- `outputs/retrofit/open-source/escape-html/instruction-packs/symbol-stringification.instruction-pack.json`
- `outputs/retrofit/open-source/escape-html/graph-deltas/symbol-stringification.graph-delta.json`
- `outputs/retrofit/open-source/escape-html/graph-update-proposals/symbol-stringification.graph-update-proposal.json`
- `outputs/retrofit/open-source/escape-html/dogfood-report.json`

Why this fixture is different:

- It is an external retrofit dogfood, not an internal Todo Search adoption fixture.
- It records a real code/test behavior change in a local external checkout.
- It recovers intent from README, source, tests, and graph edges.
- It includes an instruction pack, graph delta, graph update proposal, and dogfood report.
- Its boundaries include no upstream PR, no maintainer approval claim, no package metadata change, and no escaping
  vocabulary change.
- Its Evidence shape is an external project test suite result (`npm test`, 31 passing tests), not the Todo Search runtime
  fixture chain.

## Calibration Input Draft

The first input-model draft is:

```text
examples/retrofit/open-source/escape-html/generated/compiler-input-model-calibration-draft.json
```

This draft is `calibration-draft`, `not-supported`, `not-approved`, and `equivalenceProven: false`. It is not wired into
`graph read-model compile-contract --dry-run`, does not create a promotion review packet for the second fixture, and is
not an execution source.

Inputs that can be represented with the current shape:

- `humanRequest` from the external behavior-change dogfood record;
- `graphSnapshot.artifacts[]` for graph source, change record, instruction pack, graph delta, graph update proposal, and
  dogfood report;
- `targetScopeCandidates[]` for `index.js`, `test/index.js`, and review Evidence artifacts;
- `policySnapshot.forbiddenScopeRules[]` for escaping vocabulary, package metadata, upstream approval, and graph-delta
  apply boundaries;
- `evidenceIndex.entries[]` for `npm test`, dogfood report, graph delta, and graph update proposal artifacts;
- `outputRequirementSources[]` for changed files, command Evidence status, validation summary, and non-upstream boundary
  reporting;
- `stopConditionSources[]` for missing external checkout/tests, scope expansion, and unsupported current compiler check
  bindings;
- `riskSources[]` for scope drift and source-authority loss.

Known draft gaps:

- The current compiler input command surface still reads only the Todo Search dry-run fixture.
- External project check IDs such as `check-escape-html-npm-test` are not in the current required-check registry.
- `work/external/escape-html` paths are local external checkout paths, not committed repository paths.
- The source dogfood is behavior-change shaped, but the draft keeps `changeType: bug_fix` as a calibration assumption
  instead of adding arbitrary `changeType` support.
- Graph delta and graph update proposal artifacts are review Evidence, not graph apply authority.

Expected resolver behavior:

- Existing output requirement, forbidden scope, stop condition, Evidence, context, risk, and allowed-scope resolver
  concepts should be reusable in shape.
- External checkout path handling and external required-check binding are expected to block or require a calibration
  extension.
- If this draft is wired in a future v0.3 task, the correct first result may be `not-supported` or `blocked` with
  precise source-authority gaps, not a successful candidate.

## What It Should Exercise

The selected fixture should exercise these source-authority surfaces in a later calibration cycle:

- `allowedScope`: external local project files `index.js` and `test/index.js`, derived from instruction-pack and graph
  record boundaries.
- `requiredContext`: README/source/test intent nodes such as `module.escape-html-function`,
  `surface.stringification-tests`, and `surface.special-character-tests`.
- `requiredEvidence`: external project test evidence from `npm test` and the dogfood report.
- `forbiddenScope`: no escaping vocabulary change, no package metadata or dependency change, no README/API wording
  change, no benchmark change, and no upstream PR or maintainer approval claim.
- `stopConditions`: missing external checkout, missing baseline install/test evidence, dirty files outside selected
  scope, missing graph source record, missing test command evidence, or upstream approval claims.
- `knownRisks`: stringification semantics regression, escaping/security regression, upstream compatibility claims,
  package metadata drift, and graph proposal being mistaken for direct graph-source mutation.
- `outputRequirements`: changed-file summary, command-output Evidence status, graph delta/proposal status, and
  non-upstream-approval boundary statement.

## Expected Source-Authority Gaps

This task does not implement the second fixture. The first calibration run should expect gaps such as:

- no committed Compiler Input Model fixture for `escape-html` yet;
- required Evidence/check mapping for external project commands may need a new bounded source authority shape;
- required context may need graph-node-to-source/test/README anchor mapping;
- forbidden scope and stop condition sources may need external-retrofit boundary vocabulary;
- known risk sources may need an escaping/stringification-specific risk vocabulary;
- graph delta and graph update proposal artifacts may need output/reporting bindings distinct from Todo Search.

These gaps should be reported as calibration findings, not hidden as support.

## Expected Semantic Diff Behavior

Before input modeling exists, the compiler should either not run for this fixture or produce a precise blocked/not-run
reason. It should not claim support for the fixture.

After a narrow Compiler Input Model candidate is authored in a future task, the expected behavior is:

- generated candidate production is non-executing;
- Contract Fixture Validator remains the validator boundary;
- semantic diff classification reports meaningful field differences or source-authority gaps;
- source-authority gap preview identifies the next resolver or input-model extension;
- `equivalenceProven` remains `false`;
- promotion review remains non-enforcing and fixture-scoped.

## Calibration Success Criteria

A future calibration cycle is successful if:

- the Compiler Input Model can represent the selected `escape-html` fixture without broad `changeType` expansion;
- the compiler candidate either runs or reports a precise unsupported/blocked status;
- semantic diff and source-authority gap reports explain missing coverage instead of masking it;
- no executor automation is introduced;
- no graph delta apply is automated;
- no CI enforcement, required checks, or branch protection is introduced;
- no user acceptance is automated;
- no current-fixture human decision is generalized to this fixture.

## Non-Goals

This selection does not:

- implement compiler support for `escape-html`;
- mark the selected fixture as supported;
- approve arbitrary `changeType` support;
- set `equivalenceProven: true`;
- approve promotion for a second fixture;
- execute AI or apply code changes;
- apply graph deltas;
- introduce required checks, branch protection, or CI enforcement;
- automate user acceptance;
- retire tree-native artifacts;
- rename `pbe`, `.pbe`, validation scripts, generated artifact paths, or sourceMode values.

## Next Step

The next implementation task should be a narrow v0.3 calibration input-model design for the selected fixture, not broad
compiler generalization. It should start by authoring or previewing the `escape-html` Compiler Input Model candidate and
recording exactly where the current source-authority resolvers are sufficient, blocked, or need extension.
