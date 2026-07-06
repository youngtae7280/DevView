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

export async function runPbeCli(argv: string[], env: CliEnvironment = { cwd: process.cwd() }): Promise<CliRunResult> {
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
                  suggestedFix: 'Run `pbe --help` to see supported commands.',
                },
              ],
            },
            null,
            2,
          )}\n`
        : `${parsed.error}\nRun \`pbe --help\` to see supported commands.\n`,
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
        : `PBE CLI internal error.\n\n${message}\n`,
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
    profile: undefined as 'full' | 'lite' | 'bypass' | undefined,
    brief: undefined as string | undefined,
    maxChars: undefined as number | undefined,
    text: undefined as string | undefined,
    transition: undefined as string | undefined,
    files: [] as string[],
    stage: undefined as CliStageOption | undefined,
    summary: undefined as string | undefined,
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
    graphSource: undefined as string | undefined,
    record: undefined as string | undefined,
    instructionPack: undefined as string | undefined,
    graphDelta: undefined as string | undefined,
    targetRepo: undefined as string | undefined,
    manual: undefined as string | undefined,
    output: undefined as string | undefined,
    dataOutput: undefined as string | undefined,
    markdown: undefined as string | undefined,
    request: undefined as string | undefined,
    pack: undefined as string | undefined,
    externalCandidate: undefined as string | undefined,
    proposal: undefined as string | undefined,
    reviewPacket: undefined as string | undefined,
    decisionRecord: undefined as string | undefined,
    decision: undefined as string | undefined,
    reviewer: undefined as string | undefined,
    rationale: undefined as string | undefined,
    runtimeReport: undefined as string | undefined,
    candidate: undefined as string | undefined,
    schemaValidation: undefined as string | undefined,
    graphValidation: undefined as string | undefined,
    traversalPlan: undefined as string | undefined,
    selectedSlice: undefined as string | undefined,
    contractInput: undefined as string | undefined,
    approvedState: undefined as string | undefined,
    applyReadiness: undefined as string | undefined,
    mutationReadiness: undefined as string | undefined,
    evidenceAcceptanceReadiness: undefined as string | undefined,
    equivalenceProofReadiness: undefined as string | undefined,
    policy: undefined as string | undefined,
    scaffold: undefined as string | undefined,
    scriptScaffold: undefined as string | undefined,
    scriptTemplates: undefined as string | undefined,
    sessionManifest: undefined as string | undefined,
    bundleDir: undefined as string | undefined,
    clarificationPack: undefined as string | undefined,
    answers: undefined as string | undefined,
    boundary: undefined as string | undefined,
    intake: undefined as string | undefined,
    frontendChain: undefined as string | undefined,
    hookHealth: undefined as string | undefined,
    installTrust: undefined as string | undefined,
    userPromptContext: undefined as string | undefined,
    instructionMarkdown: undefined as string | undefined,
    schema: undefined as string | undefined,
    chainCommand: undefined as string | undefined,
    base: undefined as string | undefined,
    head: undefined as string | undefined,
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
    } else if (arg === '--pack') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--pack requires a file path.' }
      }
      options.pack = value
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
    } else if (arg === '--approved-state') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--approved-state requires a file path.' }
      }
      options.approvedState = value
      index += 1
    } else if (arg === '--apply-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--apply-readiness requires a file path.' }
      }
      options.applyReadiness = value
      index += 1
    } else if (arg === '--mutation-readiness') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--mutation-readiness requires a file path.' }
      }
      options.mutationReadiness = value
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
    } else if (arg === '--policy') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--policy requires a file path.' }
      }
      options.policy = value
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
    } else if (arg === '--hook-health') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--hook-health requires a file path.' }
      }
      options.hookHealth = value
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
    } else if (arg === '--schema') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--schema requires a file path.' }
      }
      options.schema = value
      index += 1
    } else if (arg === '--chain-command') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--chain-command requires a command name.' }
      }
      options.chainCommand = value
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
    } else if (arg === '--stage') {
      const value = argv[index + 1]
      if (
        !value ||
        ![
          'start',
          'rpd',
          'wpd',
          'vd',
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
            '--stage requires one of: start, rpd, wpd, vd, execution, review, revision, product-patch, parallel, documentation, docs, accept.',
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
