# Graph-First Cleanup Audit and Compatibility Boundary

Status: cleanup-audit / graph-first / non-destructive

## Purpose

This package records how PBE should clean up older tree-based workflow residue while preserving the graph-source
direction that is now active in the repository.

It does not delete artifacts, remove commands, retire tree-native files, change validators, change schemas, enable CI
enforcement, or promote repo-wide Graph-source authority.

## Current Direction

PBE is moving from tree-native control artifacts as the primary source toward Graph-source-backed read-model projection
and evidence.

Current graph-source status:

- Todo Search selected slice is limited Graph-source promoted.
- Todo App DevView Run is graph-source-backed for `structure-only`.
- `examples/internal-legacy/read-model-aggregate/read-model-slices.json` is the positive read-model registry.
- `graph read-model validate --all`, `graph read-model report-health`, and `test:read-model:e2e` provide local and CI
  observation Evidence.
- CI/read-model Evidence remains non-enforcing.
- Required checks, branch protection, repo-wide source-authority expansion, and tree-native retirement are not enabled.

## Keep As Graph-First Core

Keep these as current graph-first surfaces:

- `graph-source.json` fixtures for configured slices.
- `examples/internal-legacy/read-model-aggregate/read-model-slices.json`.
- Graph read-model projection commands.
- Graph read-model validation and health report commands.
- EdgeIntent projection and report surfaces.
- Generated read-model Evidence for configured positive slices.
- External dogfooding readiness and graph-source transition concept packages.

These are the current forward path and should not be removed during cleanup.

## Keep As Compatibility / Fallback / Reference

Keep these until an explicit retirement decision exists:

- `.pbe/tree/*` Product/Project/Work/Test tree artifacts.
- `.pbe/control/*` Change/Impact/Acceptance/Product Patch/control artifacts.
- `.pbe/evidence/*` Evidence Tree artifacts.
- `.pbe/blueprint/*` compatibility views.
- `RPD`, `WPD`, `VD`, `ACEP`, and `Revision` terminology in skills and CLI docs.
- `pbe-state.json` and `autoflow` state metadata.
- `full`, `lite`, and `bypass` profile metadata values.
- ACEP/task-card views where existing examples, skills, or validators still depend on them.

These surfaces should be described as compatibility/fallback/reference layers when graph-source is the primary topic.
They should not be presented as the long-term source-authority direction unless a later decision reverses course.

## Cleanup Candidates

These are candidates for future cleanup or repositioning, not immediate deletion:

- Public "Lite Mode" framing as a separate mode.
- `pbe profile recommend` wording that sounds like user-facing mode selection.
- `agent-context/lite.md` naming once compatibility allows a rename.
- `Lite Mode Policy` title and links where they imply a separate product workflow.
- Tree-stage-first onboarding that makes RPD/WPD/VD/ACEP look more primary than graph-source/read-model mechanics.
- ACEP task-card language that looks like the future execution source rather than a compatibility view.
- Broad `.pbe` init footprint for small external dogfooding slices.
- External-project validation assumptions tied to this PBE plugin repository README layout.

## Current Cleanup Step

The current cleanup should be non-destructive:

1. Reframe `lite/full/bypass` as compatibility workflow-depth metadata.
2. Keep existing CLI fields and accepted values for compatibility.
3. Update docs, skills, context cards, and status/profile wording so users see one PBE workflow with adjustable depth.
4. Keep graph-source/read-model docs as the primary future direction.
5. Do not remove tree-native artifacts, commands, validators, schemas, or examples in this step.

## Do Not Remove Yet

Do not remove these until separate approval and evidence exist:

- Product/Project/Work/Test tree artifacts.
- Change/Impact/Evidence/Acceptance/Product Patch artifacts.
- `pbe init`, `pbe status`, `pbe validate`, and stage transition commands.
- `RPD`, `WPD`, `VD`, `ACEP`, and Revision compatibility skills.
- `pbe-state.json` and `autoflow`.
- positive read-model registry fixtures.
- Todo Search fallback/reference tree-native artifacts.
- Todo App structure-only tree-native artifacts.
- non-enforcing CI/read-model observation workflow.

Removing any of these too early would break compatibility, examples, validators, rollback evidence, or current
dogfooding records.

## Required Future Decision Points

Cleanup should proceed only through explicit decision points:

1. Rename or retire public profile wording after compatibility review.
2. Decide whether `pbe profile recommend` remains, is renamed, or becomes graph-depth recommendation.
3. Decide whether `agent-context/lite.md` can be renamed without breaking context pack compatibility.
4. Decide whether external dogfooding needs a graph-first init/adoption path before tree-native artifacts are reduced.
5. Decide whether Todo App can move beyond `structure-only`.
6. Decide whether tree-native selected-slice fallback artifacts can be retired.
7. Decide whether Candidate B becomes a required check.

## Boundary

This audit does not approve:

- tree-native retirement;
- graph-source authority expansion;
- invalid fixture CI enrollment;
- required-check configuration;
- branch protection changes;
- schema or validator policy changes;
- external dogfooding source mutation;
- replacement of user acceptance.
