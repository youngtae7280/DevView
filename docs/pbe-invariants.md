# PBE Invariants

1. RPD nodes are not Codex tasks. RPD must pass through WPD and Execution Planner.
2. Deferred is not a current slice failure.
3. Missing selected coverage is a failure.
4. Missing foundation coverage is a failure.
5. Foundation must not include actual implementation of a deferred feature.
6. Out-of-scope changes are warnings or failures.
7. Required Foundation blocks plan execution without approval.
8. Blocking Dependency blocks automatic progress.
9. High-Impact Future Module blocks implementation without human confirmation.
10. A parallel group cannot exist without an integration task.
11. If parallel safety cannot be proven, use sequential execution.
12. Shared schema/type/config/auth/permission/migration change tasks are forbidden in parallel groups.
13. A task missing from the execution manifest is not execution-eligible.
14. Review Result must report selected, foundation, deferred, blocked, and out-of-scope items separately.
15. `COMPLETED` is used only when the whole project is complete.
16. Only the user may set `accepted`.
17. UI tasks must not run without UI/UX confirmation.
18. Visual UI changes must not run without Visual Design Contract source or explicit user waiver.
19. Default PBE Clean Theme must be materialized into Design Tokens and Component Style Contract before visual implementation.
20. Shared visual component changes require Component Style Contract linkage or approved exception.
21. Required visual UI states need current screenshot/manual evidence, deferral, or blocker before closure.
22. Stale visual evidence blocks review submission and acceptance.
23. Delivery must not be completed without Result Review.
