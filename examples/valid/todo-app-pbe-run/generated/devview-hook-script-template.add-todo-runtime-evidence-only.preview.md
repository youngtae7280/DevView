# DevView Hook Script Template Preview

Status: devview-hook-script-template-preview-generated

## Boundary

- Mode: advisory preview.
- Install status: not installed.
- Active status: not active.
- Script bodies are review artifacts only.
- Strict/guided blocking, Codex execution, approval, Evidence satisfaction, equivalence proof, scope enforcement, and CI enforcement remain disabled.

## SessionStart

Candidate file: `devview-session-start.ps1`

```powershell
# DevView hook template preview only.
# Not installed. Not active. Non-enforcing advisory behavior only.
$ErrorActionPreference = "Stop"
$devviewMode = "advisory"
$strictModeEnabled = $false
$guidedEnforcementEnabled = $false
$blockingEnabled = $false
$codexExecutionTriggered = $false
Write-Output "DevView SessionStart advisory preview: report readiness only."
# Do not trust repositories, install hooks, or mutate configuration here.
Write-Output "DevView advisory hook preview completed without mutation or blocking."
exit 0
```

## UserPromptSubmit

Candidate file: `devview-user-prompt-submit.ps1`

```powershell
# DevView hook template preview only.
# Not installed. Not active. Non-enforcing advisory behavior only.
$ErrorActionPreference = "Stop"
$devviewMode = "advisory"
$strictModeEnabled = $false
$guidedEnforcementEnabled = $false
$blockingEnabled = $false
$codexExecutionTriggered = $false
$contextPreviewPath = $env:DEVVIEW_USER_PROMPT_CONTEXT_PREVIEW
if ($contextPreviewPath -and (Test-Path -LiteralPath $contextPreviewPath)) {
  Write-Output "DevView additionalContext preview is available for advisory use."
} else {
  Write-Output "DevView additionalContext preview path is not configured."
}
# Do not generate Request IR, run graph traversal, execute Codex, or claim approval here.
Write-Output "DevView advisory hook preview completed without mutation or blocking."
exit 0
```

## PreToolUse

Candidate file: `devview-pre-tool-use.ps1`

```powershell
# DevView hook template preview only.
# Not installed. Not active. Non-enforcing advisory behavior only.
$ErrorActionPreference = "Stop"
$devviewMode = "advisory"
$strictModeEnabled = $false
$guidedEnforcementEnabled = $false
$blockingEnabled = $false
$codexExecutionTriggered = $false
Write-Output "DevView PreToolUse advisory preview: remind caller to compare tool use with allowed/forbidden scope."
# Do not block tools or enforce scope in this preview.
Write-Output "DevView advisory hook preview completed without mutation or blocking."
exit 0
```

## PostToolUse

Candidate file: `devview-post-tool-use.ps1`

```powershell
# DevView hook template preview only.
# Not installed. Not active. Non-enforcing advisory behavior only.
$ErrorActionPreference = "Stop"
$devviewMode = "advisory"
$strictModeEnabled = $false
$guidedEnforcementEnabled = $false
$blockingEnabled = $false
$codexExecutionTriggered = $false
Write-Output "DevView PostToolUse advisory preview: observations may be reviewed later by report-only checks."
# Do not mutate graph-source, satisfy Evidence, or record human decisions here.
Write-Output "DevView advisory hook preview completed without mutation or blocking."
exit 0
```

## Stop

Candidate file: `devview-stop.ps1`

```powershell
# DevView hook template preview only.
# Not installed. Not active. Non-enforcing advisory behavior only.
$ErrorActionPreference = "Stop"
$devviewMode = "advisory"
$strictModeEnabled = $false
$guidedEnforcementEnabled = $false
$blockingEnabled = $false
$codexExecutionTriggered = $false
Write-Output "DevView Stop advisory preview: run check/report/proposal/review commands manually if needed."
# Do not approve work, apply graph deltas, or enable CI enforcement here.
Write-Output "DevView advisory hook preview completed without mutation or blocking."
exit 0
```

## Non-execution Statement

This Hook Gateway script template preview materializes script bodies as review artifacts only. It does not write active hook files, install hooks, trust repositories, configure Codex, block Codex execution, call an LLM, make network calls, run validation or traversal, mutate graph-source, apply graph deltas, approve work, record human decisions, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.
