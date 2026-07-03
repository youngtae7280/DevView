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

## Third Calibration Observation Preview

The third fixture calibration observation preview is:

```text
examples/valid/todo-app-pbe-run/generated/compiler-input-calibration-observation.runtime-evidence-only.preview.json
```

Observation status:

- `status: runtime-evidence-only-calibration-observation-previewed`
- `supportStatus: not-supported`
- `compileEligibility: not-eligible-current-command-not-wired`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The observation keeps the runtime Evidence-only fixture distinct from the existing Todo App structure-only positive
fixture. It is preview-only and non-enforcing, and it is not supported compiler output.

Observed gaps:

- `test-only-allowed-scope`;
- `production-source-forbidden-scope`;
- `runtime-evidence-authority`;
- `evidence-check-binding`;
- `output-requirement-for-test-evidence`;
- `stop-condition-when-source-edits-needed`;
- `compliance-checker-bridge`.

Core test-only boundary:

- production source changes are forbidden or out of scope;
- runtime behavior must be proven through test or Evidence output;
- if production source edits appear necessary, the correct behavior is to stop rather than silently expand scope;
- the fixture is useful for future compliance checking because forbidden source edits should be detectable.

The observation marks attached structure-only Evidence as present but not authoritative runtime proof. It also marks
runtime command Evidence and production source non-modification Evidence as unresolved. It does not invent passing
Evidence, does not create a contract candidate, and does not approve Todo App promotion.

## Third Test-Only Scope Boundary Preview

The third fixture test-only scope boundary preview is:

```text
examples/valid/todo-app-pbe-run/generated/test-only-scope-boundary.runtime-evidence-only.preview.json
```

Preview status:

- `status: test-only-scope-boundary-previewed`
- `scopeBoundaryStatus: preview-only-non-enforcing`
- `productionSourceBoundaryStatus: production-source-edit-forbidden-or-stop-required`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The preview narrows the third fixture's core boundary:

- allowed or candidate scope is test/Evidence oriented;
- runtime command output and source non-modification reports remain unresolved candidate Evidence/report surfaces;
- production source edits are forbidden, out of scope, or stop-required;
- Todo App profile promotion and acceptance-state mutation are forbidden;
- silent expansion from proof-only work into production implementation work is not allowed.

If runtime behavior cannot be proven without production source edits, the expected review behavior is:

```text
stop
report that production source edits appear necessary
do not silently modify production source
request a separate human scope decision
```

This is a preview policy only. It does not enforce scope, execute checks, edit files, generate a candidate, satisfy
runtime Evidence, approve promotion, or replace user acceptance. It prepares the fixture for later compliance-checker
work by making forbidden production source edits explicit and reviewable.

Updated third-fixture gap statuses:

- `test-only-allowed-scope`: `test-only-scope-boundary-previewed`
- `production-source-forbidden-scope`: `production-source-boundary-previewed`
- `stop-condition-when-source-edits-needed`: `source-edit-stop-condition-previewed`

Still unresolved:

- `runtime-evidence-authority`;
- `evidence-check-binding`;
- `output-requirement-for-test-evidence`;
- `compliance-checker-bridge`.

## Third Runtime Evidence Authority Preview

The third fixture runtime Evidence authority preview is:

```text
examples/valid/todo-app-pbe-run/generated/runtime-evidence-authority.runtime-evidence-only.preview.json
```

Preview status:

- `status: runtime-evidence-authority-previewed`
- `runtimeEvidenceAuthorityStatus: preview-only-not-satisfied`
- `currentRuntimeEvidenceStatus: missing`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The preview defines what may count as authoritative runtime Evidence for the test-only behavior proof fixture. Candidate
authoritative Evidence can include captured command output, structured runtime test artifacts, or manual runtime
observation records with human review. Natural-language claims such as "tests passed" are not authoritative Evidence by
themselves.

Authoritative runtime Evidence should record:

- exact command or runtime check;
- pass/fail status and exit code where applicable;
- relevant assertion summary;
- artifact path or structured evidence record;
- freshness or capture statement;
- links to `TT-1`, `AC-PT-1-1`, and the add-todo behavior;
- source non-modification statement.

The existing attached `todo-add.txt` remains structure-only context. It is present, but it is not enough by itself to
satisfy runtime Evidence authority for this calibration fixture. Runtime command Evidence and production source
non-modification Evidence remain unresolved.

The preview preserves the test-only boundary: runtime Evidence must be produced without production source edits. If
production source edits appear necessary, the expected behavior remains stop and report, not silent scope expansion.

Updated third-fixture gap status:

- `runtime-evidence-authority`: `runtime-evidence-authority-previewed`

Still unresolved:

- `evidence-check-binding`;
- `output-requirement-for-test-evidence`;
- `compliance-checker-bridge`.

## Third Evidence-Check Binding Preview

The third fixture evidence-check binding preview is:

```text
examples/valid/todo-app-pbe-run/generated/evidence-check-binding.runtime-evidence-only.preview.json
```

Preview status:

- `status: evidence-check-binding-previewed`
- `evidenceCheckBindingStatus: preview-only-not-satisfied`
- `currentRuntimeEvidenceStatus: missing`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The preview maps candidate checks to expected Evidence without making those checks required checks:

- `check-todo-app-runtime-add-todo` -> missing authoritative runtime command Evidence;
- `check-todo-app-attached-evidence-review` -> present attached structure-only Evidence, not runtime proof;
- `check-todo-app-production-source-unchanged` -> missing future source non-modification Evidence.

Candidate checks must produce Evidence satisfying the runtime Evidence authority preview. Because current runtime
Evidence is still missing, the binding is not satisfied. No command is claimed to have passed, and no check is wired into
CI, branch protection, or the supported compiler command path.

The preview preserves the test-only boundary: checks and Evidence must not require production source edits. If production
source edits appear necessary, the expected behavior remains stop and report, not silent scope expansion.

Updated third-fixture gap status:

- `evidence-check-binding`: `evidence-check-binding-previewed`

Still unresolved before the output requirement preview:

- `output-requirement-for-test-evidence`;
- `compliance-checker-bridge`.

## Third Output Requirement For Test Evidence Preview

The third fixture output requirement preview is:

```text
examples/valid/todo-app-pbe-run/generated/output-requirement-for-test-evidence.runtime-evidence-only.preview.json
```

Preview status:

- `status: output-requirement-for-test-evidence-previewed`
- `outputRequirementStatus: preview-only-not-satisfied`
- `currentRuntimeEvidenceStatus: missing`
- `evidenceCheckBindingStatus: preview-only-not-satisfied`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The preview defines what an agent must report after a test-only behavior proof attempt without turning that report into
runtime Evidence by itself. Required report content includes:

- whether candidate checks were attempted, skipped, or unavailable;
- captured command output references or an explicit missing Evidence status;
- current runtime Evidence status;
- whether available Evidence satisfies runtime Evidence authority requirements;
- whether production source files were modified;
- whether the source-edit stop condition was triggered;
- the non-promotion, non-approval, and non-acceptance boundary for this calibration fixture.

Report text alone is insufficient without command output or structured Evidence references. The output requirement also
keeps the structure-only attached Evidence boundary visible: the existing attached Evidence can be referenced as context,
but it does not satisfy runtime Evidence authority by itself.

The preview preserves the test-only boundary. Runtime Evidence must be produced without production source edits. If
production source edits appear necessary, the report should identify the stop condition rather than silently expanding
scope.

Updated third-fixture gap status:

- `output-requirement-for-test-evidence`: `output-requirement-for-test-evidence-previewed`

Still unresolved before the compliance-checker bridge preview:

- `compliance-checker-bridge`.

## Third Compliance-Checker Bridge Preview

The third fixture compliance-checker bridge preview is:

```text
examples/valid/todo-app-pbe-run/generated/compliance-checker-bridge.runtime-evidence-only.preview.json
```

Preview status:

- `status: compliance-checker-bridge-previewed`
- `complianceBridgeStatus: preview-only-not-implemented`
- `previewGapSetStatus: runtime-evidence-only-preview-gap-set-complete`
- `currentRuntimeEvidenceStatus: missing`
- `evidenceCheckBindingStatus: preview-only-not-satisfied`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`

The bridge explains what a future checker would inspect for the test-only behavior proof fixture. It links the test-only
scope boundary, runtime Evidence authority, evidence/check binding, and output requirement previews into future
violation-check inputs.

Future violation checks may include:

- production source modified during a test-only fixture;
- required runtime Evidence missing;
- candidate check reported without captured command output;
- missing source modification statement;
- missing stop condition statement;
- Evidence claimed satisfied while `currentRuntimeEvidenceStatus` remains `missing`;
- candidate check treated as an enforced required check;
- output report missing required Evidence references.

This is still descriptive, not executable. No compliance checker is implemented. The preview does not inspect diffs,
detect file modifications, parse command output, reject violations, enforce scope, run checks, or approve runtime
Evidence.

Updated third-fixture gap status:

- `compliance-checker-bridge`: `compliance-checker-bridge-previewed`

Preview gap set status:

```text
runtime-evidence-only-preview-gap-set-complete
```

Remaining preview gaps:

```text
none
```

Remaining support blockers still include unsupported command wiring, missing authoritative runtime Evidence,
unsatisfied evidence/check binding, no implemented compliance checker, no approval, and `equivalenceProven: false`.

Recommended next step from the observation:

```text
close-third-fixture-runtime-evidence-preview-cycle
```

Recommended next scope:

```text
runtime-evidence-only-preview-closeout
```

Reason: the third fixture preview gap set is complete. The next step should close out what was learned without
implementing compliance checking, broadening compiler support, generating a contract candidate, approving the fixture,
or turning reports into user acceptance.

## Third Runtime Evidence-Only Preview Closeout

Closeout decision:

```text
close-third-fixture-runtime-evidence-preview-cycle
```

Scope:

```text
Todo App add-todo runtime evidence-only calibration
```

The third fixture preview cycle is closed as a support-before-observation milestone, not as supported compiler behavior.
The completed preview axes are:

- test-only scope boundary;
- runtime Evidence authority;
- evidence/check binding;
- output requirement for test Evidence;
- compliance-checker bridge.

These previews show how a test-only behavior proof fixture can separate allowed test/Evidence work from forbidden
production source edits, how runtime Evidence should be made observable, how candidate checks map to expected Evidence,
what output must report, and what a future checker would inspect. They remain preview-only and non-enforcing.

What remains unsupported:

- the third fixture is not supported;
- the third fixture is not wired into the supported compiler command path;
- no contract candidate is generated;
- no promotion review approval exists;
- `equivalenceProven` remains `false`;
- runtime Evidence is still missing;
- evidence/check binding remains `preview-only-not-satisfied`;
- no compliance checker is implemented;
- production source edits remain forbidden or stop-required for this fixture.

Remaining limitations:

- runtime Evidence authority is defined but not satisfied;
- candidate checks do not become required checks;
- output requirements are preview-only and do not generate final reports;
- the compliance-checker bridge is descriptive, not executable;
- no diff inspection, file modification detection, command output parsing, or violation reporting exists yet.

Closed preview gaps:

```text
test-only-allowed-scope
production-source-forbidden-scope
runtime-evidence-authority
evidence-check-binding
output-requirement-for-test-evidence
stop-condition-when-source-edits-needed
compliance-checker-bridge
```

Unresolved support blockers:

```text
not-supported
not-eligible-current-command-not-wired
contract-candidate-not-run
runtime-evidence-missing
evidence-check-binding-not-satisfied
compliance-checker-not-implemented
approvalStatus-not-approved
equivalenceProven-false
```

Future implementation candidates include test-only allowed-scope policy, runtime Evidence capture authority, supported
evidence/check binding, proof-only output generation, and non-enforcing compliance-checker reporting. None of those are
approved by this closeout.

Recommended next step:

```text
cross-fixture-calibration-synthesis
```

Reason: three fixtures now cover distinct shapes: local `bug_fix`, external `behavior-change`, and test-only behavior
proof. A cross-fixture synthesis should summarize what these calibration cycles taught before any preview concept is
promoted into general compiler logic, report generation, or compliance-checker implementation.

## Cross-Fixture Calibration Synthesis

Synthesis decision:

```text
cross-fixture-calibration-synthesis
```

The compiler calibration set now covers three distinct fixture shapes:

```text
local bug_fix
external behavior-change
test-only behavior proof
```

This synthesis is documentation-only. It does not implement support, wire calibration fixtures into the supported
compiler command path, generate new contract candidates, approve promotion, or prove equivalence.

### Fixture Shape Summary

Todo Search whitespace-normalization `bug_fix`:

- proved: the current dry-run fixture can be reconstructed from source authority for major contract fields;
- did not prove: arbitrary `changeType` support, broad fixture support, execution readiness, or universal equivalence;
- stressed: source-authority preservation, semantic diff classification, review-only diff policy, promotion review
  packet, and current-fixture human decision scope;
- current status: completed current fixture, `equivalenceCandidate: true`, `equivalenceProven: false`, scoped human
  decision recorded, generated approval status not promoted.

`component/escape-html` Symbol stringification `behavior-change`:

- proved: DevView can observe a behavior-change calibration input and identify support-before-implementation preview
  axes;
- did not prove: behavior-change support, authoritative external checkout, candidate generation, promotion readiness, or
  graph-delta application;
- stressed: external required-check binding, external checkout path authority, anchor-level context, behavior-change
  risk vocabulary, and graph-delta review binding;
- current status: v0.3 preview gap set complete, still `not-supported`, `contract-candidate-not-run`, `not-approved`,
  and `equivalenceProven: false`.

Todo App add-todo runtime Evidence-only calibration:

- proved: DevView can model a test-only behavior proof where production source edits are forbidden or stop-required;
- did not prove: runtime Evidence satisfaction, supported evidence/check binding, implemented compliance checking,
  candidate generation, or Todo App promotion beyond `structure-only`;
- stressed: test-only allowed scope, production-source forbidden scope, runtime Evidence authority, proof-only output
  requirements, and compliance-checker bridge;
- current status: runtime Evidence-only preview gap set complete, still `not-supported`,
  `contract-candidate-not-run`, `not-approved`, and `equivalenceProven: false`; runtime Evidence remains missing and
  evidence/check binding remains `preview-only-not-satisfied`.

### Reusable Compiler Concepts

The following concepts appear reusable across more than one fixture:

- source-authority preservation: generated contract fields should be derived from input model authority, not copied from
  hand-written comparison fixtures;
- scope boundary: allowed, forbidden, and stop-required surfaces must stay explicit before candidate generation;
- forbidden scope: production source, promotion, acceptance, and enforcement boundaries need first-class representation;
- Evidence authority: observable Evidence must be distinguished from natural-language claims and context-only artifacts;
- evidence/check binding: checks must map to Evidence without becoming required checks unless separately approved;
- output requirement binding: output obligations should report Evidence status, boundary status, and missing proof
  honestly;
- stop conditions: unsupported or out-of-scope work should stop/report instead of silently widening scope;
- risk vocabulary: risk terms are useful review metadata but not mitigation proof;
- graph-delta review binding: behavior deltas can be described for review without applying graph deltas;
- compliance-checker bridge: future checking should compare actual work and reported Evidence against contract
  boundaries, but the bridge itself is not an implemented checker.

Stable concepts are the concepts above as review vocabulary and source-authority modeling targets. They are not yet
stable as generalized compiler logic, report generation, command wiring, enforcement, or execution behavior.

### Fixture-Specific Concepts

`escape-html` behavior-change concepts should remain fixture-specific until another fixture exercises them:

- external checkout path authority;
- external required-check binding;
- approximate anchor-level context;
- graph-delta review-only binding;
- behavior-change risk vocabulary around runtime compatibility, input coercion, Symbol handling, escaping correctness,
  and source-authority boundary.

Todo App runtime Evidence-only concepts should also remain fixture-specific until broader policy exists:

- production source forbidden scope for a test-only proof;
- runtime Evidence authority;
- evidence/check binding that remains unsatisfied when Evidence is missing;
- output requirement for test Evidence and source non-modification reporting;
- compliance-checker bridge for detecting contract-following violations.

Do not generalize fixture-specific concepts by copying their preview artifact shapes directly into compiler output.

### Overfitting Risks

Known overfitting risks:

- treating one fixture's preview artifact shape as universal;
- promoting static preview artifacts directly into compiler execution output;
- treating candidate checks as required checks;
- treating local checkout paths as portable source authority;
- treating risk vocabulary as mitigation proof;
- treating compliance-checker bridge metadata as implemented checker behavior;
- treating review-only closeouts as support, approval, equivalence proof, execution authority, or user acceptance.

### Recommended Next Milestone

Recommended next milestone:

```text
compiler-eligibility-status-model
```

Reason: the calibration cycles now use recurring statuses such as `not-supported`,
`behavior-change-calibration-policy-recognized`, `not-eligible-current-command-not-wired`,
`contract-candidate-not-run`, `preview-gap-set-complete`, and `promotion-not-eligible`. Before adding another fixture or
promoting preview concepts into code, DevView should define a formal eligibility/status lifecycle across fixtures.

That lifecycle should clarify the difference between:

- selected fixture;
- calibration draft;
- policy recognized;
- preview gap set complete;
- compile eligible;
- candidate generated;
- promotion review eligible;
- human decision recorded;
- equivalence proven.

This synthesis does not implement that lifecycle model. It only records why the model is the next recommended milestone.

The lifecycle model is now recorded in
[contract-compiler-eligibility-status-model.md](contract-compiler-eligibility-status-model.md). It defines status
categories, canonical meanings, allowed and forbidden transitions, and current fixture mapping without implementing
support or promotion.

The next direction decision is now recorded in
[devview-compliance-checker-mvp-scope.md](devview-compliance-checker-mvp-scope.md). It selects
`scope-compliance-preview` as the first future compliance-checker MVP axis without implementing checker behavior,
enforcing scope, rejecting diffs, approving fixtures, or changing equivalence status.

## Scope Compliance Checker MVP Preview

The first scope compliance checker preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-checker.runtime-evidence-only.preview.json
```

Preview status:

- `status: scope-compliance-checker-previewed`
- `checkerPreviewStatus: preview-only-not-implemented`
- `mvpAxis: scope-compliance-preview`
- `changedFileListSource.status: missing-not-implemented`
- `changedFileListAuthorityPreviewStatus: changed-file-list-authority-previewed`
- `supportStatus: not-supported`
- `expectedCandidateStatus: contract-candidate-not-run`
- `approvalStatus: not-approved`
- `equivalenceProven: false`
- `currentRuntimeEvidenceStatus: missing`
- `evidenceCheckBindingStatus: preview-only-not-satisfied`

The preview binds the Todo App runtime Evidence-only fixture to the first compliance-checker MVP axis. It uses the
test-only scope boundary preview as the source for expected allowed scope and forbidden scope, then records future
checker inputs such as an actual changed-file list, diff summary, agent output report, and source non-modification
Evidence.

Future conceptual violation categories include:

- `allowed-scope-violation`;
- `forbidden-scope-violation`;
- `production-source-modified-in-test-only-fixture`;
- `missing-changed-file-list`;
- `scope-status-overclaim`.

The preview is still descriptive, not executable. No compliance checker is implemented. No actual diff is inspected, no
changed files are collected, no scope is enforced, and no result can be rejected from this artifact. Runtime Evidence
remains missing and evidence/check binding remains unsatisfied.

The third-fixture observation now links this preview with:

```text
scopeCompliancePreviewStatus: scope-compliance-checker-previewed
```

The implementation readiness criteria are now recorded in
[scope-compliance-checker-implementation-readiness.md](scope-compliance-checker-implementation-readiness.md). They define
the future changed-file input authority question, allowed/forbidden scope sources, missing-input reporting, path
normalization questions, non-enforcing result states, and the first proposed static result artifact without implementing
checker behavior.

## Scope Compliance Result Preview

The first static scope compliance result-shape preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json
```

Preview status:

- `status: scope-compliance-collection-only-not-evaluated-previewed`
- `scopeComplianceResultStatus: scope-compliance-not-evaluated-collection-only`
- `changedFileListStatus: git-derived-changed-files-collected`
- `changedFileListAuthorityStatus: git-derived-changed-files`
- `enforcementStatus: non-enforcing-preview`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: true`
- `scopeComplianceEvaluationStatus: not-evaluated`
- `scopeEnforced: false`

The preview result intentionally does not report `scope-compliance-no-violation-observed`. It also does not report an
actual violation. Changed files may now be collected as names/status only, but no scope compliance evaluation has run.

The third-fixture observation now links this preview with:

```text
scopeComplianceResultPreviewStatus: scope-compliance-collection-only-not-evaluated-previewed
```

Runtime Evidence remains missing, evidence/check binding remains `preview-only-not-satisfied`, the fixture remains
`not-supported`, and no checker has run.

## Changed-File List Authority Preview

The first changed-file list authority preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/changed-file-list-authority.runtime-evidence-only.preview.json
```

Preview status:

- `status: changed-file-list-authority-previewed`
- `changedFileListAuthorityStatus: changed-file-list-authority-unresolved`
- `currentChangedFileListStatus: changed-file-list-missing`
- `actualDiffInspected: false`
- `changedFilesCollected: false`
- `checkerRun: false`

The preview compares candidate future changed-file sources without collecting changed files. It records that
agent-reported changed files are claim-only and not authoritative by themselves. Fixture-provided changed-file lists may
be used first for a static preview result-shape test, but they remain preview-only and non-enforcing. A git-derived
changed-file list is a later authoritative candidate after base/head selection, working-tree state, and path
normalization rules exist.

The third-fixture observation now links this preview with:

```text
changedFileListAuthorityPreviewStatus: changed-file-list-authority-previewed
```

The scope compliance result preview now links collection-only changed-file input, keeps `evaluatedViolations: []`, and
does not claim a clean result or an actual violation.

## Authoritative Changed-File Input Boundary Decision

The scope compliance MVP now records the changed-file input boundary decision:

```text
authoritativeChangedFileInputBoundaryDecisionStatus: authoritative-changed-file-input-boundary-decided
```

Decision:

- agent-reported changed files are not authoritative;
- fixture-provided changed files are preview-only and remain limited to static result-shape design;
- review-packet changed files are review context, not the first MVP authority source;
- execution-metadata changed files may become authoritative later if emitted by a trusted executor;
- git-derived changed files are the selected first real authoritative candidate for a later implementation task.

This decision did not implement changed-file collection, run `git diff`, inspect actual diffs, run checker logic,
evaluate fixture-provided scenarios, claim no-violation, claim actual violations, reject diffs, enforce scope, approve
the fixture, satisfy runtime Evidence, or prove equivalence. DEC-220 later adds collection-only input; scope compliance
still remains not evaluated.

## Git-Derived Changed-File Input Design Preview

The git-derived changed-file input design preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-input-design.runtime-evidence-only.preview.json
```

Preview status:

- `status: git-derived-input-design-previewed`
- `authorityClass: git-diff-derived-authoritative-candidate`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: false`
- `evaluatedViolations: []`

The preview designs the future git-derived input shape without collecting files. It prefers explicit base/head refs or a
committed range for the first implementation, defers working-tree, staged, and untracked-file modes, and records path
normalization requirements for repository-root-relative POSIX-style paths. Generated read-model churn should be reported
honestly by collection, with any suppression or exclusion handled by a separate policy.

The third-fixture observation now links this preview with:

```text
gitDerivedChangedFileInputDesignStatus: git-derived-input-design-previewed
```

At this design-preview stage the result preview still reported `scope-compliance-input-missing`. No `git diff` output was
encoded, no actual diff was inspected, no changed files were collected, no fixture scenario was evaluated, and no clean
or violation result was claimed.

## Git-Derived Changed-File Collection Scope Decision

The first git-derived collection implementation scope is now decided:

```text
gitDerivedChangedFileCollectionScopeDecisionStatus: git-derived-collection-scope-decided
```

Decision:

- first slice is collection-only;
- explicit base/head refs are first;
- committed range such as `HEAD~1..HEAD` remains a convenience candidate after explicit-ref handling is defined;
- working-tree, staged, and untracked modes remain deferred;
- collection should produce a collection artifact only;
- collection success does not imply scope compliance;
- scope evaluation, clean result, violation result, rejection, enforcement, CI wiring, approval, and equivalence proof
  remain later tasks.

Future collection-only state may set `changedFilesCollected: true`, but it must keep `checkerRun: false`,
`evaluatedViolations: []`, and `scopeComplianceEvaluationStatus: not-evaluated` until a later evaluation slice exists.

## Git-Derived Changed-File Collection-Only Implementation

The first git-derived changed-file collection artifact is:

```text
examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-collection.runtime-evidence-only.preview.json
```

Collection status:

```text
gitDerivedChangedFileCollectionStatus: git-derived-changed-files-collected
```

The new command shape is:

```text
graph read-model collect-changed-files --base <baseRef> --head <headRef> --json
```

This is the first implementation slice for the scope compliance input layer. It uses Git only to collect changed-file
names/status between explicit refs. It normalizes paths to repository-root-relative POSIX-style paths and reports
generated files honestly. It does not inspect patch contents.

The third-fixture observation now records collection-only progress while preserving:

- `checkerRun: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `evaluatedViolations: []`;
- no allowedScope or forbiddenScope evaluation;
- no clean or violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

Changed files collected does not mean scope compliance checked.

## Scope Compliance Collection Input Consumption Preview

The first collection input consumption preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-collection-input-consumption.runtime-evidence-only.preview.json
```

Preview status:

```text
scopeComplianceCollectionInputConsumptionStatus: scope-compliance-collection-input-consumption-previewed
```

This artifact accepts the git-derived changed-file collection artifact as a future scope compliance checker input. It
does not consume that input for evaluation.

Required boundary:

- `inputAcceptedForFutureEvaluation: true`;
- `inputConsumedForEvaluation: false`;
- `checkerRun: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `evaluatedViolations: []`;
- no allowedScope comparison;
- no forbiddenScope comparison;
- no path pattern matching;
- no clean or violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

Remaining future inputs include allowedScope binding, forbiddenScope binding, path pattern matching policy,
generated-file handling policy, violation category schema, and evaluation result schema.

## Scope Compliance Scope Input Binding Preview

The allowed/forbidden scope input binding preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json
```

Preview status:

```text
scopeComplianceScopeInputBindingStatus: scope-compliance-scope-input-binding-previewed
```

This artifact identifies where a future scope compliance checker should read comparison scope for the third fixture:

- allowed scope: `targetScopeCandidates[]` in
  `compiler-input-model-calibration-draft.runtime-evidence-only.json`;
- forbidden scope: `policySnapshot.forbiddenScopeRules[]` in the same calibration draft.

This does not create a new source of truth and does not promote preview docs into checker authority. The preferred
future authority remains a supported execution contract with `allowedScope[]` and `forbiddenScope[]`, but the Todo App
runtime Evidence-only fixture is not supported, not wired, and has no contract candidate.

Required boundary:

- `scopeInputsAcceptedForFutureEvaluation: true`;
- `scopeInputsConsumedForEvaluation: false`;
- `checkerRun: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `evaluatedViolations: []`;
- no changed-file comparison against allowedScope;
- no changed-file comparison against forbiddenScope;
- no path pattern matching;
- no clean or violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

With this preview, the changed-file input and the scope-rule input are both identifiable for future evaluation. The next
safe step is path pattern matching policy, not scope compliance evaluation.

## Scope Compliance Path Pattern Policy Preview

The path pattern matching policy preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json
```

Preview status:

```text
scopeCompliancePathPatternPolicyStatus: scope-compliance-path-pattern-policy-previewed
```

This artifact previews how a future checker should compare normalized changed-file paths with allowed/forbidden scope
patterns:

- repository-root-relative POSIX paths;
- Windows `\` separator normalization;
- no absolute local paths as input or output authority;
- leading `./` normalization;
- exact paths plus glob-like patterns for the first slice;
- no regex in the first slice;
- forbidden match wins over allowed match;
- unknown or unparsable patterns block evaluation rather than silently passing;
- unmatched changed paths become a future `scope-unmatched-path` category, not a clean result;
- generated files are reported honestly rather than silently excluded;
- renamed files should preserve old and new paths when Git reports them;
- deleted files remain changed paths;
- case sensitivity remains repository-policy unresolved.

Required boundary:

- `policyAcceptedForFutureEvaluation: true`;
- `policyConsumedForEvaluation: false`;
- `checkerRun: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `evaluatedViolations: []`;
- no checker-consumed path matching;
- no allowedScope comparison;
- no forbiddenScope comparison;
- no clean or violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

With this preview, the next safe step was violation category schema preview, not path matching implementation.

## Scope Compliance Violation Category Schema Preview

The violation category schema preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json
```

Preview status:

```text
scopeComplianceViolationCategorySchemaStatus: scope-compliance-violation-category-schema-previewed
```

This artifact defines future finding vocabulary for scope compliance:

- `forbidden-scope-match`;
- `allowed-scope-match`;
- `scope-unmatched-path`;
- `unknown-pattern`;
- `unparsable-pattern`;
- `generated-file-review-required`;
- `rename-review-required`;
- `deleted-file-review-required`;
- `case-sensitivity-review-required`.

The preview records conservative future severity/blocking policy: forbidden scope matches are blocking; unmatched paths
are review-required and not clean; unknown or unparsable patterns block or stop evaluation; generated, rename, deleted,
and case-sensitivity categories require review unless later policy decides otherwise.

Required boundary:

- `categorySchemaAcceptedForFutureEvaluation: true`;
- `categorySchemaConsumedForEvaluation: false`;
- `checkerRun: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `evaluatedViolations: []`;
- no actual evaluated findings;
- no checker-consumed path matching;
- no allowedScope comparison;
- no forbiddenScope comparison;
- no clean or actual violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

`evaluatedViolations: []` still means not evaluated while `checkerRun: false`; it is not a clean result. With this
preview, the next safe step was evaluation result shape preview, not path matching implementation.

## Scope Compliance Evaluation Result Shape Preview

The evaluation result shape preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json
```

Preview status:

```text
scopeComplianceEvaluationResultShapeStatus: scope-compliance-evaluation-result-shape-previewed
```

This artifact defines future result states for a later non-enforcing evaluator:

- `not-evaluated`;
- `evaluation-blocked`;
- `evaluated-clean`;
- `evaluated-with-review-required`;
- `evaluated-with-blocking-violations`.

Required current state:

- `checkerRun: false`;
- `inputConsumedForEvaluation: false`;
- `scopeInputsConsumedForEvaluation: false`;
- `pathPolicyConsumedForEvaluation: false`;
- `categorySchemaConsumedForEvaluation: false`;
- `scopeComplianceEvaluationStatus: not-evaluated`;
- `scopeComplianceResult: no-result`;
- `evaluatedViolations: []`;
- `reviewRequiredFindings: []`;
- `blockingFindings: []`;
- no clean result;
- no actual violation result;
- no checker-consumed path matching;
- no allowedScope or forbiddenScope comparison;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

The clean result policy is intentionally strict. Empty finding arrays are clean only after a future evaluator has run,
consumed changed-file input, scope inputs, path policy, and category schema, evaluated every changed file, and found no
blocking, review-required, or unknown findings. In the current preview, empty finding arrays still mean not evaluated.

## Scope Compliance Path Matching Helper

The helper-only path matcher is:

```text
cli/src/core/scope-compliance-path-pattern.ts
```

Status:

```text
pathMatchingHelperStatus: helper-implemented-not-consumed-for-evaluation
```

The helper supports a single normalized repository-root-relative path against a single future scope pattern. It handles
POSIX-style normalization, Windows separator normalization, leading `./`, absolute path rejection, exact path matches,
directory-prefix patterns, and simple first-slice glob-like patterns. It returns helper-level fields such as `matched`,
`matchKind`, `patternValid`, `pathValid`, and `reason`.

Required boundary:

- no allowedScope or forbiddenScope list evaluation;
- no `forbidden-scope-match` or `allowed-scope-match` category output;
- no `scope-unmatched-path` category output;
- no checker run;
- no `scopeComplianceResult`;
- no clean result;
- no actual violation result;
- no rejection, enforcement, CI wiring, fixture approval, runtime Evidence satisfaction, or equivalence proof.

The helper is implementation plumbing for a later non-enforcing evaluator. It is not itself scope compliance evaluation.

## Scope Compliance Non-Enforcing Evaluator

The first non-enforcing evaluator helper is:

```text
cli/src/core/scope-compliance-evaluator.ts
```

The first advisory evaluation artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation.runtime-evidence-only.preview.json
```

Current artifact status:

```text
scopeComplianceEvaluatorStatus: non-enforcing-evaluator-implemented
checkerRun: true
nonEnforcing: true
scopeComplianceEvaluationStatus: evaluation-blocked
scopeComplianceResult: evaluation-blocked
enforcementStatus: not-enforced
```

This is the first implementation slice that consumes the git-derived changed-file collection, allowed/forbidden scope
binding, path pattern policy, path matching helper, violation category schema, and result shape. It remains advisory
only. It does not inspect patch contents, reject diffs, enforce scope, wire CI, configure required checks, approve the
fixture, satisfy runtime Evidence, apply graph deltas, or prove equivalence.

The evaluator is also available through the advisory CLI surface:

```text
graph read-model check-scope --base <baseRef> --head <headRef> --json
```

The command prints advisory JSON, may write an artifact only with explicit `--output`, and does not fail solely because
advisory findings exist.

The same command can write a compact advisory runtime report when a Markdown path is supplied:

```text
graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json
```

The compact report summarizes base/head refs, changed/evaluated file counts, advisory result state, non-enforcement
status, and finding counts. It is not enforcement, fixture approval, runtime Evidence satisfaction, equivalence proof,
graph delta apply, or user acceptance.

The first Graph Delta Proposal boundary preview for advisory scope results is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-boundary.runtime-evidence-only.preview.json
```

It records how advisory `check-scope` output may later inform proposal candidates such as scope-finding review notes,
risk updates, Evidence links, decision notes, changed-file observations, and runtime report links. The boundary remains
proposal-only: `graphSourceMutated: false`, `graphDeltaApplied: false`, `requiresHumanReview: true`, and
`approvalStatus: not-approved`.

The candidate schema alignment preview is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json
```

It maps advisory scope candidate categories against the existing `pbe-graph-update-proposal-v0` shape instead of
creating a competing proposal format. The preview records partial mappings for `changedFiles`, `proposedRecordState`,
and `boundaries`, while leaving Evidence links, runtime report links, source record binding, and graph-delta source
selection unresolved for future review.

The unresolved mapping decision preview is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json
```

It narrows three pre-generator decisions. `CH-001` is the existing structure-only change node candidate for future
`sourceRecordId` review, `graphDeltaPath` remains deferred until a graph-delta-compatible source exists, and advisory
JSON/report links remain candidate-only review context rather than accepted Evidence or approval.

The graph-delta-compatible source preview is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json
```

It defines the proposal-only generator input shape by gathering advisory `check-scope` output, compact runtime
report references, changed-file collection, scope evaluation, proposal boundary, schema alignment, and unresolved
mapping decisions. It is not graph-source, not a graph delta, not a graph update proposal, not apply, and not runtime
Evidence satisfaction. `CH-001` remains a structure-only review candidate and human review remains required.

The proposal-only generator scope decision is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json
```

It defines the implementation boundary that the first proposal-only generator now follows. The CLI may read the source
artifact and produce proposal-shaped preview JSON only through stdout or explicit `--output`; the output remains
unapproved, non-enforcing, human-review-required, and separate from graph-source apply.

The proposal-only generator CLI is:

```text
graph read-model propose-graph-delta --source <sourceArtifact> --json
graph read-model propose-graph-delta --source <sourceArtifact> --output <proposalPath> --json
```

It emits `artifactRole: graph-delta-proposal-only-preview` with `schemaId: pbe-graph-update-proposal-v0`. It does not
create an apply-ready graph update proposal, mutate graph-source, apply graph deltas, approve updates, satisfy runtime
Evidence, prove equivalence, reject diffs, enforce scope, or configure required checks.

The Human Review Packet CLI is:

```text
graph read-model review-graph-delta --proposal <proposalPath> --json
graph read-model review-graph-delta --proposal <proposalPath> --markdown <file> --json
```

It consumes proposal-only previews and emits `reviewPacketStatus: review-required` with compact review counts,
candidate-only items, and human review questions. It does not approve the fixture, record a human decision, mutate
graph-source, apply graph deltas, satisfy runtime Evidence, prove equivalence, reject diffs, enforce scope, or configure
required checks.

The current Todo App runtime Evidence-only evaluation is blocked rather than clean because the draft still contains
`unresolved:todo-app-runtime-proof-report`. Empty `evaluatedViolations: []` in this artifact must not be read as fixture
approval or runtime Evidence satisfaction.

## DevView Runtime Budget Smoke

The deterministic runtime budget is documented in
[devview-runtime-performance-budget.md](devview-runtime-performance-budget.md).

The first advisory timing smoke is:

```text
npm run devview:runtime:smoke
```

It measures selected deterministic local commands and reports the 5 second target as advisory only. Full validation,
full test suites, CI runtime, human review, and AI editing time are outside this budget. The changed-file collection
step writes to a `.tmp` smoke artifact rather than refreshing the tracked Todo App collection preview. The smoke
includes advisory `check-scope` and writes its compact runtime report to `.tmp` without writing an evaluation artifact.
It also includes proposal-only graph delta preview generation and writes any generated preview to `.tmp` through explicit
`--output`. It then generates the Human Review Packet from that `.tmp` proposal preview and writes Markdown only to
`.tmp` through explicit `--markdown`. It does not enforce scope, reject diffs, configure required checks, approve
fixtures, record human decisions, satisfy runtime Evidence, prove equivalence, or apply graph deltas.

## DevView Codex Hook Gateway Boundary

The DevView Codex Hook Gateway boundary preview for the Todo App runtime Evidence-only calibration fixture is:

```text
examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json
```

It records how future DevView ON sessions may be routed through Codex lifecycle hooks before and after editing:
preflight/request intake, execution contract availability, edit-capable tool checks, post-checks, advisory scope reports,
proposal-only previews, and Human Review Packets. Current status remains preview-only: hook scripts are not implemented,
actual blocking hook behavior is not implemented, strict mode is disabled, CI enforcement is disabled, graph apply is
disabled, approval automation is disabled, and graph-source remains unmutated.

## Natural Language Request Intake Boundary

The Natural Language Request Intake compiler frontend boundary for this calibration fixture is:

```text
examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json
```

It previews how a human natural-language request could become a Request IR candidate and then require deterministic
validation before graph traversal, selected node/edge slice generation, contract compiler input generation, or
instruction pack generation. AI-produced fields are candidate-only and do not become fixture support, approval, runtime
Evidence, graph-source authority, or equivalence proof.

The AI Request Analyzer boundary preview is:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json
```

It defines the future analyzer as a candidate-only producer from raw natural language plus optional repo/session context
to Request IR Candidate JSON. The analyzer is not implemented, no LLM/API call is introduced, and analyzer output cannot
drive traversal, selected slice generation, contract input, instruction pack generation, Codex execution, approval,
runtime Evidence satisfaction, equivalence proof, graph-source mutation, graph delta apply, or enforcement.

The deterministic prompt/input contract pack for future analyzer use is:

```text
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-pack.add-todo-runtime-evidence-only.preview.md
```

It is generated from the analyzer boundary and Request IR Candidate schema previews. It is not an analyzer
implementation, does not call an LLM/API, and does not generate a Request IR Candidate.

The clarification interview boundary preview is:

```text
examples/valid/todo-app-pbe-run/generated/clarification-interview-boundary.add-todo-runtime-evidence-only.preview.json
```

The deterministic clarification question-plan pack for the current calibration candidate is:

```text
examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.md
```

It defines the alternate branch for ambiguous natural-language requests. Low confidence, unknown request type, missing
target record/component, ambiguous allowed or forbidden scope, missing evidence requirement, graph/source authority
conflict, production-source edit ambiguity, or implicit approval/apply/enforcement requests must stop before traversal
and ask short mapped questions. Clarification answers may produce only a revised Request IR Candidate; the revised
candidate must re-run schema-only and graph-aware validation before traversal. This is not an interview UI, not an LLM
call, not approval, not runtime Evidence satisfaction, and not compiler/execution authority.

For the current add-todo runtime-evidence-only calibration candidate, the generated pack records
`questionPlanStatus: no-questions-required-for-current-calibration-candidate` and `questionCount: 0`. Ambiguous future
candidates may receive at most one to three mapped questions, but those questions still do not revise the Request IR
Candidate or grant traversal authority. The generator guards explicit JSON/Markdown output paths so they cannot
overwrite the boundary, candidate, linked schema/intake/analyzer artifacts, graph/source authority, evidence artifacts,
or selected frontend/source artifacts.

The current no-op clarification answers fixture and revised Request IR Candidate preview are:

```text
examples/valid/todo-app-pbe-run/generated/clarification-answers.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.revised.add-todo-runtime-evidence-only.preview.json
```

The revised candidate is generated by:

```text
graph read-model revise-request-ir-candidate --clarification-pack examples/valid/todo-app-pbe-run/generated/clarification-interview-pack.add-todo-runtime-evidence-only.preview.json --answers examples/valid/todo-app-pbe-run/generated/clarification-answers.add-todo-runtime-evidence-only.preview.json --json
```

It is still only a Request IR Candidate. It records
`revisionAuthorityStatus: clarification-derived-candidate-not-validated`, `validationRequiredAgain: true`,
`authorityStatus: not-authoritative-until-validated`, and downstream traversal/contract/instruction/execution/apply/
approval/evidence/equivalence/enforcement flags false. The schema-only validator accepts the revised candidate shape but
returns `schema-valid-graph-validation-not-run`; graph-aware validation and traversal remain separate later passes.

The Request IR Candidate schema and first calibration candidate fixture are:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/request-ir-candidate.add-todo-runtime-evidence-only.preview.json
```

The schema-only Request IR validation result is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-validation.add-todo-runtime-evidence-only.preview.json
```

The graph-aware validation boundary preview is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-aware-validation-boundary.runtime-evidence-only.preview.json
```

The graph-aware validation result is:

```text
examples/valid/todo-app-pbe-run/generated/request-ir-graph-validation.add-todo-runtime-evidence-only.preview.json
```

The calibration candidate models a Korean natural-language request to add evidence for the Todo App add button without
touching production source. It classifies the request as `runtime-evidence-only` and `test-only-behavior-proof`, with
`CH-001` and `Todo App` as candidate targets. The schema-only validator confirms required fields, enum shape,
candidate-only boundaries, confidence policy, and ambiguity policy.

The graph-aware validator then resolves `CH-001`, `Todo App`, `runtime-evidence-only`, and
`test-only-behavior-proof` against graph/read-model authority. It may report `graphTraversalAllowed: true`, but that is
future-pass permission only. It does not run traversal, select nodes or edges, generate contract compiler input, or
generate instruction packs.

The next frontend boundaries for this calibration fixture are:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan-boundary.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/selected-graph-slice-boundary.add-todo-runtime-evidence-only.preview.json
```

The generated traversal plan for this calibration fixture is:

```text
examples/valid/todo-app-pbe-run/generated/graph-traversal-plan.add-todo-runtime-evidence-only.preview.json
```

The traversal plan generator resolves start-node planning for `CH-001` and records graph vocabulary-backed node/edge
type fields plus planner role/intent fields.

The generated selected graph slice for this calibration fixture is:

```text
examples/valid/todo-app-pbe-run/generated/selected-graph-slice.add-todo-runtime-evidence-only.preview.json
```

The selected graph slice generator starts from `CH-001`, selects the bounded direct graph-source/read-model slice, and
records trace entries for the selected nodes and edges. For this calibration fixture it selects `CH-001`, `WT-1`,
`TT-1`, `EV-1`, and `IM-001`, plus the directly connected `touches`, `preserves`, and `reports-on` edges allowed by
the traversal plan. The selected slice itself is still not contract compiler input and does not generate instruction
packs.

The generated Contract Compiler Input for this calibration fixture is:

```text
examples/valid/todo-app-pbe-run/generated/contract-compiler-input.add-todo-runtime-evidence-only.preview.json
```

The selected-slice-to-contract-input generator maps the selected slice into existing compiler input model groups:
`humanRequest`, `graphSnapshot`, `packSchema`, `policySnapshot`, `evidenceIndex`, `targetScopeCandidates`,
`outputRequirementSources`, `stopConditionSources`, and `riskSources`. For this calibration fixture,
`targetScopeCandidates` keep selected context from `CH-001`, `WT-1`, `TT-1`, and `EV-1`, while `allowedScope` is narrowed
to check/evidence/report-oriented artifacts derived from `TT-1` and `EV-1`. The change-tree and work-tree paths stay
context-only and are not authorized as editable allowed scope for runtime-Evidence-only work. Evidence paths are
fixture-root normalized when a selected node points at `.pbe/...`; risk context comes from `IM-001`; output requirements
remain preview/advisory report obligations; and unresolved production-source forbidden scope stays explicitly unresolved
until selected graph/source authority proves a concrete path.

This generated Contract Compiler Input reports frontend field-group compatibility with the compiler input model, but it
is not the legacy `compiler-input-model-dry-run` artifact and does not claim backend dry-run validation passed. It does
not invoke the backend dry-run compiler, generate instruction packs, trigger Codex execution, mutate graph-source, apply
graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.

The generated frontend Instruction Pack outputs for this calibration fixture are:

```text
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/instruction-pack.add-todo-runtime-evidence-only.preview.md
```

The Contract-Input-to-Instruction-Pack generator preserves the narrowed `allowedScope` from `TT-1` and `EV-1`, keeps
production source changes as unresolved forbidden scope, keeps graph-source mutation and approval/acceptance changes
forbidden, and carries required Evidence, stop conditions, known risks, and output requirements into concise
operational instructions. The generated pack is not Codex execution, not approval, not runtime Evidence satisfaction,
not graph-source mutation, not graph delta apply, and not scope or CI enforcement.
Its preview outputs cannot overwrite source authority, selected frontend inputs, forbidden concrete paths, Evidence
authority artifacts, selected scope candidate paths, or graph-source/source-authority-shaped JSON artifacts.

Traversal boundary type fields are limited to actual graph taxonomy vocabulary from the Todo App projection. Abstract
planner meanings such as target component, scope policy, required evidence, stop condition, output requirement, and risk
are recorded as roles/intents rather than invented node kinds or edge types.

## Fixture-Provided Changed-File List Preview

The first fixture-provided changed-file list preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/fixture-provided-changed-file-list.runtime-evidence-only.preview.json
```

Preview status:

- `status: fixture-provided-changed-file-list-previewed`
- `inputAuthorityStatus: fixture-provided-preview-only`
- `changedFileListStatus: fixture-provided-preview-input-available`
- `authoritativeChangedFileListStatus: missing-or-not-authoritative`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: false`

The artifact provides two static scenarios:

- test/Evidence-only changed files, for a future allowed-scope result-shape candidate;
- production source modified, for a future forbidden-scope result-shape candidate.

Both scenarios are preview inputs only. They are not actual observed diffs, not collected from Git, not agent-reported
changed files, not execution transcript metadata, and not authoritative runtime Evidence. They may help shape future
checker result logic, but they do not prove compliance, do not report a violation, and do not replace later git-derived
changed-file authority.

The third-fixture observation now links this preview with:

```text
fixtureProvidedChangedFileListPreviewStatus: fixture-provided-preview-input-available
```

The fixture-provided preview itself still keeps `checkerRun: false`, `actualDiffInspected: false`,
`changedFilesCollected: false`, and `evaluatedViolations: []`. A separate git-derived collection-only artifact now
records collected changed-file names/status without evaluating scope.

## Scope Compliance Fixture Input Consumption Preview

The first fixture input consumption preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-fixture-input-consumption.runtime-evidence-only.preview.json
```

Preview status:

- `status: scope-compliance-fixture-input-present-preview-only`
- `fixtureProvidedInputStatus: fixture-provided-preview-input-available`
- `fixtureProvidedInputAuthorityStatus: fixture-provided-preview-only`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: false`
- `evaluatedViolations: []`

This artifact consumes the fixture-provided changed-file list only as static preview input. It records that the
test/Evidence-only and production-source-modified scenarios are present for future result-shape design, but it does not
normalize paths, compare scope, produce a clean result, produce a violation, reject changes, or enforce scope.

The third-fixture observation now links this preview with:

```text
fixtureInputConsumptionPreviewStatus: scope-compliance-fixture-input-present-preview-only
```

The result preview remains non-conclusive: `scopeComplianceResultStatus` is now
`scope-compliance-not-evaluated-collection-only`, `checkerRun` is still `false`, and `evaluatedViolations` is still
empty.

## Scope Compliance Dry-Run Skeleton Preview

The first scope compliance dry-run skeleton preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-dry-run-skeleton.runtime-evidence-only.preview.json
```

Preview status:

- `status: scope-compliance-dry-run-skeleton-previewed`
- `dryRunSkeletonStatus: preview-only-not-executable`
- `resultStatus: scope-compliance-dry-run-not-run`
- `stopReason: scope-compliance-evaluation-not-implemented`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: true`
- `scopeComplianceEvaluationStatus: not-evaluated`
- `evaluatedViolations: []`

The skeleton describes the future dry-run stages: load contract scope, load an authoritative changed-file list, normalize
paths, compare allowed scope, compare forbidden scope, and emit a non-enforcing result. Each stage is currently not run.
The fixture-provided changed-file list is present only as preview input. The git-derived collection-only artifact now
adds collected names/status, but it still does not unblock evaluation because no scope comparison slice exists.

The third-fixture observation now links this preview with:

```text
scopeComplianceDryRunSkeletonStatus: preview-only-not-executable
```

The result preview remains conservative: `scopeComplianceResultStatus` is now
`scope-compliance-not-evaluated-collection-only`, `checkerRun` is still `false`, and `evaluatedViolations` is still
empty. No clean result, actual violation, rejection, enforcement, approval, runtime Evidence satisfaction, or
equivalence proof is claimed.

## Scope Compliance Not-Run Report Preview

The scope compliance not-run report preview artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-not-run-report.runtime-evidence-only.preview.json
```

Preview status:

- `status: scope-compliance-not-run-report-previewed`
- `reportStatus: scope-compliance-not-run-report-previewed`
- `stopReason: scope-compliance-evaluation-not-implemented`
- `nextRequiredInput: implemented-scope-evaluation`
- `checkerRun: false`
- `actualDiffInspected: false`
- `changedFilesCollected: true`
- `scopeComplianceEvaluationStatus: not-evaluated`
- `evaluatedViolations: []`

This artifact previews how DevView should report a not-run scope compliance dry-run. It explains that fixture-provided
changed-file lists are available only as preview input and cannot replace git-derived collection. The collection-only
artifact now exists, but no scope comparison is implemented, no violation categories are evaluated, and no clean or
actual violation result can be claimed.

The third-fixture observation now links this preview with:

```text
scopeComplianceNotRunReportStatus: scope-compliance-not-run-report-previewed
```

The report is explanatory only. It does not implement the checker, run dry-run logic, evaluate fixture scenarios, reject
diffs, enforce scope, wire CI, approve the fixture, satisfy runtime Evidence, or prove equivalence.

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

The compact advisory scope runtime report is now the readability surface for `check-scope`, the Graph Delta Proposal
boundary records how those advisory results may feed future proposal candidates, the candidate schema alignment maps
those candidates against the existing graph update proposal shape, and the unresolved mapping decision narrows
`sourceRecordId`, `graphDeltaPath`, and Evidence/report link handling. A later task may decide whether to add a
proposal-only command, but it should not reject diffs, enforce scope, broaden compiler support, wire additional fixtures
into the supported command path, create promotion review packets, approve fixtures, claim runtime Evidence is satisfied,
inspect patch contents, turn candidate checks into required checks, apply graph deltas, turn test Evidence into user
acceptance, allow production source edits, enforce CI, or change the existing Todo App structure-only status.

## Todo App Frontend Chain Manifest

The Todo App runtime-Evidence-only calibration frontend now has a report-only artifact chain manifest:

```text
examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.json
examples/valid/todo-app-pbe-run/generated/devview-frontend-chain.add-todo-runtime-evidence-only.preview.md
```

It is generated with:

```text
graph read-model report-frontend-chain --intake examples/valid/todo-app-pbe-run/generated/natural-language-request-intake-boundary.runtime-evidence-only.preview.json --json
```

The manifest reads the existing calibration chain from natural-language intake through Instruction Pack preview and
reports artifact roles, statuses, paths, terminal stage, and authority boundaries. It is not a compiler input, not an
Instruction Pack, not runtime Evidence, and not approval. It does not call an LLM, generate Request IR, implement hook
sessions, trigger Codex execution, mutate graph-source, apply graph deltas, prove equivalence, enforce scope, or
configure CI.
