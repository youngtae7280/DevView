# Adoption-Safe Validation Path Design

Status: design package / adoption-safe validation / implemented narrow boundary

## Purpose

This package designs how PBE validation should distinguish the PBE plugin repository from external initialized projects.

The first implementation is intentionally narrow: it classifies validation targets and keeps repository-only validators
out of external initialized project validation. It does not change schemas, templates, state transitions, CI behavior,
branch protection, examples, source authority, or tree-native artifact retirement.

The goal is to make future external dogfooding safe by avoiding plugin-repository assumptions when `pbe validate` is run
inside an unrelated project that has been initialized with `.pbe/`.

## Implemented Boundary

`pbe validate` now distinguishes three observable targets:

- PBE plugin repository root: strict repository self-validation remains active.
- Initialized project root with `.pbe/`: project artifact validation runs without requiring PBE plugin README layout,
  skill inventory, templates/schemas inventory, examples fixtures, or full ACEP package inventory.
- Uninitialized non-plugin root: validation reports that PBE is not initialized.

The boundary is automatic; no `--target` option was added. Missing optional project artifacts still pass unless current
state requires them. Present optional artifacts, such as an ACEP execution manifest, still validate and can fail.

## First External Dogfooding Blocker

The first external dogfooding run used `mdn/todo-vue` for a small bounded external slice. The source change and targeted
project checks were viable, and `pbe init --profile lite` created `.pbe/` successfully.

The blocker appeared when running:

```powershell
node C:\Users\...\PBE\dist\cli\index.js validate --json
```

from the external clone.

The command failed because current validation still mixes PBE plugin repository validation with initialized-project
validation:

- README layout validation expected the external project README to document PBE plugin repository paths such as
  `.pbe/tree/`, `.pbe/execution/`, `.pbe/control/`, `.pbe/evidence/`, `.pbe/blueprint/`, `RPD`, `WPD`, `VD`, and `ACEP`.
- Compatibility core expected a full `.pbe/codex-execution-pack/` ACEP package.
- v2 visual profile template references pointed at template node ids not present in the initialized external project
  trees.

The result: `pbe validate` was too repository-shaped for external adoption.

## Validation Surface Types

Future validation should distinguish these surfaces.

| Surface                               | Purpose                                                             | Example command today                            | Future boundary                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| PBE plugin repository self-validation | Validate this plugin repo, its docs, skills, templates, schemas.    | `npm.cmd run validate:pbe`                       | May keep strict repo README/docs/plugin/skills checks.                                           |
| Initialized PBE project validation    | Validate `.pbe` artifacts inside a project that already uses PBE.   | `pbe validate --root <project>`                  | Should validate project artifacts without requiring plugin repo README or full example fixtures. |
| External project adoption validation  | Validate a newly initialized external project and bounded slice.    | future mode or target design                     | Should be minimal, optional-artifact aware, and adoption-safe.                                   |
| Graph-read-model registry validation  | Validate configured Graph-source/read-model positive slices.        | `graph read-model validate --all --json`         | Remains registry-scoped; does not become generic external validation by accident.                |
| Examples / fixture validation         | Validate committed valid/invalid fixtures and expected regressions. | `npm.cmd run test:examples` and repo test suites | Should stay repo-owned; should not run against arbitrary external project examples by default.   |
| Optional artifact validation          | Validate artifacts when present, such as Product Patch or ACEP.     | partially present through current validators     | Missing optional artifacts should pass; present artifacts must validate against their contracts. |

## Proposed Command Behavior

This section is a design proposal only.

### Keep `npm run validate:pbe` As Repository Self-Validation

`npm.cmd run validate:pbe` should continue to mean:

- validate this PBE plugin repository;
- validate plugin structure;
- validate public skills;
- validate skills CLI synchronization;
- validate templates and schemas;
- validate examples and compatibility core expectations owned by this repo;
- validate current repo docs and fixture assumptions.

It may remain strict because it is run in the plugin repository itself.

### Make External `pbe validate` Adoption-Safe

When `pbe validate` runs from an external initialized project, it should not require:

- PBE plugin repository README layout;
- PBE plugin docs structure;
- public skill inventory;
- example fixture inventory;
- full `.pbe/codex-execution-pack/` ACEP package unless that package exists or the active state requires it;
- visual/template node ids that were only placeholders in templates and not materialized in project artifacts.

External validation should instead:

- parse `.pbe` artifacts that exist;
- validate required artifacts for the current project state;
- treat new optional artifacts as `missing: pass`, `present: validate`;
- provide issue codes, `suggestedFix`, and `nextCommand`;
- preserve user-only acceptance;
- avoid implying source-authority expansion or tree-native retirement.

### Optional Artifact Policy

Adoption-safe validation should follow this rule:

```text
missing optional artifact -> pass with optional guidance when relevant
present optional artifact -> schema + semantic validator must pass
required-by-current-state artifact missing -> fail with suggestedFix and nextCommand
```

Examples:

- Missing Product Patch Tree should pass unless a product patch flow is active.
- Missing ACEP execution pack should pass before ACEP is selected or ready.
- Present ACEP manifest should validate.
- Missing visual evidence should fail only when selected visual work or review/accept closure requires it.

### Issue Output

Future issues should be clear enough for Codex and users to recover:

| Situation                                  | Suggested future code                       | Suggested next command               |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------ |
| Repo-only validator ran against external   | `VALIDATION_TARGET_MISMATCH`                | `pbe validate --target project`      |
| Optional artifact missing                  | no error, optional note only                | `pbe status`                         |
| Required current-state artifact missing    | `PROJECT_REQUIRED_ARTIFACT_MISSING`         | relevant transition/check command    |
| Present optional artifact invalid          | artifact-specific existing or new code      | repair artifact, then `pbe validate` |
| External README lacks PBE plugin sections  | no error in project/external target         | none                                 |
| User acceptance missing for accepted state | existing user-acceptance guard remains hard | `pbe review submit` or `pbe accept`  |

## Validator Classification

Future implementation should classify validators before changing behavior.

| Validator class               | Examples today                                                                 | Target scope                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Repo-only validators          | Plugin structure, Skills, Skills CLI sync, Templates, Schemas, Examples        | PBE plugin repository self-validation only.                                                     |
| Repo compatibility validators | Compatibility core required-path inventory and repository docs expectations    | PBE plugin repository, plus carefully scoped compatibility checks when a target opts into them. |
| Project artifact validators   | PBE layout, Autoflow state, RPD transition, WorkGraph, ACEP manifest, Revision | Initialized `.pbe` project validation, state-aware and optional-artifact aware.                 |
| Optional artifact validators  | Product Patch, visual profile, ACEP package, revision package                  | Missing passes unless current state or artifact presence makes validation required.             |
| Graph-read-model validators   | read-model registry, projection contracts, validate-all, report-health, E2E    | Configured registry slices only; not generic external project validation by default.            |
| Examples / negative fixtures  | valid examples, invalid fixtures, focused read-model invalid fixtures          | Repo-owned tests and fixture validation only.                                                   |

This separation keeps failure semantics clear. Validators should not be merged merely because they inspect nearby files.

## Detection Inputs

Future validation target detection should use explicit and observable inputs.

Possible inputs:

- `--root <path>`: the target project root.
- presence of `.pbe/`: initialized PBE project signal.
- package/root identity: whether the target root is the PBE plugin repository.
- plugin repository files: `.codex-plugin/plugin.json`, `skills/`, `templates/`, `schemas/`, `scripts/validate-devview-files.js`.
- external project signals: package/app files without plugin repo files.
- current `.pbe/blueprint/pbe-state.json` state, when present.
- explicit future target option such as `--target repo|project|external`.

Do not implement `--target` in this design step. If added later, it should be explicit and should not silently downgrade
validation safety.

## Future Test Plan

Future implementation should add tests before changing validator behavior.

Minimum test cases:

1. PBE plugin repository self-validation still runs repo-only validators and passes.
2. External initialized project with `.pbe/` passes validation when optional ACEP pack is missing and current state does
   not require ACEP.
3. External initialized project README is not required to document PBE plugin repository layout.
4. Present but invalid optional artifact fails with a clear artifact-specific issue.
5. Accepted state without user acceptance still fails.
6. Review/accept closure still runs File Change Guard.
7. Product Patch tree remains optional: missing passes, present validates.
8. Visual/template placeholder references do not fail unless materialized and required by selected visual work.
9. Graph-read-model `validate --all` remains registry-scoped and does not scan arbitrary external projects.
10. `npm.cmd run validate:pbe` continues to fail if repo-owned skills/templates/schemas/examples are broken.
11. Invalid fixtures remain outside positive registry and external validation.
12. `suggestedFix` and `nextCommand` appear on blocking project issues.

## Compatibility And Migration Risks

Implementation must avoid these risks:

- weakening repository self-validation;
- allowing initialized projects to bypass user-only acceptance;
- treating missing required current-state artifacts as optional;
- hiding stale Evidence or File Change Guard failures;
- letting repo-only validators disappear from `npm run validate:pbe`;
- making graph-read-model registry validation scan external projects without explicit registry enrollment;
- allowing external validation to imply source-authority expansion or tree-native retirement;
- breaking existing examples/valid and examples/invalid semantics.

## Non-Goals

This package does not:

- change `pbe validate`;
- add `--target`;
- change validators;
- change schemas or templates;
- change state machine behavior;
- change CI or required checks;
- enable branch protection or merge blocking;
- modify examples or external projects;
- expand source authority;
- retire tree-native artifacts;
- replace user acceptance with validation output.

## Next Implementation Branches Requiring Care

The next implementation branch should be explicit and narrow. Candidate branches:

1. Add validation target detection and reporting without changing pass/fail behavior.
2. Split repo-only validators from initialized-project validators behind an explicit target model.
3. Make project validation optional-artifact aware.
4. Add adoption-safe external validation fixtures.
5. Repair template/default visual profile references for initialized external projects.
6. Add future `--target repo|project|external` only after target detection and safety tests are reviewed.
7. Re-run external dogfooding on a bounded slice after adoption-safe validation passes locally.

Each branch should preserve graph-source boundaries, user acceptance, File Change Guard, and current repository
self-validation.
