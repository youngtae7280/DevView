# DevView Invariants

- RPD nodes are not Codex tasks.
- Deferred items are not current slice failures.
- Selected and foundation items must be covered.
- Foundation must not implement deferred behavior.
- Required Foundation requires approval before execution.
- Blocking Dependency stops automatic progress.
- Parallel groups require integration tasks.
- If parallel safety cannot be proven, do not parallelize.
- UI implementation requires UI/UX confirmation.
- Visual UI implementation requires Visual Design Contract source, concrete tokens, component style rules, and required state evidence unless explicitly waived by the user.
- Stale visual evidence cannot close a branch.
- Codex cannot mark work accepted. Only the user can.
