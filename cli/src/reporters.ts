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
  profile recommend    Recommend workflow depth from a task brief
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
  graph execution-contract report
                       Report a graph-native execution contract view for a configured slice
  graph operation apply-proposal
                       Preview or apply a graph update proposal to graph-source; dry-run unless --apply is provided
  graph operation generate-pack
                       Generate a graph instruction pack for one selected record
  graph operation capture-delta
                       Capture a graph delta from an allowed target repo diff
  graph operation propose-update
                       Generate a graph update proposal from a graph delta
  graph operation run-chain
                       Run or plan the local PBE operation-chain wrapper without knowing the underlying script path
  graph retrofit plan  Summarize a retrofit graph-source before implementation without touching the target project
  graph read-model generate
                       Generate bounded read-model Evidence from a selected slice
  graph read-model compare
                       Compare generated read-model Evidence with a manual parity artifact
  graph read-model project
                       Project a bounded Graph source artifact into read-model projection output
  graph read-model project-intent
                       Project an intent-critical Graph source fixture into edge-intent read-model projection output
  graph read-model report-intent
                       Summarize local native/retrofit edge-intent projection health without validate-all enforcement
  graph read-model report-compiler-boundary
                       Validate the local non-enforcing Compiler Boundary MVP registry, schema, and dry-run contract
  graph read-model report-compiler-input
                       Validate the local non-enforcing Compiler Input Model MVP schema and dry-run input fixture
  graph read-model compile-contract
                       Compile a non-executing dry-run contract candidate from the Compiler Input Model with --dry-run
  graph read-model collect-changed-files
                       Collect git-derived changed-file names/status between explicit refs without scope evaluation
  graph read-model check-scope
                       Run advisory non-enforcing scope compliance evaluation for explicit refs
  graph read-model propose-graph-delta
                       Generate proposal-only Graph Delta preview JSON from an advisory source artifact
  graph read-model review-graph-delta
                       Generate a human review packet from a proposal-only Graph Delta preview
  graph read-model record-human-decision
                       Record an explicit human decision without approved state, apply, mutation, or enforcement
  graph read-model create-approved-proposal-state
                       Create or block an approved proposal state preview without apply, mutation, or enforcement
  graph read-model check-graph-delta-apply
                       Check Graph Delta apply readiness without apply, mutation, or enforcement
  graph read-model report-graph-source-mutation-readiness
                       Report graph-source mutation readiness without writing graph-source
  graph read-model report-evidence-acceptance-readiness
                       Report Evidence acceptance readiness without accepting Evidence
  graph read-model report-equivalence-proof-readiness
                       Report equivalence proof readiness without proving equivalence
  graph read-model report-scope-ci-enforcement-readiness
                       Report disabled scope/CI enforcement readiness without enabling enforcement
  graph read-model generate-ai-request-analyzer-pack
                       Generate deterministic AI Request Analyzer prompt/input pack without LLM calls
  graph read-model analyze-request
                       Report provider-disabled analyzer status or import an explicit external Request IR Candidate
  graph read-model generate-clarification-interview-pack
                       Generate deterministic clarification question-plan pack without UI or LLM calls
  graph read-model revise-request-ir-candidate
                       Generate a revised Request IR Candidate preview from clarification answers
  graph read-model validate-request-ir
                       Validate Request IR candidate schema and safety boundaries only
  graph read-model validate-request-ir-graph
                       Validate Request IR candidate graph/read-model authority without traversal
  graph read-model plan-traversal
                       Generate a deterministic Graph Traversal Plan without selected slice output
  graph read-model select-slice
                       Generate a deterministic Selected Graph Slice without contract input output
  graph read-model generate-contract-input
                       Generate deterministic Contract Compiler Input from a Selected Graph Slice
  graph read-model generate-instruction-pack
                       Generate deterministic Instruction Pack from Contract Compiler Input without execution
  graph read-model report-project-memory-extension-gaps
                       Report Project Memory taxonomy extension gaps without applying extensions
  graph read-model report-project-memory-impact
                       Report Project Memory direction-change impact without approving or applying a revision
  graph read-model render-devview-graph
                       Render a read-only DevViewGraph HTML inspector from retrofit graph-source and instruction pack
  graph read-model report-hook-gateway-health
                       Report Hook Gateway health boundary readiness without installing hooks or enforcement
  graph read-model report-frontend-chain
                       Report the DevView frontend artifact chain from intake through Instruction Pack preview
  graph read-model prepare-user-prompt-context
                       Prepare advisory UserPromptSubmit additionalContext preview without installing hooks or execution
  graph read-model generate-hook-script-scaffold
                       Generate preview-only Hook Gateway script scaffold without installing or activating hooks
  graph read-model generate-hook-script-templates
                       Materialize preview-only Hook Gateway script bodies without writing active hook files
  graph read-model generate-hook-session-manifest
                       Generate preview-only Hook Gateway session manifest without starting or activating hooks
  graph read-model materialize-hook-script-bundle
                       Materialize repo-local advisory Hook Gateway script bundle without installing hooks
  graph read-model report-hook-activation-chain
                       Report Hook Gateway activation preview chain without installing or activating hooks
  graph read-model report-devview-baseline
                       Report the DevView core baseline freeze without adding execution or authority
  graph read-model report-health
                       Summarize local non-enforcing Graph-source transition health
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
  --apply              Apply graph operation changes. Without this, graph operation commands run in preview mode.
  --dry-run            Preview graph operation command plans without executing wrapped scripts.
  --all                Run all configured read-model registry profiles for graph read-model validate.
  --profile <value>    Compatibility workflow-depth hint: full, lite, or bypass. Defaults to full.
  --brief <text>       init project brief.
  --max-chars <n>      Maximum context pack bundle characters. Defaults to 12000.
  --text <text>        Text to assess for Human Gate clarity.
  --transition <value> Human Gate transition being assessed.
  --files <list>       Candidate changed/expected files for profile recommend, comma-separated.
  --stage <value>      trace/context stage. Trace uses wpd, vd, execution, review, or accept.
  --summary <text>     change create summary.
  --source <value>     change source or graph read-model proposal source artifact.
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
  --read-model <file>  Optional generated read-model input for project-memory extension gap reporting.
  --graph-source <file>
                       Graph source artifact for graph read-model projection, retrofit plan, project-intent, report-intent, project-memory gap reporting, or render-devview-graph.
  --project-memory <file>
                       DevView Project Memory preview for extension gap reporting, impact reporting, or render-devview-graph.
  --direction-change <file>
                       Project direction change candidate for project-memory impact reporting.
  --record <id>        Graph source record id for graph operation generate-pack or graph read-model render-devview-graph.
  --instruction-pack <file>
                       Graph instruction pack file for graph operation capture-delta, UserPromptSubmit context preview, or render-devview-graph.
  --graph-delta <file> Graph delta file for graph operation propose-update.
  --target-repo <path> Target git repository path for graph operation capture-delta.
  --manual <file>      Manual parity artifact for graph read-model comparison.
  --output <file>      Output file for graph read-model projection, project-intent, collect-changed-files, check-scope, propose-graph-delta, record-human-decision, create-approved-proposal-state, check-graph-delta-apply, report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, report-equivalence-proof-readiness, report-scope-ci-enforcement-readiness, generate-ai-request-analyzer-pack, analyze-request, generate-clarification-interview-pack, revise-request-ir-candidate, validate-request-ir, validate-request-ir-graph, plan-traversal, select-slice, generate-contract-input, generate-instruction-pack, report-project-memory-extension-gaps, report-project-memory-impact, render-devview-graph, report-hook-gateway-health, report-frontend-chain, prepare-user-prompt-context, generate-hook-script-scaffold, generate-hook-script-templates, generate-hook-session-manifest, materialize-hook-script-bundle, report-hook-activation-chain, or report-devview-baseline.
  --data-output <file> Data JSON output for graph read-model render-devview-graph.
  --markdown <file>    Optional Markdown summary output for graph read-model report-health, check-scope, review-graph-delta, record-human-decision, create-approved-proposal-state, check-graph-delta-apply, report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, report-equivalence-proof-readiness, report-scope-ci-enforcement-readiness, generate-ai-request-analyzer-pack, generate-clarification-interview-pack, generate-instruction-pack, report-project-memory-extension-gaps, report-project-memory-impact, report-frontend-chain, prepare-user-prompt-context, generate-hook-script-scaffold, generate-hook-script-templates, generate-hook-session-manifest, materialize-hook-script-bundle, report-hook-activation-chain, or report-devview-baseline.
  --proposal <file>    Graph update proposal file for graph operation apply-proposal, graph read-model review-graph-delta, or graph read-model record-human-decision.
  --review-packet <file>
                       Human Review Packet file for graph read-model record-human-decision.
  --decision-record <file>
                       Human Decision Record file for graph read-model create-approved-proposal-state.
  --approved-state <file>
                       Approved Proposal State preview file for graph read-model check-graph-delta-apply.
  --apply-readiness <file>
                       Graph Delta Apply readiness file for graph read-model report-graph-source-mutation-readiness.
  --mutation-readiness <file>
                       Graph-source Mutation readiness file for graph read-model report-evidence-acceptance-readiness.
  --evidence-acceptance-readiness <file>
                       Evidence Acceptance readiness file for graph read-model report-equivalence-proof-readiness.
  --equivalence-proof-readiness <file>
                       Equivalence Proof readiness file for graph read-model report-scope-ci-enforcement-readiness.
  --scope-ci-enforcement-readiness <file>
                       Scope/CI Enforcement readiness file for graph read-model report-devview-baseline.
  --policy <file>      Policy boundary file for graph read-model report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, report-equivalence-proof-readiness, or report-scope-ci-enforcement-readiness.
  --decision <value>   Explicit human decision value for graph read-model record-human-decision.
  --reviewer <value>   Human reviewer identity for graph read-model record-human-decision.
  --rationale <value>  Human-authored rationale for graph read-model record-human-decision.
  --runtime-report <file>
                       Optional runtime report input for graph read-model record-human-decision.
  --candidate <file>   Request IR Candidate file for graph read-model validate-request-ir or generate-clarification-interview-pack.
  --schema-validation <file>
                       Schema-only Request IR validation file for graph read-model validate-request-ir-graph.
  --graph-validation <file>
                       Graph-aware Request IR validation file for graph read-model plan-traversal.
  --traversal-plan <file>
                       Graph Traversal Plan file for graph read-model select-slice.
  --selected-slice <file>
                       Selected Graph Slice file for graph read-model generate-contract-input.
  --contract-input <file>
                       Contract Compiler Input file for graph read-model generate-instruction-pack.
  --scaffold <file>    Hook script scaffold preview for graph read-model generate-hook-script-templates.
  --script-scaffold <file>
                       Hook script scaffold preview for graph read-model generate-hook-session-manifest.
  --script-templates <file>
                       Hook script template preview for graph read-model generate-hook-session-manifest, materialize-hook-script-bundle, or report-hook-activation-chain.
  --session-manifest <file>
                       Hook session manifest preview for graph read-model materialize-hook-script-bundle or report-hook-activation-chain.
  --bundle-dir <dir>   Optional repo-local output directory for graph read-model materialize-hook-script-bundle. Defaults to .tmp/devview-hook-script-bundle.
  --request <text>     Natural-language request text for graph read-model analyze-request.
  --pack <file>        AI Request Analyzer Pack file for graph read-model analyze-request.
  --external-candidate <file>
                       Explicit precomputed Request IR Candidate import for graph read-model analyze-request.
  --clarification-pack <file>
                       Clarification Interview Pack file for graph read-model revise-request-ir-candidate.
  --answers <file>     Clarification answers file for graph read-model revise-request-ir-candidate.
  --boundary <file>    Boundary file for graph read-model report-hook-gateway-health, record-human-decision, create-approved-proposal-state, check-graph-delta-apply, generate-ai-request-analyzer-pack, generate-clarification-interview-pack, or generate-hook-script-scaffold.
  --intake <file>      Natural-language request intake boundary file for graph read-model report-frontend-chain.
  --frontend-chain <file>
                       Frontend chain report file for graph read-model prepare-user-prompt-context or report-devview-baseline.
  --roadmap-audit <file>
                       Roadmap completion audit file for graph read-model report-devview-baseline.
  --final-handoff <file>
                       Roadmap final handoff file for graph read-model report-devview-baseline.
  --hook-activation-chain <file>
                       Hook activation chain report file for graph read-model report-devview-baseline.
  --hook-health <file> Hook Gateway health report or boundary file for graph read-model prepare-user-prompt-context, or Hook Gateway health boundary for generate-hook-script-scaffold.
  --install-trust <file>
                       Hook install/trust boundary for graph read-model generate-hook-script-scaffold.
  --user-prompt-context <file>
                       UserPromptSubmit context preview for graph read-model generate-hook-script-scaffold.
  --instruction-markdown <file>
                       Instruction Pack Markdown file for graph read-model prepare-user-prompt-context.
  --schema <file>      Request IR Candidate schema file for graph read-model generate-ai-request-analyzer-pack.
  --chain-command <name>
                       Wrapped graph operation script command. Defaults to operation-chain.
  --base <ref>         Base git ref for graph read-model collect-changed-files or check-scope.
  --head <ref>         Head git ref for graph read-model collect-changed-files or check-scope.
`
}
