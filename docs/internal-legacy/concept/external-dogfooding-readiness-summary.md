# External Dogfooding Readiness Summary

Status: external-dogfooding-readiness-summary / docs-only / no-execution / non-enforcing

## Purpose

This summary records what the public README and concept docs should communicate before PBE is used on an external
project.

It is a readiness summary only. It does not start external dogfooding, promote source authority, enable required checks,
change branch protection, modify CI workflow behavior, change CLI/schema/validator behavior, retire tree-native
artifacts, or replace user acceptance.

## Current Graph-Source State

Current configured read-model slices are graph-source-backed, but not all with the same authority level.

| Surface                    | Current state                                                                                              | Boundary                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo Search selected slice | Limited Graph-source promoted selected-slice authority surface.                                            | Scoped only to the Todo Search selected slice. Tree-native selected-slice artifacts remain deprecated fallback/reference records and are not deleted. |
| Todo App DevView Run       | Graph-source-backed `structure-only` profile.                                                              | Not source-authority-bearing, not parity-backed, not pilot-marker-backed, and not promoted beyond `structure-only`.                                   |
| Positive registry          | `examples/internal-legacy/read-model-aggregate/read-model-slices.json` with Todo Search and Todo App only. | Registry-backed `validate --all` is positive Evidence only and does not expand authority.                                                             |
| CI/read-model Evidence     | Manual/PR informational observation with health, E2E, validate-all, intent projection, and focused tests.  | Non-enforcing; not a required check, branch protection rule, or merge gate.                                                                           |
| Candidate B                | Prepared soft-required package: `report-health` plus `test:read-model:e2e`.                                | Not enabled; explicit approval, waiver/failure policy, and branch protection decision are still required.                                             |
| Invalid fixtures           | Local focused negative test inputs.                                                                        | Not in positive registry, positive validate-all, CI enrollment, or source-authority evidence.                                                         |

## Public Documentation Expectation

Before external dogfooding, public entry points should say the following without overclaiming:

- PBE is a CLI + file-artifact control layer, not a hosted product or GUI.
- Todo Search has a limited Graph-source promoted selected-slice authority surface.
- Todo App is graph-source-backed for `structure-only` validation only.
- `graph read-model validate --all`, health reports, and CI artifacts are Evidence and observation, not user acceptance.
- Candidate B is prepared as a policy package, not enabled as a required check.
- Branch protection, CI enforcement, repo-wide source-authority promotion, and tree-native retirement remain unapproved.
- External dogfooding should begin with bounded slices and should not reinterpret generated Evidence as Product
  acceptance.

The current README already states the core boundaries briefly. Deeper graph-source details should remain in
`docs/concept/` and documentation indexes rather than adding many deep links to the README.

## Readiness Inputs

The current external dogfooding readiness picture is assembled from these packages:

- [Repo-wide Graph-Source Transition Mechanics](repo-wide-graph-source-transition-mechanics.md)
- [Graph-Source Required-Check Readiness](graph-source-required-check-readiness.md)
- [Graph-Source Soft-Required Candidate B Package](graph-source-soft-required-candidate-b-package.md)
- [Todo App Structure-Only Next-Step Package](todo-app-structure-only-next-step-package.md)
- [Graph-Source Registry / Projection Generalization Readiness](graph-source-registry-projection-generalization-readiness.md)
- [Read-Model Invalid Fixture Boundary Readiness](read-model-invalid-fixture-boundary-readiness.md)
- `examples/internal-legacy/read-model-aggregate/graph-source-transition-status.json`

## Remaining Approval Branches

External dogfooding can proceed only if the next slice respects the current boundaries. Separate approval is still
needed before any of these branches starts:

1. Enable Candidate B as a required or blocking check.
2. Configure branch protection or merge blocking around graph-source health.
3. Promote Todo App beyond `structure-only`.
4. Start registry/projection generalization implementation for external projects.
5. Enroll invalid fixtures in any CI-visible negative suite.
6. Retire or delete tree-native artifacts.
7. Expand repo-wide Graph-source source authority.

## External Dogfooding Entry Criteria

A safe external dogfooding branch should:

- name one bounded external slice;
- keep PBE tracking local and evidence-based;
- use the current CLI/read-model commands as non-enforcing observation unless separately approved;
- avoid registry expansion unless the user approves that implementation branch;
- keep invalid fixtures as local negative examples;
- preserve user acceptance as user-only;
- record generated Evidence churn separately from docs-only readiness work.

## Non-Actions In This Summary

This summary does not:

- execute dogfooding on an external project;
- add source-authority scope;
- change README behavior or command semantics;
- change `examples/internal-legacy/read-model-aggregate/read-model-slices.json`;
- change `.github/workflows/read-model-evidence.yml`;
- enable required checks, branch protection, merge gates, or CI enforcement;
- modify CLI, schemas, validators, or tests;
- retire tree-native artifacts;
- replace Product or user acceptance.

## Readiness Summary

- README status language: adequate and conservative.
- Docs index linkage: should point to this summary for external dogfooding readiness.
- Graph-source state: clear enough for bounded external dogfooding planning.
- Enforcement state: non-enforcing.
- Candidate B: prepared, not enabled.
- Todo App: graph-source-backed `structure-only`, not promoted.
- Invalid fixtures: local focused negative inputs only.
- Next step: user chooses whether the next branch is external dogfooding execution, Candidate B enablement, registry
  generalization, Todo App pilot preparation, invalid fixture suite formalization, or continued observation.
