import { relativePath } from '../core/fs.js'
import {
  compareReadModelEvidence,
  generateReadModelEvidence,
  summarizeReadModelEvidence,
  validateAllReadModelEvidence,
  validateReadModelEvidence,
} from '../core/read-model-evidence.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import { type CommandContext, invalidCommand } from './shared.js'

export async function graphReadModelGenerateCommand(context: CommandContext): Promise<CommandResult> {
  const slice = context.options.slice
  if (!slice) {
    return invalidCommand('graph read-model generate requires --slice <path>.')
  }
  const result = await generateReadModelEvidence(context.options.root, slice)
  return {
    ok: true,
    command: 'graph read-model generate',
    exitCode: ExitCode.Success,
    message: 'Generated read-model Evidence created.',
    issues: [],
    data: {
      generatedReadModel: relativePath(context.options.root, result.generatedJsonPath),
      generatedSummary: relativePath(context.options.root, result.generatedMarkdownPath),
      evidenceManifest: relativePath(context.options.root, result.manifestPath),
      nodeCount: result.model.nodes.length,
      edgeCount: result.model.edges.length,
      sourceAuthorityBoundary: result.model.sourceAuthorityBoundary,
      nonPromotionStatement: result.model.nonPromotionStatement,
    },
  }
}

export async function graphReadModelCompareCommand(context: CommandContext): Promise<CommandResult> {
  const generated = context.options.generated
  const manual = context.options.manual
  if (!generated) {
    return invalidCommand('graph read-model compare requires --generated <file>.')
  }
  if (!manual) {
    return invalidCommand('graph read-model compare requires --manual <file>.')
  }
  const result = await compareReadModelEvidence(context.options.root, generated, manual)
  return {
    ok: true,
    command: 'graph read-model compare',
    exitCode: ExitCode.Success,
    message: 'Generated/manual read-model parity report created.',
    issues: [],
    data: {
      parityReport: relativePath(context.options.root, result.reportJsonPath),
      paritySummary: relativePath(context.options.root, result.reportMarkdownPath),
      status: result.report.summary.status,
      mismatchCount: result.report.summary.mismatchCount,
      blockingCount: result.report.summary.blockingCount,
      decisionRequiredCount: result.report.summary.decisionRequiredCount,
      sourceAuthorityBoundary: result.report.sourceAuthorityBoundary,
      nonPromotionStatement: result.report.nonPromotionStatement,
    },
  }
}

export async function graphReadModelValidateCommand(context: CommandContext): Promise<CommandResult> {
  if (context.options.all) {
    try {
      const result = await validateAllReadModelEvidence(context.options.root)
      const aggregate = result.aggregateResult.summary
      const failed = aggregate.status === 'aggregate-blocked' || aggregate.status === 'decision-required'
      return {
        ok: !failed,
        command: 'graph read-model validate --all',
        exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
        message: 'Registry-backed read-model validate-all Evidence created.',
        issues: [],
        data: {
          status: aggregate.status,
          aggregateStatus: aggregate.status,
          registryPath: result.registryPath,
          includedProfiles: result.includedProfiles,
          perSliceResults: result.perSliceResults,
          aggregateSummary: relativePath(context.options.root, result.aggregateResult.summaryJsonPath),
          aggregateSummaryMarkdown: relativePath(context.options.root, result.aggregateResult.summaryMarkdownPath),
          sliceCount: aggregate.summary.sliceCount,
          warningCount: aggregate.summary.warningCount,
          blockingCount: aggregate.summary.blockingCount,
          decisionRequiredCount: aggregate.summary.decisionRequiredCount,
          sourceAuthorityBoundary: result.sourceAuthorityBoundary,
          nonPromotionStatement: result.nonPromotionStatement,
          nonEnforcementStatement: result.nonEnforcementStatement,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        ok: false,
        command: 'graph read-model validate --all',
        exitCode: ExitCode.ValidationFailed,
        message: 'Registry-backed read-model validate-all failed.',
        issues: [
          issue({
            validator: 'ReadModelRegistry',
            code: 'READ_MODEL_VALIDATE_ALL_FAILED',
            severity: 'error',
            message,
            suggestedFix: 'Fix the registry/profile mismatch or run scoped read-model commands for the affected slice.',
          }),
        ],
      }
    }
  }

  const slice = context.options.slice
  if (!slice) {
    return invalidCommand('graph read-model validate requires --slice <path> or --all.')
  }
  const result = await validateReadModelEvidence(context.options.root, slice)
  const failed = result.report.status === 'validation-blocked' || result.report.status === 'decision-required'
  return {
    ok: !failed,
    command: 'graph read-model validate',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: 'Validator-backed read-model Evidence created.',
    issues: [],
    data: {
      validationReport: relativePath(context.options.root, result.reportJsonPath),
      validationSummary: relativePath(context.options.root, result.reportMarkdownPath),
      status: result.report.status,
      evidenceLevel: result.report.evidenceLevel,
      scopeLevel: result.report.scopeLevel,
      checkCount: result.report.summary.checkCount,
      warningCount: result.report.summary.warningCount,
      blockingCount: result.report.summary.blockingCount,
      decisionRequiredCount: result.report.summary.decisionRequiredCount,
      sourceAuthorityBoundary: result.report.sourceAuthorityBoundary,
      nonPromotionStatement: result.report.nonPromotionStatement,
    },
  }
}

export async function graphReadModelSummarizeCommand(context: CommandContext): Promise<CommandResult> {
  const slices = parseSlices(context.options.slices)
  if (slices.length === 0) {
    return invalidCommand('graph read-model summarize requires --slices <path,path>.')
  }
  const result = await summarizeReadModelEvidence(context.options.root, slices)
  const failed = result.summary.status === 'aggregate-blocked' || result.summary.status === 'decision-required'
  return {
    ok: !failed,
    command: 'graph read-model summarize',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: 'Aggregate read-model Evidence summary created from existing per-slice validation reports.',
    issues: [],
    data: {
      aggregateSummary: relativePath(context.options.root, result.summaryJsonPath),
      aggregateSummaryMarkdown: relativePath(context.options.root, result.summaryMarkdownPath),
      status: result.summary.status,
      sliceCount: result.summary.summary.sliceCount,
      warningCount: result.summary.summary.warningCount,
      blockingCount: result.summary.summary.blockingCount,
      decisionRequiredCount: result.summary.summary.decisionRequiredCount,
      includedSlices: result.summary.includedSlices,
      aggregateBoundary: result.summary.aggregateBoundary,
      nonPromotionStatement: result.summary.nonPromotionStatement,
    },
  }
}

function parseSlices(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(parseSlices)
  }
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}
