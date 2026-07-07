# DevView Documentation Index

## Start Here

- [Install DevView locally](install.md)
- [DevView CLI Reference](cli-reference.md)
- [DevView Terminology](concept/devview-terminology.md)
- [Runtime Architecture Concept Repository](concept/README.md)
- [Troubleshooting](troubleshooting.md)

## Canonical Concepts

- [DevView terminology](concept/devview-terminology.md) - Maintainability Graph, View Tree, Context Pack, AI Work Plan,
  Runtime Evidence, Graph Delta, and Guarded Graph Update.
- [Project-specific extensions](concept/devview-extensions.md) - Project Profiles, Extension Manifests, and report-only
  extension readiness.
- [Runtime architecture concepts](concept/README.md) - Public concept overview and safe MVP boundaries.

## Safe MVP Baseline

- Roadmap completion audit preview: `<roadmap-completion-audit.json>`
- Roadmap final handoff preview: `<roadmap-final-handoff.json>`
- Core baseline freeze report: `<devview-core-baseline-freeze.json>`

These generated artifacts are source-summary reports. They do not execute Codex, install hooks, mutate the
Maintainability Graph, accept Evidence, satisfy runtime Evidence, prove equivalence, enforce scope, configure CI, or
automate user acceptance.

## Legacy Migration

Historical tree-native docs and fixtures remain in the repository as migration inputs and compatibility audit material.
They are not public DevView product positioning. Use the non-mutating audit command to inspect remaining legacy names:

```bash
devview report-legacy-artifacts --json
```
