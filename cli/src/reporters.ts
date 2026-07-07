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
  return `DevView CLI

Usage:
  devview <command> [options]

Commands:
  validate             Run DevView validators
  report-legacy-artifacts
                       Report remaining legacy names and migration inputs without mutating files
  cleanup-legacy       Plan legacy example migration/delete/compatibility operations; requires --dry-run
  extensions report-readiness
                       Report Project Profile and Extension Manifest readiness without executing extension code
  extensions compile-profile
                       Compile declarative Project Profile and Extension Manifest capabilities into a report-only catalog
  extensions plan-context
                       Connect extension catalog hints to View Tree and Context Pack planning without executing extensions
  extensions validate-adapters
                       Validate Evidence Adapter and Policy Extension compatibility without executing adapters
  extensions validate-native-retrofit-profile
                       Validate Native/Retrofit profile coverage without executing extensions or external tooling
  benchmark evaluate-result
                       Score a stored benchmark candidate result against a golden answer without executing benchmarks
  benchmark summarize-comparison
                       Summarize stored benchmark evaluation reports into a comparison matrix without executing benchmarks
  benchmark validate-graphify-import
                       Validate static Graphify export and mapping fixtures without live Graphify activity
  security report-enterprise-readiness
                       Aggregate enterprise hardening readiness as a report-only assessment
  security report-provider-network-policy
                       Record provider/network default-deny policy posture without provider or network activity
  security report-release-provenance
                       Report package provenance, SBOM, and package signing readiness without creating release artifacts
  security validate-sbom-artifact
                       Validate a wrapped preexisting SBOM artifact without generating SBOMs or attestations
  security record-package-provenance-inputs
                       Record package/source/build input facts without creating package artifacts or attestations
  security validate-rbac-policy
                       Validate declarative RBAC role assignment policy without enforcing RBAC
  security report-rbac-readiness
                       Record RBAC actor identity readiness without signing or enforcement
  security report-signing-readiness
                       Record signing/key governance readiness without signing, keys, or enforcement
  security preview-record-envelope
                        Preview unsigned record envelope hashes without signing or RBAC enforcement
  security verify-record-envelope
                        Verify unsigned record envelope preview digests without signing or RBAC enforcement
  work-journal render  Render static cumulative DevView Work Journal HTML/data without execution or authority
  init                 Internal compatibility initializer for legacy migration inputs
  status               Internal compatibility status for legacy migration inputs
  gate <stage>         Check whether a stage can be entered, including review-result
  gate assess          Assess Human Gate clarity and hard triggers without changing state
  profile recommend    Recommend workflow depth from a task brief
  context recommend    Recommend skills, agent-context cards, and optional full docs
  context pack         Create a prompt-ready bundle from recommended readFirst context
  product-intake check Check Product Intake/Product Tree status
  product-intake close Attempt to close Product Intake
  ui approve           Record user UI/UX approval and transition to UI_UX_APPROVED
  trace check          Check Product/Work/Test/Evidence traceability
  files check          Check changed files against Work/Revision scope
  work-planning check  Check Work Tree and WorkGraph readiness
  work-planning close  Validate Work Planning and transition to WORK_PLANNING_DONE
  verification-design check
                       Check Test Tree and verification coverage
  verification-design close
                       Validate Verification Design/Test Tree and transition to VERIFICATION_DESIGN_DONE
  scope select         Record implementation scope selection
  dependency audit complete
                       Record Dependency Impact Audit checkpoint
  plan execution complete
                       Record Plan Execution checkpoint
  coverage audit complete
                       Record Coverage Audit checkpoint
  ux audit complete    Record UX Audit checkpoint
  execution-pack check Check Execution Pack readiness
  execution-pack ready Validate Execution Pack manifest and transition to EXECUTION_PACK_READY
  execution start      Transition from EXECUTION_PACK_READY to EXECUTION_IN_PROGRESS
  execution complete   Validate execution evidence and transition to EXECUTION_PACK_RUN_DONE
  review submit        Submit verified work to Review Result gate
  accept               Close as ACCEPTED then DONE only with user acceptance metadata
  change create        Record user feedback/change request as a Change node
  impact analyze       Create Impact node links for an existing Change node
  product patch propose
                       Propose a user-confirmed Product Tree patch from a Change node
  product patch apply  Apply a confirmed Product Patch Proposal
  revision start       Enter REVISION_REQUESTED after Impact analysis
  revision complete    Return revision work to Work Planning/Verification Design/Execution Pack closure flow
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
                       Collect git-derived changed-file names/status from explicit refs, tracked unstaged working tree, staged index, or untracked files without scope evaluation
  graph read-model check-scope
                       Run advisory non-enforcing scope compliance evaluation for explicit refs, tracked unstaged working tree, staged index, or untracked files
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
  graph read-model report-approved-apply-dry-run
                       Report approved proposal/apply readiness dry-run without applying or mutating graph-source
  graph read-model apply-graph-delta
                       Apply explicit Graph Delta operations to an explicit graph-source target after dry-run readiness, backup, and validation
  graph read-model report-graph-source-mutation-readiness
                       Report graph-source mutation readiness without writing graph-source
  graph read-model report-evidence-acceptance-readiness
                       Report Evidence acceptance readiness without accepting Evidence
  graph read-model record-evidence-decision
                       Record an explicit human Evidence decision without creating accepted Evidence
  graph read-model create-accepted-evidence-record
                       Create an Accepted Evidence record from a hardened human Evidence decision without runtime satisfaction
  graph read-model report-runtime-evidence-satisfaction-readiness
                       Report readiness to bind accepted Evidence to a runtime obligation without satisfying runtime Evidence
  graph read-model record-runtime-evidence-satisfaction
                       Record actual runtime Evidence satisfaction after ready binding and source Evidence revalidation
  graph read-model report-equivalence-proof-readiness
                       Report equivalence proof readiness without proving equivalence
  graph read-model record-equivalence-proof
                       Record actual equivalence proof from a Runtime Evidence satisfaction record without enforcement
  graph read-model report-scope-ci-enforcement-readiness
                       Report disabled scope/CI enforcement readiness without enabling enforcement
  graph read-model record-scope-ci-enforcement
                       Record Scope/CI enforcement lifecycle authority without external CI, branch protection, hook, or graph mutation
  graph read-model record-guarded-graph-update-boundary
                       Record future guarded graph update preconditions without applying Graph Delta or mutating graph-source
  graph read-model plan-guarded-graph-update
                       Preview guarded graph-source changes from a boundary record without applying Graph Delta or mutating graph-source
  graph read-model apply-guarded-graph-update
                       Apply a ready guarded graph update plan to one explicit graph-source JSON after operator authorization, backup, and validation
  graph read-model generate-ai-request-analyzer-pack
                       Generate deterministic AI Request Analyzer prompt/input pack without LLM calls
  graph read-model analyze-request
                       Report provider-disabled analyzer status, import an external Request IR Candidate, or parse a mock provider response
  graph read-model generate-clarification-interview-pack
                       Generate deterministic clarification question-plan pack without UI or LLM calls
  graph read-model revise-request-ir-candidate
                       Generate a revised Request IR Candidate preview from clarification answers
  graph read-model run-clarification-chain
                       Generate a revised Request IR Candidate and schema-only validation from clarification answers
  graph read-model run-preflight-session
                       Run deterministic frontend preflight from Request IR Candidate to Instruction Pack preview without Codex execution
  graph read-model validate-request-ir
                       Validate Request IR candidate schema and safety boundaries only
  graph read-model validate-request-ir-graph
                       Validate Request IR candidate graph/read-model authority without traversal
  graph read-model plan-traversal
                       Generate a deterministic Graph Traversal Plan without selected slice output
  graph read-model generate-view-tree
                       Generate a deterministic View Tree preview without contract input output
  graph read-model select-slice
                       Compatibility alias for graph read-model generate-view-tree
  graph read-model generate-contract-input
                       Generate deterministic Contract Compiler Input from a View Tree preview
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
  graph read-model report-user-prompt-submit-advisory
                       Report UserPromptSubmit advisory context readiness without installing hooks, blocking tools, or executing Codex
  graph read-model report-stop-post-run-advisory
                       Report Stop/Post Run advisory artifact completeness without running Git, scope checks, proposals, or review generation
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
  graph read-model report-legacy-artifacts
                       Report remaining legacy names and migration inputs without mutating files
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
  --force              Allow init to overwrite existing internal compatibility files.
  --apply              Apply graph operation changes. Without this, graph operation commands run in preview mode.
  --dry-run            Preview graph operation command plans without executing wrapped scripts.
  --all                Run all configured read-model registry profiles for graph read-model validate.
  --profile <value>    Compatibility workflow-depth hint: full, lite, or bypass. Defaults to full.
  --brief <text>       init project brief.
  --max-chars <n>      Maximum context pack bundle characters. Defaults to 12000.
  --text <text>        Text to assess for Human Gate clarity.
  --transition <value> Human Gate transition being assessed.
  --files <list>       Candidate changed/expected files for profile recommend, comma-separated.
  --stage <value>      trace/context stage. Trace uses work-planning, verification-design, execution, review, or accept.
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
                       Graph source artifact for graph read-model projection, retrofit plan, project-intent, report-intent, project-memory gap reporting, render-devview-graph, apply-graph-delta, or apply-guarded-graph-update.
  --project-memory <file>
                       DevView Project Memory preview for extension gap reporting, impact reporting, or render-devview-graph.
  --direction-change <file>
                       Project direction change candidate for project-memory impact reporting.
  --record <id>        Graph source record id for graph operation generate-pack or graph read-model render-devview-graph.
  --instruction-pack <file>
                       Graph instruction pack file for graph operation capture-delta, UserPromptSubmit context preview, record-evidence-decision, report-stop-post-run-advisory, or render-devview-graph.
  --graph-delta <file> Graph delta file for graph operation propose-update.
  --target-repo <path> Target git repository path for graph operation capture-delta.
  --manual <file>      Manual parity artifact for graph read-model comparison.
  --output <file>      Output file for extensions compile-profile, extensions plan-context, extensions validate-adapters, extensions validate-native-retrofit-profile, benchmark evaluate-result, benchmark summarize-comparison, benchmark validate-graphify-import, graph read-model projection, project-intent, collect-changed-files, check-scope, propose-graph-delta, record-human-decision, create-approved-proposal-state, check-graph-delta-apply, report-approved-apply-dry-run, apply-graph-delta, report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, record-runtime-evidence-satisfaction, report-equivalence-proof-readiness, record-equivalence-proof, report-scope-ci-enforcement-readiness, record-scope-ci-enforcement, record-guarded-graph-update-boundary, plan-guarded-graph-update, apply-guarded-graph-update, generate-ai-request-analyzer-pack, analyze-request, generate-clarification-interview-pack, revise-request-ir-candidate, run-clarification-chain, validate-request-ir, validate-request-ir-graph, plan-traversal, generate-view-tree, select-slice, generate-contract-input, generate-instruction-pack, report-project-memory-extension-gaps, report-project-memory-impact, render-devview-graph, report-hook-gateway-health, report-frontend-chain, prepare-user-prompt-context, report-user-prompt-submit-advisory, report-stop-post-run-advisory, generate-hook-script-scaffold, generate-hook-script-templates, generate-hook-session-manifest, materialize-hook-script-bundle, report-hook-activation-chain, or report-devview-baseline.
  --data-output <file> Data JSON output for graph read-model render-devview-graph.
  --markdown <file>    Optional Markdown summary output for extensions compile-profile, extensions plan-context, extensions validate-adapters, extensions validate-native-retrofit-profile, benchmark evaluate-result, benchmark summarize-comparison, benchmark validate-graphify-import, graph read-model report-health, check-scope, review-graph-delta, record-human-decision, create-approved-proposal-state, check-graph-delta-apply, report-approved-apply-dry-run, apply-graph-delta, report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, record-runtime-evidence-satisfaction, report-equivalence-proof-readiness, record-equivalence-proof, report-scope-ci-enforcement-readiness, record-scope-ci-enforcement, record-guarded-graph-update-boundary, plan-guarded-graph-update, apply-guarded-graph-update, generate-ai-request-analyzer-pack, generate-clarification-interview-pack, run-clarification-chain, run-preflight-session, generate-instruction-pack, report-project-memory-extension-gaps, report-project-memory-impact, report-frontend-chain, prepare-user-prompt-context, report-user-prompt-submit-advisory, report-stop-post-run-advisory, generate-hook-script-scaffold, generate-hook-script-templates, generate-hook-session-manifest, materialize-hook-script-bundle, report-hook-activation-chain, or report-devview-baseline.
  --proposal <file>    Graph update proposal file for graph operation apply-proposal, graph read-model review-graph-delta, record-human-decision, report-approved-apply-dry-run, apply-graph-delta, record-evidence-decision, create-accepted-evidence-record, record-guarded-graph-update-boundary, plan-guarded-graph-update, or apply-guarded-graph-update.
  --review-packet <file>
                       Human Review Packet file for graph read-model record-human-decision or report-stop-post-run-advisory.
  --decision-record <file>
                       Human Decision Record file for graph read-model create-approved-proposal-state.
  --evidence-decision <file>
                       Hardened Evidence Decision Record file for graph read-model create-accepted-evidence-record or report-devview-baseline.
  --accepted-evidence <file>
                       Accepted Evidence Record file for graph read-model report-runtime-evidence-satisfaction-readiness or report-devview-baseline.
  --approved-state <file>
                       Approved Proposal State preview file for graph read-model check-graph-delta-apply.
  --approved-state-boundary <file>
                       Approved Proposal State boundary file for graph read-model report-approved-apply-dry-run.
  --apply-boundary <file>
                       Graph Delta Apply boundary file for graph read-model report-approved-apply-dry-run.
  --dry-run-report <file>
                       Approved apply dry-run report for graph read-model apply-graph-delta.
  --approved-apply-dry-run <file>
                       Approved apply dry-run report for graph read-model report-devview-baseline.
  --apply-readiness <file>
                       Graph Delta Apply readiness file for graph read-model report-graph-source-mutation-readiness.
  --mutation-policy <file>
                       Graph-source Mutation Policy boundary file for graph read-model report-approved-apply-dry-run or apply-graph-delta.
  --mutation-readiness <file>
                       Graph-source Mutation readiness file for graph read-model report-evidence-acceptance-readiness.
  --evidence-acceptance-readiness <file>
                       Optional legacy Evidence Acceptance readiness provenance for graph read-model report-equivalence-proof-readiness.
  --runtime-evidence-satisfaction-readiness <file>
                       Runtime Evidence Satisfaction readiness file for graph read-model record-runtime-evidence-satisfaction, report-equivalence-proof-readiness, report-devview-baseline, or work-journal render.
  --runtime-evidence-satisfaction-record <file>
                       Runtime Evidence Satisfaction record file for graph read-model record-equivalence-proof, record-guarded-graph-update-boundary, or work-journal render.
  --equivalence-proof-readiness <file>
                       Equivalence Proof readiness file for graph read-model report-scope-ci-enforcement-readiness, report-devview-baseline, or work-journal render.
  --equivalence-proof-record <file>
                       Equivalence Proof record file for graph read-model record-scope-ci-enforcement, record-guarded-graph-update-boundary, or work-journal render.
  --extension-readiness <file>
                       Project-specific extension readiness report for extensions compile-profile, graph read-model report-devview-baseline, or work-journal render.
  --extension-profile-catalog <file>
                       Project-specific extension profile catalog for extensions plan-context, extensions validate-adapters, graph read-model report-devview-baseline, or work-journal render.
  --extension-context-plan <file>
                       Project-specific extension context plan for extensions validate-adapters, graph read-model report-devview-baseline, or work-journal render.
  --extension-adapter-compatibility-report <file>
                       Project-specific extension adapter compatibility report for extensions validate-native-retrofit-profile, graph read-model report-devview-baseline, or work-journal render.
  --native-retrofit-profile-validation-report <file>
                       Native/Retrofit profile validation report for graph read-model report-devview-baseline or work-journal render.
  --scope-ci-enforcement-readiness <file>
                       Scope/CI Enforcement readiness file for graph read-model record-scope-ci-enforcement or report-devview-baseline.
  --scope-ci-enforcement-record <file>
                       Scope/CI Enforcement record file for graph read-model record-guarded-graph-update-boundary, report-devview-baseline, or work-journal render.
  --guarded-graph-update-boundary-record <file>
                       Guarded Graph Update boundary record file for graph read-model plan-guarded-graph-update, apply-guarded-graph-update, report-devview-baseline, or work-journal render.
  --apply-plan <file>  Guarded Graph Update apply plan file for graph read-model apply-guarded-graph-update.
  --guarded-graph-update-apply-plan <file>
                       Guarded Graph Update apply plan file for graph read-model report-devview-baseline or work-journal render.
  --guarded-graph-update-apply-report <file>
                       Guarded Graph Update apply report file for graph read-model report-devview-baseline or work-journal render.
  --operator <id>      Explicit operator id for graph read-model apply-guarded-graph-update.
  --authorization-rationale <text>
                       Human-authored authorization rationale for graph read-model apply-guarded-graph-update.
  --payload <file>     Payload artifact for security preview-record-envelope or verify-record-envelope.
  --source-artifacts <files>
                       Optional comma-separated/repeatable source artifacts for security preview-record-envelope or verify-record-envelope.
  --previous-envelope <file>
                       Optional previous unsigned envelope preview for security preview-record-envelope or verify-record-envelope.
  --required-permission <permission>
                       Required RBAC permission claim for security preview-record-envelope.
  --actor-id <id>      Explicit actor id for security preview-record-envelope.
  --actor-type <type>  Actor type for security preview-record-envelope: human, automation, service, or extension-author.
  --actor-role <role>  Actor role claim for security preview-record-envelope; repeat or comma-separate for multiples.
  --rbac-readiness <file>
                       RBAC readiness source for security report-signing-readiness.
  --enterprise-readiness <file>
                       Enterprise readiness source for security report-provider-network-policy, report-signing-readiness, or report-release-provenance.
  --record-envelope-preview <file>
                       Unsigned record envelope preview for security report-enterprise-readiness, report-signing-readiness, or verify-record-envelope; repeat or comma-separate for multiples.
  --record-envelope-verification <file>
                       Record envelope verification report for security report-enterprise-readiness or report-signing-readiness; repeat or comma-separate for multiples.
  --signing-readiness <file>
                       Signing/key governance readiness report for security report-enterprise-readiness or report-release-provenance; repeat or comma-separate for multiples.
  --rbac-policy-validation <file>
                       RBAC policy validation report for security report-enterprise-readiness or report-release-provenance; repeat or comma-separate for multiples.
  --release-provenance-readiness <file>
                       Release provenance/SBOM readiness report for security report-enterprise-readiness; repeat or comma-separate for multiples.
  --sbom <file>        Wrapped static SBOM source fact for security validate-sbom-artifact.
  --package-json <file>
                       Package metadata source for security validate-sbom-artifact or record-package-provenance-inputs; defaults to the plugin package.json.
  --sbom-validation <file>
                       SBOM validation report for security report-enterprise-readiness or record-package-provenance-inputs; repeat or comma-separate for multiples.
  --package-provenance-inputs <file>
                       Package provenance inputs record for security report-enterprise-readiness; repeat or comma-separate for multiples.
  --source-ref <value>
                       Explicit source ref label for security record-package-provenance-inputs; metadata only, not verified.
  --build-command <value>
                       Explicit build command label for security record-package-provenance-inputs; metadata only, never executed.
  --authorize-graph-source-mutation
                       Required explicit authorization flag for graph read-model apply-guarded-graph-update.
  --policy <file>      Policy boundary file for graph read-model report-graph-source-mutation-readiness, report-evidence-acceptance-readiness, record-evidence-decision, create-accepted-evidence-record, report-equivalence-proof-readiness, record-equivalence-proof, report-scope-ci-enforcement-readiness, security report-provider-network-policy, or security validate-rbac-policy.
  --readiness <file>   Optional Evidence Acceptance readiness provenance for graph read-model record-evidence-decision or create-accepted-evidence-record.
  --source-evidence <file>
                       Single candidate/source Evidence artifact for graph read-model record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, or record-runtime-evidence-satisfaction.
  --decision <value>   Explicit human decision value for graph read-model record-human-decision or record-evidence-decision.
  --reviewer <value>   Human reviewer identity for graph read-model record-human-decision or record-evidence-decision.
  --rationale <value>  Human-authored rationale for graph read-model record-human-decision or record-evidence-decision.
  --decision-actor-type <value>
                       Optional decision actor type for graph read-model record-human-decision or record-evidence-decision; only human is accepted.
  --decision-source <value>
                       Optional decision source for graph read-model record-human-decision or record-evidence-decision; explicit-cli-input or imported-human-review.
  --decision-timestamp <iso8601>
                       Optional explicit ISO8601 timestamp for graph read-model record-human-decision or record-evidence-decision.
  --runtime-report <file>
                       Optional runtime report input for graph read-model record-human-decision, record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, or report-stop-post-run-advisory.
  --apply-report <file>
                       Optional Graph Delta Apply report provenance for graph read-model record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, report-stop-post-run-advisory, or report-devview-baseline.
  --request-candidate <file>
                       Optional Request IR Candidate provenance for graph read-model record-evidence-decision.
  --candidate <file>   Request IR Candidate file for graph read-model validate-request-ir, generate-clarification-interview-pack, run-preflight-session, or report-user-prompt-submit-advisory.
  --schema-validation <file>
                       Schema-only Request IR validation file for graph read-model validate-request-ir-graph.
  --graph-validation <file>
                       Graph-aware Request IR validation file for graph read-model plan-traversal.
  --traversal-plan <file>
                       Graph Traversal Plan file for graph read-model generate-view-tree or select-slice.
  --view-tree <file>
                       View Tree preview file for extensions plan-context or graph read-model generate-contract-input.
  --selected-slice <file>
                       Compatibility alias for --view-tree.
  --contract-input <file>
                       Contract Compiler Input file for graph read-model generate-instruction-pack or extensions plan-context.
  --context-pack <file>
                       Context Pack input for extensions plan-context. Compatibility: --contract-input can also be used.
  --scaffold <file>    Hook script scaffold preview for graph read-model generate-hook-script-templates.
  --script-scaffold <file>
                       Hook script scaffold preview for graph read-model generate-hook-session-manifest.
  --script-templates <file>
                       Hook script template preview for graph read-model generate-hook-session-manifest, materialize-hook-script-bundle, or report-hook-activation-chain.
  --session-manifest <file>
                       Hook session manifest preview for graph read-model materialize-hook-script-bundle or report-hook-activation-chain.
  --bundle-dir <dir>   Optional repo-local output directory for graph read-model materialize-hook-script-bundle. Defaults to .tmp/devview-hook-script-bundle.
  --output-dir <dir>   Required output directory for graph read-model run-preflight-session.
  --session-id <id>    Optional deterministic session id for graph read-model run-preflight-session.
  --request <text>     Natural-language request text for graph read-model analyze-request.
  --prompt <text>      Raw UserPromptSubmit prompt text for graph read-model report-user-prompt-submit-advisory.
  --prompt-file <file> Prompt file for graph read-model report-user-prompt-submit-advisory.
  --pack <file>        AI Request Analyzer Pack file for graph read-model analyze-request.
  --provider-config <file>
                       Optional AI Request Analyzer provider config preview for graph read-model analyze-request or report-user-prompt-submit-advisory provenance.
  --external-candidate <file>
                       Explicit precomputed Request IR Candidate import for graph read-model analyze-request.
  --invoke-provider    Enable analyzer provider parsing for graph read-model analyze-request. Mock mode remains no-network; live OpenAI mode also requires --allow-network-provider and --provider-mode openai.
  --allow-network-provider
                       Explicit network gate for graph read-model analyze-request live provider mode. Valid only with --provider-mode openai.
  --provider-mode <mode>
                       Provider mode for graph read-model analyze-request. Currently supports openai only when paired with --allow-network-provider.
  --mock-provider-response <file>
                       Mock analyzer provider response preview for --invoke-provider; no real provider is called.
  --clarification-pack <file>
                       Clarification Interview Pack file for graph read-model revise-request-ir-candidate or run-clarification-chain.
  --answers <file>     Clarification answers file for graph read-model revise-request-ir-candidate or run-clarification-chain.
  --revised-candidate-output <file>
                       Revised Request IR Candidate output for graph read-model run-clarification-chain.
  --validation-output <file>
                       Schema-only Request IR validation output for graph read-model run-clarification-chain, or post-mutation validation output for graph read-model apply-graph-delta/apply-guarded-graph-update.
  --backup-dir <dir>   Backup directory for graph read-model apply-graph-delta or apply-guarded-graph-update.
  --read-model-output <file>
                       Regenerated read-model output for graph read-model apply-graph-delta or apply-guarded-graph-update.
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
  --hook-health <file> Hook Gateway health report or boundary file for graph read-model prepare-user-prompt-context, report-user-prompt-submit-advisory, or Hook Gateway health boundary for generate-hook-script-scaffold.
  --user-prompt-advisory <file>
                       UserPromptSubmit advisory report for graph read-model report-stop-post-run-advisory.
  --preflight-session <file>
                       Preflight session chain report for graph read-model report-user-prompt-submit-advisory or report-stop-post-run-advisory.
  --devview-mode <mode>
                       UserPromptSubmit advisory mode for graph read-model report-user-prompt-submit-advisory: off, advisory, guided, or strict-disabled.
  --analyzer-run <file>
                       Optional analyzer run provenance for graph read-model report-user-prompt-submit-advisory.
  --analyzer-pack <file>
                       Optional analyzer pack provenance for graph read-model report-user-prompt-submit-advisory.
  --install-trust <file>
                       Hook install/trust boundary for graph read-model generate-hook-script-scaffold.
  --user-prompt-context <file>
                       UserPromptSubmit context preview for graph read-model generate-hook-script-scaffold.
  --instruction-markdown <file>
                       Instruction Pack Markdown file for graph read-model prepare-user-prompt-context or report-stop-post-run-advisory.
  --changed-files <file>
                       Changed-file collection artifact for graph read-model report-stop-post-run-advisory.
  --scope-report <file>
                       Advisory scope report artifact for graph read-model record-evidence-decision, create-accepted-evidence-record, report-runtime-evidence-satisfaction-readiness, or report-stop-post-run-advisory.
  --required-evidence-id <id>
                       Required Evidence id for graph read-model report-runtime-evidence-satisfaction-readiness.
  --runtime-evidence-authority <file>
                       Optional runtime Evidence authority preview for graph read-model report-runtime-evidence-satisfaction-readiness.
  --evidence-check-binding <file>
                       Optional Evidence check binding preview for graph read-model report-runtime-evidence-satisfaction-readiness.
  --output-requirement <file>
                       Optional output requirement preview for graph read-model report-runtime-evidence-satisfaction-readiness.
  --check-report <file>
                       Optional check report provenance for graph read-model report-runtime-evidence-satisfaction-readiness.
  --schema <file>      Request IR Candidate schema file for graph read-model generate-ai-request-analyzer-pack.
  --project-profile <file>
                       Project Profile file for extensions report-readiness or extensions validate-native-retrofit-profile. Defaults to .devview/project-profile.json.
  --extensions-dir <dir>
                       Extension Manifest directory for extensions report-readiness. Defaults to .devview/extensions.
  --benchmark-suite <file>
                       Benchmark suite spec for benchmark evaluate-result.
  --benchmark-task <file>
                       Optional benchmark task spec for benchmark validate-graphify-import.
  --task <file>        Benchmark task spec for benchmark evaluate-result.
  --golden-answer <file>
                       Benchmark golden answer for benchmark evaluate-result.
  --candidate-result <file>
                       Stored benchmark candidate result for benchmark evaluate-result.
  --evaluations <files>
                       Comma-separated or repeatable benchmark evaluation reports for benchmark summarize-comparison.
  --graphify-export <file>
                       Static Graphify export fixture for benchmark validate-graphify-import.
  --mapping <file>     Static Graphify-to-DevView mapping fixture for benchmark validate-graphify-import.
  --base <ref>         Base git ref for graph read-model collect-changed-files or check-scope.
  --head <ref>         Head git ref for graph read-model collect-changed-files or check-scope.
  --working-tree       Use tracked unstaged working tree changes for graph read-model collect-changed-files or check-scope; mutually exclusive with --base/--head, --staged, and --untracked.
  --staged             Use staged index changes for graph read-model collect-changed-files or check-scope; mutually exclusive with --base/--head, --working-tree, and --untracked.
  --untracked          Use untracked files for graph read-model collect-changed-files or check-scope; mutually exclusive with --base/--head, --working-tree, and --staged.
`
}
