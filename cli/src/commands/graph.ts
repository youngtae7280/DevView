import { relativePath } from '../core/fs.js'
import { createApprovedProposalStateFile } from '../core/approved-proposal-state.js'
import { generateAiRequestAnalyzerPackFile } from '../core/ai-request-analyzer-pack.js'
import { checkGraphDeltaApplyReadinessFile } from '../core/graph-delta-apply-readiness.js'
import { reportEvidenceAcceptanceReadinessFile } from '../core/evidence-acceptance-readiness.js'
import { reportEquivalenceProofReadinessFile } from '../core/equivalence-proof-readiness.js'
import { reportGraphSourceMutationReadinessFile } from '../core/graph-source-mutation-readiness.js'
import { reportScopeCiEnforcementReadinessFile } from '../core/scope-ci-enforcement-readiness.js'
import { analyzeRequestFile } from '../core/ai-request-analyzer-run.js'
import { generateClarificationInterviewPackFile } from '../core/clarification-interview-pack.js'
import { compileExecutionContractDryRun } from '../core/contract-compiler-dry-run.js'
import { collectGitDerivedChangedFiles } from '../core/git-derived-changed-file-collection.js'
import { generateGraphDeltaHumanReviewPacket } from '../core/graph-delta-human-review-packet.js'
import { generateGraphTraversalPlanFile } from '../core/graph-traversal-plan.js'
import { generateContractCompilerInputFile } from '../core/contract-input-generator.js'
import { runClarificationRuntimeChainFile } from '../core/clarification-runtime-chain.js'
import { reportDevViewBaselineFile } from '../core/devview-baseline-report.js'
import { runPreflightSessionChainFile } from '../core/preflight-session-chain.js'
import { recordHumanDecisionFile } from '../core/human-decision-record.js'
import { reportHookGatewayHealthFile } from '../core/hook-gateway-health-report.js'
import { reportHookActivationChainFile } from '../core/hook-activation-chain-report.js'
import { generateHookSessionManifestFile } from '../core/hook-session-manifest.js'
import { materializeHookScriptBundleFile } from '../core/hook-script-bundle.js'
import { generateHookScriptScaffoldFile } from '../core/hook-script-scaffold.js'
import { generateHookScriptTemplatePreviewFile } from '../core/hook-script-template-preview.js'
import { generateInstructionPackFile } from '../core/instruction-pack-generator.js'
import { renderDevViewGraphHtmlFile } from '../core/devview-graph-html.js'
import { reportProjectMemoryExtensionGapsFile } from '../core/project-memory-extension-gap-report.js'
import { reportProjectMemoryImpactFile } from '../core/project-memory-impact-report.js'
import { reportFrontendChainFile } from '../core/frontend-chain-report.js'
import { generateProposalOnlyGraphDeltaPreview } from '../core/graph-delta-proposal-generator.js'
import { reviseRequestIrCandidateFile } from '../core/request-ir-candidate-reviser.js'
import { generateSelectedGraphSliceFile } from '../core/selected-graph-slice.js'
import { reportStopPostRunAdvisoryFile } from '../core/stop-post-run-advisory.js'
import { prepareUserPromptContextFile } from '../core/user-prompt-context.js'
import { reportUserPromptSubmitAdvisoryFile } from '../core/user-prompt-submit-advisory.js'
import { validateRequestIrGraphAwareFile } from '../core/request-ir-graph-aware-validator.js'
import { validateRequestIrCandidateFile } from '../core/request-ir-candidate-validator.js'
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
  const sourceModeProblem = validateChangedFileSourceMode('graph read-model collect-changed-files', context)
  if (sourceModeProblem) {
    return sourceModeProblem
  }

  if (!hasLocalChangedFileMode(context) && !context.options.base) {
    return invalidCommand('graph read-model collect-changed-files requires --base <baseRef>.')
  }
  if (!hasLocalChangedFileMode(context) && !context.options.head) {
    return invalidCommand('graph read-model collect-changed-files requires --head <headRef>.')
  }

  try {
    const result = await collectGitDerivedChangedFiles(context.options.root, {
      baseRef: context.options.base,
      headRef: context.options.head,
      workingTree: context.options.workingTree,
      staged: context.options.staged,
      untracked: context.options.untracked,
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
          suggestedFix: sourceModeSuggestedFix(context),
        }),
      ],
    }
  }
}

export async function graphReadModelCheckScopeCommand(context: CommandContext): Promise<CommandResult> {
  const sourceModeProblem = validateChangedFileSourceMode('graph read-model check-scope', context)
  if (sourceModeProblem) {
    return sourceModeProblem
  }

  if (!hasLocalChangedFileMode(context) && !context.options.base) {
    return invalidCommand('graph read-model check-scope requires --base <baseRef>.')
  }
  if (!hasLocalChangedFileMode(context) && !context.options.head) {
    return invalidCommand('graph read-model check-scope requires --head <headRef>.')
  }

  try {
    const result = await runAdvisoryScopeComplianceCheck(context.options.root, {
      baseRef: context.options.base,
      headRef: context.options.head,
      workingTree: context.options.workingTree,
      staged: context.options.staged,
      untracked: context.options.untracked,
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
          suggestedFix: sourceModeSuggestedFix(context, true),
        }),
      ],
    }
  }
}

function localChangedFileModes(context: CommandContext): string[] {
  return [
    context.options.workingTree ? '--working-tree' : '',
    context.options.staged ? '--staged' : '',
    context.options.untracked ? '--untracked' : '',
  ].filter(Boolean)
}

function hasLocalChangedFileMode(context: CommandContext): boolean {
  return localChangedFileModes(context).length > 0
}

function validateChangedFileSourceMode(command: string, context: CommandContext): CommandResult | null {
  const localModes = localChangedFileModes(context)
  if (localModes.length > 1) {
    return invalidCommand(
      `${command} requires exactly one changed-file source mode; do not combine ${localModes.join(', ')}.`,
    )
  }
  if (localModes.length === 1 && (context.options.base || context.options.head)) {
    return invalidCommand(`${command} cannot combine ${localModes[0]} with --base or --head.`)
  }
  return null
}

function sourceModeSuggestedFix(context: CommandContext, scope = false): string {
  const tail = scope
    ? 'Keep the Todo App runtime Evidence-only calibration draft readable. Advisory findings are non-enforcing once the command can run.'
    : 'This command collects names/status only and does not evaluate scope compliance.'
  if (context.options.workingTree) {
    return `Run inside a safe Git repository with tracked unstaged changes, or omit --working-tree and provide explicit --base and --head refs. ${tail}`
  }
  if (context.options.staged) {
    return `Run inside a safe Git repository with staged index changes, or omit --staged and provide explicit --base and --head refs. ${tail}`
  }
  if (context.options.untracked) {
    return `Run inside a safe Git repository with untracked files, or omit --untracked and provide explicit --base and --head refs. ${tail}`
  }
  return `Provide valid explicit --base and --head refs in the target repository. ${tail}`
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

export async function graphReadModelRecordHumanDecisionCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.reviewPacket) {
    return invalidCommand('graph read-model record-human-decision requires --review-packet <packetPath>.')
  }
  if (!context.options.proposal) {
    return invalidCommand('graph read-model record-human-decision requires --proposal <proposalPath>.')
  }
  if (!context.options.decision) {
    return invalidCommand('graph read-model record-human-decision requires --decision <value>.')
  }
  if (!context.options.reviewer) {
    return invalidCommand('graph read-model record-human-decision requires --reviewer <humanReviewerIdentity>.')
  }
  if (!context.options.rationale) {
    return invalidCommand('graph read-model record-human-decision requires --rationale <humanAuthoredRationale>.')
  }

  try {
    const result = await recordHumanDecisionFile(context.options.root, {
      boundary: context.options.boundary,
      reviewPacket: context.options.reviewPacket,
      proposal: context.options.proposal,
      decision: context.options.decision,
      reviewer: context.options.reviewer,
      rationale: context.options.rationale,
      decisionActorType: context.options.decisionActorType,
      decisionSource: context.options.decisionSource,
      decisionTimestamp: context.options.decisionTimestamp,
      runtimeReport: context.options.runtimeReport,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model record-human-decision',
      exitCode: ExitCode.Success,
      message: 'Human decision record created without approved state, apply, mutation, or enforcement.',
      issues: [],
      data: {
        ...result.record,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next:
          result.record.decisionValue === 'approve-proposal'
            ? 'A separate future approved-proposal-state command may consume this record. This command did not create that state, apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
            : 'Proposal remains unapproved. This command did not create approved proposal state, apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model record-human-decision',
      exitCode: ExitCode.ValidationFailed,
      message: 'Human decision record creation blocked.',
      issues: [
        issue({
          validator: 'HumanDecisionRecord',
          code: 'HUMAN_DECISION_RECORD_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable boundary, review packet, proposal-only preview, explicit human reviewer, rationale, and dedicated decision-record output paths. Do not use Codex/AI identities or overwrite source authority artifacts.',
        }),
      ],
    }
  }
}

export async function graphReadModelCreateApprovedProposalStateCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.decisionRecord) {
    return invalidCommand('graph read-model create-approved-proposal-state requires --decision-record <file>.')
  }
  if (!context.options.proposal) {
    return invalidCommand('graph read-model create-approved-proposal-state requires --proposal <file>.')
  }

  try {
    const result = await createApprovedProposalStateFile(context.options.root, {
      boundary: context.options.boundary,
      decisionRecord: context.options.decisionRecord,
      proposal: context.options.proposal,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model create-approved-proposal-state',
      exitCode: ExitCode.Success,
      message: result.state.approvedProposalStateCreated
        ? 'Approved proposal state preview created without apply, mutation, or enforcement.'
        : 'Approved proposal state preview blocked without apply, mutation, or enforcement.',
      issues: [],
      data: {
        ...result.state,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: result.state.approvedProposalStateCreated
          ? 'A separate future graph-delta apply command may consume this approved-state preview after its own checks. This command did not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Resolve the human decision/proposal precondition before approved state creation. This command did not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model create-approved-proposal-state',
      exitCode: ExitCode.ValidationFailed,
      message: 'Approved proposal state preview creation blocked.',
      issues: [
        issue({
          validator: 'ApprovedProposalState',
          code: 'APPROVED_PROPOSAL_STATE_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable approved-state boundary, Human Decision Record, proposal-only preview, and dedicated approved-state output paths. The decision must be an explicit human approve-proposal record before approved state can be created.',
        }),
      ],
    }
  }
}

export async function graphReadModelCheckGraphDeltaApplyCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.approvedState) {
    return invalidCommand('graph read-model check-graph-delta-apply requires --approved-state <file>.')
  }
  if (!context.options.proposal) {
    return invalidCommand('graph read-model check-graph-delta-apply requires --proposal <file>.')
  }

  try {
    const result = await checkGraphDeltaApplyReadinessFile(context.options.root, {
      boundary: context.options.boundary,
      approvedState: context.options.approvedState,
      proposal: context.options.proposal,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model check-graph-delta-apply',
      exitCode: ExitCode.Success,
      message:
        result.readiness.status === 'devview-graph-delta-apply-readiness-ready'
          ? 'Graph Delta apply readiness preview created without apply, mutation, or enforcement.'
          : 'Graph Delta apply readiness preview blocked without apply, mutation, or enforcement.',
      issues: [],
      data: {
        ...result.readiness,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next:
          result.readiness.status === 'devview-graph-delta-apply-readiness-ready'
            ? 'A separate future apply command may consume this readiness preview after current graph-source and rollback checks. This command did not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
            : 'Resolve approved-state/proposal preconditions before any future apply path. This command did not apply graph deltas, mutate graph-source, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model check-graph-delta-apply',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph Delta apply readiness check blocked.',
      issues: [
        issue({
          validator: 'GraphDeltaApplyReadiness',
          code: 'GRAPH_DELTA_APPLY_READINESS_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable apply boundary, approved proposal state preview, proposal-only preview, and dedicated apply-readiness output paths. This command is read-only and never mutates graph-source.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportGraphSourceMutationReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.policy) {
    return invalidCommand('graph read-model report-graph-source-mutation-readiness requires --policy <file>.')
  }
  if (!context.options.applyReadiness) {
    return invalidCommand('graph read-model report-graph-source-mutation-readiness requires --apply-readiness <file>.')
  }

  try {
    const result = await reportGraphSourceMutationReadinessFile(context.options.root, {
      policy: context.options.policy,
      applyReadiness: context.options.applyReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-graph-source-mutation-readiness',
      exitCode: ExitCode.Success,
      message:
        result.readiness.status === 'devview-graph-source-mutation-readiness-ready'
          ? 'Graph-source mutation readiness preview created without mutation, apply, or enforcement.'
          : 'Graph-source mutation readiness preview blocked without mutation, apply, or enforcement.',
      issues: [],
      data: {
        ...result.readiness,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Use this as readiness context only. This command did not write graph-source, apply graph deltas, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-graph-source-mutation-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph-source mutation readiness report blocked.',
      issues: [
        issue({
          validator: 'GraphSourceMutationReadiness',
          code: 'GRAPH_SOURCE_MUTATION_READINESS_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable mutation policy boundary, Graph Delta apply readiness preview, and dedicated mutation-readiness output paths. This command is read-only and never mutates graph-source.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportEvidenceAcceptanceReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.policy) {
    return invalidCommand('graph read-model report-evidence-acceptance-readiness requires --policy <file>.')
  }
  if (!context.options.mutationReadiness) {
    return invalidCommand('graph read-model report-evidence-acceptance-readiness requires --mutation-readiness <file>.')
  }

  try {
    const result = await reportEvidenceAcceptanceReadinessFile(context.options.root, {
      policy: context.options.policy,
      mutationReadiness: context.options.mutationReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-evidence-acceptance-readiness',
      exitCode: ExitCode.Success,
      message:
        result.readiness.status === 'devview-evidence-acceptance-readiness-ready'
          ? 'Evidence acceptance readiness preview created without accepting Evidence, satisfying runtime Evidence, applying, mutating, or enforcing.'
          : 'Evidence acceptance readiness preview blocked without accepting Evidence, satisfying runtime Evidence, applying, mutating, or enforcing.',
      issues: [],
      data: {
        ...result.readiness,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Use this as readiness context only. This command did not accept Evidence, satisfy runtime Evidence, prove equivalence, apply graph deltas, mutate graph-source, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-evidence-acceptance-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Evidence acceptance readiness report blocked.',
      issues: [
        issue({
          validator: 'EvidenceAcceptanceReadiness',
          code: 'EVIDENCE_ACCEPTANCE_READINESS_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Evidence Acceptance Policy boundary, Graph-source Mutation readiness preview, and dedicated evidence-acceptance-readiness output paths. This command is read-only and never accepts Evidence.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportEquivalenceProofReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.policy) {
    return invalidCommand('graph read-model report-equivalence-proof-readiness requires --policy <file>.')
  }
  if (!context.options.evidenceAcceptanceReadiness) {
    return invalidCommand(
      'graph read-model report-equivalence-proof-readiness requires --evidence-acceptance-readiness <file>.',
    )
  }

  try {
    const result = await reportEquivalenceProofReadinessFile(context.options.root, {
      policy: context.options.policy,
      evidenceAcceptanceReadiness: context.options.evidenceAcceptanceReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-equivalence-proof-readiness',
      exitCode: ExitCode.Success,
      message:
        result.readiness.status === 'devview-equivalence-proof-readiness-ready'
          ? 'Equivalence proof readiness preview created without proving equivalence, accepting Evidence, applying, mutating, or enforcing.'
          : 'Equivalence proof readiness preview blocked without proving equivalence, accepting Evidence, applying, mutating, or enforcing.',
      issues: [],
      data: {
        ...result.readiness,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Use this as readiness context only. This command did not prove equivalence, accept Evidence, satisfy runtime Evidence, apply graph deltas, mutate graph-source, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-equivalence-proof-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Equivalence proof readiness report blocked.',
      issues: [
        issue({
          validator: 'EquivalenceProofReadiness',
          code: 'EQUIVALENCE_PROOF_READINESS_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Equivalence Proof Policy boundary, Evidence Acceptance readiness preview, and dedicated equivalence-proof-readiness output paths. This command is read-only and never proves equivalence.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportScopeCiEnforcementReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.policy) {
    return invalidCommand('graph read-model report-scope-ci-enforcement-readiness requires --policy <file>.')
  }
  if (!context.options.equivalenceProofReadiness) {
    return invalidCommand(
      'graph read-model report-scope-ci-enforcement-readiness requires --equivalence-proof-readiness <file>.',
    )
  }

  try {
    const result = await reportScopeCiEnforcementReadinessFile(context.options.root, {
      policy: context.options.policy,
      equivalenceProofReadiness: context.options.equivalenceProofReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-scope-ci-enforcement-readiness',
      exitCode: ExitCode.Success,
      message:
        result.readiness.status === 'devview-scope-ci-enforcement-readiness-ready'
          ? 'Scope/CI enforcement readiness preview created without enforcing scope, configuring CI, rejecting diffs, or blocking tools.'
          : 'Scope/CI enforcement readiness preview blocked without enforcing scope, configuring CI, rejecting diffs, or blocking tools.',
      issues: [],
      data: {
        ...result.readiness,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Use this as disabled readiness context only. This command did not enforce scope, enable CI, configure required checks, change branch protection, reject diffs, activate strict/guided blocking, prove equivalence, accept Evidence, apply graph deltas, or mutate graph-source.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-scope-ci-enforcement-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Scope/CI enforcement readiness report blocked.',
      issues: [
        issue({
          validator: 'ScopeCiEnforcementReadiness',
          code: 'SCOPE_CI_ENFORCEMENT_READINESS_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Scope/CI Enforcement Policy boundary, Equivalence Proof readiness preview, and dedicated scope-ci-enforcement-readiness output paths. This command is read-only and never enables enforcement.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateAiRequestAnalyzerPackCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.boundary) {
    return invalidCommand('graph read-model generate-ai-request-analyzer-pack requires --boundary <boundaryPath>.')
  }
  if (!context.options.schema) {
    return invalidCommand('graph read-model generate-ai-request-analyzer-pack requires --schema <schemaPath>.')
  }

  try {
    const pack = await generateAiRequestAnalyzerPackFile(
      context.options.root,
      context.options.boundary,
      context.options.schema,
      {
        output: context.options.output,
        markdown: context.options.markdown,
      },
    )
    const blocked = pack.pack.status !== 'ai-request-analyzer-pack-generated' || !pack.pack.analyzerPackGenerated
    const errorFindings = pack.pack.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-ai-request-analyzer-pack',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'AI Request Analyzer prompt pack generation blocked before any LLM call.'
        : 'AI Request Analyzer prompt pack generated without LLM or Request IR Candidate generation.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : pack.pack.validationFindings).map((finding) =>
            issue({
              validator: 'AiRequestAnalyzerPackGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the AI Request Analyzer boundary or Request IR Candidate schema before generating a prompt pack.',
            }),
          )
        : [],
      data: {
        ...pack.pack,
        ...(pack.outputPath ? { outputPath: pack.outputPath } : {}),
        ...(pack.markdownReport ? { markdownReport: pack.markdownReport } : {}),
        next: blocked
          ? 'Repair the analyzer boundary/schema preview. This command did not call an LLM, generate Request IR, run traversal, generate contract input, generate execution instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Use this pack only as future analyzer prompt/input contract context. It did not call an LLM, generate Request IR, run traversal, generate contract input, generate execution instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-ai-request-analyzer-pack',
      exitCode: ExitCode.ValidationFailed,
      message: 'AI Request Analyzer prompt pack generation could not run.',
      issues: [
        issue({
          validator: 'AiRequestAnalyzerPackGenerator',
          code: 'AI_REQUEST_ANALYZER_PACK_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable analyzer boundary and Request IR Candidate schema preview artifacts, plus dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelAnalyzeRequestCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.request) {
    return invalidCommand('graph read-model analyze-request requires --request <text>.')
  }
  if (!context.options.pack) {
    return invalidCommand('graph read-model analyze-request requires --pack <aiRequestAnalyzerPackPath>.')
  }

  try {
    const run = await analyzeRequestFile(context.options.root, context.options.request, context.options.pack, {
      providerConfig: context.options.providerConfig,
      externalCandidate: context.options.externalCandidate,
      invokeProvider: context.options.invokeProvider,
      allowNetworkProvider: context.options.allowNetworkProvider,
      providerMode: context.options.providerMode,
      mockProviderResponse: context.options.mockProviderResponse,
      output: context.options.output,
    })
    const blocked =
      run.result.analyzerProviderStatus === 'provider-disabled' ||
      run.result.validationFindings.some((finding) => finding.severity === 'error') ||
      ((Boolean(context.options.externalCandidate) || context.options.invokeProvider) &&
        !run.result.requestIrCandidateGenerated)
    const errorFindings = run.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model analyze-request',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'AI Request Analyzer provider is disabled or candidate generation/import was blocked before validation/traversal.'
        : run.result.analyzerProviderStatus === 'mock-provider-candidate-generated-no-network'
          ? 'Mock analyzer provider response generated a candidate-only Request IR Candidate without network calls.'
          : run.result.analyzerProviderStatus === 'openai-provider-candidate-generated-live'
            ? 'Gated OpenAI analyzer provider generated a candidate-only Request IR Candidate.'
            : 'External Request IR Candidate imported as candidate-only without invoking an analyzer provider.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : run.result.validationFindings).map((finding) =>
            issue({
              validator: 'AiRequestAnalyzerCommandSurface',
              code:
                finding.code === undefined && run.result.analyzerProviderStatus === 'provider-disabled'
                  ? 'AI_REQUEST_ANALYZER_PROVIDER_DISABLED'
                  : finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Provide an explicit --external-candidate generated from the same request, or configure a future trusted analyzer provider in a separate task.',
            }),
          )
        : [],
      data: {
        ...run.result,
        ...(run.outputPath ? { outputPath: run.outputPath } : {}),
        next: blocked
          ? 'Provider candidate generation/import was blocked before validation or traversal. This command did not run graph validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : run.result.analyzerProviderStatus === 'openai-provider-candidate-generated-live'
            ? 'Run graph read-model validate-request-ir on the candidate before graph-aware validation or traversal. This command used explicit OpenAI provider gates, but did not run graph validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
            : 'Run graph read-model validate-request-ir on the candidate before graph-aware validation or traversal. This command did not call an LLM, run graph validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model analyze-request',
      exitCode: ExitCode.ValidationFailed,
      message: 'AI Request Analyzer command surface could not run.',
      issues: [
        issue({
          validator: 'AiRequestAnalyzerCommandSurface',
          code: 'AI_REQUEST_ANALYZER_COMMAND_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable analyzer pack, a matching explicit external candidate when provider mode is disabled, and a dedicated preview output path.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateClarificationInterviewPackCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.boundary) {
    return invalidCommand('graph read-model generate-clarification-interview-pack requires --boundary <boundaryPath>.')
  }
  if (!context.options.candidate) {
    return invalidCommand(
      'graph read-model generate-clarification-interview-pack requires --candidate <candidatePath>.',
    )
  }

  try {
    const pack = await generateClarificationInterviewPackFile(
      context.options.root,
      context.options.boundary,
      context.options.candidate,
      {
        output: context.options.output,
        markdown: context.options.markdown,
      },
    )
    const blocked =
      pack.pack.status !== 'clarification-interview-pack-generated' || !pack.pack.clarificationInterviewPackGenerated
    const errorFindings = pack.pack.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-clarification-interview-pack',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Clarification Interview Pack generation blocked before questions could be planned.'
        : 'Clarification Interview Pack generated without UI, LLM, candidate revision, validation, traversal, or execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : pack.pack.validationFindings).map((finding) =>
            issue({
              validator: 'ClarificationInterviewPackGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the clarification boundary or Request IR Candidate before generating a clarification question plan.',
            }),
          )
        : [],
      data: {
        ...pack.pack,
        ...(pack.outputPath ? { outputPath: pack.outputPath } : {}),
        ...(pack.markdownReport ? { markdownReport: pack.markdownReport } : {}),
        next: blocked
          ? 'Repair the clarification boundary or candidate-only Request IR artifact. This command did not call an LLM, revise Request IR, run validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Use this pack as clarification question-plan preview only. Clarification answers must produce a revised Request IR Candidate and rerun validate-request-ir plus validate-request-ir-graph before traversal. This command did not call an LLM, revise Request IR, run validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-clarification-interview-pack',
      exitCode: ExitCode.ValidationFailed,
      message: 'Clarification Interview Pack generation could not run.',
      issues: [
        issue({
          validator: 'ClarificationInterviewPackGenerator',
          code: 'CLARIFICATION_INTERVIEW_PACK_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable clarification boundary and candidate-only Request IR artifacts, plus dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReviseRequestIrCandidateCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.clarificationPack) {
    return invalidCommand('graph read-model revise-request-ir-candidate requires --clarification-pack <packPath>.')
  }
  if (!context.options.answers) {
    return invalidCommand('graph read-model revise-request-ir-candidate requires --answers <answersPath>.')
  }
  if (!context.options.output) {
    return invalidCommand('graph read-model revise-request-ir-candidate requires --output <revisedCandidatePath>.')
  }

  try {
    const revision = await reviseRequestIrCandidateFile(
      context.options.root,
      context.options.clarificationPack,
      context.options.answers,
      {
        output: context.options.output,
      },
    )
    const blocked =
      revision.result.status !== 'request-ir-candidate-revision-generated' || !revision.result.revisedCandidateGenerated
    const errorFindings = revision.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model revise-request-ir-candidate',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Request IR Candidate revision from clarification answers blocked.'
        : 'Revised Request IR Candidate preview generated without validation, traversal, contract input, instruction pack, or execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : revision.result.validationFindings).map((finding) =>
            issue({
              validator: 'RequestIrCandidateClarificationReviser',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the clarification pack, answers, or original Request IR Candidate before generating a revised candidate.',
            }),
          )
        : [],
      data: {
        ...revision.result,
        ...(revision.outputPath ? { outputPath: revision.outputPath } : {}),
        next: blocked
          ? 'Repair the clarification pack or answers. This command did not write a trusted candidate, run validation, run traversal, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Run graph read-model validate-request-ir on the revised candidate before any graph-aware validation or traversal. This command did not run validation, run traversal, generate selected slices, generate contract input, generate instruction packs, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model revise-request-ir-candidate',
      exitCode: ExitCode.ValidationFailed,
      message: 'Request IR Candidate revision could not run.',
      issues: [
        issue({
          validator: 'RequestIrCandidateClarificationReviser',
          code: 'REQUEST_IR_CANDIDATE_REVISION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable clarification pack and answers artifacts, plus a dedicated revised candidate preview output path.',
        }),
      ],
    }
  }
}

export async function graphReadModelRunClarificationChainCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.clarificationPack) {
    return invalidCommand('graph read-model run-clarification-chain requires --clarification-pack <packPath>.')
  }
  if (!context.options.answers) {
    return invalidCommand('graph read-model run-clarification-chain requires --answers <answersPath>.')
  }
  if (!context.options.revisedCandidateOutput) {
    return invalidCommand(
      'graph read-model run-clarification-chain requires --revised-candidate-output <candidatePath>.',
    )
  }
  if (!context.options.validationOutput) {
    return invalidCommand('graph read-model run-clarification-chain requires --validation-output <validationPath>.')
  }
  if (!context.options.output) {
    return invalidCommand('graph read-model run-clarification-chain requires --output <chainReportPath>.')
  }

  try {
    const chain = await runClarificationRuntimeChainFile(context.options.root, {
      clarificationPack: context.options.clarificationPack,
      answers: context.options.answers,
      revisedCandidateOutput: context.options.revisedCandidateOutput,
      validationOutput: context.options.validationOutput,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked =
      chain.report.status !== 'devview-clarification-runtime-chain-report-generated' ||
      chain.report.requestIrValidationStatus === 'validation-blocked'
    const errorFindings = chain.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model run-clarification-chain',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Clarification runtime chain blocked before downstream graph authority.'
        : 'Clarification runtime chain generated a revised candidate and schema-only validation report.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : chain.report.validationFindings).map((finding) =>
            issue({
              validator: 'ClarificationRuntimeChainReporter',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the clarification pack, answers, revised candidate, or schema-only validation boundary.',
            }),
          )
        : [],
      data: {
        ...chain.report,
        ...(chain.revisedCandidateOutput ? { revisedCandidateOutput: chain.revisedCandidateOutput } : {}),
        ...(chain.validationOutput ? { validationOutput: chain.validationOutput } : {}),
        ...(chain.outputPath ? { outputPath: chain.outputPath } : {}),
        ...(chain.markdownReport ? { markdownReport: chain.markdownReport } : {}),
        next: blocked
          ? 'Repair the clarification revision or schema-only validation findings. This chain did not run graph-aware validation, traversal, selected slice generation, contract input, instruction pack generation, Codex execution, graph mutation, approval, Evidence acceptance, equivalence proof, scope enforcement, or CI enforcement.'
          : 'Run graph read-model validate-request-ir-graph only as a separate explicit step if graph-aware validation is desired. This chain stopped after schema-only validation.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model run-clarification-chain',
      exitCode: ExitCode.ValidationFailed,
      message: 'Clarification runtime chain could not run.',
      issues: [
        issue({
          validator: 'ClarificationRuntimeChainReporter',
          code: 'CLARIFICATION_RUNTIME_CHAIN_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable clarification pack and answers artifacts plus dedicated revised candidate, validation, report, and Markdown output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelRunPreflightSessionCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.candidate) {
    return invalidCommand('graph read-model run-preflight-session requires --candidate <candidatePath>.')
  }
  if (!context.options.outputDir) {
    return invalidCommand('graph read-model run-preflight-session requires --output-dir <directoryPath>.')
  }

  try {
    const chain = await runPreflightSessionChainFile(context.options.root, {
      candidate: context.options.candidate,
      outputDir: context.options.outputDir,
      sessionId: context.options.sessionId,
      markdown: context.options.markdown,
    })
    const blocked = chain.report.status !== 'devview-preflight-session-chain-report-generated'
    const errorFindings = chain.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model run-preflight-session',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'DevView preflight session chain stopped before instruction-pack preview completion.'
        : 'DevView preflight session chain generated instruction-pack preview artifacts without Codex execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : chain.report.validationFindings).map((finding) =>
            issue({
              validator: 'PreflightSessionChainReporter',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.stage
                ? `Stage: ${finding.stage}${finding.field ? `; field: ${finding.field}` : ''}`
                : finding.field
                  ? `Field: ${finding.field}`
                  : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the preflight stage inputs and rerun the chain into a dedicated safe output directory.',
            }),
          )
        : [],
      data: {
        ...chain.report,
        outputDir: chain.outputDir,
        outputPath: chain.outputPath,
        ...(chain.markdownReport ? { markdownReport: chain.markdownReport } : {}),
        next: blocked
          ? 'Repair the stopped stage, then rerun the preflight chain. No Codex execution, graph mutation, approval, Evidence acceptance, equivalence proof, scope enforcement, strict/guided blocking, or CI enforcement occurred.'
          : 'Review the instruction pack preview. This chain did not trigger Codex execution, mutate graph-source, apply graph deltas, automate approval, satisfy or accept Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model run-preflight-session',
      exitCode: ExitCode.ValidationFailed,
      message: 'DevView preflight session chain could not run.',
      issues: [
        issue({
          validator: 'PreflightSessionChainReporter',
          code: 'PREFLIGHT_SESSION_CHAIN_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Request IR Candidate plus a dedicated safe output directory and optional Markdown report path.',
        }),
      ],
    }
  }
}

export async function graphReadModelValidateRequestIrCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.candidate) {
    return invalidCommand('graph read-model validate-request-ir requires --candidate <candidatePath>.')
  }

  try {
    const validation = await validateRequestIrCandidateFile(context.options.root, context.options.candidate, {
      output: context.options.output,
    })
    const blocked = validation.result.requestIrValidationStatus === 'validation-blocked'
    const errorFindings = validation.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model validate-request-ir',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Request IR Candidate schema-only validation blocked.'
        : 'Request IR Candidate schema-only validation completed without graph traversal.',
      issues: blocked
        ? errorFindings.map((finding) =>
            issue({
              validator: 'RequestIrCandidateSchemaOnlyValidator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Regenerate the candidate as candidate-only before attempting graph-aware validation.',
            }),
          )
        : [],
      data: {
        ...validation.result,
        ...(validation.outputPath ? { outputPath: validation.outputPath } : {}),
        next: blocked
          ? 'Fix the malformed or unsafe Request IR Candidate boundary fields. This validator never enables traversal from unsafe AI output.'
          : 'Proceed only to graph-aware validation. Schema-valid candidate output still cannot drive graph traversal, contract generation, or instruction-pack generation.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model validate-request-ir',
      exitCode: ExitCode.ValidationFailed,
      message: 'Request IR Candidate schema-only validation could not run.',
      issues: [
        issue({
          validator: 'RequestIrCandidateSchemaOnlyValidator',
          code: 'REQUEST_IR_CANDIDATE_SCHEMA_ONLY_VALIDATION_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Request IR Candidate artifact with candidate-only boundaries and no graph traversal or contract-generation claims.',
        }),
      ],
    }
  }
}

export async function graphReadModelValidateRequestIrGraphCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.candidate) {
    return invalidCommand('graph read-model validate-request-ir-graph requires --candidate <candidatePath>.')
  }
  if (!context.options.schemaValidation) {
    return invalidCommand(
      'graph read-model validate-request-ir-graph requires --schema-validation <schemaValidationPath>.',
    )
  }

  try {
    const validation = await validateRequestIrGraphAwareFile(
      context.options.root,
      context.options.candidate,
      context.options.schemaValidation,
      {
        output: context.options.output,
      },
    )
    const blocked = validation.result.graphValidationStatus === 'validation-blocked'
    const errorFindings = validation.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model validate-request-ir-graph',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Request IR graph-aware validation blocked before traversal.'
        : 'Request IR graph-aware validation completed without running traversal.',
      issues: blocked
        ? errorFindings.map((finding) =>
            issue({
              validator: 'RequestIrGraphAwareValidator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the Request IR candidate or schema-only validation prerequisite before graph traversal can be considered.',
            }),
          )
        : [],
      data: {
        ...validation.result,
        ...(validation.outputPath ? { outputPath: validation.outputPath } : {}),
        next: blocked
          ? 'Fix the graph-aware validation prerequisite or unresolved candidate authority. No traversal, selected slice, contract input, or instruction pack was generated.'
          : 'A later traversal pass may be attempted. This command did not run traversal, select graph nodes or edges, generate contract input, generate instruction packs, mutate graph-source, or approve work.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model validate-request-ir-graph',
      exitCode: ExitCode.ValidationFailed,
      message: 'Request IR graph-aware validation could not run.',
      issues: [
        issue({
          validator: 'RequestIrGraphAwareValidator',
          code: 'REQUEST_IR_GRAPH_AWARE_VALIDATION_BLOCKED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Request IR Candidate and schema-only validation artifacts. Graph-aware validation does not run traversal or generate contract input.',
        }),
      ],
    }
  }
}

export async function graphReadModelPlanTraversalCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.graphValidation) {
    return invalidCommand('graph read-model plan-traversal requires --graph-validation <graphAwareValidationPath>.')
  }

  try {
    const plan = await generateGraphTraversalPlanFile(context.options.root, context.options.graphValidation, {
      output: context.options.output,
    })
    const blocked = plan.result.graphTraversalPlanStatus === 'blocked'
    const errorFindings = plan.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model plan-traversal',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Graph traversal plan generation blocked before selected slice generation.'
        : 'Graph traversal plan generated without selecting graph nodes or edges.',
      issues: blocked
        ? errorFindings.map((finding) =>
            issue({
              validator: 'GraphTraversalPlanGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix graph-aware Request IR validation or graph/read-model authority before planning traversal.',
            }),
          )
        : [],
      data: {
        ...plan.result,
        ...(plan.outputPath ? { outputPath: plan.outputPath } : {}),
        next: blocked
          ? 'Fix graph traversal planning prerequisites. No traversal, selected slice, contract input, or instruction pack was generated.'
          : 'A later selected graph slice pass may consume this plan. This command did not execute traversal, select graph nodes or edges, generate contract input, generate instruction packs, mutate graph-source, or approve work.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model plan-traversal',
      exitCode: ExitCode.ValidationFailed,
      message: 'Graph traversal plan generation could not run.',
      issues: [
        issue({
          validator: 'GraphTraversalPlanGenerator',
          code: 'GRAPH_TRAVERSAL_PLAN_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable graph-aware Request IR validation artifact. Planning does not execute traversal or generate selected graph slices.',
        }),
      ],
    }
  }
}

export async function graphReadModelSelectSliceCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.traversalPlan) {
    return invalidCommand('graph read-model select-slice requires --traversal-plan <traversalPlanPath>.')
  }

  try {
    const slice = await generateSelectedGraphSliceFile(context.options.root, context.options.traversalPlan, {
      output: context.options.output,
    })
    const blocked = slice.result.selectedGraphSliceStatus !== 'generated'
    const errorFindings = slice.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model select-slice',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Selected graph slice generation did not produce a generated selected slice.'
        : 'Selected graph slice generated without contract input or instruction pack output.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : slice.result.validationFindings).map((finding) =>
            issue({
              validator: 'SelectedGraphSliceGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the traversal plan or graph/read-model authority before selecting a graph slice.',
            }),
          )
        : [],
      data: {
        ...slice.result,
        ...(slice.outputPath ? { outputPath: slice.outputPath } : {}),
        next: blocked
          ? 'Fix selected graph slice prerequisites. No contract input or instruction pack was generated.'
          : 'A later contract compiler input pass may consume this selected slice. This command did not generate contract input, generate instruction packs, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model select-slice',
      exitCode: ExitCode.ValidationFailed,
      message: 'Selected graph slice generation could not run.',
      issues: [
        issue({
          validator: 'SelectedGraphSliceGenerator',
          code: 'SELECTED_GRAPH_SLICE_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable ready Graph Traversal Plan artifact. Slice selection does not generate contract input or instruction packs.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateContractInputCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.selectedSlice) {
    return invalidCommand('graph read-model generate-contract-input requires --selected-slice <selectedSlicePath>.')
  }

  try {
    const input = await generateContractCompilerInputFile(context.options.root, context.options.selectedSlice, {
      output: context.options.output,
    })
    const blocked = input.result.status !== 'contract-compiler-input-generated' || !input.result.contractInputGenerated
    const errorFindings = input.result.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-contract-input',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Contract compiler input generation blocked before instruction pack generation.'
        : 'Contract compiler input generated without instruction pack output.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : input.result.validationFindings).map((finding) =>
            issue({
              validator: 'ContractCompilerInputGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix the selected graph slice prerequisites before mapping Contract Compiler Input.',
            }),
          )
        : [],
      data: {
        ...input.result,
        ...(input.outputPath ? { outputPath: input.outputPath } : {}),
        next: blocked
          ? 'Fix selected slice prerequisites. No instruction pack, Codex execution, graph apply, approval, runtime Evidence satisfaction, or enforcement was generated.'
          : 'A later frontend pass may consume this Contract Compiler Input. This command did not generate instruction packs, trigger Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-contract-input',
      exitCode: ExitCode.ValidationFailed,
      message: 'Contract compiler input generation could not run.',
      issues: [
        issue({
          validator: 'ContractCompilerInputGenerator',
          code: 'CONTRACT_INPUT_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable generated Selected Graph Slice artifact. Contract input generation does not create instruction packs or execute Codex.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateInstructionPackCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.contractInput) {
    return invalidCommand('graph read-model generate-instruction-pack requires --contract-input <contractInputPath>.')
  }

  try {
    const instructionPack = await generateInstructionPackFile(context.options.root, context.options.contractInput, {
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked =
      instructionPack.pack.status !== 'instruction-pack-generated' || !instructionPack.pack.instructionPackGenerated
    const errorFindings = instructionPack.pack.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-instruction-pack',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Instruction Pack generation blocked before Codex execution.'
        : 'Instruction Pack generated without Codex execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : instructionPack.pack.validationFindings).map((finding) =>
            issue({
              validator: 'InstructionPackGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Fix Contract Compiler Input prerequisites before generating an Instruction Pack.',
            }),
          )
        : [],
      data: {
        ...instructionPack.pack,
        ...(instructionPack.outputPath ? { outputPath: instructionPack.outputPath } : {}),
        ...(instructionPack.markdownReport ? { markdownReport: instructionPack.markdownReport } : {}),
        next: blocked
          ? 'Fix Contract Compiler Input prerequisites. No Codex execution, graph apply, approval, runtime Evidence satisfaction, or enforcement was generated.'
          : 'Use this pack as deterministic Codex input only after human review. This command did not trigger Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-instruction-pack',
      exitCode: ExitCode.ValidationFailed,
      message: 'Instruction Pack generation could not run.',
      issues: [
        issue({
          validator: 'InstructionPackGenerator',
          code: 'INSTRUCTION_PACK_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable generated Contract Compiler Input artifact. Instruction Pack generation does not execute Codex.',
        }),
      ],
    }
  }
}

export async function graphReadModelRenderDevViewGraphCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.graphSource) {
    return invalidCommand('graph read-model render-devview-graph requires --graph-source <graphSourcePath>.')
  }
  if (!context.options.record) {
    return invalidCommand('graph read-model render-devview-graph requires --record <recordId>.')
  }
  if (!context.options.instructionPack) {
    return invalidCommand('graph read-model render-devview-graph requires --instruction-pack <instructionPackPath>.')
  }
  if (!context.options.output) {
    return invalidCommand('graph read-model render-devview-graph requires --output <htmlOutputPath>.')
  }
  if (!context.options.dataOutput) {
    return invalidCommand('graph read-model render-devview-graph requires --data-output <dataOutputPath>.')
  }

  try {
    const result = await renderDevViewGraphHtmlFile(context.options.root, {
      graphSource: context.options.graphSource,
      record: context.options.record,
      instructionPack: context.options.instructionPack,
      projectMemory: context.options.projectMemory,
      output: context.options.output,
      dataOutput: context.options.dataOutput,
    })
    const selectedSubgraph = result.data.subgraphs[0]
    return {
      ok: true,
      command: 'graph read-model render-devview-graph',
      exitCode: ExitCode.Success,
      message: 'DevViewGraph read-only HTML inspector generated.',
      issues: [],
      data: {
        artifactRole: result.data.artifactRole,
        status: result.data.status,
        outputPath: result.outputPath,
        dataOutputPath: result.dataOutputPath,
        sourceGraphSource: result.data.sourceGraphSource,
        sourceInstructionPack: result.data.sourceInstructionPack,
        sourceProjectMemory: result.data.sourceProjectMemory,
        sourceRecordId: result.data.sourceRecordId,
        projectMemorySummary: result.data.projectMemorySummary,
        nodeCount: result.data.graph.nodes.length,
        edgeCount: result.data.graph.edges.length,
        treeCount: result.data.trees.length,
        subgraphCount: result.data.subgraphs.length,
        selectedNodeIds: selectedSubgraph?.nodeIds ?? [],
        selectedEdgeIds: selectedSubgraph?.edgeIds ?? [],
        safetyFlags: result.data.safetyFlags,
        next: 'Open the generated HTML as a read-only inspector. This command did not execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model render-devview-graph',
      exitCode: ExitCode.ValidationFailed,
      message: 'DevViewGraph HTML rendering could not run.',
      issues: [
        issue({
          validator: 'DevViewGraphHtmlRenderer',
          code: 'DEVVIEW_GRAPH_HTML_RENDER_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable retrofit graph-source, matching retrofit instruction pack, and dedicated HTML/data output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportProjectMemoryExtensionGapsCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.projectMemory) {
    return invalidCommand(
      'graph read-model report-project-memory-extension-gaps requires --project-memory <projectMemoryPath>.',
    )
  }
  if (!context.options.graphSource) {
    return invalidCommand(
      'graph read-model report-project-memory-extension-gaps requires --graph-source <graphSourcePath>.',
    )
  }

  try {
    const result = await reportProjectMemoryExtensionGapsFile(context.options.root, {
      projectMemory: context.options.projectMemory,
      graphSource: context.options.graphSource,
      readModel: context.options.readModel,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-project-memory-extension-gaps',
      exitCode: ExitCode.Success,
      message: 'Project Memory extension gap report generated without applying extensions or changing authority.',
      issues: [],
      data: {
        ...result.report,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Review missing, extra, deprecated, and unapproved extension kinds. This command did not apply extensions, mutate graph-source, change traversal, generate contracts, satisfy Evidence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-project-memory-extension-gaps',
      exitCode: ExitCode.ValidationFailed,
      message: 'Project Memory extension gap report could not run.',
      issues: [
        issue({
          validator: 'ProjectMemoryExtensionGapReporter',
          code: 'PROJECT_MEMORY_EXTENSION_GAP_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Project Memory and graph-source inputs plus dedicated output paths. This command is report-only.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportProjectMemoryImpactCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.projectMemory) {
    return invalidCommand(
      'graph read-model report-project-memory-impact requires --project-memory <projectMemoryPath>.',
    )
  }
  if (!context.options.directionChange) {
    return invalidCommand(
      'graph read-model report-project-memory-impact requires --direction-change <directionChangeCandidatePath>.',
    )
  }

  try {
    const result = await reportProjectMemoryImpactFile(context.options.root, {
      projectMemory: context.options.projectMemory,
      directionChange: context.options.directionChange,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    return {
      ok: true,
      command: 'graph read-model report-project-memory-impact',
      exitCode: ExitCode.Success,
      message: 'Project Memory impact report generated without approving or applying a direction change.',
      issues: [],
      data: {
        ...result.report,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: 'Review direction-change impact and proposal requirements. This command did not approve a Project Memory revision, apply taxonomy/view tree changes, mutate graph-source, change traversal, generate contracts, satisfy Evidence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-project-memory-impact',
      exitCode: ExitCode.ValidationFailed,
      message: 'Project Memory impact report could not run.',
      issues: [
        issue({
          validator: 'ProjectMemoryImpactReporter',
          code: 'PROJECT_MEMORY_IMPACT_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Project Memory preview, direction-change candidate, and dedicated output paths. This command is report-only.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportHookGatewayHealthCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.boundary) {
    return invalidCommand('graph read-model report-hook-gateway-health requires --boundary <boundaryPath>.')
  }

  try {
    const health = await reportHookGatewayHealthFile(context.options.root, context.options.boundary, {
      output: context.options.output,
    })
    const blocked = health.report.status !== 'devview-hook-gateway-health-report-generated'
    const errorFindings = health.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model report-hook-gateway-health',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook Gateway health report blocked by an unsafe boundary preview.'
        : 'Hook Gateway health boundary reported without hook installation or enforcement.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : health.report.validationFindings).map((finding) =>
            issue({
              validator: 'HookGatewayHealthReporter',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Repair the Hook Gateway health boundary preview before reporting activation readiness.',
            }),
          )
        : [],
      data: {
        ...health.report,
        ...(health.outputPath ? { outputPath: health.outputPath } : {}),
        next: blocked
          ? 'Repair the boundary preview. This command did not install hooks, trust commands, block Codex execution, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Use this report as non-enforcing readiness context only. Hook scripts, install/trust mutation, guided blocking, strict mode, Codex execution blocking, graph apply, approval, runtime Evidence satisfaction, equivalence proof, scope enforcement, and CI enforcement remain unimplemented.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-hook-gateway-health',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook Gateway health report could not run.',
      issues: [
        issue({
          validator: 'HookGatewayHealthReporter',
          code: 'HOOK_GATEWAY_HEALTH_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable Hook Gateway health boundary preview and a dedicated preview/report output path.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportFrontendChainCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.intake) {
    return invalidCommand('graph read-model report-frontend-chain requires --intake <intakeBoundaryPath>.')
  }

  try {
    const result = await reportFrontendChainFile(context.options.root, context.options.intake, {
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.report.status !== 'devview-frontend-chain-report-generated'
    const errorFindings = result.report.blockingFindings

    return {
      ok: !blocked,
      command: 'graph read-model report-frontend-chain',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'DevView frontend artifact chain report blocked by missing or mismatched artifacts.'
        : 'DevView frontend artifact chain report generated without execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.report.validationFindings).map((finding) =>
            issue({
              validator: 'FrontendChainReporter',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.stage ? `Stage: ${finding.stage}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Regenerate or relink the frontend calibration artifact chain before treating it as instruction-pack-ready.',
            }),
          )
        : [],
      data: {
        ...result.report,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair the chain inputs. This report did not call an LLM, generate Request IR, implement hook sessions, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.'
          : 'Review the instruction pack preview and chain manifest as human-readable context only. This report did not call an LLM, implement hook sessions, execute Codex, mutate graph-source, apply graph deltas, approve work, satisfy runtime Evidence, prove equivalence, enforce scope, or configure CI.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-frontend-chain',
      exitCode: ExitCode.ValidationFailed,
      message: 'DevView frontend artifact chain report could not run.',
      issues: [
        issue({
          validator: 'FrontendChainReporter',
          code: 'FRONTEND_CHAIN_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a readable natural-language intake boundary and dedicated manifest/report output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelPrepareUserPromptContextCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.frontendChain) {
    return invalidCommand('graph read-model prepare-user-prompt-context requires --frontend-chain <file>.')
  }
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model prepare-user-prompt-context requires --hook-health <file>.')
  }
  if (!context.options.instructionPack) {
    return invalidCommand('graph read-model prepare-user-prompt-context requires --instruction-pack <file>.')
  }
  if (!context.options.instructionMarkdown) {
    return invalidCommand('graph read-model prepare-user-prompt-context requires --instruction-markdown <file>.')
  }

  try {
    const result = await prepareUserPromptContextFile(context.options.root, {
      frontendChain: context.options.frontendChain,
      hookHealth: context.options.hookHealth,
      instructionPack: context.options.instructionPack,
      instructionMarkdown: context.options.instructionMarkdown,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.context.status !== 'user-prompt-submit-context-preview-generated'
    const errorFindings = result.context.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model prepare-user-prompt-context',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'UserPromptSubmit additionalContext preview blocked by unsafe or mismatched inputs.'
        : 'UserPromptSubmit additionalContext preview generated without hook installation or Codex execution.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.context.validationFindings).map((finding) =>
            issue({
              validator: 'UserPromptSubmitContextPreviewGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Regenerate frontend chain, Hook Gateway health, and Instruction Pack artifacts before preparing context.',
            }),
          )
        : [],
      data: {
        ...result.context,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair context inputs. This command did not install hooks, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Use this Markdown as advisory additionalContext only. This command did not install hooks, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model prepare-user-prompt-context',
      exitCode: ExitCode.ValidationFailed,
      message: 'UserPromptSubmit additionalContext preview could not run.',
      issues: [
        issue({
          validator: 'UserPromptSubmitContextPreviewGenerator',
          code: 'USER_PROMPT_CONTEXT_PREVIEW_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable frontend chain, Hook Gateway health, Instruction Pack JSON/Markdown, and dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportUserPromptSubmitAdvisoryCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.prompt && !context.options.promptFile) {
    return invalidCommand(
      'graph read-model report-user-prompt-submit-advisory requires --prompt <text> or --prompt-file <file>.',
    )
  }
  if (context.options.prompt && context.options.promptFile) {
    return invalidCommand('graph read-model report-user-prompt-submit-advisory accepts only one prompt source.')
  }
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model report-user-prompt-submit-advisory requires --hook-health <file>.')
  }
  if (!context.options.output) {
    return invalidCommand('graph read-model report-user-prompt-submit-advisory requires --output <file>.')
  }

  try {
    const result = await reportUserPromptSubmitAdvisoryFile(context.options.root, {
      prompt: context.options.prompt,
      promptFile: context.options.promptFile,
      hookHealth: context.options.hookHealth,
      devviewMode: context.options.devviewMode,
      preflightSession: context.options.preflightSession,
      candidate: context.options.candidate,
      analyzerRun: context.options.analyzerRun,
      analyzerPack: context.options.analyzerPack,
      providerConfig: context.options.providerConfig,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = [
      'user-prompt-submit-advisory-blocked-preflight',
      'user-prompt-submit-advisory-preflight-artifact-missing',
    ].includes(result.report.status)
    const errorFindings = result.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: errorFindings.length === 0,
      command: 'graph read-model report-user-prompt-submit-advisory',
      exitCode: errorFindings.length > 0 ? ExitCode.ValidationFailed : ExitCode.Success,
      message:
        result.report.status === 'user-prompt-submit-advisory-noop-devview-off'
          ? 'UserPromptSubmit advisory report generated with DevView off; no additionalContext injection is ready.'
          : blocked
            ? 'UserPromptSubmit advisory report generated without context injection because preflight is not ready.'
            : result.report.additionalContextInjectionReady
              ? 'UserPromptSubmit advisory additionalContext preview generated without hook blocking or Codex execution.'
              : 'UserPromptSubmit advisory report generated without additionalContext injection.',
      issues:
        errorFindings.length > 0
          ? errorFindings.map((finding) =>
              issue({
                validator: 'UserPromptSubmitAdvisoryReporter',
                code: finding.code,
                severity: finding.severity,
                message: finding.message,
                reason: finding.field ? `Field: ${finding.field}` : undefined,
                suggestedFix:
                  finding.suggestedFix ??
                  'Repair the UserPromptSubmit advisory inputs and rerun into dedicated output paths.',
              }),
            )
          : [],
      data: {
        ...result.report,
        outputPath: result.outputPath,
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: result.report.additionalContextInjectionReady
          ? 'Use this Markdown as advisory additionalContext only. This command did not install hooks, block tools, trigger Codex execution, invoke providers, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : (result.report.nextRequiredCommand ??
            'No advisory additionalContext is ready. This command did not run preflight, invoke providers, install hooks, block tools, or trigger Codex execution.'),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-user-prompt-submit-advisory',
      exitCode: ExitCode.ValidationFailed,
      message: 'UserPromptSubmit advisory report could not run.',
      issues: [
        issue({
          validator: 'UserPromptSubmitAdvisoryReporter',
          code: 'USER_PROMPT_SUBMIT_ADVISORY_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide a prompt, Hook Gateway health artifact, optional preflight session chain, and dedicated safe output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportStopPostRunAdvisoryCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.userPromptAdvisory) {
    return invalidCommand('graph read-model report-stop-post-run-advisory requires --user-prompt-advisory <file>.')
  }
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model report-stop-post-run-advisory requires --hook-health <file>.')
  }
  if (!context.options.output) {
    return invalidCommand('graph read-model report-stop-post-run-advisory requires --output <file>.')
  }

  try {
    const result = await reportStopPostRunAdvisoryFile(context.options.root, {
      userPromptAdvisory: context.options.userPromptAdvisory,
      hookHealth: context.options.hookHealth,
      preflightSession: context.options.preflightSession,
      instructionPack: context.options.instructionPack,
      instructionMarkdown: context.options.instructionMarkdown,
      changedFiles: context.options.changedFiles,
      scopeReport: context.options.scopeReport,
      runtimeReport: context.options.runtimeReport,
      proposal: context.options.proposal,
      reviewPacket: context.options.reviewPacket,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const errorFindings = result.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: errorFindings.length === 0,
      command: 'graph read-model report-stop-post-run-advisory',
      exitCode: errorFindings.length > 0 ? ExitCode.ValidationFailed : ExitCode.Success,
      message:
        result.report.postRunCompletenessStatus === 'review-ready-not-approved'
          ? 'Stop/Post Run advisory report summarized proposal and review packet state without approval.'
          : result.report.postRunCompletenessStatus === 'clean-no-changes-observed'
            ? 'Stop/Post Run advisory report found no changed files; this is not approval or Evidence satisfaction.'
            : 'Stop/Post Run advisory report generated missing-artifact guidance without executing post-run commands.',
      issues:
        errorFindings.length > 0
          ? errorFindings.map((finding) =>
              issue({
                validator: 'StopPostRunAdvisoryReporter',
                code: finding.code,
                severity: finding.severity,
                message: finding.message,
                reason: finding.field ? `Field: ${finding.field}` : undefined,
                suggestedFix:
                  finding.suggestedFix ??
                  'Repair the Stop/Post Run advisory inputs and rerun into dedicated output paths.',
              }),
            )
          : [],
      data: {
        ...result.report,
        outputPath: result.outputPath,
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next:
          result.report.nextRequiredCommands.length > 0
            ? result.report.nextRequiredCommands
            : [
                'Human review remains required. This command did not approve, apply graph deltas, mutate graph-source, accept Evidence, enforce scope, or configure CI.',
              ],
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-stop-post-run-advisory',
      exitCode: ExitCode.ValidationFailed,
      message: 'Stop/Post Run advisory report could not run.',
      issues: [
        issue({
          validator: 'StopPostRunAdvisoryReporter',
          code: 'STOP_POST_RUN_ADVISORY_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide UserPromptSubmit advisory, Hook Gateway health, optional post-run artifacts, and dedicated safe output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateHookScriptScaffoldCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.boundary) {
    return invalidCommand('graph read-model generate-hook-script-scaffold requires --boundary <file>.')
  }
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model generate-hook-script-scaffold requires --hook-health <file>.')
  }
  if (!context.options.installTrust) {
    return invalidCommand('graph read-model generate-hook-script-scaffold requires --install-trust <file>.')
  }
  if (!context.options.userPromptContext) {
    return invalidCommand('graph read-model generate-hook-script-scaffold requires --user-prompt-context <file>.')
  }

  try {
    const result = await generateHookScriptScaffoldFile(context.options.root, {
      boundary: context.options.boundary,
      hookHealth: context.options.hookHealth,
      installTrust: context.options.installTrust,
      userPromptContext: context.options.userPromptContext,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.scaffold.status !== 'devview-hook-script-scaffold-preview-generated'
    const errorFindings = result.scaffold.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-hook-script-scaffold',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook script scaffold preview blocked by unsafe or mismatched inputs.'
        : 'Hook script scaffold preview generated without installing or activating hooks.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.scaffold.validationFindings).map((finding) =>
            issue({
              validator: 'HookScriptScaffoldPreviewGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Regenerate Hook Gateway boundary, health, install/trust, and UserPromptSubmit context previews.',
            }),
          )
        : [],
      data: {
        ...result.scaffold,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair scaffold inputs. This command did not install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Review this scaffold as preview-only hook template context. This command did not install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-hook-script-scaffold',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook script scaffold preview could not run.',
      issues: [
        issue({
          validator: 'HookScriptScaffoldPreviewGenerator',
          code: 'HOOK_SCRIPT_SCAFFOLD_GENERATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Hook Gateway boundary, health, install/trust, UserPromptSubmit context, and dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateHookScriptTemplatesCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.scaffold) {
    return invalidCommand('graph read-model generate-hook-script-templates requires --scaffold <file>.')
  }

  try {
    const result = await generateHookScriptTemplatePreviewFile(context.options.root, {
      scaffold: context.options.scaffold,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.preview.status !== 'devview-hook-script-template-preview-generated'
    const errorFindings = result.preview.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-hook-script-templates',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook script template preview blocked by unsafe or mismatched scaffold input.'
        : 'Hook script template preview generated without writing active hook files.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.preview.validationFindings).map((finding) =>
            issue({
              validator: 'HookScriptTemplatePreviewGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix: finding.suggestedFix ?? 'Regenerate the Hook script scaffold preview.',
            }),
          )
        : [],
      data: {
        ...result.preview,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair scaffold input. This command did not write active hook files, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Review these script bodies as preview-only artifacts. This command did not write active hook files, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-hook-script-templates',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook script template preview could not run.',
      issues: [
        issue({
          validator: 'HookScriptTemplatePreviewGenerator',
          code: 'HOOK_SCRIPT_TEMPLATE_PREVIEW_FAILED',
          severity: 'error',
          message,
          suggestedFix: 'Provide a readable Hook script scaffold and dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelGenerateHookSessionManifestCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model generate-hook-session-manifest requires --hook-health <file>.')
  }
  if (!context.options.userPromptContext) {
    return invalidCommand('graph read-model generate-hook-session-manifest requires --user-prompt-context <file>.')
  }
  if (!context.options.scriptScaffold) {
    return invalidCommand('graph read-model generate-hook-session-manifest requires --script-scaffold <file>.')
  }
  if (!context.options.scriptTemplates) {
    return invalidCommand('graph read-model generate-hook-session-manifest requires --script-templates <file>.')
  }

  try {
    const result = await generateHookSessionManifestFile(context.options.root, {
      hookHealth: context.options.hookHealth,
      userPromptContext: context.options.userPromptContext,
      scriptScaffold: context.options.scriptScaffold,
      scriptTemplates: context.options.scriptTemplates,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.manifest.status !== 'devview-hook-session-manifest-preview-generated'
    const errorFindings = result.manifest.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model generate-hook-session-manifest',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook session manifest preview blocked by unsafe or mismatched inputs.'
        : 'Hook session manifest preview generated without starting or activating hooks.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.manifest.validationFindings).map((finding) =>
            issue({
              validator: 'HookSessionManifestPreviewGenerator',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix: finding.suggestedFix ?? 'Regenerate Hook Gateway health/context/script preview artifacts.',
            }),
          )
        : [],
      data: {
        ...result.manifest,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair manifest inputs. This command did not start hooks, install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Review this manifest as preview-only session context. This command did not start hooks, install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model generate-hook-session-manifest',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook session manifest preview could not run.',
      issues: [
        issue({
          validator: 'HookSessionManifestPreviewGenerator',
          code: 'HOOK_SESSION_MANIFEST_PREVIEW_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Hook Gateway health/context/script preview artifacts and dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelMaterializeHookScriptBundleCommand(
  context: CommandContext,
): Promise<CommandResult> {
  if (!context.options.scriptTemplates) {
    return invalidCommand('graph read-model materialize-hook-script-bundle requires --script-templates <file>.')
  }
  if (!context.options.sessionManifest) {
    return invalidCommand('graph read-model materialize-hook-script-bundle requires --session-manifest <file>.')
  }

  try {
    const result = await materializeHookScriptBundleFile(context.options.root, {
      scriptTemplates: context.options.scriptTemplates,
      sessionManifest: context.options.sessionManifest,
      bundleDir: context.options.bundleDir,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.bundle.status !== 'devview-hook-script-bundle-materialized-preview'
    const errorFindings = result.bundle.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model materialize-hook-script-bundle',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook script bundle preview blocked by unsafe or mismatched inputs.'
        : 'Hook script bundle preview materialized without installing or activating hooks.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.bundle.validationFindings).map((finding) =>
            issue({
              validator: 'HookScriptBundleMaterializer',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix: finding.suggestedFix ?? 'Regenerate Hook script templates and session manifest previews.',
            }),
          )
        : [],
      data: {
        ...result.bundle,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair bundle inputs. This command did not install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Review the repo-local script bundle as preview-only hook material. This command did not install hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model materialize-hook-script-bundle',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook script bundle preview could not run.',
      issues: [
        issue({
          validator: 'HookScriptBundleMaterializer',
          code: 'HOOK_SCRIPT_BUNDLE_MATERIALIZATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Hook script template/session manifest preview artifacts and dedicated preview output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportHookActivationChainCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.hookHealth) {
    return invalidCommand('graph read-model report-hook-activation-chain requires --hook-health <file>.')
  }
  if (!context.options.userPromptContext) {
    return invalidCommand('graph read-model report-hook-activation-chain requires --user-prompt-context <file>.')
  }
  if (!context.options.scriptScaffold) {
    return invalidCommand('graph read-model report-hook-activation-chain requires --script-scaffold <file>.')
  }
  if (!context.options.scriptTemplates) {
    return invalidCommand('graph read-model report-hook-activation-chain requires --script-templates <file>.')
  }
  if (!context.options.sessionManifest) {
    return invalidCommand('graph read-model report-hook-activation-chain requires --session-manifest <file>.')
  }

  try {
    const result = await reportHookActivationChainFile(context.options.root, {
      hookHealth: context.options.hookHealth,
      userPromptContext: context.options.userPromptContext,
      scriptScaffold: context.options.scriptScaffold,
      scriptTemplates: context.options.scriptTemplates,
      sessionManifest: context.options.sessionManifest,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = result.report.status !== 'devview-hook-activation-chain-report-generated'
    const errorFindings = result.report.validationFindings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'graph read-model report-hook-activation-chain',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Hook activation preview chain report blocked by unsafe or mismatched inputs.'
        : 'Hook activation preview chain report generated without activating hooks.',
      issues: blocked
        ? (errorFindings.length > 0 ? errorFindings : result.report.validationFindings).map((finding) =>
            issue({
              validator: 'HookActivationChainReporter',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                finding.suggestedFix ??
                'Regenerate Hook Gateway health/context/script/session preview artifacts before reporting activation readiness.',
            }),
          )
        : [],
      data: {
        ...result.report,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: blocked
          ? 'Repair activation-chain inputs. This command did not activate hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.'
          : 'Review this as preview-only activation readiness context. This command did not activate hooks, configure trust, trigger Codex execution, mutate graph-source, approve work, satisfy Evidence, prove equivalence, or enforce scope.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-hook-activation-chain',
      exitCode: ExitCode.ValidationFailed,
      message: 'Hook activation preview chain report could not run.',
      issues: [
        issue({
          validator: 'HookActivationChainReporter',
          code: 'HOOK_ACTIVATION_CHAIN_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide readable Hook Gateway health/context/script/session preview artifacts and dedicated report output paths.',
        }),
      ],
    }
  }
}

export async function graphReadModelReportDevViewBaselineCommand(context: CommandContext): Promise<CommandResult> {
  if (!context.options.roadmapAudit) {
    return invalidCommand('graph read-model report-devview-baseline requires --roadmap-audit <file>.')
  }
  if (!context.options.finalHandoff) {
    return invalidCommand('graph read-model report-devview-baseline requires --final-handoff <file>.')
  }

  try {
    const result = await reportDevViewBaselineFile(context.options.root, {
      roadmapAudit: context.options.roadmapAudit,
      finalHandoff: context.options.finalHandoff,
      frontendChain: context.options.frontendChain,
      hookActivationChain: context.options.hookActivationChain,
      applyReadiness: context.options.applyReadiness,
      mutationReadiness: context.options.mutationReadiness,
      evidenceAcceptanceReadiness: context.options.evidenceAcceptanceReadiness,
      equivalenceProofReadiness: context.options.equivalenceProofReadiness,
      scopeCiEnforcementReadiness: context.options.scopeCiEnforcementReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const partial = result.report.baselineCompletenessStatus === 'partial-with-warnings'

    return {
      ok: true,
      command: 'graph read-model report-devview-baseline',
      exitCode: ExitCode.Success,
      message: partial
        ? 'DevView core baseline freeze report generated with optional-input warnings.'
        : 'DevView core baseline freeze report generated.',
      issues: result.report.validationFindings.map((finding) =>
        issue({
          validator: 'DevViewBaselineReporter',
          code: finding.code,
          severity: finding.severity,
          message: finding.message,
          reason: finding.field ? `Field: ${finding.field}` : undefined,
          suggestedFix: finding.suggestedFix,
        }),
      ),
      data: {
        ...result.report,
        ...(result.outputPath ? { outputPath: result.outputPath } : {}),
        ...(result.markdownReport ? { markdownReport: result.markdownReport } : {}),
        next: partial
          ? 'Review optional-input warnings. This command created no execution, hook, graph mutation, approval, Evidence, equivalence, enforcement, or Project Memory extension authority.'
          : 'Review the baseline freeze report. This command created no execution, hook, graph mutation, approval, Evidence, equivalence, enforcement, or Project Memory extension authority.',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'graph read-model report-devview-baseline',
      exitCode: ExitCode.ValidationFailed,
      message: 'DevView core baseline freeze report could not run.',
      issues: [
        issue({
          validator: 'DevViewBaselineReporter',
          code: 'DEVVIEW_BASELINE_REPORT_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide the roadmap audit and final handoff artifacts, use optional preview/readiness artifacts only, and choose dedicated output paths.',
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
