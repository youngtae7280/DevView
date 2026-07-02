# PBE To DevView Migration Notes

DevView is the new public-facing name for the Codex plugin formerly called Project Blueprint Engine.

This first pass is a narrow identity and documentation update. PBE remains the compatibility namespace for existing
commands, artifact paths, generated files, historical records, and automation that already depends on stable names.

## What Changes In This Pass

- Public-facing README language introduces DevView.
- The Codex plugin display name and descriptions use DevView.
- The package description mentions DevView while preserving the package name.
- Agent guidance introduces DevView while preserving PBE compatibility rules.
- DevView glossary and migration notes are added.

## What Does Not Change

- CLI command names do not change.
- The `pbe` binary name does not change.
- `.pbe/` artifact paths do not change.
- `validate:pbe` and `validate:pbe:v2` scripts do not change.
- Generated artifact paths do not change.
- Contract compiler behavior does not change.
- Source-authority resolver behavior does not change.
- Semantic diff behavior does not change.
- Equivalence/readiness policy behavior does not change.
- sourceMode and provenance enum values do not change.
- Historical decision records are not globally rewritten.
- `equivalenceProven` is not set to `true`.
- Promotion review approval is not granted.

## Compatibility Rule

Use DevView for the public product/plugin identity. Use PBE where compatibility, history, CLI names, `.pbe` paths,
validation scripts, generated artifacts, or legacy tree terms require stable naming.

```text
DevView = public product/plugin name
PBE = legacy compatibility namespace
```

## Boundary Rule

DevView is not an executor. Generated compiler output is not an execution source. Validation is not user acceptance.
Review packets are not approvals. CI enforcement, required checks, branch protection, graph delta apply, user acceptance
automation, and tree-native retirement require separate explicit approval.

## Post-Rename Boundary Audit

After the DevView public identity rename, public wording should continue to preserve these audit checks:

- DevView does not execute code changes by itself.
- Generated compiler output and Instruction Packs are bounded review/control artifacts, not execution authority.
- Promotion review packets are review inputs, not approvals.
- Validation and CI observation are evidence, not user acceptance.
- CI enforcement, required checks, and branch protection are not introduced by the rename.
- Graph delta apply is not automated by the rename.
- PBE compatibility remains active for `pbe`, `.pbe`, validation scripts, generated artifact paths, historical records,
  and sourceMode/provenance values.

## Future Rename Phases

Future rename work should stay staged and reviewable:

1. Keep public docs and package metadata aligned on DevView.
2. Preserve compatibility names until a specific retirement decision exists.
3. Add aliases before removing old names.
4. Avoid global replacements across historical decision logs and generated artifacts.
5. Do not change compiler behavior as part of naming-only work.
6. Treat any CLI, script, path, sourceMode, generated artifact, or workflow rename as a separate compatibility project.

Any later phase that proposes renaming `pbe`, `.pbe`, validation scripts, generated paths, sourceMode values, or
tree-native artifacts needs its own review plan, migration path, rollback story, and explicit approval.
