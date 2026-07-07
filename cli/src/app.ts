import process from 'node:process'
import { findPluginRoot, resolveRoot } from './core/fs.js'
import type { CliEnvironment, CliStageOption, ParsedArgs } from './core/types.js'
import { ExitCode } from './core/types.js'
import { runCommand } from './commands.js'
import { helpText, renderResult } from './reporters.js'

export interface CliRunResult {
  exitCode: ExitCode
  stdout: string
  stderr: string
}

export async function runDevViewCli(
  argv: string[],
  env: CliEnvironment = { cwd: process.cwd() },
): Promise<CliRunResult> {
  const pluginRoot = env.pluginRoot || findPluginRoot(import.meta.url)
  const parsed = parseArgs(argv, env.cwd)
  if ('error' in parsed) {
    const wantsJson = argv.includes('--json')
    return {
      exitCode: ExitCode.InvalidArguments,
      stdout: '',
      stderr: wantsJson
        ? `${JSON.stringify(
            {
              ok: false,
              command: 'parse',
              exitCode: ExitCode.InvalidArguments,
              issues: [
                {
                  validator: 'CLI',
                  code: 'INVALID_ARGUMENTS',
                  severity: 'error',
                  message: parsed.error,
                  suggestedFix: 'Run `devview --help` to see supported commands.',
                },
              ],
            },
            null,
            2,
          )}\n`
        : `${parsed.error}\nRun \`devview --help\` to see supported commands.\n`,
    }
  }

  if (parsed.positionals.length === 0 || parsed.positionals.includes('--help') || parsed.positionals.includes('-h')) {
    return {
      exitCode: ExitCode.Success,
      stdout: helpText(),
      stderr: '',
    }
  }

  if (parsed.positionals[0] === 'help') {
    return {
      exitCode: ExitCode.Success,
      stdout: helpText(),
      stderr: '',
    }
  }

  try {
    const result = await runCommand(parsed.positionals, {
      options: parsed.options,
      env: {
        cwd: env.cwd,
        pluginRoot,
      },
    })
    const output = renderResult(result, parsed.options.json)
    return {
      exitCode: result.exitCode,
      stdout: result.exitCode === ExitCode.Success ? output : '',
      stderr: result.exitCode === ExitCode.Success ? '' : output,
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error)
    return {
      exitCode: ExitCode.InternalError,
      stdout: '',
      stderr: parsed.options.json
        ? `${JSON.stringify({ ok: false, command: parsed.positionals.join(' '), exitCode: ExitCode.InternalError, issues: [{ validator: 'CLI', code: 'INTERNAL_ERROR', severity: 'error', message }] }, null, 2)}\n`
        : `DevView CLI internal error.\n\n${message}\n`,
    }
  }
}

function parseArgs(argv: string[], cwd: string): ParsedArgs | { error: string } {
  const positionals: string[] = []
  const options = {
    root: resolveRoot(cwd),
    json: false,
    verbose: false,
    noColor: false,
    force: false,
    apply: false,
    dryRun: false,
    all: false,
    workingTree: false,
    staged: false,
    untracked: false,
    profile: undefined as 'full' | 'lite' | 'bypass' | undefined,
    brief: undefined as string | undefined,
    maxChars: undefined as number | undefined,
    text: undefined as string | undefined,
    transition: undefined as string | undefined,
    files: [] as string[],
    stage: undefined as CliStageOption | undefined,
    summary: undefined as string | undefined,
    title: undefined as string | undefined,
    runId: undefined as string | undefined,
    source: undefined as string | undefined,
    change: undefined as string | undefined,
    patch: undefined as string | undefined,
    operation: undefined as string | undefined,
    product: [] as string[],
    work: [] as string[],
    test: [] as string[],
    evidence: [] as string[],
    acceptance: [] as string[],
    slice: undefined as string | undefined,
    slices: undefined as string | undefined,
    generated: undefined as string | undefined,
    readModel: undefined as string | undefined,
    graphSource: undefined as string | undefined,
    projectMemory: undefined as string | undefined,
    directionChange: undefined as string | undefined,
    record: undefined as string | undefined,
    instructionPack: undefined as string | undefined,
    graphDelta: undefined as string | undefined,
    applyPlan: undefined as string | undefined,
    targetRepo: undefined as string | undefined,
    manual: undefined as string | undefined,
    output: undefined as string | undefined,
    dataOutput: undefined as string | undefined,
    runOutput: undefined as string | undefined,
    markdown: undefined as string | undefined,
    request: undefined as string | undefined,
    prompt: undefined as string | undefined,
    promptFile: undefined as string | undefined,
    pack: undefined as string | undefined,
    analyzerRun: undefined as string | undefined,
    analyzerPack: undefined as string | undefined,
    providerConfig: undefined as string | undefined,
    externalCandidate: undefined as string | undefined,
    invokeProvider: false,
    allowNetworkProvider: false,
    providerMode: undefined as string | undefined,
    mockProviderResponse: undefined as string | undefined,
    proposal: undefined as string | undefined,
    dryRunReport: undefined as string | undefined,
    approvedApplyDryRun: undefined as string | undefined,
    reviewPacket: undefined as string | undefined,
    decisionRecord: undefined as string | undefined,
    evidenceDecision: undefined as string | undefined,
    acceptedEvidence: undefined as string | undefined,
    decision: undefined as string | undefined,
    reviewer: undefined as string | undefined,
    rationale: undefined as string | undefined,
    decisionActorType: undefined as string | undefined,
    decisionSource: undefined as string | undefined,
    decisionTimestamp: undefined as string | undefined,
    operator: undefined as string | undefined,
    authorizationRationale: undefined as string | undefined,
    authorizeGraphSourceMutation: false,
    payload: undefined as string | undefined,
    sourceArtifacts: undefined as string | undefined,
    previousEnvelope: undefined as string | undefined,
    requiredPermission: undefined as string | undefined,
    actorId: undefined as string | undefined,
    actorType: undefined as string | undefined,
    actorRole: undefined as string | undefined,
    runtimeReport: undefined as string | undefined,
    candidate: undefined as string | undefined,
    schemaValidation: undefined as string | undefined,
    graphValidation: undefined as string | undefined,
    traversalPlan: undefined as string | undefined,
    viewTree: undefined as string | undefined,
    selectedSlice: undefined as string | undefined,
    contextPack: undefined as string | undefined,
    contractInput: undefined as string | undefined,
    approvedState: undefined as string | undefined,
    approvedStateBoundary: undefined as string | undefined,
    applyBoundary: undefined as string | undefined,
    applyReadiness: undefined as string | undefined,
    mutationPolicy: undefined as string | undefined,
    backupDir: undefined as string | undefined,
    readModelOutput: undefined as string | undefined,
    mutationReadiness: undefined as string | undefined,
    readiness: undefined as string | undefined,
    sourceEvidence: undefined as string | undefined,
    runtimeEvidenceAuthority: undefined as string | undefined,
    evidenceCheckBinding: undefined as string | undefined,
    outputRequirement: undefined as string | undefined,
    requiredEvidenceId: undefined as string | undefined,
    runtimeEvidenceSatisfactionRecord: undefined as string | undefined,
    runtimeEvidenceSatisfactionReadiness: undefined as string | undefined,
    evidenceAcceptanceReadiness: undefined as string | undefined,
    equivalenceProofReadiness: undefined as string | undefined,
    equivalenceProofRecord: undefined as string | undefined,
    policy: undefined as string | undefined,
    applyReport: undefined as string | undefined,
    checkReport: undefined as string | undefined,
    requestCandidate: undefined as string | undefined,
    scaffold: undefined as string | undefined,
    scriptScaffold: undefined as string | undefined,
    scriptTemplates: undefined as string | undefined,
    sessionManifest: undefined as string | undefined,
    bundleDir: undefined as string | undefined,
    outputDir: undefined as string | undefined,
    sessionId: undefined as string | undefined,
    clarificationPack: undefined as string | undefined,
    answers: undefined as string | undefined,
    revisedCandidateOutput: undefined as string | undefined,
    validationOutput: undefined as string | undefined,
    boundary: undefined as string | undefined,
    intake: undefined as string | undefined,
    frontendChain: undefined as string | undefined,
    baseline: undefined as string | undefined,
    roadmapAudit: undefined as string | undefined,
    finalHandoff: undefined as string | undefined,
    hookActivationChain: undefined as string | undefined,
    extensionReadiness: undefined as string | undefined,
    extensionProfileCatalog: undefined as string | undefined,
    extensionContextPlan: undefined as string | undefined,
    extensionAdapterCompatibilityReport: undefined as string | undefined,
    nativeRetrofitProfileValidationReport: undefined as string | undefined,
    scopeCiEnforcementReadiness: undefined as string | undefined,
    scopeCiEnforcementRecord: undefined as string | undefined,
    guardedGraphUpdateBoundaryRecord: undefined as string | undefined,
    guardedGraphUpdateApplyPlan: undefined as string | undefined,
    guardedGraphUpdateApplyReport: undefined as string | undefined,
    hookHealth: undefined as string | undefined,
    userPromptAdvisory: undefined as string | undefined,
    preflightSession: undefined as string | undefined,
    devviewMode: undefined as string | undefined,
    installTrust: undefined as string | undefined,
    userPromptContext: undefined as string | undefined,
    instructionMarkdown: undefined as string | undefined,
    changedFiles: undefined as string | undefined,
    scopeReport: undefined as string | undefined,
    schema: undefined as string | undefined,
    projectProfile: undefined as string | undefined,
    extensionsDir: undefined as string | undefined,
    benchmarkSuite: undefined as string | undefined,
    benchmarkTask: undefined as string | undefined,
    tasks: undefined as string | undefined,
    task: undefined as string | undefined,
    goldenAnswer: undefined as string | undefined,
    goldenAnswers: undefined as string | undefined,
    candidateResult: undefined as string | undefined,
    candidateResults: undefined as string | undefined,
    evaluations: undefined as string | undefined,
    comparisonSummary: undefined as string | undefined,
    graphifyImportValidations: undefined as string | undefined,
    suiteLock: undefined as string | undefined,
    governancePolicy: undefined as string | undefined,
    benchmarkGovernanceVerification: undefined as string | undefined,
    releaseSurfaceValidation: undefined as string | undefined,
    providerNetworkPolicyReport: undefined as string | undefined,
    enterpriseReadiness: undefined as string | undefined,
    graphifyExport: undefined as string | undefined,
    mapping: undefined as string | undefined,
    base: undefined as string | undefined,
    head: undefined as string | undefined,
    scope: undefined as string | undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') {
      options.json = true
    } else if (arg === '--verbose') {
      options.verbose = true
    } else if (arg === '--no-color') {
      options.noColor = true
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--apply') {
      options.apply = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--all') {
      options.all = true
    } else if (arg === '--working-tree') {
      options.workingTree = true
    } else if (arg === '--staged') {
      options.staged = true
    } else if (arg === '--untracked') {
      options.untracked = true
    } else if (arg === '--root') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--root requires a path.' }
      }
      options.root = resolveRoot(value)
      index += 1
    } else if (arg === '--profile') {
      const value = argv[index + 1]
      if (!value || !['full', 'lite', 'bypass'].includes(value)) {
        return { error: '--profile requires one of: full, lite, bypass.' }
      }
      options.profile = value as 'full' | 'lite' | 'bypass'
      index += 1
    } else if (arg === '--brief') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--brief requires text.' }
      }
      options.brief = value
      index += 1
    } else if (arg === '--max-chars') {
      const value = argv[index + 1]
      const parsed = Number(value)
      if (!value || !Number.isInteger(parsed) || parsed <= 0) {
        return { error: '--max-chars requires a positive integer.' }
      }
      options.maxChars = parsed
      index += 1
    } else if (arg === '--text') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--text requires text.' }
      }
      options.text = value
      index += 1
    } else if (arg === '--transition') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--transition requires a value.' }
      }
      options.transition = value
      index += 1
    } else if (arg === '--files') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--files requires a comma-separated file list.' }
      }
      options.files.push(...splitIds(value))
      index += 1
    } else if (arg === '--summary') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--summary requires text.' }
      }
      options.summary = value
      index += 1
    } else if (arg === '--title') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--title requires text.' }
      }
      options.title = value
      index += 1
    } else if (arg === '--run-id') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--run-id requires a stable run id.' }
      }
      options.runId = value
      index += 1
    } else if (arg === '--source') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--source requires text.' }
      }
      options.source = value
      index += 1
    } else if (arg === '--change') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--change requires a Change node id.' }
      }
      options.change = value
      index += 1
    } else if (arg === '--patch') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--patch requires a Product Patch node id.' }
      }
      options.patch = value
      index += 1
    } else if (arg === '--operation') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--operation requires a Product Patch operation.' }
      }
      options.operation = value
      index += 1
    } else if (arg === '--product') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--product requires a Product node id.' }
      }
      options.product.push(...splitIds(value))
      index += 1
    } else if (arg === '--work') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--work requires a Work node id.' }
      }
      options.work.push(...splitIds(value))
      index += 1
    } else if (arg === '--test') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--test requires a Test node id.' }
      }
      options.test.push(...splitIds(value))
      index += 1
    } else if (arg === '--evidence') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--evidence requires an Evidence node id.' }
      }
      options.evidence.push(...splitIds(value))
      index += 1
    } else if (arg === '--acceptance') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--acceptance requires an Acceptance node id.' }
      }
      options.acceptance.push(...splitIds(value))
      index += 1
    } else if (arg === '--slice') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--slice requires a path.' }
      }
      options.slice = value
      index += 1
    } else if (arg === '--slices') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--slices requires comma-separated slice paths.' }
      }
      options.slices = value
      index += 1
    } else if (arg === '--generated') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--generated requires a file path.' }
      }
      options.generated = value
      index += 1
    } else if (arg === '--graph-source') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--graph-source requires a file path.' }
      }
      options.graphSource = value
      index += 1
    } else if (arg === '--read-model') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--read-model requires a file path.' }
      }
      options.readModel = value
      index += 1
    } else if (arg === '--project-memory') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--project-memory requires a file path.' }
      }
      options.projectMemory = value
      index += 1
    } else if (arg === '--direction-change') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--direction-change requires a file path.' }
      }
      options.directionChange = value
      index += 1
    } else if (arg === '--record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--record requires a record id.' }
      }
      options.record = value
      index += 1
    } else if (arg === '--instruction-pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--instruction-pack requires a file path.' }
      }
      options.instructionPack = value
      index += 1
    } else if (arg === '--graph-delta') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--graph-delta requires a file path.' }
      }
      options.graphDelta = value
      index += 1
    } else if (arg === '--apply-plan') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--apply-plan requires a file path.' }
      }
      options.applyPlan = value
      index += 1
    } else if (arg === '--target-repo') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--target-repo requires a path.' }
      }
      options.targetRepo = value
      index += 1
    } else if (arg === '--manual') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--manual requires a file path.' }
      }
      options.manual = value
      index += 1
    } else if (arg === '--output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--output requires a file path.' }
      }
      options.output = value
      index += 1
    } else if (arg === '--data-output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--data-output requires a file path.' }
      }
      options.dataOutput = value
      index += 1
    } else if (arg === '--run-output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--run-output requires a file path.' }
      }
      options.runOutput = value
      index += 1
    } else if (arg === '--markdown') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--markdown requires a file path.' }
      }
      options.markdown = value
      index += 1
    } else if (arg === '--request') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--request requires text.' }
      }
      options.request = value
      index += 1
    } else if (arg === '--prompt') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--prompt requires text.' }
      }
      options.prompt = value
      index += 1
    } else if (arg === '--prompt-file') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--prompt-file requires a file path.' }
      }
      options.promptFile = value
      index += 1
    } else if (arg === '--pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--pack requires a file path.' }
      }
      options.pack = value
      index += 1
    } else if (arg === '--analyzer-run') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--analyzer-run requires a file path.' }
      }
      options.analyzerRun = value
      index += 1
    } else if (arg === '--analyzer-pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--analyzer-pack requires a file path.' }
      }
      options.analyzerPack = value
      index += 1
    } else if (arg === '--provider-config') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--provider-config requires a file path.' }
      }
      options.providerConfig = value
      index += 1
    } else if (arg === '--invoke-provider') {
      options.invokeProvider = true
    } else if (arg === '--allow-network-provider') {
      options.allowNetworkProvider = true
    } else if (arg === '--provider-mode') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--provider-mode requires a provider mode.' }
      }
      options.providerMode = value
      index += 1
    } else if (arg === '--mock-provider-response') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--mock-provider-response requires a file path.' }
      }
      options.mockProviderResponse = value
      index += 1
    } else if (arg === '--external-candidate') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--external-candidate requires a file path.' }
      }
      options.externalCandidate = value
      index += 1
    } else if (arg === '--proposal') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--proposal requires a file path.' }
      }
      options.proposal = value
      index += 1
    } else if (arg === '--dry-run-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--dry-run-report requires a file path.' }
      }
      options.dryRunReport = value
      index += 1
    } else if (arg === '--approved-apply-dry-run') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--approved-apply-dry-run requires a file path.' }
      }
      options.approvedApplyDryRun = value
      index += 1
    } else if (arg === '--review-packet') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--review-packet requires a file path.' }
      }
      options.reviewPacket = value
      index += 1
    } else if (arg === '--decision-record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--decision-record requires a file path.' }
      }
      options.decisionRecord = value
      index += 1
    } else if (arg === '--evidence-decision') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--evidence-decision requires a file path.' }
      }
      options.evidenceDecision = value
      index += 1
    } else if (arg === '--accepted-evidence') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--accepted-evidence requires a file path.' }
      }
      options.acceptedEvidence = value
      index += 1
    } else if (arg === '--decision') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--decision requires a value.' }
      }
      options.decision = value
      index += 1
    } else if (arg === '--reviewer') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--reviewer requires a value.' }
      }
      options.reviewer = value
      index += 1
    } else if (arg === '--rationale') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--rationale requires a value.' }
      }
      options.rationale = value
      index += 1
    } else if (arg === '--decision-actor-type') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--decision-actor-type requires a value.' }
      }
      options.decisionActorType = value
      index += 1
    } else if (arg === '--decision-source') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--decision-source requires a value.' }
      }
      options.decisionSource = value
      index += 1
    } else if (arg === '--decision-timestamp') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--decision-timestamp requires a value.' }
      }
      options.decisionTimestamp = value
      index += 1
    } else if (arg === '--operator') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--operator requires a value.' }
      }
      options.operator = value
      index += 1
    } else if (arg === '--authorization-rationale') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--authorization-rationale requires a value.' }
      }
      options.authorizationRationale = value
      index += 1
    } else if (arg === '--authorize-graph-source-mutation') {
      options.authorizeGraphSourceMutation = true
    } else if (arg === '--payload') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--payload requires a file path.' }
      }
      options.payload = value
      index += 1
    } else if (arg === '--source-artifacts') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--source-artifacts requires one or more file paths.' }
      }
      options.sourceArtifacts = options.sourceArtifacts ? `${options.sourceArtifacts},${value}` : value
      index += 1
    } else if (arg === '--previous-envelope') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--previous-envelope requires a file path.' }
      }
      options.previousEnvelope = value
      index += 1
    } else if (arg === '--required-permission') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--required-permission requires a value.' }
      }
      options.requiredPermission = value
      index += 1
    } else if (arg === '--actor-id') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--actor-id requires a value.' }
      }
      options.actorId = value
      index += 1
    } else if (arg === '--actor-type') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--actor-type requires a value.' }
      }
      options.actorType = value
      index += 1
    } else if (arg === '--actor-role') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--actor-role requires a value.' }
      }
      options.actorRole = options.actorRole ? `${options.actorRole},${value}` : value
      index += 1
    } else if (arg === '--runtime-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--runtime-report requires a file path.' }
      }
      options.runtimeReport = value
      index += 1
    } else if (arg === '--candidate') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--candidate requires a file path.' }
      }
      options.candidate = value
      index += 1
    } else if (arg === '--schema-validation') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--schema-validation requires a file path.' }
      }
      options.schemaValidation = value
      index += 1
    } else if (arg === '--graph-validation') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--graph-validation requires a file path.' }
      }
      options.graphValidation = value
      index += 1
    } else if (arg === '--traversal-plan') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--traversal-plan requires a file path.' }
      }
      options.traversalPlan = value
      index += 1
    } else if (arg === '--view-tree') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--view-tree requires a file path.' }
      }
      options.viewTree = value
      index += 1
    } else if (arg === '--selected-slice') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--selected-slice requires a file path.' }
      }
      options.selectedSlice = value
      index += 1
    } else if (arg === '--contract-input') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--contract-input requires a file path.' }
      }
      options.contractInput = value
      index += 1
    } else if (arg === '--context-pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--context-pack requires a file path.' }
      }
      options.contextPack = value
      index += 1
    } else if (arg === '--approved-state') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--approved-state requires a file path.' }
      }
      options.approvedState = value
      index += 1
    } else if (arg === '--approved-state-boundary') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--approved-state-boundary requires a file path.' }
      }
      options.approvedStateBoundary = value
      index += 1
    } else if (arg === '--apply-boundary') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--apply-boundary requires a file path.' }
      }
      options.applyBoundary = value
      index += 1
    } else if (arg === '--apply-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--apply-readiness requires a file path.' }
      }
      options.applyReadiness = value
      index += 1
    } else if (arg === '--mutation-policy') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--mutation-policy requires a file path.' }
      }
      options.mutationPolicy = value
      index += 1
    } else if (arg === '--backup-dir') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--backup-dir requires a directory path.' }
      }
      options.backupDir = value
      index += 1
    } else if (arg === '--read-model-output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--read-model-output requires a file path.' }
      }
      options.readModelOutput = value
      index += 1
    } else if (arg === '--mutation-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--mutation-readiness requires a file path.' }
      }
      options.mutationReadiness = value
      index += 1
    } else if (arg === '--readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--readiness requires a file path.' }
      }
      options.readiness = value
      index += 1
    } else if (arg === '--source-evidence') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--source-evidence requires a file path.' }
      }
      options.sourceEvidence = value
      index += 1
    } else if (arg === '--runtime-evidence-authority') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--runtime-evidence-authority requires a file path.' }
      }
      options.runtimeEvidenceAuthority = value
      index += 1
    } else if (arg === '--evidence-check-binding') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--evidence-check-binding requires a file path.' }
      }
      options.evidenceCheckBinding = value
      index += 1
    } else if (arg === '--output-requirement') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--output-requirement requires a file path.' }
      }
      options.outputRequirement = value
      index += 1
    } else if (arg === '--required-evidence-id') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--required-evidence-id requires a value.' }
      }
      options.requiredEvidenceId = value
      index += 1
    } else if (arg === '--runtime-evidence-satisfaction-record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--runtime-evidence-satisfaction-record requires a file path.' }
      }
      options.runtimeEvidenceSatisfactionRecord = value
      index += 1
    } else if (arg === '--runtime-evidence-satisfaction-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--runtime-evidence-satisfaction-readiness requires a file path.' }
      }
      options.runtimeEvidenceSatisfactionReadiness = value
      index += 1
    } else if (arg === '--evidence-acceptance-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--evidence-acceptance-readiness requires a file path.' }
      }
      options.evidenceAcceptanceReadiness = value
      index += 1
    } else if (arg === '--equivalence-proof-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--equivalence-proof-readiness requires a file path.' }
      }
      options.equivalenceProofReadiness = value
      index += 1
    } else if (arg === '--equivalence-proof-record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--equivalence-proof-record requires a file path.' }
      }
      options.equivalenceProofRecord = value
      index += 1
    } else if (arg === '--policy') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--policy requires a file path.' }
      }
      options.policy = value
      index += 1
    } else if (arg === '--scope-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scope-report requires a file path.' }
      }
      options.scopeReport = value
      index += 1
    } else if (arg === '--apply-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--apply-report requires a file path.' }
      }
      options.applyReport = value
      index += 1
    } else if (arg === '--check-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--check-report requires a file path.' }
      }
      options.checkReport = value
      index += 1
    } else if (arg === '--request-candidate') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--request-candidate requires a file path.' }
      }
      options.requestCandidate = value
      index += 1
    } else if (arg === '--scaffold') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scaffold requires a file path.' }
      }
      options.scaffold = value
      index += 1
    } else if (arg === '--script-scaffold') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--script-scaffold requires a file path.' }
      }
      options.scriptScaffold = value
      index += 1
    } else if (arg === '--script-templates') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--script-templates requires a file path.' }
      }
      options.scriptTemplates = value
      index += 1
    } else if (arg === '--session-manifest') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--session-manifest requires a file path.' }
      }
      options.sessionManifest = value
      index += 1
    } else if (arg === '--bundle-dir') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--bundle-dir requires a directory path.' }
      }
      options.bundleDir = value
      index += 1
    } else if (arg === '--output-dir') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--output-dir requires a directory path.' }
      }
      options.outputDir = value
      index += 1
    } else if (arg === '--session-id') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--session-id requires a value.' }
      }
      options.sessionId = value
      index += 1
    } else if (arg === '--clarification-pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--clarification-pack requires a file path.' }
      }
      options.clarificationPack = value
      index += 1
    } else if (arg === '--answers') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--answers requires a file path.' }
      }
      options.answers = value
      index += 1
    } else if (arg === '--revised-candidate-output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--revised-candidate-output requires a file path.' }
      }
      options.revisedCandidateOutput = value
      index += 1
    } else if (arg === '--validation-output') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--validation-output requires a file path.' }
      }
      options.validationOutput = value
      index += 1
    } else if (arg === '--boundary') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--boundary requires a file path.' }
      }
      options.boundary = value
      index += 1
    } else if (arg === '--intake') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--intake requires a file path.' }
      }
      options.intake = value
      index += 1
    } else if (arg === '--frontend-chain') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--frontend-chain requires a file path.' }
      }
      options.frontendChain = value
      index += 1
    } else if (arg === '--baseline') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--baseline requires a file path.' }
      }
      options.baseline = value
      index += 1
    } else if (arg === '--roadmap-audit') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--roadmap-audit requires a file path.' }
      }
      options.roadmapAudit = value
      index += 1
    } else if (arg === '--final-handoff') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--final-handoff requires a file path.' }
      }
      options.finalHandoff = value
      index += 1
    } else if (arg === '--hook-activation-chain') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--hook-activation-chain requires a file path.' }
      }
      options.hookActivationChain = value
      index += 1
    } else if (arg === '--extension-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--extension-readiness requires a file path.' }
      }
      options.extensionReadiness = value
      index += 1
    } else if (arg === '--extension-profile-catalog') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--extension-profile-catalog requires a file path.' }
      }
      options.extensionProfileCatalog = value
      index += 1
    } else if (arg === '--extension-context-plan') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--extension-context-plan requires a file path.' }
      }
      options.extensionContextPlan = value
      index += 1
    } else if (arg === '--extension-adapter-compatibility-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--extension-adapter-compatibility-report requires a file path.' }
      }
      options.extensionAdapterCompatibilityReport = value
      index += 1
    } else if (arg === '--native-retrofit-profile-validation-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--native-retrofit-profile-validation-report requires a file path.' }
      }
      options.nativeRetrofitProfileValidationReport = value
      index += 1
    } else if (arg === '--scope-ci-enforcement-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scope-ci-enforcement-readiness requires a file path.' }
      }
      options.scopeCiEnforcementReadiness = value
      index += 1
    } else if (arg === '--scope-ci-enforcement-record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scope-ci-enforcement-record requires a file path.' }
      }
      options.scopeCiEnforcementRecord = value
      index += 1
    } else if (arg === '--guarded-graph-update-boundary-record') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--guarded-graph-update-boundary-record requires a file path.' }
      }
      options.guardedGraphUpdateBoundaryRecord = value
      index += 1
    } else if (arg === '--guarded-graph-update-apply-plan') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--guarded-graph-update-apply-plan requires a file path.' }
      }
      options.guardedGraphUpdateApplyPlan = value
      index += 1
    } else if (arg === '--guarded-graph-update-apply-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--guarded-graph-update-apply-report requires a file path.' }
      }
      options.guardedGraphUpdateApplyReport = value
      index += 1
    } else if (arg === '--hook-health') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--hook-health requires a file path.' }
      }
      options.hookHealth = value
      index += 1
    } else if (arg === '--user-prompt-advisory') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--user-prompt-advisory requires a file path.' }
      }
      options.userPromptAdvisory = value
      index += 1
    } else if (arg === '--preflight-session') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--preflight-session requires a file path.' }
      }
      options.preflightSession = value
      index += 1
    } else if (arg === '--devview-mode') {
      const value = argv[index + 1]
      if (!value || !['off', 'advisory', 'guided', 'strict-disabled'].includes(value)) {
        return { error: '--devview-mode requires one of: off, advisory, guided, strict-disabled.' }
      }
      options.devviewMode = value
      index += 1
    } else if (arg === '--install-trust') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--install-trust requires a file path.' }
      }
      options.installTrust = value
      index += 1
    } else if (arg === '--user-prompt-context') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--user-prompt-context requires a file path.' }
      }
      options.userPromptContext = value
      index += 1
    } else if (arg === '--instruction-markdown') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--instruction-markdown requires a file path.' }
      }
      options.instructionMarkdown = value
      index += 1
    } else if (arg === '--changed-files') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--changed-files requires a file path.' }
      }
      options.changedFiles = value
      index += 1
    } else if (arg === '--scope-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scope-report requires a file path.' }
      }
      options.scopeReport = value
      index += 1
    } else if (arg === '--schema') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--schema requires a file path.' }
      }
      options.schema = value
      index += 1
    } else if (arg === '--project-profile') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--project-profile requires a file path.' }
      }
      options.projectProfile = value
      index += 1
    } else if (arg === '--extensions-dir') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--extensions-dir requires a directory path.' }
      }
      options.extensionsDir = value
      index += 1
    } else if (arg === '--benchmark-suite') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--benchmark-suite requires a file path.' }
      }
      options.benchmarkSuite = value
      index += 1
    } else if (arg === '--benchmark-task') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--benchmark-task requires a file path.' }
      }
      options.benchmarkTask = value
      index += 1
    } else if (arg === '--tasks') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--tasks requires one or more file paths.' }
      }
      options.tasks = options.tasks ? `${options.tasks},${value}` : value
      index += 1
    } else if (arg === '--task') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--task requires a file path.' }
      }
      options.task = value
      index += 1
    } else if (arg === '--golden-answer') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--golden-answer requires a file path.' }
      }
      options.goldenAnswer = value
      index += 1
    } else if (arg === '--golden-answers') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--golden-answers requires one or more file paths.' }
      }
      options.goldenAnswers = options.goldenAnswers ? `${options.goldenAnswers},${value}` : value
      index += 1
    } else if (arg === '--candidate-result') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--candidate-result requires a file path.' }
      }
      options.candidateResult = value
      index += 1
    } else if (arg === '--candidate-results') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--candidate-results requires one or more file paths.' }
      }
      options.candidateResults = options.candidateResults ? `${options.candidateResults},${value}` : value
      index += 1
    } else if (arg === '--evaluations') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--evaluations requires one or more file paths.' }
      }
      options.evaluations = options.evaluations ? `${options.evaluations},${value}` : value
      index += 1
    } else if (arg === '--comparison-summary') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--comparison-summary requires a file path.' }
      }
      options.comparisonSummary = value
      index += 1
    } else if (arg === '--graphify-import-validations') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--graphify-import-validations requires one or more file paths.' }
      }
      options.graphifyImportValidations = options.graphifyImportValidations
        ? `${options.graphifyImportValidations},${value}`
        : value
      index += 1
    } else if (arg === '--suite-lock') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--suite-lock requires a file path.' }
      }
      options.suiteLock = value
      index += 1
    } else if (arg === '--governance-policy') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--governance-policy requires a file path.' }
      }
      options.governancePolicy = value
      index += 1
    } else if (arg === '--benchmark-governance-verification') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--benchmark-governance-verification requires a file path.' }
      }
      options.benchmarkGovernanceVerification = value
      index += 1
    } else if (arg === '--release-surface-validation') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--release-surface-validation requires a file path.' }
      }
      options.releaseSurfaceValidation = value
      index += 1
    } else if (arg === '--provider-network-policy-report') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--provider-network-policy-report requires a file path.' }
      }
      options.providerNetworkPolicyReport = value
      index += 1
    } else if (arg === '--enterprise-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--enterprise-readiness requires a file path.' }
      }
      options.enterpriseReadiness = value
      index += 1
    } else if (arg === '--graphify-export') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--graphify-export requires a file path.' }
      }
      options.graphifyExport = value
      index += 1
    } else if (arg === '--mapping') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--mapping requires a file path.' }
      }
      options.mapping = value
      index += 1
    } else if (arg === '--base') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--base requires a git ref.' }
      }
      options.base = value
      index += 1
    } else if (arg === '--head') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--head requires a git ref.' }
      }
      options.head = value
      index += 1
    } else if (arg === '--scope') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--scope requires a value.' }
      }
      options.scope = value
      index += 1
    } else if (arg === '--stage') {
      const value = argv[index + 1]
      if (
        !value ||
        ![
          'start',
          'product-intake',
          'work-planning',
          'verification-design',
          'execution',
          'review',
          'revision',
          'product-patch',
          'parallel',
          'documentation',
          'docs',
          'accept',
        ].includes(value)
      ) {
        return {
          error:
            '--stage requires one of: start, product-intake, work-planning, verification-design, execution, review, revision, product-patch, parallel, documentation, docs, accept.',
        }
      }
      options.stage = value as CliStageOption
      index += 1
    } else if (arg.startsWith('--') && arg !== '--help') {
      return { error: `Unknown option: ${arg}` }
    } else {
      positionals.push(arg)
    }
  }

  return { positionals, options }
}

function splitIds(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}
