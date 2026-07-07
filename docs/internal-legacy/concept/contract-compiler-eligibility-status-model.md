# Contract Compiler Eligibility Status Model

This document defines the conceptual eligibility and status lifecycle for DevView Contract Compiler fixtures.

It is a documentation and decision artifact only. It does not implement compiler support, wire calibration fixtures into
the supported command path, generate candidates, approve promotion, prove equivalence, execute AI, enforce CI, apply
graph deltas, or replace user acceptance.

## Purpose

The first three compiler calibration fixtures introduced many status terms:

- `not-supported`
- `policy-recognized`
- `not-eligible-current-command-not-wired`
- `contract-candidate-not-run`
- `preview-gap-set-complete`
- `promotion-not-eligible`
- `not-approved`
- `equivalenceCandidate: true`
- `equivalenceProven: false`

This model prevents those terms from drifting into each other. In particular:

- `preview-gap-set-complete` does not mean supported.
- `policy-recognized` does not mean compile eligible.
- candidate check does not mean required check.
- review binding does not mean apply.
- a human decision for one fixture does not generalize to other fixtures.

## Status Categories

Fixture selection status:

- records whether a fixture has been selected for calibration;
- does not make the fixture supported or eligible.

Calibration recognition status:

- records whether the fixture shape is recognized as a calibration shape, such as `behavior-change` or
  `test-only-behavior-proof`;
- does not approve arbitrary `changeType` support.

Preview gap status:

- records whether known support-before-implementation gaps have been previewed;
- does not mean candidate generation can run.

Compile eligibility status:

- records whether the fixture may enter a supported compiler command path;
- remains false for calibration-only fixtures.

Candidate generation status:

- records whether a contract candidate has been generated;
- `contract-candidate-not-run` means no candidate exists for that fixture.

Semantic diff status:

- records whether generated and comparison artifacts have known semantic, policy, Evidence, scope, risk, or review-only
  differences;
- only applies after a candidate exists.

Promotion review status:

- records whether a candidate can be reviewed by a human promotion reviewer;
- does not mean approval.

Approval status:

- records explicit human or generated approval state;
- generated `approvalStatus: not-approved` remains unchanged unless a separate approved process changes it.

Equivalence status:

- separates `equivalenceCandidate` from `equivalenceProven`;
- `equivalenceCandidate: true` is review metadata, not proof.

Execution/enforcement status:

- records whether execution, graph delta apply, required checks, branch protection, CI enforcement, or user acceptance
  automation has been introduced;
- the current calibration model keeps this status non-enforcing.

## Canonical Statuses

`calibration-fixture-selected`:

- A fixture has been selected for observation.
- It is not supported, not candidate-generation eligible, and not approved.

`calibration-draft`:

- A draft Compiler Input Model or fixture artifact exists.
- The draft may be incomplete, unsupported, or not wired to a command.

`policy-recognized`:

- The fixture shape is recognized as a bounded calibration policy case.
- This does not mean the fixture is generally supported or compile eligible.

`behavior-change-calibration-policy-recognized`:

- A behavior-change-shaped draft is recognized as a calibration input.
- This does not enable arbitrary behavior-change support.

`test-only-behavior-proof`:

- A fixture shape where test/Evidence work is central and production source edits are forbidden or stop-required.
- This is a shape label, not support.

`preview-gap-set-complete`:

- The known preview axes for a calibration fixture have been documented.
- This closes an observation loop only. It does not mean supported, eligible, approved, or proven.

`runtime-evidence-only-preview-gap-set-complete`:

- The Todo App runtime Evidence-only fixture has previewed test-only scope, runtime Evidence authority, evidence/check
  binding, output requirements, and compliance-checker bridge.
- Runtime Evidence remains missing and the compliance checker remains unimplemented.

`not-supported`:

- The fixture is outside the supported compiler command path.
- This status blocks candidate generation unless a later eligibility decision changes it.

`not-eligible-current-command-not-wired`:

- The current command path does not accept the fixture.
- This remains true even if policy recognition or preview gap completion exists.

`contract-candidate-not-run`:

- No contract candidate has been generated for the fixture.
- Semantic diff, promotion review, and equivalence proof cannot be generalized from a missing candidate.

`promotion-not-eligible`:

- The fixture cannot enter promotion review.
- Common reasons include unsupported command path, missing authoritative Evidence, missing checker implementation, or no
  candidate.

`promotion-review-ready-for-human`:

- A candidate and review packet are ready for human review.
- This is not approval and not user acceptance.

`not-approved`:

- No approval has been granted for the artifact or fixture.
- This applies to generated approval fields unless a separate human decision is recorded.

`approved-for-current-fixture-promotion-review`:

- A narrow human decision accepted the current Todo Search fixture promotion review packet.
- It does not approve other fixtures, arbitrary `changeType` support, execution authority, enforcement, or broad
  equivalence proof.

`equivalenceCandidate: true`:

- Blocking semantic/policy loss is clean enough for review under the current policy.
- This is not proof and not promotion.

`equivalenceProven: false`:

- Equivalence has not been proven under an approved policy.
- This remains the default until a separate approved equivalence policy and decision change it.

`non-enforcing`:

- No CI enforcement, required checks, branch protection, graph delta apply, automated user acceptance, or execution
  authority is introduced.

## Allowed Lifecycle Transitions

The conceptual happy path is:

```text
selected
-> calibration draft
-> observation preview
-> preview gap set complete
-> closeout decision
-> future eligibility review
-> candidate generation eligible
-> candidate generated
-> semantic diff classified
-> promotion review ready
-> scoped human decision recorded
```

Each arrow requires an explicit decision or implementation step. No arrow is automatic.

Additional allowed transitions:

- `candidate generated -> semantic diff classified` after a candidate and comparison fixture exist.
- `semantic diff clean -> promotion review ready` only if source-authority gaps, unknown diffs, and blocking losses are
  handled under policy.
- `promotion review ready -> scoped human decision recorded` only through a human decision record.
- `scoped human decision recorded -> broader support review` only through a new scope-specific decision.

## Forbidden Transitions

The following transitions are forbidden:

- `preview gap set complete -> supported`
- `preview gap set complete -> candidate generation eligible`
- `policy recognized -> candidate generated`
- `calibration draft -> supported`
- `local path preview -> portable source authority`
- `external required-check binding preview -> required check`
- `candidate check -> required check`
- `risk vocabulary preview -> risk mitigated`
- `graph-delta review binding -> graph delta apply`
- `compliance-checker bridge preview -> compliance checker implemented`
- `promotion-review-ready-for-human -> approved`
- `equivalenceCandidate: true -> equivalenceProven: true`
- `human decision for one fixture -> support for another fixture`
- `generated approval field -> human approval`
- `runtime Evidence missing -> runtime Evidence satisfied`

## Current Fixture Mapping

Todo Search whitespace-normalization `bug_fix`:

- selection: current completed fixture;
- draft/input: supported current dry-run input exists;
- compile eligibility: current command path supports this fixture only;
- candidate generation: candidate generated;
- semantic diff: classified with review-only diffs;
- promotion review: ready for human;
- approval: scoped human decision recorded as `approved-for-current-fixture-promotion-review`;
- equivalence: `equivalenceCandidate: true`, `equivalenceProven: false`;
- enforcement: non-enforcing.

`component/escape-html` Symbol stringification `behavior-change`:

- selection: second calibration fixture;
- recognition: behavior-change calibration policy recognized;
- preview gap status: v0.3 preview gap set complete;
- compile eligibility: `not-eligible-current-command-not-wired`;
- candidate generation: `contract-candidate-not-run`;
- promotion review: `promotion-not-eligible`;
- approval: `not-approved`;
- equivalence: `equivalenceProven: false`;
- enforcement: non-enforcing.

Todo App add-todo runtime Evidence-only calibration:

- selection: third calibration fixture;
- recognition: `test-only-behavior-proof`;
- preview gap status: `runtime-evidence-only-preview-gap-set-complete`;
- compile eligibility: `not-eligible-current-command-not-wired`;
- candidate generation: `contract-candidate-not-run`;
- runtime Evidence: missing;
- evidence/check binding: `preview-only-not-satisfied`;
- compliance checker: not implemented;
- promotion review: `promotion-not-eligible`;
- approval: `not-approved`;
- equivalence: `equivalenceProven: false`;
- enforcement: non-enforcing.

## Status Normalization Risks

Known risks:

- status drift across JSON previews, docs, decision records, and health reports;
- mixing support status with preview status;
- treating missing runtime Evidence as satisfied;
- treating generated approval fields as human approval;
- treating `equivalenceCandidate` as `equivalenceProven`;
- treating static preview artifacts as compiler execution output;
- treating candidate checks as required checks;
- treating local checkout paths as portable source authority;
- treating one fixture's closeout as a general compiler promotion.

## Next Milestone

Recommended next milestone:

```text
next-calibration-direction-decision
```

The next direction decision is now recorded in
[devview-compliance-checker-mvp-scope.md](devview-compliance-checker-mvp-scope.md). It selects:

```text
scope-compliance-preview
```

as the first future compliance-checker MVP axis. That scope decision is planning-only and does not implement checker
behavior, inspect or reject diffs, enforce scope, wire CI, approve fixtures, or prove equivalence.

The implementation readiness criteria are now recorded in
[scope-compliance-checker-implementation-readiness.md](scope-compliance-checker-implementation-readiness.md). That
readiness document keeps the checker unimplemented while defining future input requirements, missing-input states,
preview-only result states, and the first static result-artifact boundary.

## Non-Goals

This model does not:

- mark calibration fixtures as supported;
- wire calibration fixtures into the supported compiler command path;
- generate contract candidates for calibration fixtures;
- create or approve promotion review packets for calibration fixtures;
- claim runtime Evidence is satisfied;
- implement the compliance checker;
- promote static preview artifacts into compiler execution output;
- turn candidate checks into required checks;
- set `equivalenceProven: true`;
- introduce executor automation;
- introduce graph delta apply;
- introduce CI enforcement, required checks, or branch protection;
- automate user acceptance;
- retire tree-native artifacts;
- rename `pbe`, `.pbe`, validation scripts, generated paths, or sourceMode values.
