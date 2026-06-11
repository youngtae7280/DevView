# Evidence And Coverage

Evidence and final coverage checks keep ACEP execution honest.

## Evidence Rule

No verification item should be treated as complete without evidence or a not-runnable explanation.

When acceptance criteria exist, evidence should identify which Test nodes and criteria it proves.

Evidence can include:

- changed files
- related test files
- command output
- build logs
- validation summaries
- UI manual verification notes
- screenshot paths when available
- legacy inventory comparisons
- visual/runtime parity notes
- hardware readiness or certification records
- not-runnable explanations
- verification miss root-cause notes

## Final Coverage Check

`16-final-coverage-check.md` must be completed before the final report.

It covers:

- requirement coverage
- acceptance criteria coverage
- task coverage
- verification coverage
- UI/UX coverage
- surface completion and parity coverage when the profile is active
- hardware readiness coverage when hardware-dependent work exists
- verification miss promotion status when feedback exposed a missed validation dimension
- traceability issues
- final decision

## Final Report Gate

Codex must not write the final report until technical completion criteria are satisfied. If coverage issues remain, Codex continues working or records a stop condition.

After final report, Codex prepares result review and submits as `submitted_for_review`. Only the user can accept.
