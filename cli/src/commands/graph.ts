import { relativePath } from '../core/fs.js'
import {
  compareReadModelEvidence,
  generateReadModelEvidence,
  validateReadModelEvidence,
} from '../core/read-model-evidence.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode } from '../core/types.js'
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
  const slice = context.options.slice
  if (!slice) {
    return invalidCommand('graph read-model validate requires --slice <path>.')
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
