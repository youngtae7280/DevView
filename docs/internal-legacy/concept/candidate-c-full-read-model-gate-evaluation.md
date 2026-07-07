# Candidate C Full Read-Model Gate Evaluation

Status: evaluation / not promoted / non-enforcing evidence only

## Purpose

This document evaluates whether Candidate C should become a broader required read-model gate.

Candidate C is the full read-model gate family around registry-backed validate-all, graph-source health reporting, E2E
smoke, CI-backed read-model Evidence, and possible broader read-model enforcement.

Decision:

```text
Do not promote Candidate C to enforcement in this step.
Keep Candidate C as non-enforcing Evidence and future promotion candidate.
```

This evaluation does not change source authority, schemas, state, validators, CLI behavior, CI enforcement semantics,
examples, README, branch protection, ACEP, tree-native compatibility, or user acceptance.

## Current Candidate C Surface

Candidate C currently consists of these surfaces:

| Surface                                | Current command / workflow                                           | Current role                                                  |
| -------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Registry-backed validate-all           | `node dist/cli/index.js graph read-model validate --all --json`      | Local non-enforcing Evidence                                  |
| Graph-source health report             | `node dist/cli/index.js graph read-model report-health --json`       | Local non-enforcing summary                                   |
| Read-model E2E smoke                   | `npm run test:read-model:e2e`                                        | Local non-enforcing smoke Evidence                            |
| Candidate B script                     | `npm run check:graph-source:candidate-b`                             | Narrow repo-side check surface, not branch-protected          |
| CI-backed read-model Evidence          | `.github/workflows/read-model-evidence.yml`                          | `workflow_dispatch` and `pull_request` informational Evidence |
| Main CI Candidate B job                | `PBE CI / Candidate B Read-Model Check`                              | CI-observed job, not branch-protected                         |
| Intent report / edgeIntent observation | `graph read-model report-intent` and workflow projection observation | Separate report-only visibility                               |

There is no dedicated `check:graph-source:candidate-c` package script, no Candidate C required-check job, and no GitHub
branch protection rule requiring Candidate C.

## What Passes Today

Current positive signals:

- `graph read-model validate --all --json` reports `aggregate-pass` for the configured positive registry.
- `graph read-model report-health --json` reports `graph-source-health-pass`.
- `npm run test:read-model:e2e` reports `e2e-smoke-pass`.
- `npm run check:graph-source:candidate-b` passes locally.
- `PBE CI / Candidate B Read-Model Check` exists and the latest observed push run succeeded.
- `.github/workflows/read-model-evidence.yml` records non-enforcing CI-backed read-model Evidence with manual and PR
  informational trigger modes.
- Intent-critical edgeIntent projection observation is available as separate non-enforcing visibility.

These are strong readiness signals. They are not enough to make Candidate C a merge-blocking required gate.

## Positive Registry Scope Today

Positive validate-all is registry-scoped and explicit. It is not directory discovery.

Current positive profiles:

| Profile                               | Slice                                                 | Policy level          | Role                                                                                                |
| ------------------------------------- | ----------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| `todo-search-selected-slice`          | `examples/internal-legacy/adoption/todo-search-slice` | `pilot-marker-backed` | Limited graph-source promoted selected slice with parity, runtime fixture, and scoped pilot marker. |
| `todo-app-devview-run-structure-only` | `examples/valid/todo-app-devview-run`                 | `structure-only`      | Confirmed Graph-source-backed structure-only fixture; not source-authority-bearing.                 |

`validate --all` must remain scoped to these configured profiles until registry expansion is separately approved.

## What Candidate C Would Enforce If Promoted

A real Candidate C promotion would likely require all of the following to be stable and accepted as blocking semantics:

1. Registry-backed `graph read-model validate --all --json`.
2. `graph read-model report-health --json`.
3. `npm run test:read-model:e2e`.
4. CI-backed read-model Evidence artifact completeness.
5. Intent / edgeIntent observation policy, if included in the gate.
6. Per-slice projection contract pass.
7. Retained warning visibility.
8. Invalid fixture boundary clarity.
9. Branch protection / required-check configuration.
10. Waiver and failure policy for false positives, infra failures, retained warnings, temporary CI failures, and
    decision-required outcomes.

That is broader than Candidate B and would create stronger blocking semantics across registry, CI Evidence, health,
E2E, and possibly intent observation surfaces.

## Readiness Decision

Candidate C is not ready for promotion.

Current safe status:

```text
Candidate C remains non-enforcing Evidence and future candidate.
```

Reasons:

- Candidate B itself is still not branch-protection-required.
- `main` branch protection is not configured.
- Candidate C is broader than Candidate B and would require a larger failure/waiver policy.
- Todo App remains `structure-only` and should not be treated as source-authority-bearing.
- External graph-source enrollment remains design-only.
- Real external feature dogfooding produced implementation/build evidence, but not external user acceptance or external
  graph-source enrollment.
- Invalid fixtures remain local focused negative tests and are not part of positive validate-all or CI enforcement.
- `.github/workflows/read-model-evidence.yml` is informational Evidence, not a required-check workflow.
- No dedicated Candidate C script/job/check context exists yet.

## Blocking Gaps

Candidate C promotion is blocked until the following are resolved:

- Candidate B branch-protection decision is complete and accepted, or the user explicitly chooses to skip directly to a
  broader gate.
- A Candidate C waiver/failure policy is written and accepted.
- The exact Candidate C check surface is named and stabilized.
- GitHub branch protection policy is explicit and verified.
- Todo App either remains explicitly allowed as structure-only inside the gate or gains separate approved pilot evidence.
- External graph-source enrollment policy is implemented or explicitly out of Candidate C scope.
- Invalid fixture execution remains separate, or a future negative-suite policy is designed without mixing negative
  fixtures into positive validate-all.
- CI-backed artifact retention and review expectations are stable enough for blocking use.
- User acceptance and source-authority boundaries remain visible in required-check output.

## Todo App / Structure-Only Boundary

Todo App is the strongest reason Candidate C must not overclaim readiness.

Todo App currently has:

- graph-source-backed generation;
- projection contract pass;
- validate-all inclusion;
- E2E smoke coverage;
- Product/Work/Test/Evidence references.

Todo App does not have:

- scoped pilot marker;
- parity backing or waiver;
- runtime fixture requirement;
- explicit source-authority approval beyond `structure-only`;
- retirement approval.

Therefore Candidate C may include Todo App only as a structure-only positive profile. It must not use Todo App pass as
source-authority expansion, user acceptance, or tree-native retirement approval.

## Invalid Fixture / Negative Coverage Boundary

Invalid read-model fixtures are intentionally excluded from positive validate-all and CI enforcement.

Current role:

- local focused tests prove invalid view-scoped tags, missing Core View coverage, and missing pilot markers are blocked;
- invalid fixtures are not enrolled in `examples/internal-legacy/read-model-aggregate/read-model-slices.json`;
- invalid fixtures are not positive CI profiles;
- invalid fixture CI enrollment remains a separate future policy decision.

Candidate C must not claim broad negative-suite coverage unless a separate negative fixture suite is designed, named,
and kept separate from positive registry validation.

## CI / Branch Protection Boundary

Current CI state:

- `PBE CI / Candidate B Read-Model Check` exists and runs `npm run check:graph-source:candidate-b`.
- `.github/workflows/read-model-evidence.yml` exists as `DevView Read-Model Evidence` with `workflow_dispatch` and
  `pull_request` informational triggers.
- The read-model Evidence workflow uploads reviewable artifacts and health summaries.
- The workflow is not a required check and does not configure branch protection.

Candidate C should not be represented as branch-protected unless GitHub branch protection is actually configured and
verified. This step does not configure it.

## Source-Authority And User-Acceptance Boundary

Candidate C pass would be Evidence only unless a separate user decision changes that.

Candidate C must not:

- expand source authority;
- approve Todo App beyond `structure-only`;
- approve external graph-source enrollment;
- retire tree-native or ACEP compatibility artifacts;
- replace user acceptance;
- treat generated Evidence, CI pass, aggregate pass, or health pass as Product acceptance.

## Minimum Future Promotion Requirements

Before Candidate C can become a required gate, PBE should have:

1. Explicit user approval for Candidate C blocking semantics.
2. Stable named command or script for Candidate C, such as a future `check:graph-source:candidate-c`.
3. Stable GitHub check/job name for Candidate C.
4. Accepted failure/waiver policy for validate-all, health, E2E, CI artifact, intent observation, and retained warnings.
5. Clear policy for Todo App structure-only inclusion or separate Todo App pilot evidence.
6. Clear policy for invalid fixture / negative suite boundaries.
7. Branch protection baseline and exact required-check context verified.
8. CI artifact retention and review expectations documented for blocking use.
9. Explicit non-replacement statement for user acceptance and source authority.
10. Successful manual/local and PR observations after the exact Candidate C surface is named.

## Safest Next Action

Recommended next action:

```text
Keep Candidate C non-enforcing. If a future branch is approved, first define a named Candidate C script/job and waiver
policy without enabling branch protection.
```

Candidate C should follow Candidate B's governance ladder:

```text
docs/evaluation -> named local script -> CI-observed job -> reviewed PR signal -> explicit branch protection decision
```

## Non-Goals

This evaluation does not:

- add a Candidate C command or package script;
- change CI workflow semantics;
- configure branch protection;
- expand source authority;
- promote Todo App beyond `structure-only`;
- enroll invalid fixtures in positive CI;
- change schemas, validators, state, CLI behavior, examples, or README;
- retire ACEP or tree-native artifacts;
- replace user acceptance.

## Final Decision

```text
Candidate C is not promoted now.
Candidate C remains non-enforcing Evidence and a future gate candidate.
```
