# Work Planning Context

Use when:

- Selected product scope needs concrete work items.
- The task is about expected files, module boundaries, dependency risk, or implementation order.

Do:

- Split selected scope into bounded work items.
- Record expected files, forbidden files, dependencies, and affected domains.
- Keep selected, foundation, deferred, blocked, and out-of-scope classifications clear.
- Treat parallel safety as file, artifact, state, evidence, generated-output, and integration safety.
- Use sequential execution when safety is uncertain.

Do not:

- Use product intent directly as coding tasks.
- Leave expected files unknown for parallel tasks.
- Parallelize work that touches the same source file, state, evidence, generated output, or integration boundary.
- Turn deferred scope into foundation behavior.

Escalate when:

- Shared files, generated outputs, or build state could collide.
- Module boundaries are unknown.
- Future modules affect current structure.
