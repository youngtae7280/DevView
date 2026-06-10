# Evidence And Coverage

Evidence and final coverage checks keep ACEP execution honest.

## Evidence Rule

No verification item should be treated as complete without evidence or a not-runnable explanation.

Evidence can include:

- changed files
- related test files
- command output
- build logs
- validation summaries
- UI manual verification notes
- screenshot paths when available

## Final Coverage Check

`16-final-coverage-check.md` must be completed before the final report.

It covers:

- requirement coverage
- task coverage
- verification coverage
- UI/UX coverage
- traceability issues
- final decision

## Final Report Gate

Codex must not write the final report until technical completion criteria are satisfied. If coverage issues remain, Codex continues working or records a stop condition.

After final report, Codex prepares result review and submits as `submitted_for_review`. Only the user can accept.
