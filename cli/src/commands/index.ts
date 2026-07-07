import type { CommandResult } from '../core/types.js'
import { validateEvidence, validateTraceability, validateVisualDesign } from '../validators/devview-validators.js'
import { acceptCommand } from './accept.js'
import { executionPackCheckCommand, executionPackReadyCommand } from './execution-pack.js'
import { changeCreateCommand } from './change.js'
import { contextPackCommand, contextRecommendCommand } from './context.js'
import { executionCompleteCommand, executionStartCommand } from './execution.js'
import { extensionsReportReadinessCommand } from './extensions.js'
import { filesCheckCommand } from './files.js'
import { gateAssessCommand, gateCommand } from './gate.js'
import {
  graphExecutionContractReportCommand,
  graphOperationApplyProposalCommand,
  graphOperationCaptureDeltaCommand,
  graphOperationGeneratePackCommand,
  graphOperationProposeUpdateCommand,
  graphReadModelCheckScopeCommand,
  graphReadModelAnalyzeRequestCommand,
  graphReadModelApplyGraphDeltaCommand,
  graphRetrofitPlanCommand,
  graphReadModelCollectChangedFilesCommand,
  graphReadModelCompareCommand,
  graphReadModelCheckGraphDeltaApplyCommand,
  graphReadModelCompileContractCommand,
  graphReadModelCreateApprovedProposalStateCommand,
  graphReadModelGenerateCommand,
  graphReadModelGenerateAiRequestAnalyzerPackCommand,
  graphReadModelGenerateClarificationInterviewPackCommand,
  graphReadModelGenerateContractInputCommand,
  graphReadModelGenerateHookSessionManifestCommand,
  graphReadModelGenerateHookScriptScaffoldCommand,
  graphReadModelGenerateHookScriptTemplatesCommand,
  graphReadModelGenerateViewTreeCommand,
  graphReadModelMaterializeHookScriptBundleCommand,
  graphReadModelReportHookActivationChainCommand,
  graphReadModelGenerateInstructionPackCommand,
  graphReadModelObserveCandidatesCommand,
  graphReadModelPlanTraversalCommand,
  graphReadModelPlanGuardedGraphUpdateCommand,
  graphReadModelPrepareUserPromptContextCommand,
  graphReadModelReportUserPromptSubmitAdvisoryCommand,
  graphReadModelReportStopPostRunAdvisoryCommand,
  graphReadModelProposeGraphDeltaCommand,
  graphReadModelProjectCommand,
  graphReadModelProjectIntentCommand,
  graphReadModelReviewGraphDeltaCommand,
  graphReadModelRecordEvidenceDecisionCommand,
  graphReadModelCreateAcceptedEvidenceRecordCommand,
  graphReadModelRecordHumanDecisionCommand,
  graphReadModelReviseRequestIrCandidateCommand,
  graphReadModelRunClarificationChainCommand,
  graphReadModelRunPreflightSessionCommand,
  graphReadModelReportHookGatewayHealthCommand,
  graphReadModelReportCompilerBoundaryCommand,
  graphReadModelReportCompilerInputCommand,
  graphReadModelReportApprovedApplyDryRunCommand,
  graphReadModelReportEvidenceAcceptanceReadinessCommand,
  graphReadModelRecordRuntimeEvidenceSatisfactionCommand,
  graphReadModelReportRuntimeEvidenceSatisfactionReadinessCommand,
  graphReadModelRecordEquivalenceProofCommand,
  graphReadModelRecordGuardedGraphUpdateBoundaryCommand,
  graphReadModelReportEquivalenceProofReadinessCommand,
  graphReadModelReportFrontendChainCommand,
  graphReadModelReportProjectMemoryExtensionGapsCommand,
  graphReadModelReportProjectMemoryImpactCommand,
  graphReadModelRenderDevViewGraphCommand,
  graphReadModelReportHealthCommand,
  graphReadModelReportIntentCommand,
  graphReadModelReportGraphSourceMutationReadinessCommand,
  graphReadModelReportDevViewBaselineCommand,
  graphReadModelRecordScopeCiEnforcementCommand,
  graphReadModelReportScopeCiEnforcementReadinessCommand,
  graphReadModelSelectSliceCommand,
  graphReadModelSummarizeCommand,
  graphReadModelValidateRequestIrGraphCommand,
  graphReadModelValidateRequestIrCommand,
  graphReadModelValidateCommand,
  cleanupLegacyCommand,
  reportLegacyArtifactsCommand,
} from './graph.js'
import { impactAnalyzeCommand } from './impact.js'
import { initCommand } from './init.js'
import { profileRecommendCommand } from './profile.js'
import { productPatchApplyCommand, productPatchProposeCommand } from './product.js'
import { reviewSubmitCommand } from './review.js'
import { revisionCompleteCommand, revisionStartCommand } from './revision.js'
import { productIntakeCheckCommand, productIntakeCloseCommand } from './product-intake.js'
import {
  coverageAuditCompleteCommand,
  dependencyAuditCompleteCommand,
  planExecutionCompleteCommand,
  scopeSelectCommand,
  uxAuditCompleteCommand,
} from './scope.js'
import { checkResult, type CommandContext, invalidCommand } from './shared.js'
import { statusCommand } from './status.js'
import { uiApproveCommand } from './ui.js'
import { validateCommand } from './validate.js'
import { verificationDesignCheckCommand, verificationDesignCloseCommand } from './verification-design.js'
import { workPlanningCheckCommand, workPlanningCloseCommand } from './work-planning.js'
import { workJournalRenderCommand } from './work-journal.js'

export async function runCommand(positionals: string[], context: CommandContext): Promise<CommandResult> {
  const [command, subcommand] = positionals
  if (!command) {
    return invalidCommand('No command provided.')
  }
  if (command === 'init') {
    return initCommand(context)
  }
  if (command === 'status') {
    return statusCommand(context)
  }
  if (command === 'validate') {
    return validateCommand(context)
  }
  if (command === 'report-legacy-artifacts') {
    return reportLegacyArtifactsCommand(context)
  }
  if (command === 'cleanup-legacy') {
    return cleanupLegacyCommand(context)
  }
  if (command === 'extensions' && subcommand === 'report-readiness') {
    return extensionsReportReadinessCommand(context)
  }
  if (command === 'work-journal' && subcommand === 'render') {
    return workJournalRenderCommand(context)
  }
  if (command === 'gate') {
    if (subcommand === 'assess') {
      return gateAssessCommand(context)
    }
    return gateCommand(positionals[1], context)
  }
  if (command === 'product-intake' && subcommand === 'check') {
    return productIntakeCheckCommand(context)
  }
  if (command === 'product-intake' && subcommand === 'close') {
    return productIntakeCloseCommand(context)
  }
  if (command === 'ui' && subcommand === 'approve') {
    return uiApproveCommand(context)
  }
  if (command === 'trace' && subcommand === 'check') {
    const traceStage = context.options.stage
    if (traceStage && !isTraceabilityStage(traceStage)) {
      return invalidCommand(
        '--stage for trace check requires one of: work-planning, verification-design, execution, review, accept.',
      )
    }
    return checkResult('trace check', await validateTraceability(context.options.root, { stage: traceStage }))
  }
  if (command === 'files' && subcommand === 'check') {
    return filesCheckCommand(context)
  }
  if (command === 'work-planning' && subcommand === 'check') {
    return workPlanningCheckCommand(context)
  }
  if (command === 'work-planning' && subcommand === 'close') {
    return workPlanningCloseCommand(context)
  }
  if (command === 'verification-design' && subcommand === 'check') {
    return verificationDesignCheckCommand(context)
  }
  if (command === 'verification-design' && subcommand === 'close') {
    return verificationDesignCloseCommand(context)
  }
  if (command === 'scope' && subcommand === 'select') {
    return scopeSelectCommand(context)
  }
  if (command === 'dependency' && subcommand === 'audit' && positionals[2] === 'complete') {
    return dependencyAuditCompleteCommand(context)
  }
  if (command === 'plan' && subcommand === 'execution' && positionals[2] === 'complete') {
    return planExecutionCompleteCommand(context)
  }
  if (command === 'coverage' && subcommand === 'audit' && positionals[2] === 'complete') {
    return coverageAuditCompleteCommand(context)
  }
  if (command === 'ux' && subcommand === 'audit' && positionals[2] === 'complete') {
    return uxAuditCompleteCommand(context)
  }
  if (command === 'execution-pack' && subcommand === 'check') {
    return executionPackCheckCommand(context)
  }
  if (command === 'execution-pack' && subcommand === 'ready') {
    return executionPackReadyCommand(context)
  }
  if (command === 'execution' && subcommand === 'start') {
    return executionStartCommand(context)
  }
  if (command === 'execution' && subcommand === 'complete') {
    return executionCompleteCommand(context)
  }
  if (command === 'review' && subcommand === 'submit') {
    return reviewSubmitCommand(context)
  }
  if (command === 'accept') {
    return acceptCommand(context)
  }
  if (command === 'change' && subcommand === 'create') {
    return changeCreateCommand(context)
  }
  if (command === 'impact' && subcommand === 'analyze') {
    return impactAnalyzeCommand(context)
  }
  if (command === 'profile' && subcommand === 'recommend') {
    return profileRecommendCommand(context)
  }
  if (command === 'context' && subcommand === 'recommend') {
    return contextRecommendCommand(context)
  }
  if (command === 'context' && subcommand === 'pack') {
    return contextPackCommand(context)
  }
  if (command === 'product' && subcommand === 'patch' && positionals[2] === 'propose') {
    return productPatchProposeCommand(context)
  }
  if (command === 'product' && subcommand === 'patch' && positionals[2] === 'apply') {
    return productPatchApplyCommand(context)
  }
  if (command === 'revision' && subcommand === 'start') {
    return revisionStartCommand(context)
  }
  if (command === 'revision' && subcommand === 'complete') {
    return revisionCompleteCommand(context)
  }
  if (command === 'evidence' && subcommand === 'check') {
    return checkResult('evidence check', await validateEvidence(context.options.root))
  }
  if (command === 'visual' && subcommand === 'check') {
    return checkResult('visual check', await validateVisualDesign(context.options.root))
  }
  if (command === 'graph' && subcommand === 'execution-contract' && positionals[2] === 'report') {
    return graphExecutionContractReportCommand(context)
  }
  if (command === 'graph' && subcommand === 'operation' && positionals[2] === 'apply-proposal') {
    return graphOperationApplyProposalCommand(context)
  }
  if (command === 'graph' && subcommand === 'operation' && positionals[2] === 'generate-pack') {
    return graphOperationGeneratePackCommand(context)
  }
  if (command === 'graph' && subcommand === 'operation' && positionals[2] === 'capture-delta') {
    return graphOperationCaptureDeltaCommand(context)
  }
  if (command === 'graph' && subcommand === 'operation' && positionals[2] === 'propose-update') {
    return graphOperationProposeUpdateCommand(context)
  }
  if (command === 'graph' && subcommand === 'retrofit' && positionals[2] === 'plan') {
    return graphRetrofitPlanCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate') {
    return graphReadModelGenerateCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'compare') {
    return graphReadModelCompareCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'project') {
    return graphReadModelProjectCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'project-intent') {
    return graphReadModelProjectIntentCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-intent') {
    return graphReadModelReportIntentCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-compiler-boundary') {
    return graphReadModelReportCompilerBoundaryCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-compiler-input') {
    return graphReadModelReportCompilerInputCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'compile-contract') {
    return graphReadModelCompileContractCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'collect-changed-files') {
    return graphReadModelCollectChangedFilesCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'check-scope') {
    return graphReadModelCheckScopeCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'propose-graph-delta') {
    return graphReadModelProposeGraphDeltaCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'review-graph-delta') {
    return graphReadModelReviewGraphDeltaCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-human-decision') {
    return graphReadModelRecordHumanDecisionCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'create-approved-proposal-state') {
    return graphReadModelCreateApprovedProposalStateCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'check-graph-delta-apply') {
    return graphReadModelCheckGraphDeltaApplyCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-approved-apply-dry-run') {
    return graphReadModelReportApprovedApplyDryRunCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'apply-graph-delta') {
    return graphReadModelApplyGraphDeltaCommand(context)
  }
  if (
    command === 'graph' &&
    subcommand === 'read-model' &&
    positionals[2] === 'report-graph-source-mutation-readiness'
  ) {
    return graphReadModelReportGraphSourceMutationReadinessCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-evidence-acceptance-readiness') {
    return graphReadModelReportEvidenceAcceptanceReadinessCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-evidence-decision') {
    return graphReadModelRecordEvidenceDecisionCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'create-accepted-evidence-record') {
    return graphReadModelCreateAcceptedEvidenceRecordCommand(context)
  }
  if (
    command === 'graph' &&
    subcommand === 'read-model' &&
    positionals[2] === 'report-runtime-evidence-satisfaction-readiness'
  ) {
    return graphReadModelReportRuntimeEvidenceSatisfactionReadinessCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-runtime-evidence-satisfaction') {
    return graphReadModelRecordRuntimeEvidenceSatisfactionCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-equivalence-proof-readiness') {
    return graphReadModelReportEquivalenceProofReadinessCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-equivalence-proof') {
    return graphReadModelRecordEquivalenceProofCommand(context)
  }
  if (
    command === 'graph' &&
    subcommand === 'read-model' &&
    positionals[2] === 'report-scope-ci-enforcement-readiness'
  ) {
    return graphReadModelReportScopeCiEnforcementReadinessCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-scope-ci-enforcement') {
    return graphReadModelRecordScopeCiEnforcementCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'record-guarded-graph-update-boundary') {
    return graphReadModelRecordGuardedGraphUpdateBoundaryCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'plan-guarded-graph-update') {
    return graphReadModelPlanGuardedGraphUpdateCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-ai-request-analyzer-pack') {
    return graphReadModelGenerateAiRequestAnalyzerPackCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'analyze-request') {
    return graphReadModelAnalyzeRequestCommand(context)
  }
  if (
    command === 'graph' &&
    subcommand === 'read-model' &&
    positionals[2] === 'generate-clarification-interview-pack'
  ) {
    return graphReadModelGenerateClarificationInterviewPackCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'revise-request-ir-candidate') {
    return graphReadModelReviseRequestIrCandidateCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'run-clarification-chain') {
    return graphReadModelRunClarificationChainCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'run-preflight-session') {
    return graphReadModelRunPreflightSessionCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'validate-request-ir') {
    return graphReadModelValidateRequestIrCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'validate-request-ir-graph') {
    return graphReadModelValidateRequestIrGraphCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'plan-traversal') {
    return graphReadModelPlanTraversalCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-view-tree') {
    return graphReadModelGenerateViewTreeCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'select-slice') {
    return graphReadModelSelectSliceCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-contract-input') {
    return graphReadModelGenerateContractInputCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-instruction-pack') {
    return graphReadModelGenerateInstructionPackCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'render-devview-graph') {
    return graphReadModelRenderDevViewGraphCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-project-memory-extension-gaps') {
    return graphReadModelReportProjectMemoryExtensionGapsCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-project-memory-impact') {
    return graphReadModelReportProjectMemoryImpactCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-hook-gateway-health') {
    return graphReadModelReportHookGatewayHealthCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-frontend-chain') {
    return graphReadModelReportFrontendChainCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'prepare-user-prompt-context') {
    return graphReadModelPrepareUserPromptContextCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-user-prompt-submit-advisory') {
    return graphReadModelReportUserPromptSubmitAdvisoryCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-stop-post-run-advisory') {
    return graphReadModelReportStopPostRunAdvisoryCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-hook-script-scaffold') {
    return graphReadModelGenerateHookScriptScaffoldCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-hook-script-templates') {
    return graphReadModelGenerateHookScriptTemplatesCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'generate-hook-session-manifest') {
    return graphReadModelGenerateHookSessionManifestCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'materialize-hook-script-bundle') {
    return graphReadModelMaterializeHookScriptBundleCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-hook-activation-chain') {
    return graphReadModelReportHookActivationChainCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-devview-baseline') {
    return graphReadModelReportDevViewBaselineCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-legacy-artifacts') {
    return reportLegacyArtifactsCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-health') {
    return graphReadModelReportHealthCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'observe-candidates') {
    return graphReadModelObserveCandidatesCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'validate') {
    return graphReadModelValidateCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'summarize') {
    return graphReadModelSummarizeCommand(context)
  }
  return invalidCommand(`Unknown command: ${positionals.join(' ')}`)
}

export type { CommandContext }

function isTraceabilityStage(
  value: string,
): value is 'work-planning' | 'verification-design' | 'execution' | 'review' | 'accept' {
  return ['work-planning', 'verification-design', 'execution', 'review', 'accept'].includes(value)
}
