import { getAutoflow, getOpenBlockingDecisions, loadProject } from '../core/project.js'
import { normalizePbeState, PBE_STATES, type PbeState } from '../core/state-machine.js'
import type { CommandResult } from '../core/types.js'
import type { ValidationIssue } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function statusCommand(context: CommandContext): Promise<CommandResult> {
  const { project, issues } = await loadProject(context.options.root)
  if (!project.initialized || !project.state) {
    return {
      ok: false,
      command: 'status',
      exitCode: issues.length > 0 ? ExitCode.SchemaError : ExitCode.NotInitialized,
      message: 'PBE project is not initialized.',
      issues:
        issues.length > 0
          ? issues
          : [
              issue({
                validator: 'Project',
                code: 'PBE_NOT_INITIALIZED',
                severity: 'error',
                message: '.pbe/blueprint/pbe-state.json was not found.',
                suggestedFix: 'Run `pbe init --profile full --brief "..."` in the target project.',
              }),
            ],
      data: {
        initialized: false,
      },
    }
  }

  const autoflow = getAutoflow(project.state)
  const openDecisions = getOpenBlockingDecisions(project.decisionQueue)
  const rawState = autoflow.state
  const state = normalizePbeState(rawState)
  const stateHistory = Array.isArray(autoflow.stateHistory)
    ? autoflow.stateHistory.filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
      )
    : []
  const lastTransition = stateHistory.length > 0 ? stateHistory[stateHistory.length - 1] : null
  const activeRevision = summarizeActiveRevision(project.state?.activeRevision)
  const blockingIssues = collectStatusBlockingIssues({
    loadIssues: issues,
    rawState,
    state,
    autoflow,
    openDecisions,
    activeRevision,
  })
  const recommendedNextCommand = recommendNextCommand(state, blockingIssues)
  const suggestedFixes = uniqueStrings(blockingIssues.map((entry) => entry.suggestedFix).filter(isString))
  return {
    ok: true,
    command: 'status',
    exitCode: ExitCode.Success,
    message: [
      'PBE Status',
      '',
      `Initialized: yes`,
      `Profile: ${String(autoflow.profile || 'unknown')}`,
      `Current state: ${String(rawState || 'unknown')}`,
      `Current gate: ${String(autoflow.currentGate || 'none')}`,
      `Next step: ${String(autoflow.nextStep || 'unknown')}`,
      `Delivery status: ${String(project.state.deliveryStatus || 'unknown')}`,
      `Active revision: ${activeRevision ? formatActiveRevision(activeRevision) : 'none'}`,
      `Last transition: ${formatTransition(lastTransition)}`,
      `Open blocking decisions: ${openDecisions.length}`,
      `Recommended next command: ${recommendedNextCommand || 'none'}`,
      `Blocking issues: ${blockingIssues.length}`,
      `Suggested fix: ${suggestedFixes[0] || 'none'}`,
    ].join('\n'),
    issues: blockingIssues,
    data: {
      initialized: true,
      profile: autoflow.profile || null,
      state: rawState || null,
      currentGate: autoflow.currentGate || null,
      nextStep: autoflow.nextStep || null,
      deliveryStatus: project.state.deliveryStatus || null,
      activeRevision,
      stateHistoryCount: stateHistory.length,
      lastTransition,
      recommendedNextCommand,
      blockingIssues,
      suggestedFixes,
      openBlockingDecisions: openDecisions,
      artifacts: project.state.artifacts || {},
    },
  }
}

const recommendedNextCommandByState: Record<PbeState, string | null> = {
  INIT: 'pbe rpd close or pbe rpd check',
  WAITING_ROOT_CONFIRMATION: 'pbe rpd close',
  RPD_IN_PROGRESS: 'pbe rpd check',
  RPD_DONE: 'pbe ui approve or pbe wpd close',
  WAITING_UI_UX_CONFIRM: 'pbe ui approve',
  UI_UX_APPROVED: 'pbe wpd close',
  VISUAL_CONTRACT_READY: 'pbe wpd close',
  WPD_IN_PROGRESS: 'pbe wpd close',
  WPD_DONE: 'pbe vd close',
  UI_SURFACE_INVENTORY_DONE: 'pbe vd close',
  VD_IN_PROGRESS: 'pbe vd close',
  VD_DONE: 'pbe scope select',
  WAITING_IMPLEMENTATION_SCOPE: 'pbe scope select',
  SCOPE_SELECTED: 'pbe acep ready',
  ACEP_READY: 'pbe execution start',
  EXECUTION_IN_PROGRESS: 'pbe execution complete',
  ACEP_RUN_DONE: 'pbe review submit',
  VISUAL_AUDIT_DONE: 'pbe review submit',
  WAITING_REVIEW_RESULT: 'pbe accept or pbe change create',
  REVISION_REQUESTED: 'pbe revision complete',
  ACCEPTED: 'pbe accept or DONE if closure is complete',
  DONE: null,
  BLOCKED: 'pbe validate',
}

function recommendNextCommand(state: PbeState | null, issues: ValidationIssue[]): string | null {
  const issueCommand = issues.find((entry) => entry.severity === 'error' && entry.nextCommand)?.nextCommand
  if (issueCommand) {
    return issueCommand
  }
  if (!state) {
    return 'pbe validate'
  }
  return recommendedNextCommandByState[state]
}

function collectStatusBlockingIssues(input: {
  loadIssues: ValidationIssue[]
  rawState: unknown
  state: PbeState | null
  autoflow: Record<string, unknown>
  openDecisions: Record<string, unknown>[]
  activeRevision: Record<string, unknown> | null
}): ValidationIssue[] {
  const statusIssues = [...input.loadIssues]

  if (!input.state) {
    statusIssues.push(
      issue({
        validator: 'Status',
        code: 'UNKNOWN_STATE',
        severity: 'error',
        file: '.pbe/blueprint/pbe-state.json',
        message: `Unknown PBE autoflow.state: ${String(input.rawState || '<missing>')}.`,
        suggestedFix: `Run \`pbe validate\` and repair the state to one of: ${PBE_STATES.join(', ')}.`,
        nextCommand: 'pbe validate',
      }),
    )
  }

  for (const decision of input.openDecisions) {
    statusIssues.push(
      issue({
        validator: 'DecisionQueue',
        code: 'BLOCKING_DECISION_OPEN',
        severity: 'error',
        file: '.pbe/control/decision-queue.json',
        nodeId: isString(decision.id) ? decision.id : undefined,
        message: `Blocking decision is open: ${String(decision.question || decision.reason || decision.id || 'unknown decision')}.`,
        suggestedFix: 'Resolve the blocking decision before continuing downstream PBE stages.',
      }),
    )
  }

  const lastFailure = input.autoflow.lastFailure
  if (typeof lastFailure === 'object' && lastFailure !== null) {
    const failure = lastFailure as Record<string, unknown>
    statusIssues.push(
      issue({
        validator: 'Autoflow',
        code: 'LAST_FAILURE_PRESENT',
        severity: 'error',
        file: '.pbe/blueprint/pbe-state.json',
        message: `Last failure is still present: ${String(failure.failedStep || failure.step || 'unknown step')}.`,
        suggestedFix: isString(failure.suggestedFix)
          ? failure.suggestedFix
          : 'Resolve the recorded failure before continuing downstream PBE stages.',
        nextCommand: isString(failure.nextCommand) ? failure.nextCommand : undefined,
      }),
    )
  }

  if (input.state === 'REVISION_REQUESTED' && !input.activeRevision) {
    statusIssues.push(
      issue({
        validator: 'Revision',
        code: 'REVISION_CONTEXT_MISSING',
        severity: 'error',
        file: '.pbe/blueprint/pbe-state.json',
        message: 'State is REVISION_REQUESTED but activeRevision is missing.',
        suggestedFix: 'Run `pbe revision start` for the affected Change node before revision work continues.',
        nextCommand: 'pbe revision start',
      }),
    )
  }

  return statusIssues
}

function summarizeActiveRevision(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const revision = value as Record<string, unknown>
  return {
    changeNodeId: revision.changeNodeId || null,
    status: revision.status || null,
    startedAt: revision.startedAt || null,
    impactNodeIds: Array.isArray(revision.impactNodeIds) ? revision.impactNodeIds : [],
    affectedProductNodeIds: Array.isArray(revision.affectedProductNodeIds) ? revision.affectedProductNodeIds : [],
    affectedWorkNodeIds: Array.isArray(revision.affectedWorkNodeIds) ? revision.affectedWorkNodeIds : [],
    affectedTestNodeIds: Array.isArray(revision.affectedTestNodeIds) ? revision.affectedTestNodeIds : [],
    affectedEvidenceNodeIds: Array.isArray(revision.affectedEvidenceNodeIds) ? revision.affectedEvidenceNodeIds : [],
    affectedAcceptanceNodeIds: Array.isArray(revision.affectedAcceptanceNodeIds)
      ? revision.affectedAcceptanceNodeIds
      : [],
  }
}

function formatActiveRevision(revision: Record<string, unknown>): string {
  return `${String(revision.changeNodeId || 'unknown change')} (${String(revision.status || 'unknown status')})`
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function formatTransition(entry: Record<string, unknown> | null): string {
  if (!entry) {
    return 'none'
  }
  return `${String(entry.from || '?')} -> ${String(entry.to || '?')} via ${String(entry.command || '?')}`
}
