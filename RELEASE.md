# Release Policy

DevView uses explicit package and plugin versions so users can understand whether a new Codex session is running the
current workflow.

## Version Types

- Patch: documentation, examples, schemas, validator fixes, or report-shape clarifications that preserve behavior.
- Minor: optional DevView lifecycle reports, policy boundaries, validators, or command surfaces that preserve existing
  public paths.
- Major: incompatible public command, artifact, storage, or workflow changes. Avoid these unless migration guidance and
  transition behavior are available.

## Required Release Checks

Before pushing plugin changes, run the focused checks for the touched area plus the requested release validation. Common
checks include:

```text
npm run build:cli
npm run validate:devview
npm run format:check
npm run devview:runtime:smoke
git -c core.longpaths=true diff --check
```

## Compatibility Rules

- Keep public DevView terminology canonical.
- Keep historical migration material internal unless a reviewed slice rewrites it.
- Preserve hidden legacy guards for existing user repositories until an explicit migration lifecycle retires them.
- Do not remove or rename public paths without migration notes and validation.

Historical release policy text is retained in `docs/internal-legacy/release-history-legacy-release-policy.md`.
