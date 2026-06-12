import { existsSync } from 'node:fs'
import path from 'node:path'
import { readJsonSafe } from './fs.js'
import type { PbeProject, ValidationIssue } from './types.js'
import { issue } from './types.js'

export const defaultArtifacts = {
  productTree: '.pbe/tree/product-tree.json',
  projectTree: '.pbe/tree/project-tree.json',
  workTree: '.pbe/tree/work-tree.json',
  testTree: '.pbe/tree/test-tree.json',
  cycleTree: '.pbe/execution/cycle-tree.json',
  decisionQueue: '.pbe/control/decision-queue.json',
  changeTree: '.pbe/control/change-tree.json',
  impactTree: '.pbe/control/impact-tree.json',
  acceptanceTree: '.pbe/control/acceptance-tree.json',
  evidenceTree: '.pbe/evidence/evidence-tree.json',
  pbeState: '.pbe/blueprint/pbe-state.json',
  projectBrief: '.pbe/blueprint/project-brief.md',
  requirementTree: '.pbe/blueprint/requirement-tree.json',
  requirementTreeMarkdown: '.pbe/blueprint/requirement-tree.md',
  rpdInterviewLog: '.pbe/blueprint/rpd-interview-log.md',
  rpdSummary: '.pbe/blueprint/rpd-summary.md',
  uiUxPreview: '.pbe/blueprint/ui-ux-preview.json',
  uiUxPreviewMarkdown: '.pbe/blueprint/ui-ux-preview.md',
  uiUxConfirmation: '.pbe/blueprint/ui-ux-confirmation.md',
  uiUxConfirmationLog: '.pbe/blueprint/ui-ux-confirmation-log.md',
  sourceOfTruthMatrix: '.pbe/blueprint/source-of-truth-matrix.md',
  pbeInvariants: '.pbe/blueprint/pbe-invariants.md',
  visualReference: '.pbe/blueprint/visual-reference.json',
  visualReferenceMarkdown: '.pbe/blueprint/visual-reference.md',
  uiThemeSpec: '.pbe/blueprint/ui-theme-spec.md',
  designTokens: '.pbe/blueprint/design-tokens.json',
  componentStyleContract: '.pbe/blueprint/component-style-contract.json',
  uiSurfaceInventory: '.pbe/control/ui-surface-inventory.json',
  componentStyleInventory: '.pbe/control/component-style-inventory.json',
  visualVerificationProfile: '.pbe/control/visual-verification-profile.json',
  visualAudit: '.pbe/evidence/visual-audit.md',
  executionManifest: '.pbe/codex-execution-pack/execution-manifest.json',
  finalCoverageCheck: '.pbe/codex-execution-pack/16-final-coverage-check.md',
} as const

export type ArtifactKey = keyof typeof defaultArtifacts

export function artifactPath(root: string, key: ArtifactKey): string {
  return path.join(root, defaultArtifacts[key])
}

export async function loadProject(root: string): Promise<{ project: PbeProject; issues: ValidationIssue[] }> {
  const statePath = artifactPath(root, 'pbeState')
  const decisionQueuePath = artifactPath(root, 'decisionQueue')
  const initialized = existsSync(path.join(root, '.pbe'))
  const issues: ValidationIssue[] = []
  let state: Record<string, unknown> | null = null
  let decisionQueue: Record<string, unknown> | null = null

  if (existsSync(statePath)) {
    const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
    if (parsed.ok) {
      state = parsed.value
    } else {
      issues.push(
        issue({
          validator: 'Project',
          code: 'PBE_STATE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.pbeState,
          message: `Could not parse pbe-state.json: ${parsed.error}`,
          suggestedFix: 'Fix the JSON syntax before running PBE gates.',
        }),
      )
    }
  }

  if (existsSync(decisionQueuePath)) {
    const parsed = await readJsonSafe<Record<string, unknown>>(decisionQueuePath)
    if (parsed.ok) {
      decisionQueue = parsed.value
    } else {
      issues.push(
        issue({
          validator: 'Project',
          code: 'DECISION_QUEUE_INVALID_JSON',
          severity: 'error',
          file: defaultArtifacts.decisionQueue,
          message: `Could not parse decision queue: ${parsed.error}`,
          suggestedFix: 'Fix the decision queue JSON syntax before continuing.',
        }),
      )
    }
  }

  return {
    project: {
      root,
      pbeDir: path.join(root, '.pbe'),
      initialized,
      statePath,
      state,
      decisionQueue,
    },
    issues,
  }
}

export function getAutoflow(state: Record<string, unknown> | null): Record<string, unknown> {
  const autoflow = state?.autoflow
  return typeof autoflow === 'object' && autoflow !== null ? (autoflow as Record<string, unknown>) : {}
}

export function getOpenBlockingDecisions(decisionQueue: Record<string, unknown> | null): Record<string, unknown>[] {
  const decisions = Array.isArray(decisionQueue?.decisions) ? decisionQueue.decisions : []
  return decisions
    .filter((decision): decision is Record<string, unknown> => typeof decision === 'object' && decision !== null)
    .filter(
      (decision) => decision.status === 'open' && ['gate', 'blocking'].includes(String(decision.blockingLevel || '')),
    )
}
