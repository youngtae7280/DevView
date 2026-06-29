# PBE Agent Context Router

Do not read all PBE docs by default.

Read this router first, then read only the card that matches the current task.

## Routing

Start/init:

- [start.md](start.md)

Compact depth / compatibility `lite` metadata:

- [lite.md](lite.md)

RPD / ambiguity:

- [rpd.md](rpd.md)

WPD / work planning:

- [wpd.md](wpd.md)

VD / test design:

- [vd.md](vd.md)

Execution / evidence:

- [evidence.md](evidence.md)

Review / repeated rejection:

- [review.md](review.md)

Revision:

- [revision.md](revision.md)

Product meaning change:

- [product-patch.md](product-patch.md)

Parallel / dependency risk:

- [parallel.md](parallel.md)

Documentation / troubleshooting / install docs:

- [lite.md](lite.md)
- [evidence.md](evidence.md)

## Policy Reading Rule

For policy decisions, read `docs/policies.md` before opening long-form policy documents. Use the original policy
documents only when the compact policy index is insufficient, the task directly touches that risk area, or
validation/user instructions require the original source.

## Rule

Start with the smallest matching card.

Load full docs only when the card says to.

If the task is unclear, ask one question instead of scanning all docs.

## Graph-First Boundary

RPD, WPD, VD, ACEP, `.pbe/blueprint/*`, and `.pbe/codex-execution-pack/*` remain valid compatibility context for
tree-control closure. They are not the source-authority direction for Graph-source/read-model work.

When a task is about Graph-source, read-model projection, source authority, structure-only status, registry-backed
validate-all, or tree-native retirement, prefer the graph-source concept docs over tree-stage context cards.

## CLI Support

Use `pbe context recommend` to get a read-first context list from a brief, stage, or profile.

This command is read-only and should be used before broad docs scanning.

`pbe status --json` may include `recommendedContext` for the current state/profile. Prefer that when an active PBE run
exists.

Use `pbe context recommend` when starting from a brief or when no active run exists.

Suggested routing flow:

1. `pbe context recommend`: choose the smallest relevant context.
2. `pbe context pack`: create a compact prompt-ready bundle from `readFirst`.
3. Agent works from the included context first.
4. If a suggested gate assessment is shown, run or consider it before turning Product intent into Work/Test decisions.
5. Ask the Human Gate question only when the assessment requires it.
6. Read full docs only when the pack or task requires it.
