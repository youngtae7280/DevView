# Migration / Compatibility Policy

## Purpose

This policy defines how PBE should evolve after v0.5 beta without breaking projects that already have `.pbe` artifacts.
Compatibility first, migration later.

PBE should not require existing projects to regenerate all artifacts just because PBE gained a new optional tree,
template, validator, or workflow guide. Additive changes should not break existing runs.

## Compatibility Principles

- Existing PBE projects should continue to validate when new optional artifacts are added.
- New artifacts should be additive whenever possible.
- Missing optional artifacts should pass validation.
- If an artifact exists, it must satisfy its schema/validator.
- Required artifact changes need a migration note.
- Breaking changes should not be introduced silently.
- Existing user acceptance records must not be rewritten by tooling.
- Product Tree meaning must not be changed silently during migration.

## Artifact Compatibility

These core artifacts are compatibility-sensitive:

- Product Tree: describes what should be built. Changing its shape can change product meaning. Avoid silent mutation.
- Work Tree: describes implementation scope. Shape changes can make old scope decisions ambiguous.
- Test Tree: describes verification design. Shape changes can disconnect tests from Acceptance Criteria.
- Evidence Tree: records proof. Evidence may become stale or invalidated, but migration should not silently delete it.
- Acceptance Tree: records user-only acceptance. Preserve accepted-by-user history and do not rewrite it.
- Change Tree: records user feedback and change intent. Preserve links to the source of requested change.
- Impact Tree: records downstream effects. Shape changes can make revision safety unclear.
- Product Patch Tree: records Product Tree before/after proposals. If missing in older projects, validation should pass.
  If present, it must validate.
- `pbe-state`: records workflow state and transition history. Do not silently rewrite state to fit a new flow.

## Optional Artifact Policy

For a new optional artifact:

- missing file: pass
- present file: schema + validator must pass
- `pbe init` may create it for new projects
- existing projects should not be forced to create it immediately
- docs should explain when the artifact becomes relevant

Example:

Product Patch Tree is optional for existing projects. It is required only when Product Tree meaning changes through a
patch proposal flow.

## Required Artifact Changes

Required artifact changes need:

- migration note
- old/new shape example
- backward compatibility behavior
- validator behavior
- manual recovery steps
- deprecation period if possible

If the change affects user-facing workflow, docs should explain whether old artifacts still validate, whether warnings
are expected, and which command or manual action restores the preferred shape.

## Schema / Template Changes

Schema changes should prefer additive fields. New required fields should be avoided unless existing fixtures and
migration docs are updated.

Templates may gain new recommended fields before schemas require them.

Templates can lead schemas. Schemas should only require fields after the workflow has stabilized through dogfooding.

## Validator Policy Changes

New validator checks should follow the governance ladder:

```text
docs/skill warning
-> template checklist
-> validator warning
-> validator error
-> state transition blocker
```

Natural-language quality checks should not become hard validator failures until they are deterministic and low
false-positive.

Validator changes should explain:

- what issue is now detected
- whether existing projects may be affected
- whether the issue is warning-level or error-level
- suggested fix / next command when available
- whether a migration note is needed

## pbe init Compatibility

`pbe init` should not overwrite existing artifacts without explicit user intent.

`pbe init` may create missing optional artifacts for a new project. For existing projects, missing optional artifacts
should not automatically imply invalid state.

When `pbe init` discovers existing `.pbe` artifacts, it should preserve user decisions, acceptance records, evidence,
state history, and Product Tree meaning unless the user explicitly chooses a migration or reset path.

## Existing Project Adoption Compatibility

Existing project adoption should start from the next bounded slice, not a full reverse-engineering migration.

Older projects should be able to adopt new PBE guidance by adding the minimum artifacts needed for the next slice. They
should not be blocked because unrelated optional artifacts are absent.

## Deprecation Policy

When removing or replacing legacy/compatibility behavior:

- Mark as compatibility/deprecated first.
- Add replacement guidance.
- Search references across README, docs, skills, templates, examples, and tests.
- Keep at least one beta cycle of deprecation before removal when user-facing.
- Do not remove compatibility paths that examples or validators still depend on.

Deprecation should make the primary path clearer without abruptly breaking old projects.

## Migration Notes

A migration note should include:

- What changed
- Who is affected
- Old shape
- New shape
- Required manual action
- Validation command
- Rollback or recovery note

Migration notes should be short, concrete, and tied to the smallest affected artifact or workflow.

## Future Command Candidates

These are candidates only. Do not implement them until dogfooding shows repeated, deterministic migration needs.

- `pbe doctor`: detects outdated/missing/inconsistent artifacts and suggests recovery.
- `pbe migrate`: applies deterministic artifact migrations with explicit user intent.
- `pbe migrate check`: reports what would change without writing files.
- `pbe artifact version`: shows artifact/schema version information.

## Compatibility Checklist

- [ ] Is this change additive?
- [ ] Does an existing project without the new artifact still validate?
- [ ] If the artifact exists, is schema/validator behavior clear?
- [ ] Does `pbe init` avoid overwriting existing artifacts?
- [ ] Are README/docs/CLI reference links updated?
- [ ] Are examples/valid and examples/invalid unaffected?
- [ ] Does the change require migration notes?
- [ ] Are user acceptance records preserved?
- [ ] Is Product Tree meaning preserved unless Product Patch flow is used?
- [ ] Is any legacy path marked compatibility/deprecated before removal?
