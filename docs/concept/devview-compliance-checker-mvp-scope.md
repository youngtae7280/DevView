# DevView Compliance Checker MVP Scope

Status: scope decision / planning-only / non-enforcing

This document defines the first MVP scope for a future DevView compliance checker.

It is a documentation and decision artifact only. It does not implement the checker, inspect or reject diffs, enforce
scope, wire checker behavior into compiler execution, create CI required checks, apply graph deltas, approve fixtures,
prove equivalence, or replace user acceptance.

## Purpose

The Contract Compiler creates an expected contract from source-authority inputs. A future compliance checker should
compare actual agent results against that contract.

The checker should not trust agent claims by default. It should inspect observable results such as:

- actual changed files;
- allowed and forbidden scope;
- command output;
- Evidence artifacts;
- output report fields;
- stop condition reporting.

This scope decision chooses the first compliance-checker MVP axis without implementing it.

## Current Basis

The status model is recorded in
[contract-compiler-eligibility-status-model.md](contract-compiler-eligibility-status-model.md). It separates preview,
support, candidate generation, promotion review, approval, equivalence, execution, and enforcement states.

The cross-fixture calibration synthesis has recorded three fixture shapes:

- local `bug_fix`;
- external `behavior-change`;
- `test-only behavior proof`.

The current completed fixture remains Todo Search whitespace-normalization `bug_fix`. It has source-authority
reconstruction complete and a scoped human promotion review decision, while `equivalenceProven` remains `false`.

The second calibration fixture remains `component/escape-html` Symbol stringification `behavior-change`. Its preview gap
set is complete, but it is still `not-supported`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`.

The third calibration fixture remains Todo App add-todo runtime Evidence-only calibration. Its runtime Evidence-only
preview gap set is complete, but it is still `not-supported`, `contract-candidate-not-run`, `not-approved`, and
`equivalenceProven: false`; runtime Evidence remains missing, evidence/check binding remains unsatisfied, and the
compliance-checker bridge is preview-only.

## Selected MVP Axis

Selected first MVP axis:

```text
scope-compliance-preview
```

Reason:

- scope compliance is the most mechanical first checker surface;
- changed-file scope can be compared against allowed and forbidden scope before deeper Evidence parsing exists;
- it directly connects to the third fixture, where production source edits are forbidden or stop-required;
- it can expose contract-following violations without turning candidate checks into required checks;
- it can remain report-only and non-enforcing while the checker design matures.

This axis is a scope decision only. It does not implement file diff inspection, changed-file collection, violation
reporting, or rejection behavior.

## Checker Purpose

A future compliance checker should answer:

```text
Did the agent result stay within the contract it was given?
```

For the first MVP axis, the narrower question is:

```text
Do the actual changed files stay within allowed scope and outside forbidden scope?
```

The checker should treat claims such as "I stayed in scope" or "tests passed" as report text, not authoritative proof.
Authoritative status should come from observable inputs, captured Evidence, and contract fields.

## Future Checker Inputs

Expected future inputs include:

- execution contract or generated contract candidate;
- actual changed file list;
- `allowedScope`;
- `forbiddenScope`;
- stop conditions;
- output requirement status;
- Evidence status;
- command output references;
- source modification statement;
- runtime Evidence status where applicable;
- promotion or equivalence status for overclaim checks.

Resolved input assumptions for this scope decision:

- the current Todo Search fixture has contract fields and generated review artifacts that can explain allowed and
  forbidden scope;
- the Todo App runtime Evidence-only fixture has preview artifacts describing production source as forbidden or
  stop-required;
- the status model already states that preview artifacts are not supported compiler execution output.

Unresolved input gaps:

- no implemented checker input schema exists;
- no implemented changed-file collector exists;
- no diff inspection or file modification detection exists;
- no command output parser exists;
- no implemented violation report format exists;
- calibration preview artifacts are not yet promoted into supported checker inputs.

## Future Violation Categories

Conceptual future violation categories include:

`allowed-scope-violation`:

- actual changed files fall outside contract `allowedScope`.

`forbidden-scope-violation`:

- actual changed files intersect contract `forbiddenScope`.

`missing-runtime-evidence`:

- runtime Evidence is required or reported as satisfied, but no authoritative runtime Evidence is present.

`missing-command-output`:

- a check or runtime proof is claimed without captured command output or structured Evidence.

`candidate-check-overstated-as-required`:

- a candidate check is reported as an enforced required check without a separate required-check decision.

`stop-condition-not-reported`:

- a contract stop condition appears to apply, but the result report does not state it.

`output-requirement-missing`:

- required report fields, Evidence references, source modification statements, or boundary statements are missing.

`equivalence-overclaim`:

- a result treats `equivalenceCandidate` as `equivalenceProven`, or treats scoped human review as broad compiler
  approval.

These categories are conceptual only. This document does not implement violation detection.

## Fixture Relevance

Todo Search whitespace-normalization `bug_fix`:

- scope compliance can compare actual changed files against the current generated contract's `allowedScope` and
  `forbiddenScope`;
- Evidence and output requirements are relevant later;
- the scoped human decision remains current-fixture only and does not make checker behavior enforcing.

`component/escape-html` Symbol stringification `behavior-change`:

- external checkout authority, external required-check binding, anchor-level context, risk vocabulary, and graph-delta
  review binding are relevant to later compliance design;
- local external checkout paths remain calibration-local, non-portable, and non-enforcing;
- graph-delta review binding remains review-only and does not become graph delta apply.

Todo App add-todo runtime Evidence-only calibration:

- the first MVP axis is most relevant here;
- production source edits are forbidden or stop-required for this test-only proof;
- missing runtime Evidence and unsatisfied evidence/check binding remain visible;
- the compliance-checker bridge previews future checks but does not implement them.

## Relationship To Status Model

This scope decision depends on the following status-model separations:

- preview does not mean support;
- policy recognized does not mean compile eligible;
- candidate check does not mean required check;
- review binding does not mean apply;
- `equivalenceCandidate` does not mean `equivalenceProven`;
- human decision for one fixture does not generalize to other fixtures;
- compliance-checker bridge preview does not mean compliance checker implemented.

The first MVP axis must preserve those separations.

## Non-Enforcement Boundary

The compliance checker MVP scope is not:

- CI enforcement;
- branch protection;
- required checks;
- diff rejection;
- graph delta apply;
- graph source mutation;
- executor automation;
- user acceptance automation;
- fixture approval;
- promotion review approval;
- equivalence proof.

This scope decision does not set `equivalenceProven: true` and does not change generated approval fields.

## Next Step

The first scope compliance checker preview artifact is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-checker.runtime-evidence-only.preview.json
```

Target fixture:

```text
Todo App add-todo runtime Evidence-only calibration
```

Preview status:

```text
scope-compliance-checker-previewed
```

The artifact describes expected checker inputs, candidate scope checks, unresolved input gaps, conceptual violation
categories, and non-enforcement boundaries. It does not implement diff inspection, collect changed files, enforce scope,
reject changes, support the fixture, generate a contract candidate, approve runtime Evidence, or turn preview artifacts
into compiler execution output.

Recommended next task:

```text
scope-compliance-checker-implementation-readiness
```

The readiness criteria are now recorded in
[scope-compliance-checker-implementation-readiness.md](scope-compliance-checker-implementation-readiness.md). They define
required future inputs, unresolved changed-file list authority, path normalization questions, non-enforcing result
states, and the first future static preview result boundary without implementing checker behavior.

The first static result-shape preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json
```

It originally reported `scope-compliance-input-missing` because no authoritative changed-file list existed. After the
collection-only slice, the result preview can link a git-derived changed-file collection artifact, but it still reports
scope compliance as not evaluated: no checker has run, and no violation or no-violation status can be claimed.

The changed-file list authority preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/changed-file-list-authority.runtime-evidence-only.preview.json
```

It records `changed-file-list-authority-previewed` while keeping changed-file collection unimplemented. The preview
states that agent-reported changed files are not authoritative by themselves, fixture-provided changed-file lists are
preview-only, and a git-derived changed-file list is a later implementation candidate after base/head and path
normalization policy exist.

The fixture-provided changed-file list preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/fixture-provided-changed-file-list.runtime-evidence-only.preview.json
```

It adds static test/Evidence-only and production-source-modified scenarios for future result-shape design. These
scenarios are not actual observed diffs, are not collected from Git, are not agent-reported changed files, and do not
prove compliance or violations. The scope compliance result preview still keeps evaluation not run.

The fixture input consumption preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-fixture-input-consumption.runtime-evidence-only.preview.json
```

It records `scope-compliance-fixture-input-present-preview-only`: fixture-provided input is present, but no checker has
run, no actual diff was inspected, and no scope compliance conclusion was produced. DEC-220 later adds a separate
git-derived collection-only artifact; fixture-provided input still remains preview-only. This prepares the future
checker dry-run boundary without adding enforcement, rejection, CI approval, or equivalence status.

The preview-only dry-run skeleton is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-dry-run-skeleton.runtime-evidence-only.preview.json
```

It records `dryRunSkeletonStatus: preview-only-not-executable`, `resultStatus: scope-compliance-dry-run-not-run`, and
after DEC-220 `stopReason: scope-compliance-evaluation-not-implemented`. This means a future dry-run sequence is
described, but no checker dry-run logic has executed and no clean or violation result can be claimed.

The not-run report shape preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-not-run-report.runtime-evidence-only.preview.json
```

It records `reportStatus: scope-compliance-not-run-report-previewed`, `checkerRun: false`, `stopReason:
scope-compliance-evaluation-not-implemented`, and `nextRequiredInput: implemented-scope-evaluation`. This report
explains why no dry-run result can be claimed: changed files may now be collected by the collection-only artifact, but no
scope comparison has run and no violation categories were evaluated. It does not enforce scope, reject changes, approve
the fixture, satisfy runtime Evidence, or prove equivalence.

The authoritative changed-file input boundary is now decided at documentation level:

```text
authoritativeChangedFileInputBoundaryDecisionStatus: authoritative-changed-file-input-boundary-decided
```

The decision keeps agent-reported changed files non-authoritative, keeps fixture-provided changed files preview-only for
static result-shape design, and selects git-derived changed files as the first real authoritative candidate for a later
implementation task. This does not run `git diff`, collect changed files, inspect actual diffs, run checker logic,
evaluate fixture scenarios, or claim clean/violation results.

The git-derived changed-file input design preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-input-design.runtime-evidence-only.preview.json
```

It records `git-derived-input-design-previewed` and designs the future input around explicit base/head refs or a
committed range, with working-tree, staged, and untracked modes deferred. It also records path normalization and
generated-churn handling requirements. At that design stage no `git diff` command had run and no changed files were
collected. DEC-220 adds collection-only input while keeping the checker result not evaluated.

The git-derived changed-file collection scope is now decided:

```text
gitDerivedChangedFileCollectionScopeDecisionStatus: git-derived-collection-scope-decided
```

The next implementation slice is collection-only with explicit base/head refs first. It should create only a
changed-file collection artifact. Collection success still keeps `checkerRun: false`, `evaluatedViolations: []`, and
`scopeComplianceEvaluationStatus: not-evaluated`; scope matching and clean/violation results remain later work.

The first collection-only implementation now records:

```text
examples/valid/todo-app-pbe-run/generated/git-derived-changed-file-collection.runtime-evidence-only.preview.json
```

Status:

```text
gitDerivedChangedFileCollectionStatus: git-derived-changed-files-collected
```

The command collects Git name/status data between explicit refs and normalizes paths. It is still only an input
collector: `checkerRun` remains `false`, `scopeComplianceEvaluationStatus` remains `not-evaluated`, and
`evaluatedViolations` remains `[]`. It does not inspect patch contents, compare scope, reject diffs, enforce CI, approve
fixtures, satisfy runtime Evidence, or prove equivalence.

The first collection input consumption preview now records:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-collection-input-consumption.runtime-evidence-only.preview.json
```

Status:

```text
scopeComplianceCollectionInputConsumptionStatus: scope-compliance-collection-input-consumption-previewed
```

This means the git-derived collection artifact is accepted as a future checker input, not consumed for evaluation. It
keeps `inputConsumedForEvaluation: false`, `checkerRun: false`, `scopeComplianceEvaluationStatus: not-evaluated`, and
`evaluatedViolations: []`. Allowed/forbidden comparison, path matching, violation classification, clean results, and
actual violation results remain later work.

The first allowed/forbidden scope input binding preview now records:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json
```

Status:

```text
scopeComplianceScopeInputBindingStatus: scope-compliance-scope-input-binding-previewed
```

The binding identifies the current preview sources for future scope evaluation:

- `targetScopeCandidates[]` in the runtime Evidence-only calibration draft for allowed scope;
- `policySnapshot.forbiddenScopeRules[]` in the same calibration draft for forbidden scope.

This is only input binding. It keeps `scopeInputsConsumedForEvaluation: false`, `checkerRun: false`,
`scopeComplianceEvaluationStatus: not-evaluated`, and `evaluatedViolations: []`. The preferred future authoritative
source remains a supported execution contract `allowedScope[]` / `forbiddenScope[]` if this fixture ever becomes
eligible and wired. Path matching and clean/violation results remain later work.

The first path pattern matching policy preview now records:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json
```

Status:

```text
scopeCompliancePathPatternPolicyStatus: scope-compliance-path-pattern-policy-previewed
```

The policy previews repository-root-relative POSIX paths, Windows separator normalization, no absolute local paths,
glob-like patterns without regex for the first slice, forbidden-over-allowed precedence, generated-file reporting,
rename/delete handling, unresolved case sensitivity, unknown-pattern blocking, and future unmatched-path behavior. It
keeps `policyConsumedForEvaluation: false`, `checkerRun: false`, `scopeComplianceEvaluationStatus: not-evaluated`, and
`evaluatedViolations: []`. The checker still does not compare paths or report clean/violation results.

The first violation category schema preview now records:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json
```

Status:

```text
scopeComplianceViolationCategorySchemaStatus: scope-compliance-violation-category-schema-previewed
```

The schema defines future categories such as `forbidden-scope-match`, `allowed-scope-match`, `scope-unmatched-path`,
`unknown-pattern`, `unparsable-pattern`, `generated-file-review-required`, `rename-review-required`,
`deleted-file-review-required`, and `case-sensitivity-review-required`. It keeps
`categorySchemaConsumedForEvaluation: false`, `checkerRun: false`, `scopeComplianceEvaluationStatus: not-evaluated`, and
`evaluatedViolations: []`. Empty evaluated violations still means not evaluated, not clean.

The first evaluation result shape preview now records:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json
```

Status:

```text
scopeComplianceEvaluationResultShapeStatus: scope-compliance-evaluation-result-shape-previewed
```

The result shape preview defines future states such as `not-evaluated`, `evaluation-blocked`, `evaluated-clean`,
`evaluated-with-review-required`, and `evaluated-with-blocking-violations`. The current state remains
`checkerRun: false`, `inputConsumedForEvaluation: false`, `scopeComplianceEvaluationStatus: not-evaluated`,
`scopeComplianceResult: no-result`, and `evaluatedViolations: []`. A clean result remains forbidden until a future
evaluator runs and consumes changed-file input, scope inputs, path policy, and category schema.

The first helper-only path matcher now exists at:

```text
cli/src/core/scope-compliance-path-pattern.ts
```

Status:

```text
pathMatchingHelperStatus: helper-implemented-not-consumed-for-evaluation
```

The helper can compare one normalized repository-root-relative path against one future scope pattern. It returns
helper-level match fields only; it does not consume the collection artifact as a checker, does not compare a changed-file
set with allowedScope or forbiddenScope, does not classify violation categories, and does not produce clean or violation
results.

The first non-enforcing scope evaluator now exists at:

```text
cli/src/core/scope-compliance-evaluator.ts
```

The first advisory evaluation artifact is:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation.runtime-evidence-only.preview.json
```

Status:

```text
scopeComplianceEvaluatorStatus: non-enforcing-evaluator-implemented
checkerRun: true
nonEnforcing: true
enforcementStatus: not-enforced
```

The evaluator consumes the git-derived changed-file collection, scope input binding, path policy, helper, category
schema, and result shape as local deterministic inputs. It is not a gate. It does not reject diffs, enforce scope, wire
CI, configure required checks, approve fixtures, satisfy runtime Evidence, apply graph deltas, or prove equivalence. The
Todo App artifact currently reports `evaluation-blocked` because unresolved scope patterns must not silently pass as
clean.

## Advisory CLI Surface

The evaluator is now exposed through a small local CLI surface:

```text
graph read-model check-scope --base <baseRef> --head <headRef> --json
```

The command collects git-derived changed-file names/status in memory, binds the current Todo App runtime Evidence-only
scope inputs, runs the non-enforcing evaluator, and prints JSON. It returns success when advisory findings exist; exit
code failure is reserved for command/runtime problems such as invalid refs or unreadable internal inputs.

The command may write an advisory evaluation artifact only when `--output <file>` is explicitly provided. Without
`--output`, it does not refresh tracked preview artifacts.

The command can also write a compact advisory runtime report:

```text
graph read-model check-scope --base <baseRef> --head <headRef> --markdown <file> --json
```

The compact report summarizes base/head refs, changed/evaluated file counts, advisory evaluation status, advisory result
state, non-enforcement status, and finding counts. It is a readability surface over the same advisory result. It is not
enforcement, approval, runtime Evidence satisfaction, equivalence proof, graph delta apply, or user acceptance.

## Graph Delta Proposal Boundary

The first Graph Delta Proposal boundary preview is now recorded:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-boundary.runtime-evidence-only.preview.json
```

This preview defines how advisory `check-scope` output may later contribute to proposal candidates such as
scope-finding review notes, risk updates, Evidence links, decision notes, changed-file observations, and runtime report
links. These are proposal candidates only. Advisory findings can inform reviewer context, but they do not approve graph
updates, mutate graph-source, apply graph deltas, enforce scope, reject diffs, satisfy runtime Evidence, prove
equivalence, or replace user acceptance. The preview keeps `proposalOnly: true`, `graphSourceMutated: false`,
`graphDeltaApplied: false`, `requiresHumanReview: true`, and `approvalStatus: not-approved`.

The candidate schema alignment preview is recorded at:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-candidate-schema.runtime-evidence-only.preview.json
```

It aligns advisory scope outputs with the existing `pbe-graph-update-proposal-v0` fields such as
`proposedRecordState`, `proposedNodeUpdates`, `changedFiles`, `edgeIntentSummary`, and `boundaries`. The alignment is
still proposal-only. Unknown mappings, including Evidence links and runtime report links, remain
`mappingStatus: unresolved-existing-schema-review-required` rather than becoming a parallel authoritative graph update
format.

The narrow unresolved mapping decision preview is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-unresolved-mapping-decision.runtime-evidence-only.preview.json
```

It identifies `CH-001` as the structure-only `sourceRecordId` candidate for review, keeps `graphDeltaPath` unresolved
until a graph-delta-compatible source exists, and allows advisory evaluation JSON plus compact runtime reports to be
linked only as candidate review context. These links do not satisfy runtime Evidence, approve graph changes, or generate
proposals.

The graph-delta-compatible source preview is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-compatible-source.runtime-evidence-only.preview.json
```

It collects the advisory `check-scope` result, compact runtime report, changed-file collection, scope evaluation,
proposal boundary, schema alignment, and unresolved mapping decision references into a future proposal-only generator
input shape. It is not graph-source, not `graph-delta-v0`, not `pbe-graph-update-proposal-v0`, and not graph delta
apply. `CH-001` remains a structure-only review candidate, `graphDeltaPath` remains candidate-only/not-written, and
human review remains required.

The proposal-only generator scope decision is:

```text
examples/valid/todo-app-pbe-run/generated/graph-delta-proposal-generator-scope-decision.runtime-evidence-only.preview.json
```

It decides that the first future generator slice may read the graph-delta-compatible source, validate boundary fields,
and produce proposal-shaped preview output only through JSON stdout or an explicit output path. It does not implement the
generator, generate proposals, mutate graph-source, apply graph deltas, approve updates, enforce scope, or satisfy
runtime Evidence.

## Runtime Budget Smoke

The deterministic DevView runtime budget is documented in
[devview-runtime-performance-budget.md](devview-runtime-performance-budget.md).

The first advisory timing smoke is:

```text
npm run devview:runtime:smoke
```

It measures selected deterministic commands and reports `runtimeBudgetTargetMs: 5000`, `budgetStatus:
advisory-not-enforced`, and `runtimeBudgetEnforced: false`. The timing smoke excludes AI editing time, full validation,
CI runtime, and human review. The changed-file collection measurement writes to a `.tmp` smoke artifact rather than the
tracked Todo App preview artifact. The smoke includes the advisory `check-scope` command and writes its compact report to
`.tmp` without writing a tracked evaluation artifact. It does not turn scope compliance into a gate and does not reject
diffs or configure required checks.

## Decision

Decision:

```text
select-compliance-checker-mvp-scope
```

Selected first axis:

```text
scope-compliance-preview
```

Rationale:

- three calibration fixtures now cover local `bug_fix`, external `behavior-change`, and test-only behavior proof;
- the eligibility/status model now prevents preview/support/approval/equivalence/enforcement drift;
- scope compliance is the smallest future checker surface that can compare actual agent results against contract
  boundaries;
- the Todo App runtime Evidence-only fixture gives a concrete non-supporting target where production source edits should
  be detectable as future violations.

This decision does not implement the checker or change any fixture status.

## Non-Goals

This decision does not:

- implement the compliance checker;
- inspect or reject actual diffs;
- enforce scope;
- wire checker behavior into compiler execution;
- wire checker behavior into CI, required checks, or branch protection;
- mark calibration fixtures as supported;
- generate contract candidates for calibration fixtures;
- approve any fixture;
- claim runtime Evidence is satisfied;
- promote static preview artifacts into compiler execution output;
- turn candidate checks into required checks;
- set `equivalenceProven: true`;
- introduce executor automation;
- introduce graph delta apply;
- automate user acceptance;
- retire tree-native artifacts;
- rename `pbe`, `.pbe`, validation scripts, generated paths, or sourceMode values.
