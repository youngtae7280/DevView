# Compact Depth Context

Use when:

- The user requests a small bounded slice in an existing project.
- The work is low-risk and does not need full planning depth.
- The relevant source, tests, and validation commands are already clear.

Do:

- Remember that compact depth is not bypass.
- Keep minimal acceptance criteria, expected files, verification, and user-only acceptance.
- Keep file-change guardrails active.
- Preserve product, work, verification, and evidence traceability even when reduced.
- Increase to full planning depth when risk grows.

Do not:

- Treat compact depth as permission to skip acceptance criteria.
- Skip user review or user-only acceptance.
- Expand into broad repo conversion.
- Use compact depth for unclear product meaning, visual redesign, architecture, permissions, schema changes, hardware,
  concurrency, or repeated rejection.

Escalate when:

- The slice touches multiple modules or shared files.
- User feedback changes product meaning or acceptance criteria.
- File scope cannot be named confidently.
