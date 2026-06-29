# Todo App Structure-Only Next-Step Package

Status: decision package / readiness only / no promotion

## Purpose

This package records what must be true before `examples/valid/todo-app-pbe-run` can move beyond its current
Graph-source-backed `structure-only` role.

It is intended to support the next user decision before external dogfooding. It does not promote Todo App source
authority, enable CI enforcement, retire tree-native artifacts, expand the graph-source registry, or change schemas,
validators, CLI behavior, or state transitions.

## Current Todo App State

Todo App PBE Run is currently:

- graph-source-backed for a bounded read-model structure fixture;
- included in positive registry-backed `graph read-model validate --all --json`;
- passing its structure-only projection contract;
- passing validator-backed read-model validation;
- visible in local E2E smoke and non-enforcing CI Evidence;
- retained as canonical `.pbe` compatibility/fallback/reference artifacts.

It is not currently:

- source-authority-bearing;
- parity-backed;
- pilot-marker-backed;
- Product-accepted by generated Evidence;
- user-accepted by CI;
- eligible for tree-native retirement;
- a reason to enroll invalid fixtures in positive CI;
- promoted beyond `structure-only`.

## Current Evidence References

| Surface             | Current Todo App signal                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Registry profile    | `examples/read-model-aggregate/read-model-slices.json` profile `todo-app-pbe-run-structure-only` |
| Transition status   | `graph-source-transition-status.json` says Todo App is `confirmed-structure-only-graph-source`   |
| Generated source    | `examples/valid/todo-app-pbe-run/graph-source.json` and generated read-model artifacts           |
| Projection contract | `projection-contract-pass` for 22 nodes, 38 edges, 7 Core Views                                  |
| Validation report   | `validation-pass`, 16 checks, 0 warnings/blocking/decision-required                              |
| Retained warnings   | structure-only limitation and no runnable runtime fixture requirement                            |
| Retirement package  | `not-ready-structure-only`; no Todo App retirement/deprecation action requested                  |
| CI mode             | manual/PR informational Evidence only; no enforcement or required check                          |

## Conditions To Move Beyond Structure-Only

Moving Todo App beyond `structure-only` requires a separate user-approved branch. At minimum, that branch needs:

1. Explicit approval to evaluate Todo App as a limited source-authority pilot.
2. A Todo App-specific source authority scope and non-scope statement.
3. Runtime evidence stronger than attached static output, or a clear reason runtime evidence remains out of scope.
4. Product/Test/Evidence/Acceptance linkage strong enough to prove user-visible behavior, not only artifact structure.
5. A decision on whether a Todo App-specific scoped source-authority pilot marker is required.
6. Continued `projection-contract-pass` and `validation-pass` with stable expected counts or reviewed count changes.
7. A warning/fallback policy that keeps retained limitations visible instead of treating them as clean promotion.
8. Confirmation that invalid fixtures remain negative/focused tests and are not enrolled as positive CI.
9. Confirmation that Candidate B health/E2E pass does not automatically approve Todo App promotion.
10. Rollback/fallback expectations for canonical `.pbe` artifacts if graph-source interpretation is rejected.

## Readiness Checklist

- [ ] User explicitly approves preparing a Todo App limited source-authority pilot.
- [ ] Product scope is named and bounded.
- [ ] Non-scope is named and preserved.
- [ ] Runtime fixture or equivalent execution evidence is defined.
- [ ] Product nodes and acceptance criteria are mapped to Test/Evidence/Acceptance records.
- [ ] Existing attached evidence is classified as sufficient, stale, weak, or supplemental.
- [ ] Pilot-marker requirement is accepted or explicitly waived for Todo App.
- [ ] Projection contract pass remains stable.
- [ ] Retained warnings remain visible.
- [ ] Canonical `.pbe` fallback/reference role remains available.
- [ ] Invalid fixtures remain outside positive validate-all and CI.
- [ ] Candidate B is treated as readiness Evidence only, not promotion approval.
- [ ] Tree-native retirement remains out of scope.

## Candidate Paths

| Path                  | Meaning                                                              | When to choose                                           | Boundary                                         |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| Keep structure-only   | Continue current positive validation and CI observation.             | External dogfooding wants stable baseline first.         | No promotion, no marker, no runtime requirement. |
| Add runtime evidence  | Add or strengthen Todo App runtime/behavior proof without promotion. | Behavior confidence is needed before a pilot.            | Evidence only; source authority unchanged.       |
| Prepare limited pilot | Draft a Todo App scoped source-authority pilot package.              | User approves evaluating Todo App beyond structure-only. | Requires approval before implementation.         |
| Defer Todo App        | Keep Todo App as a structure fixture and dogfood elsewhere.          | External dogfooding should avoid this scope.             | No change to registry or source role.            |

## Candidate B Boundary

The Graph-source required-check Candidate B package is:

```text
node dist/cli/index.js graph read-model report-health --json
npm.cmd run test:read-model:e2e
```

Candidate B pass can support readiness discussion, but it does not promote Todo App beyond `structure-only`. It also
does not create user acceptance, Product acceptance, source-authority expansion, tree-native retirement, or CI
enforcement.

## Next User Decision

The next decision is:

```text
Should Todo App PBE Run be prepared as a limited source-authority pilot, or should it remain structure-only while
external dogfooding continues elsewhere?
```

Until that decision is explicit, Todo App remains Graph-source-backed `structure-only` Evidence only.

## Non-Actions In This Package

This package does not:

- change Todo App artifacts;
- change registry entries;
- add a pilot marker;
- add runtime fixtures;
- edit `.github/workflows`;
- change CLI, validators, schemas, or state;
- enable required checks;
- retire or delete tree-native artifacts;
- approve source authority beyond `structure-only`.
