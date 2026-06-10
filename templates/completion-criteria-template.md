# Completion Criteria

Project completion requires:

1. Every task in `execution-manifest.json` is completed or explicitly marked deferred/out_of_scope with reason.
2. Every requirement has at least one linked task or an explicit deferred/out_of_scope reason.
3. Every task has at least one linked verification item or an explicit explanation.
4. Every verification item has evidence or a not-runnable explanation.
5. All required validation commands pass, or failures are documented as environment-limited/non-blocking with reason.
6. Every required UI screen has UI/UX evidence.
7. Every required UI state is implemented or explicitly documented as not applicable.
8. Final Coverage Check is completed.
9. Final Report is completed.
10. Result Review Pack is created.
11. Delivery status is `submitted_for_review`.
12. No unresolved stop condition remains.

User acceptance requires:

1. The user reviews the result.
2. Only the user can mark the result `accepted`.
3. If the user requests changes, feedback collection and Revision Pack creation must follow.
4. After revision, the result returns to Result Review.
5. Until user acceptance, the final product is not considered accepted.

Codex must not produce the final report until technical completion criteria are satisfied. Codex must not mark the result accepted.
