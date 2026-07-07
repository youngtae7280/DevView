# Migration Guide: PBE v1 to v2

## Keep compatibility

Do not remove `.pbe/blueprint/*` files immediately. Generate v2 tree files and keep v1 files as aliases or
human-readable views.

## Mapping

```text
requirement-tree.json -> product-tree.json
work-design/work-graph -> project-tree + work-tree
verification-design -> test-tree
ACEP -> cycle-contract + node-execution-contracts
feedback/revision -> change-tree + impact-tree + reopen protocol
```

## PR sequence

1. Reframe README, plugin.json, AGENTS.
2. Add tree schemas/templates.
3. Add `validate:pbe:v2` for tree schemas, templates, and optional `.pbe` tree artifacts.
4. Update start/rpd/wpd/vd.
5. Update plan/generate/run ACEP around cycle contracts.
6. Update review/feedback/revision around Change/Impact/Reopen.
7. Add golden scenarios.
