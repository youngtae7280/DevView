# Execution Contracts

Execution Contracts are the boundary between planning and implementation.

## Cycle Contract

The Cycle Contract defines one selected implementation slice:

- included Product, Project, Work, and Test nodes
- foundation scope
- deferred and out-of-scope nodes
- validation commands
- evidence requirements
- stop conditions

## Node Execution Contract

A Node Execution Contract describes a single executable Work node:

- source Product and Project nodes
- expected files and forbidden files
- dependency edges
- tests and evidence
- UI/UX constraints
- revision and change rules

## ACEP Compatibility

ACEP remains the compatibility name for packaging Cycle Contracts and Node Execution Contracts into
`.pbe/codex-execution-pack/`.

Codex must execute selected and foundation scope only. If implementation discovers scope drift, missing UX confirmation,
technical impossibility, or unsafe dependency impact, it should create or request a Change Node instead of silently
expanding the contract.
