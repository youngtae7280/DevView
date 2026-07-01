# Contract Compiler Promotion Review Policy

Status: v0.2 review packet policy / non-enforcing / no approval authority

## Purpose

Contract Compiler Dry-Run v0.2 can now reconstruct the current Todo Search `bug_fix` fixture's major contract fields
from source-authority inputs. That makes the generated candidate reviewable, but it does not make the candidate
equivalence-proven, executable, accepted, or enforceable.

This policy defines the human review boundary after `equivalenceCandidate: true`.

## State Separation

These states are intentionally separate:

- `equivalenceCandidate`: the generated candidate has source-authority preservation, no blocking semantic loss, and no
  unknown semantic diffs.
- `equivalenceProven`: a later approved policy and human review explicitly recorded equivalence proof.
- user acceptance: the user accepts a product/work result.
- execution readiness: a contract is approved to drive implementation.
- CI enforcement: required checks, branch protection, or merge enforcement are enabled.

The current dry-run may report `equivalenceCandidate: true`, but it keeps `equivalenceProven: false`.

## Promotion Review States

- `promotion-review-not-started`: no reviewable compiler candidate or diff exists.
- `promotion-review-required`: review metadata exists, but the packet is not yet ready for a human decision.
- `promotion-review-blocked`: blocking semantic loss, unknown diffs, validator failure, or source-authority gaps prevent
  promotion review.
- `promotion-review-ready-for-human`: the packet has enough non-enforcing Evidence for a human reviewer to approve,
  reject, or request changes.
- `promotion-review-approved`: a human decision record explicitly approves promotion. This is never set automatically.
- `promotion-review-rejected`: a human decision record explicitly rejects promotion.

Current status is `promotion-review-ready-for-human` with `approvalStatus: not-approved`.

## Review Packet

`graph read-model compile-contract --dry-run --json` writes:

```text
examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json
```

The packet collects:

- compiler candidate path;
- hand-written comparison fixture path;
- semantic diff artifact path;
- output requirement source-authority preview path;
- source-authority gap preview path;
- equivalence policy status;
- review-only diff summary;
- blocking semantic loss and unknown diff counts;
- validation commands required before approval;
- human review checklist;
- explicit non-goals.

The packet is review Evidence only. It is not an approval artifact.

## Review-Only Diff Policy

The current packet narrows the three remaining review-only diffs into explicit classifications:

- `source-mode-metadata-only`: provenance differs because one artifact is hand-written and the other is compiler-
  produced.
- `validation-superset-review-only`: the generated candidate adds the read-model health check as a non-enforcing
  validation superset.
- `boundary-wording-review-required`: non-execution wording differs and must be reviewed by a human before any
  promotion decision.

Boundary wording is intentionally conservative. A reviewer must confirm the wording preserves these meanings:

- compiler output is not an execution source;
- the review packet is not approval;
- validation is not user acceptance;
- no CI enforcement or branch protection is introduced;
- graph delta apply is not performed.

This classification can keep `equivalenceCandidate: true`, but it does not make `equivalenceProven` true.

## Human Review Checklist

A reviewer must check at least:

- major fields are source-authority preserved;
- blocking semantic/policy/output/evidence/context/risk/scope loss is zero;
- unknown semantic diffs are zero;
- review-only diffs are acceptable;
- sourceMode difference is expected;
- additive health check difference is expected;
- boundary wording does not weaken the non-execution boundary;
- the generated candidate passed the Contract Fixture Validator;
- `report-health`, E2E smoke, and validate-all were run before approval;
- compiler output is not treated as execution source;
- no required check, branch protection, or CI enforcement was introduced.

For the current fixture, boundary wording review remains required.

Passing deterministic checks does not replace the human decision.

## Boundaries

This policy and packet do not:

- execute AI;
- apply graph deltas;
- accept work;
- prove equivalence;
- approve compiler promotion;
- enable required checks;
- configure branch protection;
- introduce CI enforcement;
- retire tree-native artifacts;
- widen supported `changeType` values;
- make the generated contract authoritative.

The hand-written contract remains a comparison fixture. It is not a compiler source.
