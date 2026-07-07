import { recommendContext } from '../core/context-recommendation.js'
import { getAutoflow, getOpenBlockingDecisions, loadProject } from '../core/project.js'
import { normalizePbeState, PBE_STATES, type PbeState } from '../core/state-machine.js'
import type { CommandResult, ContextStageOption } from '../core/types.js'
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
      message: 'DevView project is not initialized.',
      issues:
        issues.length > 0
          ? issues
          : [
              issue({
                validator: 'Project',
                code: 'DEVVIEW_NOT_INITIALIZED',
                severity: 'error',
                message: '.devview/blueprint/devview-state.json was not found.',
                suggestedFix: 'Run `devview init --profile full --brief "..."` in the target project.',
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
  const profile = normalizeProfile(autoflow.profile)
  const profileGuidance = profile ? profileGuidanceByProfile[profile] : null
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
  const recommendedContext = recommendStatusContext(state, profile, blockingIssues)
  const suggestedFixes = uniqueStrings(blockingIssues.map((entry) => entry.suggestedFix).filter(isString))
  const messageLines = [
    'DevView Status',
    '',
    `Initialized: yes`,
    `Profile: ${String(autoflow.profile || 'unknown')}`,
    `Current state: ${String(state || rawState || 'unknown')}`,
    `Current gate: ${String(autoflow.currentGate || 'none')}`,
    `Next step: ${String(autoflow.nextStep || 'unknown')}`,
    `Delivery status: ${String(project.state.deliveryStatus || 'unknown')}`,
    `Active revision: ${activeRevision ? formatActiveRevision(activeRevision) : 'none'}`,
    `Last transition: ${formatTransition(lastTransition)}`,
    `Open blocking decisions: ${openDecisions.length}`,
    `Recommended next command: ${recommendedNextCommand || 'none'}`,
    `Blocking issues: ${blockingIssues.length}`,
    `Suggested fix: ${suggestedFixes[0] || 'none'}`,
  ]
  if (profileGuidance) {
    messageLines.push('', ...formatProfileGuidance(profileGuidance))
  }
  messageLines.push('', ...formatRecommendedContext(recommendedContext))
  return {
    ok: true,
    command: 'status',
    exitCode: ExitCode.Success,
    message: messageLines.join('\n'),
    issues: blockingIssues,
    data: {
      initialized: true,
      profile: autoflow.profile || null,
      profileGuidance,
      state: rawState || null,
      currentGate: autoflow.currentGate || null,
      nextStep: autoflow.nextStep || null,
      deliveryStatus: project.state.deliveryStatus || null,
      activeRevision,
      stateHistoryCount: stateHistory.length,
      lastTransition,
      recommendedNextCommand,
      recommendedContext,
      blockingIssues,
      suggestedFixes,
      openBlockingDecisions: openDecisions,
      artifacts: project.state.artifacts || {},
    },
  }
}

type PbeProfile = 'full' | 'lite' | 'bypass'

interface ProfileGuidance {
  profile: PbeProfile
  workflowDepth: 'standard' | 'compact' | 'none'
  summary: string
  mustKeepGuards: string[]
  escalationTriggers: string[]
  limitations: string[]
}

const profileGuidanceByProfile: Record<PbeProfile, ProfileGuidance> = {
  lite: {
    profile: 'lite',
    workflowDepth: 'compact',
    summary:
      'This run uses compact DevView guidance for a bounded low-risk slice. It is not a separate mode or a safety bypass.',
    mustKeepGuards: [
      'user-only acceptance',
      'no direct devview-state edit',
      'expectedFiles / File Change Guard',
      'minimal Acceptance Criteria',
      'minimal Test/Evidence',
      'evidence freshness/currentness',
      'review before accept',
      'Product Patch for product meaning changes',
      'Change/Impact for accepted-branch changes',
    ],
    escalationTriggers: [
      'product meaning change',
      'unclear AC or scope',
      'UI/UX taste or visual design work',
      'DB/schema/auth/permission change',
      'external API/hardware/concurrency change',
      'broad expectedFiles or multiple modules',
      'repeated review rejection',
      'Product Patch required',
      'high-risk manual-only evidence',
    ],
    limitations: [
      '`lite` is compatibility metadata, not a separate public workflow',
      'No dedicated devview lite command',
      'No reduced artifact initialization',
    ],
  },
  full: {
    profile: 'full',
    workflowDepth: 'standard',
    summary:
      'Follow the normal DevView workflow with full planning depth for unclear, high-risk, UI/UX, multi-module, or product-meaning work.',
    mustKeepGuards: [],
    escalationTriggers: [],
    limitations: [],
  },
  bypass: {
    profile: 'bypass',
    workflowDepth: 'none',
    summary:
      'Bypass means DevView tracking is not active for this work. Use the normal DevView flow if traceability, evidence, review, or acceptance control is needed.',
    mustKeepGuards: [],
    escalationTriggers: ['any DevView traceability is needed', 'evidence, review, or acceptance control is needed'],
    limitations: [],
  },
}

function normalizeProfile(value: unknown): PbeProfile | null {
  if (value === 'full' || value === 'lite' || value === 'bypass') {
    return value
  }
  return null
}

function formatProfileGuidance(guidance: ProfileGuidance): string[] {
  if (guidance.profile === 'lite') {
    return [
      'Compact workflow guidance:',
      `- ${guidance.summary}`,
      `- Keep ${guidance.mustKeepGuards.join(', ')}.`,
      `- Increase to full planning depth if ${guidance.escalationTriggers.join(', ')} appears.`,
      `- Current limitations: ${guidance.limitations.join('; ')}.`,
    ]
  }
  if (guidance.profile === 'full') {
    return ['Full-depth workflow guidance:', `- ${guidance.summary}`]
  }
  return ['No-tracking guidance:', `- ${guidance.summary}`]
}

const recommendedNextCommandByState: Record<PbeState, string | null> = {
  INIT: 'devview product-intake close or devview product-intake check',
  WAITING_ROOT_CONFIRMATION: 'devview product-intake close',
  PRODUCT_INTAKE_IN_PROGRESS: 'devview product-intake check',
  PRODUCT_INTAKE_DONE: 'devview ui approve or devview work-planning close',
  WAITING_UI_UX_CONFIRM: 'devview ui approve',
  UI_UX_APPROVED: 'devview work-planning close',
  VISUAL_CONTRACT_READY: 'devview work-planning close',
  WORK_PLANNING_IN_PROGRESS: 'devview work-planning close',
  WORK_PLANNING_DONE: 'devview verification-design close',
  UI_SURFACE_INVENTORY_DONE: 'devview verification-design close',
  VERIFICATION_DESIGN_IN_PROGRESS: 'devview verification-design close',
  VERIFICATION_DESIGN_DONE: 'devview scope select',
  WAITING_IMPLEMENTATION_SCOPE: 'devview scope select',
  SCOPE_SELECTED: 'devview execution-pack ready',
  EXECUTION_PACK_READY: 'devview execution start',
  EXECUTION_IN_PROGRESS: 'devview execution complete',
  EXECUTION_PACK_RUN_DONE: 'devview review submit',
  VISUAL_AUDIT_DONE: 'devview review submit',
  WAITING_REVIEW_RESULT: 'devview accept or devview change create',
  REVISION_REQUESTED: 'devview revision complete',
  ACCEPTED: 'devview accept or DONE if closure is complete',
  DONE: null,
  BLOCKED: 'devview validate',
}

function recommendNextCommand(state: PbeState | null, issues: ValidationIssue[]): string | null {
  const issueCommand = issues.find((entry) => entry.severity === 'error' && entry.nextCommand)?.nextCommand
  if (issueCommand) {
    return issueCommand
  }
  if (!state) {
    return 'devview validate'
  }
  return recommendedNextCommandByState[state]
}

function recommendStatusContext(
  state: PbeState | null,
  profile: PbeProfile | null,
  issues: ValidationIssue[],
): ReturnType<typeof recommendContext> {
  const contextStage = contextStageForState(state, issues)
  const recommendation = recommendContext({
    stage: contextStage,
    profile: profile || undefined,
  })
  return {
    ...recommendation,
    reasons: [
      state
        ? `current state ${state} maps to ${recommendation.detectedStage} context`
        : `unknown state maps to ${recommendation.detectedStage} context`,
      ...recommendation.reasons.filter((reason) => !reason.startsWith('--stage ')),
    ],
    notes: [
      'Read readFirst before broad docs scanning.',
      'Load full docs only when the context card says they are needed.',
      'This is context guidance only.',
    ],
  }
}

function contextStageForState(state: PbeState | null, issues: ValidationIssue[]): ContextStageOption {
  if (!state) {
    return 'start'
  }
  if (state === 'BLOCKED') {
    return isReviewRelatedBlock(issues) ? 'review' : 'start'
  }
  const mapping: Record<Exclude<PbeState, 'BLOCKED'>, ContextStageOption> = {
    INIT: 'start',
    WAITING_ROOT_CONFIRMATION: 'start',
    PRODUCT_INTAKE_IN_PROGRESS: 'product-intake',
    PRODUCT_INTAKE_DONE: 'product-intake',
    WAITING_UI_UX_CONFIRM: 'verification-design',
    UI_UX_APPROVED: 'verification-design',
    VISUAL_CONTRACT_READY: 'verification-design',
    WORK_PLANNING_IN_PROGRESS: 'work-planning',
    WORK_PLANNING_DONE: 'work-planning',
    UI_SURFACE_INVENTORY_DONE: 'verification-design',
    VERIFICATION_DESIGN_IN_PROGRESS: 'verification-design',
    VERIFICATION_DESIGN_DONE: 'verification-design',
    WAITING_IMPLEMENTATION_SCOPE: 'work-planning',
    SCOPE_SELECTED: 'work-planning',
    EXECUTION_PACK_READY: 'execution',
    EXECUTION_IN_PROGRESS: 'execution',
    EXECUTION_PACK_RUN_DONE: 'execution',
    VISUAL_AUDIT_DONE: 'review',
    WAITING_REVIEW_RESULT: 'review',
    REVISION_REQUESTED: 'revision',
    ACCEPTED: 'review',
    DONE: 'review',
  }
  return mapping[state]
}

function isReviewRelatedBlock(issues: ValidationIssue[]): boolean {
  return issues.some((entry) =>
    ['REVIEW', 'ACCEPT', 'ACCEPTANCE', 'EVIDENCE', 'VISUAL', 'FILE_CHANGE', 'REVISION'].some((token) =>
      entry.code.includes(token),
    ),
  )
}

function formatRecommendedContext(recommendation: ReturnType<typeof recommendContext>): string[] {
  return [
    'Recommended context:',
    `- Read first: ${formatPathList(recommendation.readFirst)}`,
    `- Full docs only if needed: ${formatPathList(recommendation.readOnlyIfNeeded)}`,
  ]
}

function formatPathList(paths: string[]): string {
  return paths.length > 0 ? paths.join(', ') : 'none'
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
        file: '.devview/blueprint/devview-state.json',
        message: `Unknown DevView autoflow.state: ${String(input.rawState || '<missing>')}.`,
        suggestedFix: `Run \`devview validate\` and repair the state to one of: ${PBE_STATES.join(', ')}.`,
        nextCommand: 'devview validate',
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
        suggestedFix: 'Resolve the blocking decision before continuing downstream DevView stages.',
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
        file: '.devview/blueprint/devview-state.json',
        message: `Last failure is still present: ${String(failure.failedStep || failure.step || 'unknown step')}.`,
        suggestedFix: isString(failure.suggestedFix)
          ? failure.suggestedFix
          : 'Resolve the recorded failure before continuing downstream DevView stages.',
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
        file: '.devview/blueprint/devview-state.json',
        message: 'State is REVISION_REQUESTED but activeRevision is missing.',
        suggestedFix: 'Run `devview revision start` for the affected Change node before revision work continues.',
        nextCommand: 'devview revision start',
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
  const from = normalizePbeState(entry.from) || entry.from || '?'
  const to = normalizePbeState(entry.to) || entry.to || '?'
  return `${String(from)} -> ${String(to)} via ${String(entry.command || '?')}`
}
