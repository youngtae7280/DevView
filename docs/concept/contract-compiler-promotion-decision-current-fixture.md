# Contract Compiler Promotion Decision: Current Fixture

Status: human-review-approved-for-current-fixture / docs-only decision record / non-execution

## Decision Summary

Decision: `approved-for-current-fixture-promotion-review`

Reviewer: project owner via current DevView/PBE maintenance thread

Recorded by: Codex

Date: 2026-07-02

Reviewed commit: `36d1c57 Audit DevView identity boundary wording`

This decision accepts the current Contract Compiler Promotion Review Packet for the current Todo Search dry-run fixture
only. It does not approve the compiler for arbitrary fixtures, arbitrary `changeType` values, execution authority,
required checks, CI enforcement, branch protection, graph delta application, user acceptance, or tree-native retirement.

## Reviewed Scope

| Item                            | Reviewed value                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Fixture scope                   | Current Todo Search whitespace-normalization `bug_fix` dry-run fixture only                    |
| Generated compiler candidate    | `examples/read-model-aggregate/generated/execution-contract-dry-run.generated.json`            |
| Hand-written comparison fixture | `examples/read-model-aggregate/generated/execution-contract-dry-run.json`                      |
| Semantic diff artifact          | `examples/read-model-aggregate/generated/execution-contract-dry-run.diff.json`                 |
| Source-authority gap preview    | `examples/read-model-aggregate/generated/contract-source-authority-gap.preview.json`           |
| Output requirement preview      | `examples/read-model-aggregate/generated/output-requirement-source-authority.preview.json`     |
| Promotion review packet         | `examples/read-model-aggregate/generated/contract-compiler-promotion-review.preview.json`      |
| Health report                   | `examples/read-model-aggregate/generated/read-model-health-report-output.md`                   |
| Policy                          | [contract-compiler-promotion-review-policy.md](contract-compiler-promotion-review-policy.md)   |
| Boundary audit                  | [migration-pbe-to-devview.md](../migration-pbe-to-devview.md) and [README.md](../../README.md) |

## Validation Reviewed

The decision is based on the current local verification chain remaining green:

- `npm run build:cli`: pass
- `npx vitest run cli/src/__tests__/read-model-evidence.test.ts`: pass, 95 tests
- `node dist/cli/index.js graph read-model report-compiler-input --json`: pass
- `node dist/cli/index.js graph read-model compile-contract --dry-run --json`: pass
- `node dist/cli/index.js graph read-model report-health --json --markdown examples/read-model-aggregate/generated/read-model-health-report-output.md`:
  pass
- `npm run test:read-model:e2e`: pass
- `node dist/cli/index.js graph read-model validate --all --json`: pass
- `npm run validate:pbe`: pass
- `npm run validate:pbe:v2`: pass
- `npm run format:check`: pass
- `git diff --check`: pass

## Review-Only Diff Decision

The current review-only diffs are accepted for this fixture's promotion review packet only:

| Diff field              | Classification                     | Decision                              | Rationale                                                                                                                                              |
| ----------------------- | ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sourceMode`            | `source-mode-metadata-only`        | accepted for review purposes          | The difference separates hand-written fixture provenance from compiler-produced candidate provenance and does not change execution scope or authority. |
| additive health check   | `validation-superset-review-only`  | accepted for review purposes          | The generated candidate adds read-model health reporting as a non-enforcing validation superset. It does not create a required check.                  |
| `nonExecutionStatement` | `boundary-wording-review-required` | accepted after boundary wording audit | The DevView boundary audit preserves non-execution, non-approval, non-enforcement, no user-acceptance, and no graph-delta-apply meanings.              |

## Boundary Confirmation

This decision confirms for the current fixture only that:

- generated compiler output is not execution authority;
- the Instruction Pack is not approval;
- the promotion review packet is not approval;
- validation is not user acceptance;
- CI enforcement, required checks, and branch protection are not introduced;
- graph delta apply is not automated;
- tree-native artifacts are not retired;
- PBE compatibility remains active for `pbe`, `.pbe`, validation scripts, generated artifact paths, historical records,
  and sourceMode/provenance values.

## Status Handling

This decision record is intentionally docs-only.

- It may be cited as human review acceptance for the current fixture's promotion review packet.
- It does not edit generated `approvalStatus`.
- It does not set `equivalenceProven: true`.
- It does not set broad `promotion-review-approved`.
- It does not make the generated compiler candidate an execution source.
- It does not expand source authority beyond the current reviewed fixture.

Current generated artifacts may continue to report:

```text
equivalenceCandidate: true
equivalenceProven: false
approvalStatus: not-approved
compilerPromotionReadiness: compiler-promotion-review-required
```

Those generated statuses remain conservative until a separate approved policy explicitly defines how human decision
records should be reflected in machine-readable promotion status.

## Non-Goals

This decision does not:

- change compiler behavior;
- change source-authority resolver behavior;
- change semantic diff logic;
- change readiness policy logic;
- approve arbitrary `changeType` support;
- approve future fixtures;
- execute AI;
- apply graph deltas;
- accept product work;
- enable required checks;
- configure branch protection;
- introduce CI enforcement;
- automate user acceptance;
- retire tree-native artifacts;
- rename `pbe`, `.pbe`, validation scripts, generated paths, or sourceMode values.
