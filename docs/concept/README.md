# DevView Runtime Architecture Concepts

DevView is the canonical product identity. The public concept model is:

```text
Maintainability Graph
-> View Tree
-> Context Pack
-> AI Work Plan
-> Runtime Evidence
-> Graph Delta
-> Guarded Graph Update
```

## Canonical Reading Path

1. [DevView terminology](devview-terminology.md)
2. [Maintainability Graph](maintainability-graph.md)
3. [Natural-language request intake boundary](natural-language-request-intake-boundary.md)
4. [DevView Hook Gateway boundary](devview-codex-hook-gateway-boundary.md)
5. [DevView Runtime Performance Budget](devview-runtime-performance-budget.md)
6. [DevView Project Memory](devview-project-memory.md)

## Current Safe MVP

The current safe MVP has deterministic local surfaces for:

- request intake and candidate validation;
- View Tree and Context Pack generation;
- Instruction Pack preview;
- advisory UserPromptSubmit and Stop/Post Run reports;
- changed-file collection and non-enforcing scope checks;
- Graph Delta proposal and human review packets;
- hardened human decisions;
- approved apply dry-run;
- guarded graph update reporting;
- Evidence decision and accepted Evidence records;
- Runtime Evidence Satisfaction readiness;
- runtime-gated Equivalence readiness;
- disabled Scope/CI readiness;
- baseline and final handoff summaries.

The tracked calibration remains intentionally conservative:

- current guarded graph update is blocked for the sample proposal because it has no concrete mutation operations;
- accepted Evidence exists only for a narrow reviewed source artifact;
- Runtime Evidence Satisfaction readiness is blocked by obligation mismatch;
- Equivalence readiness is blocked by Runtime Evidence Satisfaction readiness;
- Scope/CI readiness is blocked and non-enforcing.

## Boundaries

DevView public concept docs must not treat any preview as authority. Current reports do not:

- execute Codex;
- install or activate hooks;
- mutate the Maintainability Graph unless the guarded update command explicitly succeeds;
- accept Evidence without a hardened human Evidence decision and accepted Evidence record;
- satisfy runtime Evidence;
- prove equivalence;
- enforce scope;
- configure CI;
- automate approval or user acceptance.

## Legacy Migration Inputs

Historical tree-native docs and fixture artifacts remain on disk for migration and audit. They are not canonical
DevView product concepts. Use the legacy audit command to classify remaining references before any future cleanup:

```bash
devview report-legacy-artifacts --json
```
