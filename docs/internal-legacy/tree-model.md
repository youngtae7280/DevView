# PBE Tree Model

PBE v2 uses tree-native artifacts as the stable control model.

```text
Product Tree
  -> Project Tree
  -> Work Tree
  -> Test Tree

Cycle Tree
  -> Change Tree
  -> Impact Tree
  -> Evidence Tree
  -> Acceptance Tree
```

## Product Tree

Captures user intent, product behaviors, constraints, UX decisions, acceptance criteria, and product-level non-scope.

Compatibility term: `RPD`.

## Project Tree

Captures architecture boundaries, modules, surfaces, dependencies, ownership, and integration responsibilities.

Compatibility term: part of `WPD`.

## Work Tree

Captures executable work nodes derived from Product and Project nodes. Work Tree nodes are not a direct copy of Product
Tree nodes.

Compatibility term: part of `WPD`.

## Test Tree

Captures verification nodes that prove Product and Work nodes. Every non-root Test Tree node must declare required
evidence.

Compatibility term: `VD`.

## Cycle Tree

Captures the selected slice for one implementation cycle. It is packaged into Cycle and Node Execution Contracts.

Compatibility term: `ACEP`.

## Change, Impact, Evidence, And Acceptance Trees

These trees control revision and closure. Codex may submit work for review, but only the user may mark product branches
accepted.
