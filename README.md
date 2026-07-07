# DevView

DevView compiles Maintainability Graph context into View Trees, Context Packs, AI instructions, evidence, and guarded
graph updates.

DevView is a local Codex workflow and deterministic CLI surface for making AI-assisted maintenance reviewable. It keeps
product intent, code, tests, evidence, decisions, and graph updates connected before an agent changes the project.

## Core Flow

```text
Maintainability Graph
-> View Tree
-> Context Pack
-> AI Work Plan
-> Runtime Evidence
-> Graph Delta
-> Guarded Graph Update
```

## Current Safe MVP Status

- DevView can generate deterministic request-intake, View Tree, Context Pack, and Instruction Pack previews.
- Advisory preflight, UserPromptSubmit, Stop/Post Run, changed-file, scope, Graph Delta, human review, human decision,
  evidence, baseline, and handoff reports are available.
- Guarded Graph Delta apply exists only for explicit concrete operations with backup and validation. The tracked Todo
  calibration remains blocked because it has no concrete mutation operations.
- Accepted Evidence can be recorded only through a hardened human evidence decision, but runtime Evidence satisfaction
  remains a separate future lifecycle.
- Equivalence proof and Scope/CI enforcement readiness are connected but blocked and non-enforcing.
- Hook Gateway artifacts are preview-only. DevView does not install hooks, activate blocking, execute Codex, mutate
  production source, enforce scope, configure CI, or automate approval.

## Quick Start

Install dependencies and build the CLI:

```bash
npm install
npm run build:cli
```

Run the DevView validator:

```bash
npm run validate:devview
```

Run the deterministic runtime smoke:

```bash
npm run devview:runtime:smoke
```

Inspect DevView commands:

```bash
devview --help
```

Generate the current safe MVP baseline:

```bash
devview graph read-model report-devview-baseline \
  --roadmap-audit <roadmap-completion-audit.json> \
  --final-handoff <roadmap-final-handoff.json> \
  --frontend-chain <frontend-chain.json> \
  --hook-activation-chain <hook-activation-chain.json> \
  --approved-apply-dry-run <approved-apply-dry-run.json> \
  --apply-report <graph-delta-apply-report.json> \
  --evidence-decision <evidence-decision-record.json> \
  --accepted-evidence <accepted-evidence-record.json> \
  --runtime-evidence-satisfaction-readiness <runtime-satisfaction-readiness.json> \
  --equivalence-proof-readiness <equivalence-readiness.json> \
  --scope-ci-enforcement-readiness <scope-ci-readiness.json> \
  --output .tmp/devview-baseline.json \
  --markdown .tmp/devview-baseline.md \
  --json
```

Audit remaining legacy terminology without changing files:

```bash
devview report-legacy-artifacts --json
```

## Concepts

### Maintainability Graph

The Maintainability Graph is the canonical source model for DevView. It links product intent, implementation scope,
tests, evidence, decisions, risk, and graph updates.

### View Tree

A View Tree is a task-specific tree-shaped projection derived from the Maintainability Graph. It is not legacy
tree-native storage and it does not become source authority by itself.

### Context Pack

A Context Pack is a bounded subgraph package around the View Tree. It gives Codex the relevant goal, scope, constraints,
risks, evidence requirements, and non-goals without granting hidden permission to edit outside the selected context.

### AI Work Plan

An AI Work Plan turns the Context Pack into execution-ready instructions. DevView keeps this as an instruction surface,
not as approval, user acceptance, or graph mutation authority.

### Evidence

Runtime Evidence, Evidence decisions, accepted Evidence, runtime satisfaction, and equivalence proof are separate
lifecycle states. DevView never treats a test pass, apply report, or accepted Evidence record as runtime satisfaction
unless a future explicit satisfaction lifecycle says so.

### Graph Delta

A Graph Delta is a proposal to update the Maintainability Graph. It must remain proposal-only until the guarded update
lifecycle revalidates approval, policy, source identity, backup, concrete operation shape, and post-update validation.

### Guarded Update

A Guarded Graph Update is the only path that may mutate the Maintainability Graph. Current tracked calibration artifacts
keep this blocked for the Todo sample because there are no concrete mutation operations.

## Enterprise Roadmap

Before production hardening, DevView is cleaning up legacy terminology and migration surfaces. Enterprise-grade work
remains future-only until explicitly implemented:

- security review and hardening;
- RBAC and reviewer identity policy;
- tamper-evident audit logs;
- backup, rollback, and disaster recovery flows;
- compatibility and migration tooling for legacy tree-native artifacts;
- hook install/trust governance;
- enforcement policy for Scope/CI and required checks.

## Documentation

- [Documentation index](docs/index.md)
- [CLI reference](docs/cli-reference.md)
- [Install locally](docs/install.md)
- [DevView terminology](docs/concept/devview-terminology.md)
