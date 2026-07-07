# Documentation Diet Inventory

## Purpose

This inventory is a first-pass classification for reducing PBE documentation volume without changing runtime behavior.

It is based on file lists, document titles, first headings, and light reference checks only. It does not move, delete,
rename, merge, or rewrite existing documents.

## Summary

PBE currently has three different documentation layers:

- Core human docs in `README.md` and `docs/`
- Short agent execution cards in `agent-context/`
- Example and skill documents that may affect tests, plugin behavior, or user-facing guidance

The main diet opportunity is to consolidate many policy and workflow fragments into a smaller set of long-lived human
references while keeping `agent-context/` as the short agent-readable entry point.

## Proposed Target Structure

Target structure for a later consolidation pass:

```text
README.md
docs/
  index.md
  overview.md
  workflow.md
  policies.md
  cli-reference.md
  install.md
  troubleshooting.md
  known-limits.md
  archive/
agent-context/
  README.md
  start.md
  lite.md
  rpd.md
  wpd.md
  vd.md
  evidence.md
  review.md
  revision.md
  product-patch.md
  parallel.md
```

This task does not create that structure. It only records the proposed direction.

## Keep as Core Docs

Keep these as frequently used human-facing entry points or stable references:

- `README.md`
- `docs/index.md`
- `docs/install.md`
- `docs/cli-reference.md`
- `docs/troubleshooting.md`
- `docs/known-limits.md`
- `docs/core-concepts.md`
- `docs/tree-model.md`
- `docs/state-machine.md`
- `docs/workflow.md`
- `docs/usage.md`
- `docs/cli-output.md`
- `docs/file-format.md`
- `docs/validator-design.md`
- `docs/pbe-philosophy.md`

Potential later simplification:

- `docs/usage.md` may be folded into `docs/cli-reference.md` if it is mostly command usage.
- `docs/pbe-philosophy.md`, `docs/core-concepts.md`, and parts of `docs/tree-model.md` may become `docs/overview.md`.
- `docs/validator-design.md` should stay separate until CLI validator references stabilize further.

## Keep as Agent Context

Keep these as short execution cards. They are the intended read-first layer for Codex/PBE agents:

- `agent-context/README.md`
- `agent-context/start.md`
- `agent-context/lite.md`
- `agent-context/rpd.md`
- `agent-context/wpd.md`
- `agent-context/vd.md`
- `agent-context/evidence.md`
- `agent-context/review.md`
- `agent-context/revision.md`
- `agent-context/product-patch.md`
- `agent-context/parallel.md`

These files should stay short. If a card grows into policy detail, move the detail into `docs/` and keep only routing
and execution rules in the card.

## Consolidation Candidates

High-priority policy consolidation candidates for a future `docs/policies.md`:

- `docs/lite-mode-policy.md`
- `docs/workload-cap-and-artifact-minimalism.md`
- `docs/complexity-governance.md`
- `docs/parallel-safety.md`
- `docs/migration-policy.md`
- `docs/review-failure-recovery.md`
- `docs/evidence-quality-rubric.md`
- `docs/vd-quality-rubric.md`
- `docs/ambiguity-taxonomy.md`

Workflow consolidation candidates for a future `docs/workflow.md` expansion or split:

- `docs/acep.md`
- `docs/autoflow.md`
- `docs/autonomous-codex-execution-pack.md`
- `docs/change-impact-reopen.md`
- `docs/change-impact-revision.md`
- `docs/coverage-auditor.md`
- `docs/cycle-slices.md`
- `docs/decision-queue.md`
- `docs/execution-contracts.md`
- `docs/execution-planner.md`
- `docs/execution-profiles.md`
- `docs/human-gates.md`
- `docs/result-review.md`
- `docs/revision-flow.md`
- `docs/revision-pack.md`
- `docs/revision-rpd.md`
- `docs/rpd-interview-mode.md`
- `docs/rpd-tree-walk.md`
- `docs/ui-ux-confirmation-gate.md`
- `docs/user-acceptance.md`
- `docs/work-process-designer.md`

Traceability and artifact consolidation candidates:

- `docs/ambiguity-gate.md`
- `docs/ears-acceptance-criteria.md`
- `docs/evidence-and-coverage.md`
- `docs/file-change-guard.md`
- `docs/foundation-contract.md`
- `docs/golden-scenarios.md`
- `docs/migration-guide-v1-to-v2.md`
- `docs/node-state-model.md`
- `docs/parallel-conflict-recovery.md`
- `docs/parallel-execution.md`
- `docs/parallel-safety-contract.md`
- `docs/parity-completeness-profile.md`
- `docs/pbe-invariants.md`
- `docs/pbe-routing.md`
- `docs/product-patch-proposals.md`
- `docs/project-blueprint-engine-plugin.md`
- `docs/source-of-truth-matrix.md`
- `docs/traceability.md`
- `docs/traceability-rules.md`
- `docs/tree-control-system.md`
- `docs/ui-ux-spec.md`
- `docs/ux-auditor.md`
- `docs/verification-designer.md`
- `docs/visual-design-contract.md`

These are candidates, not deletion targets. A later pass should merge content only after checking inbound links, CLI
references, skill references, and example references.

## Archive Candidates

Archive candidates are historical records or release/readiness snapshots. They may be useful, but they should not remain
in the main reading path forever.

Docs archive candidates:

- `docs/beta-readiness.md`
- `docs/v0.5.0-beta-readiness-snapshot.md`
- `docs/direction-correction-report.md`
- `docs/dogfooding-existing-project.md`
- `docs/examples.md`, if `examples/README.md` becomes the single examples index

Example archive candidates:

- `examples/internal-legacy/adoption/todo-search-slice/README.md`
- `examples/internal-legacy/adoption/todo-search-slice/rpd-interview-summary.md`
- `examples/internal-legacy/adoption/todo-search-slice/*.json`
- `examples/internal-legacy/dogfooding/windows-validation-sequential-run/README.md`
- `examples/internal-legacy/dogfooding/windows-validation-sequential-run/rpd-interview-summary.md`
- `examples/internal-legacy/dogfooding/windows-validation-sequential-run/*.json`

Archive themes to preserve as candidates:

- Dogfooding records
- Beta readiness notes
- Readiness snapshots
- Validation run records
- Existing project adoption examples
- Historical reports

Do not move `examples/` in this task. Some example paths are linked from docs and may be used by tests, references, or
future regression work.

## Leave Unchanged for Now

Leave these areas untouched until a dedicated compatibility pass is planned:

- `examples/valid/todo-app-devview-run/`
- `examples/invalid/`
- `examples/README.md`
- `skills/*/SKILL.md`
- `agent-context/*`

Reasons:

- `examples/valid` and `examples/invalid` are tied to example regression expectations.
- `skills/*/SKILL.md` files are plugin behavior surfaces, not ordinary reference docs.
- `agent-context/*` paths are used by context recommendation and context pack workflows.
- Changing these paths can break CLI output, tests, plugin routing, or user documentation links.

## Risk Notes

- Link break risk is high because `docs/index.md`, `README.md`, `docs/cli-reference.md`, skills, and examples cross-link
  across the repository.
- Skill docs are executable guidance. Consolidating them as ordinary docs would blur plugin behavior.
- Example paths are user-facing and may be referenced in `test:examples`, docs, or future CI checks.
- Policy docs overlap heavily, but merging them too early can hide important stop conditions.
- Archive movement should happen only after a link audit and an example regression run.

## Recommended Next Steps

1. Add a link map before moving anything.
2. Create draft `docs/overview.md`, `docs/policies.md`, and a trimmed `docs/workflow.md` in a separate review branch.
3. Move only one document family at a time.
4. Keep `agent-context/` stable and short.
5. Keep `examples/valid` and `examples/invalid` untouched unless `test:examples` is updated in the same change.
6. Move dogfooding, readiness, and adoption records to `docs/archive/` only after checking all inbound links.
7. Run the full validation suite after every consolidation stage.
