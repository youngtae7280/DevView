# WPD Context

WPD is tree-control compatibility context for deriving Project/Work shape from Product Tree intent. For
Graph-source/read-model source-authority work, do not treat WPD output as the primary graph source unless a later
approved transition explicitly promotes it.

Use when:

- RPD/Product Tree is confirmed and selected scope needs Work nodes.
- The task is about work planning, expected files, module boundaries, or parallel safety.

Do:

- Split selected Product scope into Work nodes.
- Record `expectedFiles`, `forbiddenFiles`, dependencies, and affected domains.
- Consider File Change Guard before execution.
- Keep selected/foundation/deferred/blocked/out-of-scope classification.
- Treat parallel safety as file, artifact, state, evidence, and integration safety.
- Use sequential execution when safety is uncertain.

Do not:

- Use RPD nodes directly as coding tasks.
- Leave expected files unknown for parallel tasks.
- Parallelize tasks that touch the same source file, `.pbe` artifact, state transition, evidence file, or generated resource.
- Turn deferred scope into foundation behavior.

Escalate / read full docs when:

- Shared files, generated outputs, build state, or `.pbe` artifacts could collide.
- Module boundaries are unknown.
- Future modules affect current structure.

Full references:

- [docs/parallel-safety.md](../docs/parallel-safety.md)
