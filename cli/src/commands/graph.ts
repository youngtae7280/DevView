import { relativePath } from '../core/fs.js'
import { buildGraphExecutionContractReport } from '../core/graph-execution-contract.js'
import {
  compareReadModelEvidence,
  generateReadModelEvidence,
  observeReadModelCandidateProjections,
  projectGraphSourceReadModelToFile,
  projectIntentCriticalGraphSourceToFile,
  reportGraphSourceHealth,
  reportIntentCriticalProjection,
  summarizeReadModelEvidence,
  validateAllReadModelEvidence,
  validateReadModelEvidence,
  writeGraphSourceHealthMarkdownReport,
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

export async function graphExecutionContractReportCommand(context: CommandContext): Promise<CommandResult> {
  const slice = context.options.slice
  if (!slice) {
    return invalidCommand('graph execution-contract report requires --slice <path>.')
  }
  try {
    const report = await buildGraphExecutionContractReport(context.options.root, slice)
    return {
      ok: true,
      command: 'graph execution-contract report',
      exitCode: ExitCode.Success,
      message: `Graph-native execution contract report created for ${report.source.profileId}.`,
      issues: [],
      data: {
        status: report.status,
        profileId: report.source.profileId,
        sourceSlice: report.source.sourceSlice,
        policyLevel: report.source.policyLevel,
        compatibilityNote: report.compatibility.note,
        contract: report,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph execution-contract report',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph-native execution contract report failed.',
      issues: [
        issue({
          validator: 'GraphExecutionContractReport',
          code: 'GRAPH_EXECUTION_CONTRACT_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Use a configured read-model slice and refresh the graph-source projection before generating the report.',
          nextCommand: 'pbe graph read-model report-health',
        }),
      ],
    }
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

export async function graphReadModelProjectCommand(context: CommandContext): Promise<CommandResult> {
  const graphSource = context.options.graphSource
  if (!graphSource) {
    return invalidCommand('graph read-model project requires --graph-source <file>.')
  }
  const result = await projectGraphSourceReadModelToFile(context.options.root, graphSource, context.options.output)
  return {
    ok: true,
    command: 'graph read-model project',
    exitCode: ExitCode.Success,
    message: 'Graph source read-model projection created.',
    issues: [],
    data: {
      graphSource: result.graphSourcePath,
      projection: relativePath(context.options.root, result.projectionJsonPath),
      nodeCount: result.projection.nodes.length,
      edgeCount: result.projection.edges.length,
      coreViewCount: result.projection.coreViewCoverage.length,
      sourceAuthorityBoundary: result.projection.sourceAuthorityBoundary,
      nonPromotionStatement: result.projection.nonPromotionStatement,
      userAcceptanceBoundary: result.projection.userAcceptanceBoundary,
      fallbackReferences: result.projection.fallbackReferences,
    },
  }
}

export async function graphReadModelProjectIntentCommand(context: CommandContext): Promise<CommandResult> {
  const graphSource = context.options.graphSource
  if (!graphSource) {
    return invalidCommand('graph read-model project-intent requires --graph-source <file>.')
  }
  try {
    const result = await projectIntentCriticalGraphSourceToFile(
      context.options.root,
      graphSource,
      context.options.output,
    )
    return {
      ok: true,
      command: 'graph read-model project-intent',
      exitCode: ExitCode.Success,
      message: 'Edge intent read-model projection created.',
      issues: [],
      data: {
        graphSource: result.graphSourcePath,
        projection: relativePath(context.options.root, result.projectionJsonPath),
        status: result.projection.projectionStatus,
        sourceExampleKind: result.projection.sourceExampleKind,
        projectedIntentCount: result.projection.edgeIntentProjections.length,
        edgeIntentProjections: result.projection.edgeIntentProjections,
        projectionBoundary: result.projection.projectionBoundary,
        vocabularyBoundary: result.projection.vocabularyBoundary,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model project-intent',
      exitCode: ExitCode.ValidationFailed,
      message: 'Edge intent read-model projection failed.',
      issues: [
        issue({
          validator: 'EdgeIntentProjection',
          code: 'EDGE_INTENT_PROJECTION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Restore required edgeIntent vocabulary classifications, project-specific claim text, and source signal anchors.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportIntentCommand(context: CommandContext): Promise<CommandResult> {
  const graphSourcePaths = context.options.graphSource ? [context.options.graphSource] : undefined
  const result = await reportIntentCriticalProjection(context.options.root, graphSourcePaths)
  const failed = result.status === 'intent-report-blocked'
  return {
    ok: !failed,
    command: 'graph read-model report-intent',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: failed ? 'Edge intent projection report blocked.' : 'Edge intent projection report passed.',
    issues: failed
      ? result.fixtures
          .filter((fixture) => fixture.status === 'intent-projection-blocked')
          .map((fixture) =>
            issue({
              validator: 'EdgeIntentProjectionReport',
              code: 'EDGE_INTENT_REPORT_BLOCKED',
              severity: 'error',
              file: fixture.graphSource,
              message: fixture.error || 'Edge intent projection report blocked.',
              suggestedFix:
                'Restore required edgeIntent vocabulary classifications, project-specific claim text, and source signal anchors.',
            }),
          )
      : [],
    data: { ...result },
  }
}

export async function graphReadModelReportHealthCommand(context: CommandContext): Promise<CommandResult> {
  const result = await reportGraphSourceHealth(context.options.root)
  const markdownReportPath = context.options.markdown
    ? await writeGraphSourceHealthMarkdownReport(context.options.root, result, context.options.markdown)
    : undefined
  const failed = result.status === 'graph-source-health-blocked'
  return {
    ok: !failed,
    command: 'graph read-model report-health',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: failed ? 'Graph-source health report blocked.' : 'Graph-source health report passed.',
    issues: failed
      ? result.blockingReasons.map((message) =>
          issue({
            validator: 'GraphSourceHealthReport',
            code: 'GRAPH_SOURCE_HEALTH_BLOCKED',
            severity: 'error',
            message,
            suggestedFix:
              'Review validate-all, E2E, projection, edgeIntent, retirement readiness, and non-enforcement boundaries.',
          }),
        )
      : [],
    data: {
      ...result,
      ...(markdownReportPath ? { markdownReport: relativePath(context.options.root, markdownReportPath) } : {}),
    },
  }
}

export async function graphReadModelObserveCandidatesCommand(context: CommandContext): Promise<CommandResult> {
  const result = await observeReadModelCandidateProjections(context.options.root)
  const failed = result.status === 'candidate-observation-blocked'
  return {
    ok: !failed,
    command: 'graph read-model observe-candidates',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: 'Read-model candidate projection observation completed.',
    issues: failed
      ? [
          issue({
            validator: 'ReadModelCandidateObservation',
            code: 'READ_MODEL_CANDIDATE_OBSERVATION_BLOCKED',
            severity: 'error',
            message: result.observedCandidates.find((entry) => entry.error)?.error || 'Candidate observation blocked.',
            suggestedFix:
              'Refresh or fix the candidate graph-source projection artifact without enrolling it in validate-all or CI.',
          }),
        ]
      : [],
    data: { ...result },
  }
}

export async function graphReadModelValidateCommand(context: CommandContext): Promise<CommandResult> {
  if (context.options.all) {
    try {
      const result = await validateAllReadModelEvidence(context.options.root)
      const aggregate = result.aggregateResult.summary
      const failed = result.status === 'aggregate-blocked' || result.status === 'decision-required'
      return {
        ok: !failed,
        command: 'graph read-model validate --all',
        exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
        message: 'Registry-backed read-model validate-all Evidence created.',
        issues: [],
        data: {
          status: result.status,
          validateAllStatus: result.status,
          aggregateStatus: aggregate.status,
          registryPath: result.registryPath,
          includedProfiles: result.includedProfiles,
          perSliceResults: result.perSliceResults,
          projectionContractStatus: result.perSliceResults.map((entry) => ({
            profileId: entry.profileId,
            sourceSlice: entry.sourceSlice,
            status:
              entry.commands.find((command) => command.command === 'project-contract')?.status || 'not-configured',
          })),
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
