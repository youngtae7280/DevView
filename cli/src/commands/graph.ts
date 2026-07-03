import { relativePath } from '../core/fs.js'
import { compileExecutionContractDryRun } from '../core/contract-compiler-dry-run.js'
import { collectGitDerivedChangedFiles } from '../core/git-derived-changed-file-collection.js'
import { generateGraphDeltaHumanReviewPacket } from '../core/graph-delta-human-review-packet.js'
import { generateProposalOnlyGraphDeltaPreview } from '../core/graph-delta-proposal-generator.js'
import { buildGraphExecutionContractReport } from '../core/graph-execution-contract.js'
import { reportCompilerBoundary } from '../core/compiler-boundary.js'
import { reportCompilerInputModel } from '../core/compiler-input-model.js'
import { runAdvisoryScopeComplianceCheck } from '../core/scope-compliance-check.js'
import {
  applyGraphUpdateProposal,
  captureGraphDelta,
  generateGraphInstructionPack,
  proposeGraphUpdate,
  runGraphOperationChain,
} from '../core/graph-operation.js'
import { buildRetrofitPlan } from '../core/graph-retrofit.js'
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

export async function graphOperationApplyProposalCommand(context: CommandContext): Promise<CommandResult> {
  const proposal = context.options.proposal
  if (!proposal) {
    return invalidCommand('graph operation apply-proposal requires --proposal <file>.')
  }

  try {
    const result = await applyGraphUpdateProposal(context.options.root, proposal, {
      apply: context.options.apply,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph operation apply-proposal',
      exitCode: ExitCode.Success,
      message: context.options.apply
        ? 'Graph update proposal applied to graph-source.'
        : 'Graph update proposal preview created.',
      issues: [],
      data: {
        ...result,
        next: context.options.apply
          ? 'Run validation for the affected graph-source and review the resulting diff.'
          : 'Review plannedChanges, then rerun with --apply if the graph-source update is approved.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph operation apply-proposal',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph update proposal application blocked.',
      issues: [
        issue({
          validator: 'GraphOperationApplyProposal',
          code: 'GRAPH_UPDATE_PROPOSAL_APPLY_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Regenerate the graph delta/proposal from the current graph-source, or inspect stale proposal boundaries before applying.',
        }),
      ],
    }
  }
}

export async function graphOperationRunChainCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const result = await runGraphOperationChain(context.options.root, context.env.pluginRoot, {
      command: context.options.chainCommand,
      dryRun: context.options.dryRun,
      output: context.options.output,
    })
    return {
      ok: true,
      command: 'graph operation run-chain',
      exitCode: ExitCode.Success,
      message: context.options.dryRun
        ? 'Graph operation chain execution plan created.'
        : 'Graph operation chain command completed.',
      issues: [],
      data: {
        ...result,
        next: context.options.dryRun
          ? 'Rerun without --dry-run to execute the wrapped operation-chain script.'
          : 'Review generated outputs and run graph operation apply-proposal for any approved graph update proposal.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph operation run-chain',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph operation chain command blocked.',
      issues: [
        issue({
          validator: 'GraphOperationRunChain',
          code: 'GRAPH_OPERATION_CHAIN_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Use --dry-run to inspect the wrapped command, or run scripts/invoke-pbe-v0.ps1 directly for detailed troubleshooting.',
        }),
      ],
    }
  }
}

export async function graphOperationGeneratePackCommand(context: CommandContext): Promise<CommandResult> {
  const graphSource = context.options.graphSource
  const recordId = context.options.record
  if (!graphSource) {
    return invalidCommand('graph operation generate-pack requires --graph-source <file>.')
  }
  if (!recordId) {
    return invalidCommand('graph operation generate-pack requires --record <id>.')
  }

  try {
    const result = await generateGraphInstructionPack(context.options.root, graphSource, {
      recordId,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph operation generate-pack',
      exitCode: ExitCode.Success,
      message: 'Graph instruction pack generated.',
      issues: [],
      data: {
        ...result,
        next: 'Use this instruction pack for the bounded local change, then run graph operation capture-delta.',
      },
    }
  } catch (error) {
    return graphOperationBlocked('graph operation generate-pack', 'GRAPH_OPERATION_GENERATE_PACK_BLOCKED', error)
  }
}

export async function graphOperationCaptureDeltaCommand(context: CommandContext): Promise<CommandResult> {
  const graphSource = context.options.graphSource
  const instructionPack = context.options.instructionPack
  const targetRepo = context.options.targetRepo
  if (!graphSource) {
    return invalidCommand('graph operation capture-delta requires --graph-source <file>.')
  }
  if (!instructionPack) {
    return invalidCommand('graph operation capture-delta requires --instruction-pack <file>.')
  }
  if (!targetRepo) {
    return invalidCommand('graph operation capture-delta requires --target-repo <path>.')
  }

  try {
    const result = await captureGraphDelta(context.options.root, graphSource, {
      instructionPackPath: instructionPack,
      targetRepoPath: targetRepo,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph operation capture-delta',
      exitCode: ExitCode.Success,
      message: 'Graph delta captured from target diff.',
      issues: [],
      data: {
        ...result,
        next: 'Review changedFiles, then run graph operation propose-update.',
      },
    }
  } catch (error) {
    return graphOperationBlocked('graph operation capture-delta', 'GRAPH_OPERATION_CAPTURE_DELTA_BLOCKED', error)
  }
}

export async function graphOperationProposeUpdateCommand(context: CommandContext): Promise<CommandResult> {
  const graphDelta = context.options.graphDelta
  if (!graphDelta) {
    return invalidCommand('graph operation propose-update requires --graph-delta <file>.')
  }

  try {
    const result = await proposeGraphUpdate(context.options.root, graphDelta, {
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph operation propose-update',
      exitCode: ExitCode.Success,
      message: 'Graph update proposal generated.',
      issues: [],
      data: {
        ...result,
        next: 'Review the proposal, then run graph operation apply-proposal in preview mode.',
      },
    }
  } catch (error) {
    return graphOperationBlocked('graph operation propose-update', 'GRAPH_OPERATION_PROPOSE_UPDATE_BLOCKED', error)
  }
}

export async function graphRetrofitPlanCommand(context: CommandContext): Promise<CommandResult> {
  const graphSource = context.options.graphSource
  if (!graphSource) {
    return invalidCommand('graph retrofit plan requires --graph-source <file>.')
  }

  try {
    const result = await buildRetrofitPlan(context.options.root, graphSource, {
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph retrofit plan',
      exitCode: ExitCode.Success,
      message: 'Retrofit graph-source plan created.',
      issues: [],
      data: {
        ...result,
        next: 'Select one implementationReadyRecord, generate an instruction pack, then capture graph delta/proposal after local changes.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph retrofit plan',
      exitCode: ExitCode.ValidationFailed,
      message: 'Retrofit graph-source plan blocked.',
      issues: [
        issue({
          validator: 'GraphRetrofitPlan',
          code: 'GRAPH_RETROFIT_PLAN_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide an active retrofit graph-source with records, nodes, edges, edgeIntent, and forbidden-flow boundaries.',
        }),
      ],
    }
  }
}

function graphOperationBlocked(command: string, code: string, error: unknown): CommandResult {
  const message = error instanceof Error ? error.message : String(error)
  return {
    ok: false,
    command,
    exitCode: ExitCode.ValidationFailed,
    message: 'Graph operation command blocked.',
    issues: [
      issue({
        validator: 'GraphOperation',
        code,
        severity: 'error',
        message,
        suggestedFix: 'Check the graph-source, selected record, instruction pack, target diff, and boundary fields.',
      }),
    ],
  }
}

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

export async function graphReadModelReportCompilerBoundaryCommand(context: CommandContext): Promise<CommandResult> {
  const result = await reportCompilerBoundary(context.options.root)
  const failed = result.status === 'compiler-boundary-mvp-blocked'
  return {
    ok: !failed,
    command: 'graph read-model report-compiler-boundary',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: failed ? 'Compiler Boundary MVP report blocked.' : 'Compiler Boundary MVP report passed.',
    issues: failed
      ? result.blockingReasons.map((message) =>
          issue({
            validator: 'CompilerBoundaryMvp',
            code: 'COMPILER_BOUNDARY_MVP_BLOCKED',
            severity: 'error',
            message,
            suggestedFix:
              'Restore the compiler boundary task registry, contract schema, and dry-run execution contract fixture.',
          }),
        )
      : [],
    data: { ...result },
  }
}

export async function graphReadModelReportCompilerInputCommand(context: CommandContext): Promise<CommandResult> {
  const result = await reportCompilerInputModel(context.options.root)
  const failed = result.status === 'compiler-input-model-blocked'
  return {
    ok: !failed,
    command: 'graph read-model report-compiler-input',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: failed ? 'Compiler Input Model report blocked.' : 'Compiler Input Model report passed.',
    issues: failed
      ? result.blockingReasons.map((message) =>
          issue({
            validator: 'CompilerInputModelMvp',
            code: 'COMPILER_INPUT_MODEL_BLOCKED',
            severity: 'error',
            message,
            suggestedFix:
              'Restore the compiler input model schema and dry-run input fixture before contract compilation work.',
          }),
        )
      : [],
    data: { ...result },
  }
}

export async function graphReadModelCompileContractCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.dryRun) {
    return invalidCommand('graph read-model compile-contract requires --dry-run for this non-executing MVP surface.')
  }
  const result = await compileExecutionContractDryRun(context.options.root, {
    output: context.options.output,
    writeOutput: true,
  })
  const failed = result.status === 'contract-compiler-dry-run-blocked'
  return {
    ok: !failed,
    command: 'graph read-model compile-contract',
    exitCode: failed ? ExitCode.ValidationFailed : ExitCode.Success,
    message: failed ? 'Contract Compiler Dry-Run v0.2 blocked.' : 'Contract Compiler Dry-Run v0.2 candidate created.',
    issues: failed
      ? result.blockingReasons.map((message) =>
          issue({
            validator: 'ContractCompilerDryRunV01',
            code: 'CONTRACT_COMPILER_DRY_RUN_BLOCKED',
            severity: 'error',
            message,
            suggestedFix:
              'Restore the compiler input model fixture or contract validator requirements before compiling a candidate.',
          }),
        )
      : [],
    data: { ...result },
  }
}

export async function graphReadModelCollectChangedFilesCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.base) {
    return invalidCommand('graph read-model collect-changed-files requires --base <baseRef>.')
  }
  if (!context.options.head) {
    return invalidCommand('graph read-model collect-changed-files requires --head <headRef>.')
  }

  try {
    const result = await collectGitDerivedChangedFiles(context.options.root, {
      baseRef: context.options.base,
      headRef: context.options.head,
      output: context.options.output,
    })
    return {
      ok: true,
      command: 'graph read-model collect-changed-files',
      exitCode: ExitCode.Success,
      message: 'Git-derived changed-file collection artifact created.',
      issues: [],
      data: {
        ...result.artifact,
        outputPath: result.outputPath,
        next: 'Review the collection artifact as input only. Scope compliance remains not evaluated and checkerRun remains false.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model collect-changed-files',
      exitCode: ExitCode.ValidationFailed,
      message: 'Git-derived changed-file collection blocked.',
      issues: [
        issue({
          validator: 'GitDerivedChangedFileCollection',
          code: 'GIT_DERIVED_CHANGED_FILE_COLLECTION_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide valid explicit --base and --head refs in the target repository. This command collects names/status only and does not evaluate scope compliance.',
        }),
      ],
    }
  }
}

export async function graphReadModelCheckScopeCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.base) {
    return invalidCommand('graph read-model check-scope requires --base <baseRef>.')
  }
  if (!context.options.head) {
    return invalidCommand('graph read-model check-scope requires --head <headRef>.')
  }

  try {
    const result = await runAdvisoryScopeComplianceCheck(context.options.root, {
      baseRef: context.options.base,
      headRef: context.options.head,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model check-scope',
      exitCode: ExitCode.Success,
      message: 'Advisory scope compliance evaluation completed without enforcement.',
      issues: [],
      data: {
        ...result.artifact,
        compactRuntimeReport: result.compactRuntimeReport,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Review advisory findings only. This command does not reject diffs, enforce scope, configure required checks, approve fixtures, satisfy runtime Evidence, prove equivalence, or apply graph deltas.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model check-scope',
      exitCode: ExitCode.ValidationFailed,
      message: 'Advisory scope compliance evaluation could not run.',
      issues: [
        issue({
          validator: 'ScopeComplianceAdvisoryCheck',
          code: 'SCOPE_COMPLIANCE_ADVISORY_CHECK_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide valid explicit --base and --head refs and keep the Todo App runtime Evidence-only calibration draft readable. Advisory findings are non-enforcing once the command can run.',
        }),
      ],
    }
  }
}

export async function graphReadModelProposeGraphDeltaCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.source) {
    return invalidCommand('graph read-model propose-graph-delta requires --source <sourceArtifact>.')
  }

  try {
    const result = await generateProposalOnlyGraphDeltaPreview(context.options.root, context.options.source, {
      output: context.options.output,
    })
    return {
      ok: true,
      command: 'graph read-model propose-graph-delta',
      exitCode: ExitCode.Success,
      message: 'Proposal-only Graph Delta preview generated without apply.',
      issues: [],
      data: {
        ...result.proposal,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        next: 'Review the proposal-only preview. This command does not mutate graph-source, apply graph deltas, approve updates, satisfy runtime Evidence, prove equivalence, enforce scope, reject diffs, or create required checks.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model propose-graph-delta',
      exitCode: ExitCode.ValidationFailed,
      message: 'Proposal-only Graph Delta preview generation blocked.',
      issues: [
        issue({
          validator: 'ProposalOnlyGraphDeltaGenerator',
          code: 'GRAPH_DELTA_PROPOSAL_ONLY_GENERATION_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable graph-delta-compatible source artifact with proposalOnly=true, graphSourceMutated=false, graphDeltaApplied=false, requiresHumanReview=true, and approvalStatus=not-approved.',
        }),
      ],
    }
  }
}

export async function graphReadModelReviewGraphDeltaCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.proposal) {
    return invalidCommand('graph read-model review-graph-delta requires --proposal <proposalPath>.')
  }

  try {
    const result = await generateGraphDeltaHumanReviewPacket(context.options.root, context.options.proposal, {
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model review-graph-delta',
      exitCode: ExitCode.Success,
      message: 'Graph Delta human review packet created without approval or apply.',
      issues: [],
      data: {
        ...result.packet,
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Use this packet as review input only. This command does not record approval, mutate graph-source, apply graph deltas, satisfy runtime Evidence, prove equivalence, enforce scope, reject diffs, or create required checks.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model review-graph-delta',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph Delta human review packet generation blocked.',
      issues: [
        issue({
          validator: 'GraphDeltaHumanReviewPacket',
          code: 'GRAPH_DELTA_HUMAN_REVIEW_PACKET_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable proposal-only Graph Delta preview with proposalOnly=true, graphSourceMutated=false, graphDeltaApplied=false, requiresHumanReview=true, approvalStatus=not-approved, nonEnforcing=true, and enforcementStatus=not-enforced.',
        }),
      ],
    }
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
