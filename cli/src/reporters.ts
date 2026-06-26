import type { CommandResult, ValidationIssue } from './core/types.js'

export function renderResult(result: CommandResult, json: boolean): string {
  const issues = result.issues
  if (json) {
    return `${JSON.stringify(
      {
        ok: result.ok,
        command: result.command,
        exitCode: result.exitCode,
        message: result.message,
        issues,
        ...result.data,
      },
      null,
      2,
    )}\n`
  }

  if (result.command === 'context pack' && result.ok && result.message) {
    return `${result.message}\n`
  }

  if (result.command === 'gate assess' && result.ok && result.message) {
    return `${result.message}\n`
  }

  const lines: string[] = []
  if (result.message) {
    lines.push(result.message)
  } else {
    lines.push(result.ok ? `${result.command} succeeded.` : `${result.command} failed.`)
  }

  lines.push('')
  lines.push(`Command: ${result.command}`)
  lines.push(`Status: ${result.ok ? 'PASS' : 'FAIL'}`)
  lines.push(`Issues: ${formatIssueSummary(issues)}`)

  if (issues.length > 0) {
    lines.push('')
    lines.push('Issues:')
    for (const entry of issues) {
      lines.push(...formatIssue(entry))
    }
  }

  if (result.data?.next) {
    lines.push('')
    lines.push('Next:')
    lines.push(`- ${String(result.data.next)}`)
  }

  return `${lines.join('\n')}\n`
}

export function formatIssue(entry: ValidationIssue): string[] {
  const lines = [`- [${entry.severity}] ${entry.code}: ${entry.message}`]
  if (entry.file) {
    lines.push(`  File: ${entry.file}`)
  }
  if (entry.nodeId || entry.nodeType) {
    const nodeLabel = [entry.nodeType, entry.nodeId].filter(Boolean).join(' ')
    lines.push(`  Node: ${nodeLabel}`)
  }
  if (entry.stage) {
    lines.push(`  Stage: ${entry.stage}`)
  }
  if (entry.reason && entry.reason !== entry.message) {
    lines.push(`  Reason: ${entry.reason}`)
  }
  if (entry.suggestedFix) {
    lines.push(`  Suggested fix: ${entry.suggestedFix}`)
  }
  if (entry.nextCommand) {
    lines.push(`  Next command: ${entry.nextCommand}`)
  }
  return lines
}

function formatIssueSummary(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return '0'
  }
  const errors = issues.filter((entry) => entry.severity === 'error').length
  const warnings = issues.filter((entry) => entry.severity === 'warning').length
  const infos = issues.filter((entry) => entry.severity === 'info').length
  return [`${issues.length} total`, `${errors} error`, `${warnings} warning`, `${infos} info`].join(', ')
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
  gate assess          Assess Human Gate clarity and hard triggers without changing state
  profile recommend    Recommend full, lite, or bypass from a task brief
  context recommend    Recommend skills, agent-context cards, and optional full docs
  context pack         Create a prompt-ready bundle from recommended readFirst context
  rpd check            Check RPD/Product Tree status
  rpd close            Attempt to close RPD
  ui approve           Record user UI/UX approval and transition to UI_UX_APPROVED
  trace check          Check Product/Work/Test/Evidence traceability
  files check          Check changed files against Work/Revision scope
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
  execution start      Transition from ACEP_READY to EXECUTION_IN_PROGRESS
  execution complete   Validate execution evidence and transition to ACEP_RUN_DONE
  review submit        Submit verified work to Review Result gate
  accept               Close as ACCEPTED then DONE only with user acceptance metadata
  change create        Record user feedback/change request as a Change node
  impact analyze       Create Impact node links for an existing Change node
  product patch propose
                       Propose a user-confirmed Product Tree patch from a Change node
  product patch apply  Apply a confirmed Product Patch Proposal
  revision start       Enter REVISION_REQUESTED after Impact analysis
  revision complete    Return revision work to WPD/VD/ACEP closure flow
  evidence check       Check evidence coverage
  visual check         Check Visual Design Contract and UI evidence
  graph read-model generate
                       Generate bounded read-model Evidence from a selected slice
  graph read-model compare
                       Compare generated read-model Evidence with a manual parity artifact
  graph read-model project
                       Project a bounded Graph source artifact into read-model projection output
  graph read-model observe-candidates
                       Check non-promotional read-model candidate projection contracts outside validate-all
  graph read-model validate
                       Validate scoped generated read-model Evidence and write validator-backed reports
  graph read-model validate --all
                       Run configured registry-backed read-model Evidence validation and aggregate summary
  graph read-model summarize
                       Summarize existing per-slice read-model validation reports without running validation

Options:
  --root <path>        Target project root. Defaults to current directory.
  --json               Print stable JSON output.
  --verbose            Include validator details where available.
  --no-color           Disable colored output. Reserved for compatibility.
  --force              Allow init to overwrite existing PBE files.
  --all                Run all configured read-model registry profiles for graph read-model validate.
  --profile <value>    init profile: full, lite, or bypass. Defaults to full.
  --brief <text>       init project brief.
  --max-chars <n>      Maximum context pack bundle characters. Defaults to 12000.
  --text <text>        Text to assess for Human Gate clarity.
  --transition <value> Human Gate transition being assessed.
  --files <list>       Candidate changed/expected files for profile recommend, comma-separated.
  --stage <value>      trace/context stage. Trace uses wpd, vd, execution, review, or accept.
  --summary <text>     change create summary.
  --source <value>     change source. Defaults to user_feedback.
  --change <id>        Change node id for impact/revision commands.
  --patch <id>         Product Patch node id for product patch apply.
  --operation <value>  Product Patch operation.
  --product <id>       Affected Product node id. May be repeated or comma-separated.
  --work <id>          Affected Work node id. May be repeated or comma-separated.
  --test <id>          Affected Test node id. May be repeated or comma-separated.
  --evidence <id>      Affected Evidence node id. May be repeated or comma-separated.
  --acceptance <id>    Affected Acceptance node id. May be repeated or comma-separated.
  --slice <path>       Selected slice path for graph read-model generation.
  --slices <paths>     Slice paths for graph read-model summarize, comma-separated.
  --generated <file>   Generated read-model file for graph read-model comparison.
  --graph-source <file>
                       Graph source artifact for graph read-model projection.
  --manual <file>      Manual parity artifact for graph read-model comparison.
  --output <file>      Output file for graph read-model projection.
`
}
