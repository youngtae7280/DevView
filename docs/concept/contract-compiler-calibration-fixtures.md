# Contract Compiler Calibration Fixtures

Status: planning / non-enforcing / calibration fixture selection

## Purpose

This note tracks calibration fixture selection for DevView Contract Compiler Dry-Run generalization.

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

The first static observation report is:

```text
examples/retrofit/open-source/escape-html/generated/compiler-input-calibration-observation.preview.json
```

The first behavior-change calibration policy preview is:

```text
examples/retrofit/open-source/escape-html/generated/behavior-change-calibration-policy.preview.json
```

The first external required-check binding preview is:

```text
examples/retrofit/open-source/escape-html/generated/external-required-check-binding.preview.json
```

The first external checkout path authority preview is:

```text
examples/retrofit/open-source/escape-html/generated/external-checkout-path-authority.preview.json
```

The first anchor-level context preview is:

```text
examples/retrofit/open-source/escape-html/generated/anchor-level-context.preview.json
```

The first risk vocabulary preview is:

```text
examples/retrofit/open-source/escape-html/generated/risk-vocabulary.preview.json
```

The first graph-delta review binding preview is:

```text
examples/retrofit/open-source/escape-html/generated/graph-delta-review-binding.preview.json
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
- External project check IDs such as `check-escape-html-npm-test` are previewed as calibration-only bindings but are
  not in the current required-check registry.
- `work/external/escape-html` paths are previewed as calibration-local source context, not portable compiler support
  authority.
- Anchor-level code/test context is previewed from static record anchors, not supported compiler context.
- Behavior-change risk vocabulary is previewed, but it does not prove mitigation or support.
- Graph-delta review binding is previewed, but it does not apply graph deltas or prove equivalence.
- The source dogfood is behavior-change shaped and is now recognized as calibration-only policy while still using the
  current `bug_fix` vocabulary; this does not add arbitrary `changeType` support.
- Graph delta and graph update proposal artifacts are review Evidence, not graph apply authority.

Expected resolver behavior:

- Existing output requirement, forbidden scope, stop condition, Evidence, context, risk, and allowed-scope resolver
  concepts should be reusable in shape.
- External checkout path handling and external required-check binding are expected to block or require a calibration
  extension.
- If this draft is wired in a future v0.3 task, the correct first result may be `not-supported` or `blocked` with
  precise source-authority gaps, not a successful candidate.

## Calibration Observation

The observation preview classifies the second fixture as:

- `fixtureStatus: calibration-draft`
- `supportStatus: not-supported`
- `behaviorChangeCalibrationPolicyStatus: behavior-change-calibration-policy-recognized`
- `compileEligibility: not-eligible-current-command-not-wired`
- `expectedCandidateStatus: contract-candidate-not-run`
- `promotionEligibility.status: promotion-not-eligible`
- `equivalenceProven: false`

This is the intended current result. Behavior-change shape is now recognized as a calibration policy boundary, but the
observation does not compile a candidate and does not ask the current compiler-supported Todo Search path to accept the
second fixture.

The current source-authority model appears reusable in concept for:

- `outputRequirements`, with graph delta bindings kept review-only;
- `forbiddenScope`, with external-retrofit policy boundaries;
- `stopConditions`, with missing external checkout/check handling;
- `requiredContext`, at artifact level.

The observation reports likely extensions for:

- external required-check registry binding, now previewed but awaiting authoritative checkout modeling;
- external checkout path authority, now previewed as calibration-local and non-portable;
- escaping/stringification and maintainer-approval risk vocabulary, now previewed but not mitigation proof;
- README/source/test anchor-level context, now previewed approximately but not supported;
- graph delta and graph update proposal review-output binding, now previewed as review-only.

Recommended v0.3 direction:

```text
v0.3-calibration-closeout-decision
```

External required-check binding and external checkout path authority are now previewed as non-enforcing calibration
Evidence, anchor-level context is previewed from static record anchors, and risk vocabulary is previewed as review
metadata. Graph-delta review binding is also previewed as review-only output/reporting metadata. The next step should
close out the v0.3 escape-html calibration preview gap set before candidate generation, promotion review,
behavior-change support, broad pack schema expansion, or any execution/enforcement work.

## External Required-Check Binding Preview

The external required-check binding preview maps the escape-html draft's proof obligations to observed dogfood Evidence
without turning them into supported compiler required checks:

- `check-escape-html-npm-test` maps to the observed `npm test` result in
  `outputs/retrofit/open-source/escape-html/dogfood-report.json`;
- `check-escape-html-dogfood-validator` maps to the dogfood validator summary in the same report;
- `check-escape-html-graph-delta-review` maps to graph delta review artifacts as review-only Evidence, not graph delta
  apply authority.

The preview status is:

```text
external-required-check-binding-awaiting-authoritative-checkout
```

This means the required-check shape is visible, but the check authority is not established for support. The external
checkout path `work/external/escape-html` is previewed as calibration-local source context, not portable execution or
compiler support authority.

This preview is not:

- a CI job;
- a GitHub required check;
- a branch protection rule;
- a supported compiler check registry entry;
- a promotion approval;
- user acceptance;
- execution authority.

## External Checkout Path Authority Preview

The external checkout path authority preview describes `work/external/escape-html` using static dogfood metadata:

- expected project: `component/escape-html`;
- expected upstream: `https://github.com/component/escape-html`;
- observed checkout path: `work/external/escape-html`;
- observed clone head: `b42947eefa79efff01b3fe988c4c7e7b051ec8d8`;
- observed dirty files: `index.js` and `test/index.js`.

The preview status is:

```text
external-checkout-path-authority-previewed-calibration-local
```

This establishes only that the calibration artifacts consistently describe the same local external checkout. It does
not independently verify repository identity, make the local path portable, prove a clean baseline, or permit command
execution.

The checkout authority preview may be used to explain why external required-check binding is waiting for authoritative
checkout modeling. It must not be used as:

- permission to run external checks;
- permission to modify external files;
- supported compiler source authority;
- CI enforcement;
- branch protection;
- promotion approval;
- graph delta apply authority.

## Anchor-Level Context Preview

The anchor-level context preview describes the specific source and test behavior anchors behind the Symbol
stringification calibration fixture. File-level context is too broad here because the behavior change depends on a
narrow input-coercion point and nearby verification surfaces:

- source coercion before the dogfood: `var str = '' + string`;
- source coercion observed after the dogfood: `var str = String(string)`;
- existing non-string stringification tests such as `when string is undefined`;
- new Symbol assertion Evidence: `escapeHtml(Symbol('escape')) === 'Symbol(escape)'`;
- existing escape-vocabulary guard tests such as `when string contains "&"`.

The preview status is:

```text
anchor-level-context-previewed-approximate
```

This means the available static records identify behavior anchors, but exact line ranges are not verified and the local
external checkout remains non-portable. The anchors are review metadata only.

The anchor-level context preview is not:

- edit permission;
- supported compiler context;
- source checkout authority;
- candidate generation;
- promotion approval;
- execution authority.

## Risk Vocabulary Preview

The risk vocabulary preview names behavior-change-specific risks for the escape-html calibration fixture without
claiming they are mitigated. It uses the approximate anchors and observed Evidence to make risk review more precise than
generic `scope-drift` or `source-authority-loss` labels.

Previewed risk terms include:

- `runtime-compatibility-risk`;
- `input-coercion-behavior-risk`;
- `symbol-handling-regression-risk`;
- `escaping-correctness-risk`;
- `non-string-input-behavior-drift`;
- `test-coverage-insufficiency-risk`;
- `source-authority-boundary-risk`.

The preview status is:

```text
risk-vocabulary-previewed
```

This means the vocabulary can inform later graph-delta review and compliance checking. It does not prove risk
mitigation, does not make the fixture supported, and does not approve behavior-change support.

The risk vocabulary preview is not:

- final compiler risk policy;
- mitigation proof;
- promotion approval;
- user acceptance;
- CI enforcement;
- behavior-change support.

## Graph-Delta Review Binding Preview

The graph-delta review binding preview describes how the Symbol stringification behavior-change should be reviewed as a
graph delta. It binds the existing graph delta and graph update proposal artifacts to review questions without applying
them.

The expected review shape focuses on:

- input coercion behavior change;
- Symbol input handling;
- escaping correctness preservation;
- existing non-string input behavior relationship;
- test evidence relationship;
- source-authority boundary.

The preview status is:

```text
graph-delta-review-binding-previewed
```

This means the fixture now has review metadata connecting changed files, graph nodes, graph edges, behavior anchors,
risk terms, and Evidence. It does not apply graph deltas, mutate graph source, prove semantic equivalence, or make the
fixture supported.

The graph-delta review binding preview is not:

- graph delta apply;
- graph source mutation;
- semantic equivalence proof;
- candidate generation;
- promotion approval;
- execution authority.

## v0.3 Scope Decision

The first v0.3 scope is:

```text
behavior-change pack schema policy
```

This scope is now implemented as calibration-only policy recognition. The second fixture remains `not-supported`,
`not-eligible-current-command-not-wired`, `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`.

Why this scope comes first:

- the selected `escape-html` fixture is behavior-change shaped;
- the completed current fixture is `bug_fix` shaped;
- the calibration draft currently keeps `changeType: bug_fix` only as a compatibility assumption;
- before external checks, external paths, risk detail, or graph-delta review bindings can be promoted, DevView needs a
  policy boundary for behavior-change calibration inputs;
- without that policy boundary, later resolver work could accidentally look like arbitrary behavior-change support.

Observed gap comparison:

| Gap                                | Why it matters                                                                                      | Blocks compile eligibility | Blocks source-authority reconstruction | Blocks promotion review | Expected implementation risk | Ordering decision                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------- | ----------------------- | ---------------------------- | ----------------------------------------------------- |
| Behavior-change pack schema policy | Defines whether a behavior-change-shaped calibration draft can be recognized without broad support. | yes                        | yes                                    | yes                     | medium                       | first, because it sets the eligibility boundary       |
| External required-check binding    | Maps `npm test` and dogfood validation into required check/evidence semantics.                      | yes                        | yes                                    | yes                     | high                         | after behavior-change policy                          |
| External checkout path authority   | Distinguishes local external checkout files from committed repository fixture paths.                | yes                        | yes                                    | yes                     | high                         | after behavior-change policy                          |
| Anchor-level context               | Preserves README/source/test anchors beyond artifact-level graph context.                           | no                         | partial                                | maybe                   | medium                       | after eligibility and path/check boundaries           |
| Risk vocabulary                    | Keeps escaping/stringification and maintainer-approval risks visible without ad hoc prose.          | no                         | partial                                | maybe                   | medium                       | after eligibility; before candidate promotion         |
| Graph-delta review binding         | Keeps graph delta/proposal outputs review-only and distinct from graph apply authority.             | no                         | partial                                | maybe                   | medium                       | after eligibility; before any graph-delta integration |

The selected scope is deliberately narrow. It should define how a behavior-change calibration draft is identified,
reported, and held outside support. It should not make `compile-contract --dry-run` compile the second fixture as a
supported candidate.

Implemented output for this first v0.3 scope:

- the calibration observation can distinguish `behavior-change-calibration-policy-recognized` from arbitrary
  `unsupported-change-type-shape`;
- the fixture remains `not-supported`;
- expected candidate status remains `contract-candidate-not-run`;
- unsupported/blocked reasons become clearer;
- external required-check binding, external checkout path authority, anchor-level context, risk vocabulary, and
  graph-delta review binding remain future scopes;
- no promotion review packet is created for the second fixture.

Follow-up output after v0.3 calibration previews:

- `external-required-check-binding.preview.json` records candidate mappings for `npm test`, dogfood validation, and
  graph-delta review Evidence;
- `external-checkout-path-authority.preview.json` records the calibration-local checkout context for
  `work/external/escape-html`;
- `anchor-level-context.preview.json` records approximate source/test behavior anchors for Symbol stringification;
- `risk-vocabulary.preview.json` records behavior-change risk terms and maps them to anchors and Evidence without
  proving mitigation;
- `graph-delta-review-binding.preview.json` records review-only graph delta questions and keeps graph apply out of
  scope;
- the observation reports `external-required-check-binding-awaiting-authoritative-checkout` and
  `external-checkout-path-authority-previewed-calibration-local`;
- the observation reports `anchor-level-context-previewed-approximate`;
- the observation reports `risk-vocabulary-previewed`;
- the observation reports `graph-delta-review-binding-previewed`;
- the observation reports `v0.3-calibration-preview-gap-set-complete`;
- the fixture remains `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
  `not-approved`, and `equivalenceProven: false`;
- no observed v0.3 calibration preview gap remains hidden as support.

Non-goals for the first v0.3 scope:

- no arbitrary behavior-change support;
- no supported external required-check binding or CI/branch-protection enforcement;
- no supported external checkout path authority or execution permission;
- no supported anchor-level context resolver or edit permission;
- no final compiler risk policy or mitigation proof;
- no graph delta apply or semantic equivalence proof;
- no second fixture support or approval;
- no `equivalenceProven: true`;
- no executor automation, graph delta apply, CI enforcement, required checks, branch protection, user acceptance
  automation, or tree-native retirement.

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
- required Evidence/check mapping for external project commands now has a preview-only binding, but still needs checkout
  path authority before support can be considered;
- checkout path authority now has a calibration-local preview, but still needs a separate portable authority policy
  before support can be considered;
- required context now has approximate graph-node-to-source/test/README anchor mapping, but still needs exact line and
  portable source authority before support can be considered;
- known risks now have preview vocabulary, but still need evidence-backed mitigation review before support can be
  considered;
- forbidden scope and stop condition sources may need external-retrofit boundary vocabulary;
- graph delta and graph update proposal artifacts now have review-only bindings, but still need a human closeout
  decision before any support work can be considered.

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

## v0.3 Calibration Preview Closeout

The v0.3 escape-html calibration preview cycle is closed as observation-complete for the selected second fixture:

```text
previewGapSetStatus: v0.3-calibration-preview-gap-set-complete
```

This closeout means the observed calibration gaps now have reviewable preview artifacts. It does not mean the second
fixture is supported, compile-eligible, approved, or equivalence-proven.

Completed preview axes:

- behavior-change calibration policy:
  `examples/retrofit/open-source/escape-html/generated/behavior-change-calibration-policy.preview.json`
- external required-check binding:
  `examples/retrofit/open-source/escape-html/generated/external-required-check-binding.preview.json`
- external checkout path authority:
  `examples/retrofit/open-source/escape-html/generated/external-checkout-path-authority.preview.json`
- anchor-level context:
  `examples/retrofit/open-source/escape-html/generated/anchor-level-context.preview.json`
- risk vocabulary:
  `examples/retrofit/open-source/escape-html/generated/risk-vocabulary.preview.json`
- graph-delta review binding:
  `examples/retrofit/open-source/escape-html/generated/graph-delta-review-binding.preview.json`

Current second-fixture status remains:

- `supportStatus: not-supported`
- `compileEligibility: not-eligible-current-command-not-wired`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

Closed preview gaps:

- DevView can recognize the fixture as behavior-change shaped for calibration only.
- DevView can preview external required-check binding candidates.
- DevView can describe the external checkout as calibration-local source context.
- DevView can preview approximate source/test anchors for the behavior change.
- DevView can name behavior-change-specific risks without claiming mitigation.
- DevView can bind graph delta and graph update proposal artifacts to review-only questions.

Unresolved support blockers:

- external checkout authority remains calibration-local, non-portable, and non-enforcing;
- required-check binding still awaits an authoritative checkout and supported check registry decision;
- anchor-level context remains approximate and lacks exact line/source authority;
- risk vocabulary is not mitigation proof or final compiler risk policy;
- graph-delta review binding is review-only and does not apply graph deltas;
- no supported Compiler Input Model is committed for this fixture;
- no contract candidate is generated for this fixture;
- no promotion review packet or human approval exists for this fixture.

Closeout decision:

```text
close-v0.3-escape-html-calibration-preview-cycle
```

The preview observation cycle is closed for the second fixture, but the fixture is not promoted to supported. The preview
artifacts should stay non-enforcing calibration evidence. They should not be moved into general compiler report
generation, command wiring, or candidate generation without a separate decision.

Recommended next step:

```text
select-third-calibration-fixture
```

Reason: a third fixture should reduce overfitting risk before any of the preview concepts are promoted into general
report generation or compiler behavior.

Closeout non-goals:

- no second-fixture support;
- no compiler command wiring;
- no contract candidate generation;
- no external required checks;
- no graph delta apply;
- no graph source mutation;
- no promotion review packet or approval;
- no semantic equivalence claim;
- no risk mitigation proof;
- no CI enforcement, required checks, branch protection, user acceptance automation, or tree-native retirement.

## Third Calibration Fixture Selection

Selected third calibration fixture:

```text
Todo App add-todo runtime evidence-only calibration
```

Fixture shape:

```text
test-only behavior proof
```

Primary source surfaces:

- `examples/valid/todo-app-pbe-run/graph-source.json`
- `examples/valid/todo-app-pbe-run/.pbe/tree/product-tree.json`
- `examples/valid/todo-app-pbe-run/.pbe/tree/work-tree.json`
- `examples/valid/todo-app-pbe-run/.pbe/tree/test-tree.json`
- `examples/valid/todo-app-pbe-run/.pbe/evidence/evidence-tree.json`
- `examples/valid/todo-app-pbe-run/.pbe/evidence/test-results/todo-add.txt`
- `docs/concept/todo-app-source-authority-evidence-package.md`

This selection does not promote the existing Todo App positive fixture beyond its current structure-only role. It
selects a future calibration target shaped around proving behavior through test and Evidence surfaces while production
source edits remain out of scope.

Initial expected statuses:

- `fixtureStatus: calibration-fixture-selected`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

Why this fixture was selected:

- The current Todo Search fixture validated source-authority reconstruction for a local `bug_fix`.
- The `escape-html` fixture explored external `behavior-change` preview concepts.
- The third fixture should stress a different shape where test/Evidence scope is primary and production source changes
  are not allowed.
- Todo App already has Product, Work, Test, Evidence, Acceptance, and structure-only graph-source surfaces, plus an
  explicit evidence package explaining why runtime behavior proof is still missing.

Compiler dimensions this should stress:

- test-only allowed scope, with future edits limited to test or Evidence artifacts;
- production-source forbidden scope, especially `src/todos.ts` and any app implementation file;
- required Evidence and check binding as the central obligation;
- output requirements that report test Evidence status instead of source implementation changes;
- stop conditions when satisfying the test-only proof would require production source edits;
- compliance-checker bridge for detecting forbidden production source changes;
- user acceptance boundary, because test Evidence still cannot accept product results.

Expected future gaps to observe:

- how `allowedScope` represents test/Evidence-only work;
- how `forbiddenScope` blocks production source changes even when behavior proof is missing;
- how `requiredEvidence` and check mappings distinguish attached text Evidence from runnable test proof;
- how `outputRequirements` report a proof-only result without implying implementation authority;
- how `stopConditions` represent "source edit required" as a blocker for a test-only proof fixture;
- how a later compliance checker could detect production source drift against the test-only contract.

Expected non-support boundary:

The third fixture starts as planning-only. It is not wired into `graph read-model compile-contract --dry-run`, does not
generate a contract candidate, does not create a promotion review packet, does not approve Todo App promotion, and does
not change the existing `todo-app-pbe-run-structure-only` registry meaning.

Overfitting risk reduction:

This fixture should reduce overfitting risk because it is neither the completed local code-change fixture nor the
external behavior-change preview fixture. It asks whether DevView can reason about a proof-focused task where the safest
contract may forbid production code edits and require only test/Evidence strengthening.

## Third Calibration Input Draft

The third fixture calibration-only input draft is:

```text
examples/valid/todo-app-pbe-run/generated/compiler-input-model-calibration-draft.runtime-evidence-only.json
```

Draft status:

- `fixtureStatus: calibration-draft`
- `fixtureShape: test-only-behavior-proof`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

This draft is intentionally placed beside the existing Todo App generated artifacts, but it does not overwrite or
reinterpret the existing `todo-app-pbe-run-structure-only` fixture. The positive Todo App fixture remains
structure-only; the draft is a separate calibration artifact for a possible future runtime Evidence-only proof.

The draft models:

- allowed test/Evidence-oriented scope through `.pbe/tree/test-tree.json`, `.pbe/evidence/evidence-tree.json`, and
  `.pbe/evidence/test-results/todo-add.txt`;
- forbidden production source scope through the conceptual `src/todos.ts` path from `WT-1`;
- required runtime command Evidence as missing/unresolved rather than satisfied;
- attached structure-only Evidence as present but not authoritative runtime proof;
- output requirements for runtime Evidence status, production source non-modification, and non-promotion boundaries;
- stop conditions when runtime proof would require production source edits, when runtime command Evidence is missing, or
  when Evidence is treated as user acceptance;
- risk sources for test-only scope drift, attached-Evidence authority confusion, and acceptance-boundary confusion.

This draft should help a later calibration cycle observe compliance-checker-adjacent questions, especially whether a
test-only contract can detect forbidden production source edits. It is not a supported Compiler Input Model, does not
generate a contract candidate, does not create a promotion review packet, and does not approve Todo App promotion.

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

The next task should add a calibration observation report for the selected Todo App runtime evidence-only draft. It
should not broaden compiler support, wire the third fixture into the supported command path, create a promotion review
packet, approve the fixture, apply graph deltas, turn test Evidence into user acceptance, or change the existing Todo App
structure-only status.
