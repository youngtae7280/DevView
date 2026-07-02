# Scope Compliance Checker Implementation Readiness

Status: planning / readiness criteria / non-enforcing

This document defines readiness criteria for the first future DevView scope compliance checker implementation slice.

It is a documentation and decision artifact only. It does not implement the checker, inspect actual diffs, collect
changed files, reject changes, enforce scope, wire checker behavior into compiler execution, wire CI, create required
checks, approve fixtures, prove equivalence, or replace user acceptance.

## Purpose

DEC-208 selected `scope-compliance-preview` as the first compliance-checker MVP axis. DEC-209 added the first preview
artifact for the Todo App runtime Evidence-only fixture:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-checker.runtime-evidence-only.preview.json
```

That preview identifies future inputs and future violation categories. This readiness document defines what must be
known before a first real checker implementation slice starts.

The central readiness question is:

```text
Can DevView compare actual changed files against contract allowedScope and forbiddenScope without treating the result as
enforcement, approval, or proof?
```

## Required Future Inputs

Execution contract source:

- expected source: a supported execution contract or generated contract candidate for the target fixture;
- current status: unresolved for the Todo App runtime Evidence-only fixture;
- reason: the fixture remains `contract-candidate-not-run` and is not wired into the supported compiler command path.

Allowed scope source:

- expected source: contract `allowedScope` or a supported checker input derived from it;
- current preview source:
  `examples/valid/todo-app-pbe-run/generated/test-only-scope-boundary.runtime-evidence-only.preview.json`;
- current status: preview-only, not supported checker input.

Forbidden scope source:

- expected source: contract `forbiddenScope` or a supported checker input derived from it;
- current preview source:
  `examples/valid/todo-app-pbe-run/generated/test-only-scope-boundary.runtime-evidence-only.preview.json`;
- current status: preview-only, not supported checker input.

Changed file list source:

- expected source: a future diff summary, file modification collector, or supplied static changed-file list artifact;
- current status: unresolved;
- reason: no authoritative changed-file list, diff inspection, or file modification detection exists.

Generated artifact/report output path:

- expected first preview result path:
  `examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json`;
- current status: proposed only;
- reason: no checker result artifact is generated in this task.

Fixture identity:

- target fixture: `calibration-fixture-todo-app-runtime-evidence-only`;
- fixture shape: `test-only-behavior-proof`;
- current status: `not-supported`, `not-eligible-current-command-not-wired`, `contract-candidate-not-run`,
  `not-approved`, and `equivalenceProven: false`.

Support and eligibility status inputs:

- expected inputs: support status, compile eligibility, candidate status, approval status, equivalence status, runtime
  Evidence status, and evidence/check binding status;
- current preview sources:
  `compiler-input-calibration-observation.runtime-evidence-only.preview.json` and
  `scope-compliance-checker.runtime-evidence-only.preview.json`;
- current status: preview-only.

## Readiness Criteria

The first implementation slice should not start until DevView can answer:

Where does the changed file list come from?

- It must have a named source.
- It must distinguish authoritative, supplied-static-preview, and missing states.
- Missing changed-file input must be reportable without passing the checker.

Is the changed file list authoritative or preview-only?

- A preview-only list may be used for a preview result.
- It must not be treated as proof of compliance.
- It must not reject changes.

Which contract artifact supplies `allowedScope` and `forbiddenScope`?

- For a real checker, this should be a supported contract or supported checker input.
- For the first preview result, the Todo App test-only scope boundary preview may be cited as preview source only.

How are path matches normalized?

- The checker needs a path normalization rule before comparing file lists.
- It must define repository-relative paths, unresolved paths, generated paths, and conceptual paths such as `src/todos.ts`.
- It must not silently treat local or conceptual paths as portable authority.

How are missing inputs reported?

- Missing changed-file list, missing allowed scope, and missing forbidden scope must produce explicit states.
- Missing input must not be collapsed into "no violation".

Where is the checker result written?

- The first proposed result path is:
  `examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json`.
- The result should be preview-only and non-enforcing.

Does the result remain non-enforcing?

- Yes. The first checker result must not be CI enforcement, branch protection, required check configuration, diff
  rejection, fixture approval, user acceptance, or equivalence proof.

## First Implementation Slice Boundary

Recommended first future implementation slice:

```text
static preview checker result for one fixture using a supplied or mock changed-file list
```

Recommended target:

```text
Todo App add-todo runtime Evidence-only calibration
```

Recommended output:

```text
examples/valid/todo-app-pbe-run/generated/scope-compliance-result.runtime-evidence-only.preview.json
```

The future implementation should be able to classify:

- no changed-file input;
- allowed scope unknown;
- forbidden scope unknown;
- potential production-source violation;
- no observed violation in a supplied preview changed-file list.

This document does not implement that slice.

## Violation Reporting States

Conceptual reporting states:

`scope-compliance-not-run`:

- The checker was not run.
- This is the default state before any checker result exists.

`scope-compliance-input-missing`:

- Required checker inputs are missing, such as changed file list, allowed scope, or forbidden scope.
- This must not be treated as "no violation".

`scope-compliance-preview-only`:

- A preview result exists, but its inputs or execution mode are not authoritative.
- This may support human review only.

`scope-compliance-potential-violation`:

- The preview or checker sees a possible allowed-scope or forbidden-scope violation.
- This does not reject changes or enforce CI.

`scope-compliance-no-violation-observed`:

- No violation is observed in the supplied inputs.
- This does not prove correctness, approve the fixture, satisfy runtime Evidence, or prove equivalence.

No violation state rejects changes, enforces CI, proves correctness, approves a fixture, or changes user acceptance.

## Todo App Runtime Evidence-Only Mapping

The Todo App runtime Evidence-only fixture is the first readiness target because:

- production source edits are forbidden or stop-required;
- test/Evidence scope is central;
- missing changed-file input is easy to reason about;
- missing runtime Evidence remains visible;
- evidence/check binding remains unsatisfied;
- the existing compliance-checker bridge already names future violation checks.

Current preserved statuses:

- `supportStatus: not-supported`;
- `compileEligibility: not-eligible-current-command-not-wired`;
- `expectedCandidateStatus: contract-candidate-not-run`;
- `approvalStatus: not-approved`;
- `equivalenceProven: false`;
- `currentRuntimeEvidenceStatus: missing`;
- `evidenceCheckBindingStatus: preview-only-not-satisfied`.

The readiness model must not reinterpret the existing Todo App positive fixture beyond `structure-only`.

## Implementation Readiness Decision

Decision:

```text
define-scope-compliance-checker-implementation-readiness
```

Readiness status:

```text
implementation-not-ready-inputs-unresolved
```

Reason:

- the first MVP axis is selected;
- the first preview artifact exists;
- future inputs and conceptual violation states are defined;
- changed-file list authority is unresolved;
- path normalization is unresolved;
- result artifact schema is unresolved;
- no checker is implemented.

Recommended next task:

```text
scope-compliance-result-preview-schema
```

That next task should define the static preview result artifact shape before any executable checker logic is added.

## Non-Goals

This readiness document does not:

- implement the compliance checker;
- inspect actual diffs;
- collect changed files;
- reject diffs;
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
