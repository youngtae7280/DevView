# Output Requirement Source Authority

Status: v0.2 source-authority mapping / non-enforcing / dry-run compiler outputRequirements only

## Purpose

Contract Compiler Dry-Run v0.1 proved that PBE can compile a deterministic candidate, validate it, compare it with the
hand-written contract, classify every current semantic diff, and keep `equivalenceProven: false` when losses remain.

The v0.1 compiler loss was `output-requirement-loss`: the generated candidate replaced execution-result reporting
obligations with compiler self-reporting. This document defines and records the v0.2 source-authority surface that lets
output requirements come from machine-readable graph, policy, Evidence, check, and diff bindings instead of compiler
guesswork or copied hand-written comparison text.

## Current Source-Authority Surface

The v0.2 surface adds `outputRequirementSources[]` to the Compiler Input Model dry-run fixture and writes:

```text
examples/read-model-aggregate/generated/output-requirement-source-authority.preview.json
```

The report records:

- source authority entries
- derived output requirement candidates
- mappings to the hand-written output requirements
- generated output requirement preservation status
- unresolved generated obligations, if any
- compiler self-report obligations if they try to replace execution-result outputs

The current Todo Search dry-run fixture has source authority for:

- `changed-files-report`
- `command-output-evidence-status`
- `validation-result-summary`
- `non-execution-boundary-statement`

The compiler now derives generated `outputRequirements` from these source authority entries. The current preview maps
the three unique hand-written output requirements and reports `generated-output-requirements-preserved` with zero
unresolved output obligations. The generated output requirement text is derived from `obligationType` and bindings, not
copied from the hand-written contract.

## What This Proves

The preview proves:

- output requirement sources can be represented as machine-readable input facts;
- hand-written output requirements can be linked back to source authority entries for comparison;
- generated output requirements can be derived from source authority entries;
- the former `output-requirement-loss` can be removed from the current semantic diff without proving whole-contract
  equivalence;
- source authority can be observed without changing execution, acceptance, enforcement, or contract execution
  authority.

## What This Does Not Prove

The preview does not prove:

- generated/hand-written contract equivalence;
- execution readiness;
- whole-contract semantic equivalence;
- arbitrary `changeType` support;
- user acceptance;
- source-authority expansion;
- tree-native retirement readiness.

## Non-Goals

v0.2 preview does not:

- execute AI;
- apply graph deltas;
- mutate target code;
- enable required checks;
- configure branch protection;
- create CI enforcement;
- automate user acceptance;
- retire tree-native artifacts;
- widen pack schemas beyond the current Todo Search `bug_fix` fixture;
- treat output requirement preservation as whole-contract equivalence.

## Current Readiness

The current dry-run is `compiler-promotion-review-required`. Output requirement preservation is complete for the
current fixture, and later source-authority resolvers now preserve forbidden scope, stop conditions, required Evidence,
required context, known risks, and allowed scope. `equivalenceProven` still remains `false` because review-only
generated-vs-hand-written differences remain.

## Next Step

The next compiler step should define explicit equivalence/readiness policy for the remaining review-only differences,
not jump to executor automation. The current gap triage is recorded in
[contract-source-authority-gap-preview.md](contract-source-authority-gap-preview.md), which now recommends `none` for
the current fixture's source-authority resolver queue.
