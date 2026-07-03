import type { CommandResult } from '../core/types.js'
import { validateEvidence, validateTraceability, validateVisualDesign } from '../validators/pbe-validators.js'
import { acceptCommand } from './accept.js'
import { acepCheckCommand, acepReadyCommand } from './acep.js'
import { changeCreateCommand } from './change.js'
import { contextPackCommand, contextRecommendCommand } from './context.js'
import { executionCompleteCommand, executionStartCommand } from './execution.js'
import { filesCheckCommand } from './files.js'
import { gateAssessCommand, gateCommand } from './gate.js'
import {
  graphExecutionContractReportCommand,
  graphOperationApplyProposalCommand,
  graphOperationCaptureDeltaCommand,
  graphOperationGeneratePackCommand,
  graphOperationProposeUpdateCommand,
  graphOperationRunChainCommand,
  graphReadModelCheckScopeCommand,
  graphRetrofitPlanCommand,
  graphReadModelCollectChangedFilesCommand,
  graphReadModelCompareCommand,
  graphReadModelCompileContractCommand,
  graphReadModelGenerateCommand,
  graphReadModelGenerateContractInputCommand,
  graphReadModelGenerateInstructionPackCommand,
  graphReadModelObserveCandidatesCommand,
  graphReadModelPlanTraversalCommand,
  graphReadModelProposeGraphDeltaCommand,
  graphReadModelProjectCommand,
  graphReadModelProjectIntentCommand,
  graphReadModelReviewGraphDeltaCommand,
  graphReadModelReportHookGatewayHealthCommand,
  graphReadModelReportCompilerBoundaryCommand,
  graphReadModelReportCompilerInputCommand,
  graphReadModelReportHealthCommand,
  graphReadModelReportIntentCommand,
  graphReadModelSelectSliceCommand,
  graphReadModelSummarizeCommand,
  graphReadModelValidateRequestIrGraphCommand,
  graphReadModelValidateRequestIrCommand,
  graphReadModelValidateCommand,
} from './graph.js'
import { impactAnalyzeCommand } from './impact.js'
import { initCommand } from './init.js'
import { profileRecommendCommand } from './profile.js'
import { productPatchApplyCommand, productPatchProposeCommand } from './product.js'
import { reviewSubmitCommand } from './review.js'
import { revisionCompleteCommand, revisionStartCommand } from './revision.js'
import { rpdCheckCommand, rpdCloseCommand } from './rpd.js'
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
import { vdCheckCommand, vdCloseCommand } from './vd.js'
import { wpdCheckCommand, wpdCloseCommand } from './wpd.js'

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
  if (command === 'gate') {
    if (subcommand === 'assess') {
      return gateAssessCommand(context)
    }
    return gateCommand(positionals[1], context)
  }
  if (command === 'rpd' && subcommand === 'check') {
    return rpdCheckCommand(context)
  }
  if (command === 'rpd' && subcommand === 'close') {
    return rpdCloseCommand(context)
  }
  if (command === 'ui' && subcommand === 'approve') {
    return uiApproveCommand(context)
  }
  if (command === 'trace' && subcommand === 'check') {
    const traceStage = context.options.stage
    if (traceStage && !isTraceabilityStage(traceStage)) {
      return invalidCommand('--stage for trace check requires one of: wpd, vd, execution, review, accept.')
    }
    return checkResult('trace check', await validateTraceability(context.options.root, { stage: traceStage }))
  }
  if (command === 'files' && subcommand === 'check') {
    return filesCheckCommand(context)
  }
  if (command === 'wpd' && subcommand === 'check') {
    return wpdCheckCommand(context)
  }
  if (command === 'wpd' && subcommand === 'close') {
    return wpdCloseCommand(context)
  }
  if (command === 'vd' && subcommand === 'check') {
    return vdCheckCommand(context)
  }
  if (command === 'vd' && subcommand === 'close') {
    return vdCloseCommand(context)
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
  if (command === 'acep' && subcommand === 'check') {
    return acepCheckCommand(context)
  }
  if (command === 'acep' && subcommand === 'ready') {
    return acepReadyCommand(context)
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
  if (command === 'graph' && subcommand === 'operation' && positionals[2] === 'run-chain') {
    return graphOperationRunChainCommand(context)
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
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'validate-request-ir') {
    return graphReadModelValidateRequestIrCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'validate-request-ir-graph') {
    return graphReadModelValidateRequestIrGraphCommand(context)
  }
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'plan-traversal') {
    return graphReadModelPlanTraversalCommand(context)
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
  if (command === 'graph' && subcommand === 'read-model' && positionals[2] === 'report-hook-gateway-health') {
    return graphReadModelReportHookGatewayHealthCommand(context)
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

function isTraceabilityStage(value: string): value is 'wpd' | 'vd' | 'execution' | 'review' | 'accept' {
  return ['wpd', 'vd', 'execution', 'review', 'accept'].includes(value)
}
