# PBE Philosophy

PBE is optimized for safe, reviewable, staged project construction, not for speed.

PBE should help Codex build projects in a way that preserves intent, scope, evidence, reviewability, and future maintainability. It should not rush through implementation when requirements, UI/UX, foundation, or parallel safety are unclear.

## Principles

- Preserve the whole project picture, but implement in selected slices.
- Do not treat deferred work as failure.
- Do not let foundation work silently implement deferred behavior.
- Stop for human confirmation when future modules affect current architecture.
- Prefer sequential execution unless parallel safety is proven.
- Keep every artifact within its own responsibility.
- Keep traceability by stable IDs instead of removing useful duplication.
- Use `COMPLETED` only for whole-project completion, not for a single slice.

## What PBE Is Not

- Not a GUI app.
- Not a separate OpenAI API provider.
- Not a task-card-only generator.
- Not a speed-first parallelization tool.

## What PBE Is

- Codex Plugin workflow.
- RPD Tree Walk for user intent.
- WPD WorkGraph for module boundaries.
- VD verification design.
- ACEP execution contract.
- Traceability, evidence, coverage, review, and revision loop.
