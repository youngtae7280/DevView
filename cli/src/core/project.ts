import { existsSync } from 'node:fs'
import path from 'node:path'
import { readJsonSafe } from './fs.js'
import type { DevViewProject, ValidationIssue } from './types.js'
import { issue } from './types.js'

export const defaultArtifacts = {
  productTree: '.devview/tree/product-tree.json',
  projectTree: '.devview/tree/project-tree.json',
  workTree: '.devview/tree/work-tree.json',
  testTree: '.devview/tree/test-tree.json',
  cycleTree: '.devview/execution/cycle-tree.json',
  cycleContract: '.devview/execution/cycle-contract.md',
  decisionQueue: '.devview/control/decision-queue.json',
  changeTree: '.devview/control/change-tree.json',
  impactTree: '.devview/control/impact-tree.json',
  productPatchTree: '.devview/control/product-patch-tree.json',
  acceptanceTree: '.devview/control/acceptance-tree.json',
  evidenceTree: '.devview/evidence/evidence-tree.json',
  devviewState: '.devview/blueprint/devview-state.json',
  devviewRoutingContract: '.devview/blueprint/devview-routing-contract.md',
  dependencyImpactAudit: '.devview/blueprint/dependency-impact-audit.json',
  dependencyImpactAuditMarkdown: '.devview/blueprint/dependency-impact-audit.md',
  executionStrategy: '.devview/blueprint/execution-strategy.json',
  executionStrategyMarkdown: '.devview/blueprint/execution-strategy.md',
  coverageAudit: '.devview/blueprint/coverage-audit.md',
  uxAudit: '.devview/blueprint/ux-audit.md',
  projectBrief: '.devview/blueprint/project-brief.md',
  requirementTree: '.devview/blueprint/requirement-tree.json',
  requirementTreeMarkdown: '.devview/blueprint/requirement-tree.md',
  productIntakeInterviewLog: '.devview/blueprint/product-intake-interview-log.md',
  productIntakeSummary: '.devview/blueprint/product-intake-summary.md',
  uiUxPreview: '.devview/blueprint/ui-ux-preview.json',
  uiUxPreviewMarkdown: '.devview/blueprint/ui-ux-preview.md',
  uiUxConfirmation: '.devview/blueprint/ui-ux-confirmation.md',
  uiUxConfirmationLog: '.devview/blueprint/ui-ux-confirmation-log.md',
  sourceOfTruthMatrix: '.devview/blueprint/source-of-truth-matrix.md',
  devviewInvariants: '.devview/blueprint/devview-invariants.md',
  visualReference: '.devview/blueprint/visual-reference.json',
  visualReferenceMarkdown: '.devview/blueprint/visual-reference.md',
  uiThemeSpec: '.devview/blueprint/ui-theme-spec.md',
  designTokens: '.devview/blueprint/design-tokens.json',
  componentStyleContract: '.devview/blueprint/component-style-contract.json',
  uiSurfaceInventory: '.devview/control/ui-surface-inventory.json',
  componentStyleInventory: '.devview/control/component-style-inventory.json',
  visualVerificationProfile: '.devview/control/visual-verification-profile.json',
  visualAudit: '.devview/evidence/visual-audit.md',
  executionManifest: '.devview/codex-execution-pack/execution-manifest.json',
  finalCoverageCheck: '.devview/codex-execution-pack/16-final-coverage-check.md',
} as const

export type ArtifactKey = keyof typeof defaultArtifacts

export function projectStorageRoot(root: string): '.devview' {
  void root
  return '.devview'
}

export function artifactRelativePath(root: string, key: ArtifactKey): string {
  void root
  return defaultArtifacts[key]
}

export function artifactPath(root: string, key: ArtifactKey): string {
  return path.join(root, artifactRelativePath(root, key))
}

export function stateArtifactCandidates(root: string): string[] {
  return [path.join(root, '.devview', 'blueprint', 'devview-state.json')]
}

export function stateArtifactPath(root: string): string {
  return stateArtifactCandidates(root).find((candidate) => existsSync(candidate)) ?? stateArtifactCandidates(root)[0]
}

export function canonicalStateArtifactRelativePath(root: string): string {
  void root
  return '.devview/blueprint/devview-state.json'
}

export function routingContractCandidates(root: string): string[] {
  return [path.join(root, '.devview', 'blueprint', 'devview-routing-contract.md')]
}

export function routingContractPath(root: string): string {
  return (
    routingContractCandidates(root).find((candidate) => existsSync(candidate)) ?? routingContractCandidates(root)[0]
  )
}

export async function loadProject(root: string): Promise<{ project: DevViewProject; issues: ValidationIssue[] }> {
  const statePath = stateArtifactPath(root)
  const decisionQueuePath = artifactPath(root, 'decisionQueue')
  const storageRoot = projectStorageRoot(root)
  const initialized = existsSync(path.join(root, storageRoot))
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
          code: 'DEVVIEW_STATE_INVALID_JSON',
          severity: 'error',
          file: canonicalStateArtifactRelativePath(root),
          message: `Could not parse devview-state.json: ${parsed.error}`,
          suggestedFix: 'Fix the JSON syntax before running DevView gates.',
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
      devviewDir: path.join(root, storageRoot),
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
