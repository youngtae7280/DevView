# DevView Hook Script Scaffold Preview

Status: devview-hook-script-scaffold-preview-generated

## Boundary

- Mode: advisory preview.
- Install status: not installed.
- Active status: not active.
- Strict and guided blocking are disabled.
- This preview must not be copied into active hook locations by an automated command.

## Hook Templates

### SessionStart

- Role: read DevView mode and report advisory readiness only
- Candidate path: `.codex/hooks/devview-session-start.ps1`
- Behavior: Would report DevView advisory readiness if explicitly installed in the future.
- Enforcement: non-enforcing-advisory-only

### UserPromptSubmit

- Role: attach generated DevView additionalContext preview
- Candidate path: `.codex/hooks/devview-user-prompt-submit.ps1`
- Behavior: Would provide the prepared UserPromptSubmit context as advisory additionalContext.
- Enforcement: non-enforcing-advisory-only

### PreToolUse

- Role: future advisory scope reminder before tool use
- Candidate path: `.codex/hooks/devview-pre-tool-use.ps1`
- Behavior: Would summarize allowed and forbidden scope without blocking tool use.
- Enforcement: non-enforcing-advisory-only

### PostToolUse

- Role: future advisory changed-output observation
- Candidate path: `.codex/hooks/devview-post-tool-use.ps1`
- Behavior: Would record advisory observations for later report-only checks.
- Enforcement: non-enforcing-advisory-only

### Stop

- Role: future advisory post-run reminder
- Candidate path: `.codex/hooks/devview-stop.ps1`
- Behavior: Would remind the session to run report/proposal/review packet commands.
- Enforcement: non-enforcing-advisory-only

## Disallowed Mutations

- global-codex-config-mutation
- hidden-hook-install
- automatic-trust-acceptance
- active-hook-config-write
- strict-or-guided-blocking-activation
- codex-execution-trigger
- graph-source-mutation
- graph-delta-apply
- approval-or-human-decision-automation
- runtime-evidence-satisfaction
- equivalence-proof
- scope-or-ci-enforcement

## Non-execution Statement

This Hook Gateway script scaffold is a preview of future repo-local hook templates only. It does not write hook scripts to active locations, install hooks, trust repositories, configure Codex, block Codex execution, call an LLM, make network calls, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.
