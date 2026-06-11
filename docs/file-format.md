# File Format

PBE stores all target-repo state under `.pbe/`.

`pbe-state.json` includes an `autoflow` object that tracks current engine state,
completed steps, the active human gate, the next automatic step, and the last
failure.

## Tree-Control Folders

The v2 tree-control layout is additive. Existing `.pbe/blueprint/*` files remain
compatibility aliases or human-readable views while tree-native artifacts are
introduced.

```text
.pbe/
  tree/
    product-tree.json
    project-tree.json
    work-tree.json
    test-tree.json

  execution/
    cycle-tree.json
    cycle-contract.md
    node-execution-contracts/

  control/
    decision-queue.json
    change-tree.json
    impact-tree.json
    acceptance-tree.json

  evidence/
    evidence-tree.json
    screenshots/
    test-results/
    logs/
```

## Blueprint Folder

```text
.pbe/
  blueprint/
    pbe-state.json
    project-brief.md
    pbe-routing-contract.md
    source-of-truth-matrix.md
    pbe-invariants.md
    foundation-contract.md
    parallel-safety-contract.md
    requirement-tree.json
    requirement-tree.md
    rpd-interview-log.md
    rpd-summary.md
    ui-ux-preview.json
    ui-ux-preview.md
    ui-ux-confirmation.md
    ui-ux-confirmation-log.md
    work-design.json
    work-graph.json
    work-roadmap.md
    verification-design.json
    verification-plan.md
    dependency-impact-audit.json
    dependency-impact-audit.md
    traceability-matrix.json
    traceability-matrix.md
    execution-strategy.json
    execution-strategy.md
    coverage-audit.md
    ux-audit.md
```

## ACEP Folder

```text
.pbe/
  codex-execution-pack/
    00-readme.md
    01-autonomous-execution-policy.md
    02-project-blueprint.md
    03-requirement-tree.md
    04-traceability-matrix.md
    04-traceability-matrix.json
    05-ui-ux-spec.md
    05-ui-ux-spec.json
    06-ui-ux-preview.md
    07-ui-ux-confirmation.md
    08-work-roadmap.md
    09-verification-plan.md
    10-codex-operating-loop.md
    11-task-cards/
      task-001.md
      task-002.md
    12-validation-commands.md
    13-completion-criteria.md
    14-failure-recovery.md
    15-ui-ux-evidence-checklist.md
    16-final-coverage-check.md
    17-final-report-template.md
    18-execution-strategy.md
    19-source-of-truth-matrix.md
    20-foundation-contract.md
    21-parallel-safety-contract.md
    execution-manifest.json
```

## Review Folder

```text
.pbe/
  review/
    codex-final-report.md
    result-summary.md
    changed-files.md
    validation-results.md
    coverage-result.md
    ui-ux-evidence.md
    user-review-checklist.md
    user-feedback.md
    feedback-items.json
```

## Revision Folder

```text
.pbe/
  revisions/
    rev-001/
      00-revision-summary.md
      01-user-feedback.md
      02-affected-nodes.md
      03-revision-requirements.md
      04-revision-work-plan.md
      05-revision-verification-plan.md
      06-revision-task-cards/
      07-regression-checks.md
      08-review-checklist.md
      revision-result.md
      revision-manifest.json
```

## Schemas

Plugin-local schemas live in `schemas/`:

- `pbe-state.schema.json`
- `autoflow-state.schema.json`
- `source-of-truth-matrix.schema.json`
- `pbe-invariants.schema.json`
- `foundation-contract.schema.json`
- `parallel-safety-contract.schema.json`
- `product-tree.schema.json`
- `project-tree.schema.json`
- `work-tree.schema.json`
- `test-tree.schema.json`
- `cycle-tree.schema.json`
- `decision-queue.schema.json`
- `change-tree.schema.json`
- `impact-tree.schema.json`
- `evidence-tree.schema.json`
- `acceptance-tree.schema.json`
- `requirement-tree.schema.json`
- `ui-ux-preview.schema.json`
- `ui-ux-confirmation.schema.json`
- `work-design.schema.json`
- `work-graph.schema.json`
- `verification-design.schema.json`
- `dependency-impact-audit.schema.json`
- `traceability-matrix.schema.json`
- `ui-ux-spec.schema.json`
- `execution-manifest.schema.json`
- `execution-strategy.schema.json`
- `feedback-items.schema.json`
- `revision-manifest.schema.json`
- `final-coverage-check.schema.json`

The schemas document the contract and are compiled by `npm run validate:pbe`.
The validator also performs cross-artifact checks for routing, traceability,
parallel safety, dependency impact, UI impact, and revision file boundaries.
