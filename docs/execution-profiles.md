# Execution Profiles

PBE supports three execution profiles:

```ts
type PbeExecutionProfile = "bypass" | "lite" | "full";
```

## bypass

Use for:

- typo fixes
- single-file edits
- clearly bounded small bug fixes
- work that does not need PBE artifacts

## lite

Use for:

- small changes in a repo that already has a blueprint
- small slice implementation
- work that needs scope classification or dependency impact review, but not a full ACEP

If a high-risk condition appears during `lite`, propose switching to `full`.

## full

Use for:

- new project creation
- large features
- multi-module changes
- UI/UX work
- parallelizable work
- future features that affect current architecture
- architecture decisions

Default recommendation:

- New projects and large features: `full`.
- Small after-the-fact edits: `lite` or `bypass`.
- User-requested full process: `full`.
- User-requested lite with understood risk: continue `lite`, but record the risk.

