# Todo App Source-Authority Evidence Package

Status: evidence package / remains structure-only / no promotion

## Purpose

This package records the evidence needed before Todo App can move from Graph-source-backed `structure-only` toward a
limited source-authority pilot.

Decision:

```text
Todo App remains structure-only.
No limited source-authority pilot is promoted in this step.
```

The package sharpens the missing-evidence checklist so a future pilot can be implemented without label-only promotion.
It does not change registry metadata, source-authority labels, schemas, validators, state, CLI behavior, CI, examples,
branch protection, ACEP, tree-native artifacts, or user acceptance.

## Current Todo App Status

Configured profile:

```text
todo-app-pbe-run-structure-only
```

Configured slice:

```text
examples/valid/todo-app-pbe-run
```

Current role:

```text
confirmed graph-source-backed structure-only
```

This means:

- graph-source-backed generation exists;
- generated read-model projection validates;
- the slice participates in positive validate-all as a structure-only fixture;
- canonical `.pbe` artifacts remain compatibility/fallback/reference;
- no parity backing, pilot marker backing, runtime fixture requirement, CI enforcement, branch protection, tree-native
  retirement, or user acceptance replacement is created.

## Existing Evidence Present

Todo App has strong structure-only evidence:

| Evidence surface              | Current signal                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Graph source                  | `examples/valid/todo-app-pbe-run/graph-source.json`                                            |
| Product / AC refs             | `PT-1`, `AC-PT-1-1` in `.pbe/tree/product-tree.json`                                           |
| Work refs / expected files    | `WT-1`, `expectedFiles: ["src/todos.ts"]` in `.pbe/tree/work-tree.json`                        |
| Test refs                     | `TT-1` verifies `PT-1`, `WT-1`, and `AC-PT-1-1`                                                |
| Evidence refs                 | `EV-1` links attached test output to `TT-1` and `AC-PT-1-1`                                    |
| Acceptance artifact           | `ACCEPT-PT-1` records user acceptance for the fixture branch                                   |
| Generated read-model          | 22 nodes, 38 edges, 7 Core Views                                                               |
| Validation report             | `validation-pass`, 16 checks                                                                   |
| E2E smoke                     | Checks Todo App generation and projection as `structure-only`                                  |
| Graph execution-contract view | Report-only surface exposes Product/Work/Test/Evidence refs and retained structure-only limits |

This evidence is enough to keep Todo App in the current positive registry as a structure-only profile.

It is not enough to make Todo App source-authority-bearing beyond structure-only.

## Missing Evidence

The missing evidence is explicit and intentional:

| Missing evidence                     | Why it blocks pilot promotion                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Scoped pilot marker                  | Todo Search has a reviewed marker; Todo App does not.                                                        |
| Parity backing or waiver             | Todo App does not require manual/generated parity comparison; structure-only validation explicitly skips it. |
| Runtime fixture policy               | Todo App has attached text evidence, but no runnable runtime/build/test fixture is required by profile.      |
| Pilot scope/non-scope approval       | No explicit user-approved Todo App pilot scope exists beyond structure-only.                                 |
| Registry policy-level change package | The registry still says `policyLevel: "structure-only"` and should not be changed by label alone.            |
| Projection contract for pilot mode   | Current projection contract must preserve structure-only text.                                               |
| Source-authority review record       | No reviewed package says Todo App graph source may become product/source authority.                          |
| Rollback/fallback criteria           | No pilot-specific fallback criteria exist for Todo App.                                                      |
| Focused pilot tests                  | Existing tests protect structure-only; future pilot tests would need to prove the new bounded role.          |

## Why Existing Evidence Is Not Enough

Todo App has deterministic Product/Work/Test/Evidence references and a selected `expectedFiles` entry. That improves
reviewability, but it does not by itself create source authority.

The current validation report says:

- parity requirement: not required for structure-only;
- pilot marker requirement: not required for structure-only;
- runtime fixture requirement: attached-evidence-only;
- source authority boundary: structure-only;
- non-promotion statement: validation does not promote Maintainability Graph or create a source-authority pilot.

Promoting Todo App without changing those evidence surfaces would be a paper promotion.

## Minimum Pilot Evidence Requirements

A real Todo App limited source-authority pilot should require all of the following:

1. Explicit user approval to evaluate Todo App beyond `structure-only`.
2. A bounded Todo App pilot scope and non-scope statement.
3. A scoped pilot marker or approved replacement.
4. A parity policy:
   - generated/manual parity pass, or
   - deterministic projection parity policy, or
   - explicit waiver with risk and fallback notes.
5. Runnable runtime/build/test evidence policy for the add-todo capability.
6. Registry metadata change package that changes only the exact Todo App profile.
7. Projection contract checks that distinguish the new pilot from structure-only output.
8. Focused tests proving:
   - Todo App pilot status is recognized only for the configured profile;
   - Todo Search remains unchanged;
   - invalid fixtures stay outside positive registry;
   - Candidate B remains non-acceptance/non-retirement;
   - repo-wide source authority is not expanded.
9. Rollback/fallback criteria.
10. User acceptance boundary that generated Evidence cannot replace.

## Proposed Future Pilot Marker Fields

Candidate future marker fields:

| Field                        | Purpose                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `version`                    | Marker format version.                                                      |
| `status`                     | Expected value such as `todo-app-limited-pilot-prepared` or `active`.       |
| `approvedScope`              | Exact Todo App profile/slice covered.                                       |
| `nonScope`                   | Explicitly excluded repo-wide/source-authority/retirement behavior.         |
| `sourceAuthorityMeaning`     | What the pilot can and cannot make authoritative.                           |
| `requiredParityStatus`       | Required parity mode/status or approved waiver.                             |
| `runtimeEvidenceRequirement` | Command, fixture, or attached-evidence requirement for behavior confidence. |
| `fallbackReferences`         | Canonical `.pbe` and generated artifacts retained as fallback/reference.    |
| `fallbackTriggers`           | Drift or missing-evidence conditions that disable the pilot.                |
| `retainedWarnings`           | Warnings kept visible during pilot.                                         |
| `userAcceptanceBoundary`     | Statement that user acceptance remains user-controlled.                     |
| `nonPromotionStatement`      | Statement blocking repo-wide/source/CI/retirement promotion.                |

These are future marker fields only. This step does not add the marker.

## Runtime / Build / Test Evidence Expectations

Todo App pilot evidence should not rely on attached text alone unless explicitly waived.

Preferred future evidence:

- runnable test fixture for the add-todo behavior;
- command output with pass/fail result;
- clear mapping from command output to `TT-1` and `AC-PT-1-1`;
- evidence timestamp/source commit;
- failure policy for missing or stale runtime evidence;
- record of known limitations if the fixture is synthetic.

Acceptable temporary alternative:

- attached text evidence plus explicit waiver that runtime fixture is not yet available;
- retained warning that pilot confidence is weaker;
- no broad source-authority promotion until runtime evidence exists.

## File / Work / Test / Evidence Traceability Requirements

Any future Todo App pilot must preserve:

- Product node: `PT-1`
- Acceptance Criteria: `AC-PT-1-1`
- Work node: `WT-1`
- Expected file: `src/todos.ts`
- Test node: `TT-1`
- Evidence node: `EV-1`
- Acceptance branch: `ACCEPT-PT-1`

It must also record whether `src/todos.ts` is a real external source path, a fixture path, or a conceptual example path.
If the file path is only illustrative, the pilot cannot claim runtime source authority over a real Todo App
implementation.

## User Acceptance Boundary

Todo App acceptance records in the fixture are useful evidence for the fixture branch. They do not grant Codex or PBE
authority to:

- accept future Todo App source-authority promotion;
- waive missing pilot evidence;
- change registry policy level;
- approve branch protection;
- retire tree-native artifacts;
- replace user review for a future pilot.

Future pilot approval must be explicit and scoped.

## Existing Tests Protecting The Boundary

Existing tests already protect the current blocked state, including:

- Todo App uses `todo-app-pbe-run-structure-only`;
- Todo App graph source parses without promotion;
- Todo App source authority beyond structure-only remains blocked until pilot evidence exists;
- Todo App graph-source candidates that claim promotion are rejected;
- structure-only registry entries must not require parity or pilot markers;
- Todo App graph-native execution contract report remains structure-only after the pilot retry;
- pilot-marker-backed validation blocks when a scoped pilot marker is missing.

Because these tests already cover the boundary, this step adds no new test code.

## Decision

Todo App remains:

```text
confirmed graph-source-backed structure-only
```

No pilot metadata is added. No registry policy level is changed. No source authority is promoted.

Recommended next implementation branch:

```text
Add a Todo App pilot marker and runtime/parity evidence package only after explicit approval, then update tests and
registry metadata for that single profile.
```

## Non-Goals

This package does not:

- promote Todo App beyond structure-only;
- expand repo-wide source authority;
- change the positive registry;
- change schemas, validators, state, CLI behavior, package scripts, or CI;
- change Candidate B or branch protection;
- change examples/valid or examples/invalid semantics;
- retire ACEP or tree-native artifacts;
- replace user acceptance;
- add a runtime fixture;
- add a scoped pilot marker.
