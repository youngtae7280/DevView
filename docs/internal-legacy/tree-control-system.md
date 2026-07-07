# Tree Control System

PBE v2 treats the whole product development process as connected trees.

PBE is not an execution engine that tries to do everything. PBE is a requirements-based execution control layer for
AI-assisted development.

## Blueprint layer

```text
Product Tree -> Project Tree -> Work Tree -> Test Tree
```

## Execution layer

```text
Cycle Tree -> Change Tree -> Impact Tree -> Evidence Tree -> Acceptance Tree
```

## Control rules

- Lower trees must derive from upper trees.
- Product nodes must pass Ambiguity Gate before selected/foundation work is derived.
- Executable confirmed Product nodes need structured acceptance criteria or an explicit non-executable reason.
- Work, Test, and Evidence trees should link to acceptance criteria IDs when available.
- Development executes Cycle Slices, not the whole tree by default.
- Development-time changes become Change Nodes.
- Change Nodes produce Impact Trees.
- Impacted completed nodes can become stale, invalidated, or reopened.
- Product branches close only with evidence and human acceptance.
- Parity/completeness ledgers are derived control views. They can strengthen audit and verification, but they do not
  replace tree scope or silently expand implementation work.

## Validation

Run:

```bash
npm run validate:pbe:v2
```

The v2 validator compiles the tree schemas, validates matching templates, and when `.pbe` tree artifacts exist, checks
node IDs and cross-tree links.
