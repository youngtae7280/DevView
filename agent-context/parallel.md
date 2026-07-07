# Parallel Context

Use when:

- Multiple tasks could run at once.
- Dependency impact, staged execution, or file-scope risk is involved.
- Validation commands or generated outputs may collide.

Do:

- Default to sequential unless parallel safety is proven.
- Check same-file, same-artifact, same-state, same-evidence, same-output, and same-integration collisions.
- Require integration work and integration evidence for every parallel group.
- Keep generated resources such as build output, coverage, temp output, and clean/build steps serialized.
- On Windows, serialize validation commands that share output paths.

Do not:

- Parallelize unknown write sets.
- Parallelize shared schemas, shared types, build config, package config, auth, permissions, migrations, or same-state
  transitions.
- Treat distinct product requests as automatically parallel-safe.
- Run clean/build/test commands concurrently when they share output paths.

Escalate when:

- Shared files or generated outputs are involved.
- Any task has unknown expected files.
- Human approval is needed for a larger parallel group.
