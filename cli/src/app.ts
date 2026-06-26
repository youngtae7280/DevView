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
    manual: undefined as string | undefined,
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
    } else if (arg === '--manual') {
      const value = argv[index + 1]
      if (!value) {
        return { error: '--manual requires a file path.' }
      }
      options.manual = value
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
