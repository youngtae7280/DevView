# Graph-Source Registry / Projection Generalization Readiness

Status: readiness package / narrow registry-driven mechanics implemented / no registry expansion

## Purpose

This package records what must be true before the current Graph-source read-model registry and projection flow can be
generalized for external dogfooding.

It does not expand the registry, change CLI behavior, change schemas, change validators, promote source authority,
enable CI enforcement, enroll invalid fixtures in positive CI, or retire tree-native artifacts.

## Current Registry / Projection Shape

The current registry surface is:

```text
examples/internal-legacy/read-model-aggregate/read-model-slices.json
```

It contains exactly two positive validate-all profiles:

| Profile                               | Slice                                                 | Policy level          | Current role                                                                        |
| ------------------------------------- | ----------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `todo-search-selected-slice`          | `examples/internal-legacy/adoption/todo-search-slice` | `pilot-marker-backed` | Limited graph-source promoted selected slice with parity and pilot marker.          |
| `todo-app-devview-run-structure-only` | `examples/valid/todo-app-devview-run`                 | `structure-only`      | Confirmed Graph-source-backed structure-only fixture; not source-authority-bearing. |

The current projection contract surface is useful but still fixture-shaped. It proves repeatability for these two
configured slices; it is not yet a generic external-project registry system.

## Current Fixed Points

Generalization should start by acknowledging the current fixed points:

- `cli/src/core/read-model-evidence.ts` declares in-code profiles for Todo Search and Todo App.
- `getSliceReadModelProfile()` only accepts the two configured supported slice paths.
- `assertRegistryProfileMatchesConfig()` requires the registry profile to match the in-code profile id, source layout,
  policy level, expected counts, and the configured required/optional artifact paths used by the current profiles.
- Todo Search manual parity is now declared as registry/profile artifact metadata, not as a hidden validate-all helper
  default.
- Projection loaders include Todo Search-specific `limited-graph-source` expectations and Todo App-specific
  `structure-only-graph-source` expectations.
- `scripts/read-model-e2e-smoke.js` copies and checks Todo Search, Todo App, aggregate, and intent-critical fixture
  paths directly.
- `graph read-model report-health` summarizes the current Todo Search / Todo App transition status, not arbitrary
  registry slices.
- The workflow `.github/workflows/read-model-evidence.yml` is still shaped around the same configured examples and
  generated artifact paths.

These fixed points are acceptable for the current internal transition, but they are the audit surface before external
dogfooding.

## Implemented Narrow Mechanics

The first implementation pass keeps the two positive profiles fixed, but reduces hidden sample-specific defaults in the
validate-all path:

- registry command plans now carry required artifacts, optional artifacts, and expected counts from
  `examples/internal-legacy/read-model-aggregate/read-model-slices.json`;
- compare input paths are resolved from registry-declared artifacts, including the Todo Search manual read-model;
- projection contract inputs use registry-declared `graphSource` and `graphSourceProjection` paths;
- registry parsing rejects compare plans without `requiredArtifacts.manualReadModel`;
- registry parsing rejects projection contracts that declare `graphSourceProjection` without `graphSource`;
- validate-all still requires registry entries to match the current in-code profile boundary before execution.

This is a mechanics cleanup only. It does not add profiles, loosen positive validate-all enrollment, or promote any
additional source authority.

## What Is Already Stable Enough

The current system already has several useful contracts:

- registry entries distinguish `pilot-marker-backed` from `structure-only`;
- positive validate-all reports `aggregate-pass` only over configured profiles;
- projection contract output includes expected nodes, edges, Core Views, source authority boundary, and non-promotion
  statements;
- structure-only profiles must not require parity or scoped pilot marker artifacts;
- invalid read-model fixtures remain focused negative tests and are not enrolled in positive registry or CI;
- generated Evidence is reviewable but non-enforcing;
- Candidate B health/E2E readiness does not approve source authority, CI enforcement, or tree-native retirement.

## Generalization Readiness Conditions

Before registry/projection generalization is implemented, the next branch should define:

1. Stable registry fields for external slices, including profile id, source slice, source layout, policy level,
   expected counts, required commands, required artifacts, optional artifacts, retained warnings, fallback references,
   and boundary statements.
2. A projection contract policy that says which fields are deterministic requirements and which fields are review
   metadata.
3. Expected count policy: when counts are fixed, when they can change, and what review record is required for count
   changes.
4. Profile naming rules that do not bake Todo Search or Todo App semantics into future external profile ids.
5. Source role taxonomy that distinguishes source-backed, pilot-marker-backed, structure-only, parity-backed, and
   candidate-only states.
6. Generated Evidence update policy: which commands may rewrite generated artifacts, when those changes are intentional,
   and how to keep docs-only work from committing generated churn.
7. A hardcoding audit that lists fixture-specific code paths before removing them.
8. A negative fixture boundary that keeps invalid examples outside positive validate-all and CI.
9. A migration path from in-code profile definitions toward reviewed registry-driven configuration, if that direction is
   approved.
10. A health/reporting plan that can summarize more than the current Todo Search / Todo App pair without implying
    enforcement or promotion.

## Projection Contract Questions

Generalization must answer these questions before implementation:

- Are projection contracts allowed to vary by policy level, or should one normalized contract shape cover all profiles?
- Are Core View count expectations universal or profile-specific?
- Does every external slice need a graph-source artifact, or can canonical `.devview` artifacts remain the initial source?
- Does every source-backed profile need parity, a pilot marker, both, or a policy-specific replacement?
- How should structure-only slices become stronger without silently becoming source-authority-bearing?
- How should retained warnings be carried forward when an external slice is promoted, deferred, or rejected?

## Generated Evidence Policy

Current validation commands can intentionally update generated read-model Evidence. For external dogfooding, the policy
should be explicit:

- docs-only readiness work should not commit generated Evidence churn;
- validate-all or E2E generated changes should be reviewed separately when they are intended;
- generated Evidence should record command identity, source commit, source slice, policy level, and source authority
  boundary;
- generated output must not replace user acceptance or Product acceptance;
- generated output must not imply tree-native retirement unless a separate retirement package is approved.

## Non-Actions In This Package

This package does not:

- add external registry entries;
- remove in-code Todo Search / Todo App profiles;
- change projection loader semantics;
- change E2E smoke behavior;
- change CI workflow behavior;
- add required checks or branch protection;
- promote Todo App beyond `structure-only`;
- retire or delete tree-native artifacts;
- enroll invalid fixtures in positive CI.

## Relationship To Candidate B And Todo App Package

Candidate B (`report-health` plus `test:read-model:e2e`) can be used as readiness Evidence, but it does not approve
registry generalization.

The Todo App structure-only next-step package can clarify whether Todo App should become a stronger pilot, but it does
not approve generic registry expansion.

Both packages are inputs. Neither package is implementation approval.

## Next User Decision

The next decision is:

```text
Should PBE start a registry/projection generalization implementation branch for external dogfooding, or keep the current
two-profile registry fixed while dogfooding continues?
```

Until that decision is explicit, the registry should stay fixed to the current Todo Search and Todo App configured
profiles.
