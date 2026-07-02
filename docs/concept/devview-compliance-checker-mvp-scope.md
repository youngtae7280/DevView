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
