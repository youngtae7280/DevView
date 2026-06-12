import type { CommandResult, ValidationIssue } from './core/types.js'

export function renderResult(result: CommandResult, json: boolean): string {
  if (json) {
    return `${JSON.stringify(
      {
        ok: result.ok,
        command: result.command,
        exitCode: result.exitCode,
        message: result.message,
        issues: result.issues,
        ...result.data,
      },
      null,
      2,
    )}\n`
  }

  const lines: string[] = []
  if (result.message) {
    lines.push(result.message)
  } else {
    lines.push(result.ok ? `${result.command} succeeded.` : `${result.command} failed.`)
  }

  if (result.issues.length > 0) {
    lines.push('')
    lines.push('Issues:')
    for (const entry of result.issues) {
      lines.push(formatIssue(entry))
    }
  }

  if (result.data?.next) {
    lines.push('')
    lines.push('Next:')
    lines.push(`- ${String(result.data.next)}`)
  }

  return `${lines.join('\n')}\n`
}

export function formatIssue(entry: ValidationIssue): string {
  const file = entry.file ? ` (${entry.file}${entry.nodeId ? `:${entry.nodeId}` : ''})` : ''
  const fix = entry.suggestedFix ? `\n  Required action: ${entry.suggestedFix}` : ''
  return `- [${entry.code}] ${entry.message}${file}${fix}`
}

export function helpText(): string {
  return `Project Blueprint Engine CLI

Usage:
  pbe <command> [options]

Commands:
  init                 Initialize .pbe artifacts
  status               Show current PBE status
  validate             Run all PBE validators
  gate <stage>         Check whether a stage can be entered, including review-result
  rpd check            Check RPD/Product Tree status
  rpd close            Attempt to close RPD
  ui approve           Record user UI/UX approval and transition to UI_UX_APPROVED
  trace check          Check Product/Work/Test/Evidence traceability
  wpd check            Check Work Tree and WorkGraph readiness
  wpd close            Validate WPD and transition to WPD_DONE
  vd check             Check Test Tree and verification coverage
  vd close             Validate VD/Test Tree and transition to VD_DONE
  scope select         Record implementation scope selection
  dependency audit complete
                       Record Dependency Impact Audit checkpoint
  plan execution complete
                       Record Plan Execution checkpoint
  coverage audit complete
                       Record Coverage Audit checkpoint
  ux audit complete    Record UX Audit checkpoint
  acep check           Check ACEP execution pack
  acep ready           Validate ACEP manifest and transition to ACEP_READY
  execution complete   Validate execution evidence and transition to ACEP_RUN_DONE
  review submit        Submit verified work to Review Result gate
  accept               Close as DONE only with user acceptance metadata
  evidence check       Check evidence coverage
  visual check         Check Visual Design Contract and UI evidence

Options:
  --root <path>        Target project root. Defaults to current directory.
  --json               Print stable JSON output.
  --verbose            Include validator details where available.
  --no-color           Disable colored output. Reserved for compatibility.
  --force              Allow init to overwrite existing PBE files.
  --profile <value>    init profile: full, lite, or bypass. Defaults to full.
  --brief <text>       init project brief.
`
}
