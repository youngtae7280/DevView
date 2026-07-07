import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { defaultArtifacts, projectStorageRoot } from '../core/project.js'
import { ensureDir, writeJsonAtomic, writeTextAtomic } from '../core/fs.js'
import { PBE_STATE } from '../core/state-machine.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode } from '../core/types.js'
import { type CommandContext, invalidCommand } from './shared.js'

const initDirs = [
  '.pbe/tree',
  '.pbe/execution/node-execution-contracts',
  '.pbe/control',
  '.pbe/evidence/screenshots',
  '.pbe/evidence/review-reports',
  '.pbe/evidence/test-results',
  '.pbe/evidence/logs',
  '.pbe/blueprint',
  '.pbe/codex-execution-pack',
  '.pbe/review',
  '.pbe/revisions',
]

const jsonTemplateTargets: Array<{
  template: string
  target: string
  transform?: (value: Record<string, unknown>, context: CommandContext) => Record<string, unknown>
}> = [
  { template: 'product-tree.template.json', target: defaultArtifacts.productTree, transform: transformProductTree },
  { template: 'project-tree.template.json', target: defaultArtifacts.projectTree },
  { template: 'work-tree.template.json', target: defaultArtifacts.workTree },
  { template: 'test-tree.template.json', target: defaultArtifacts.testTree },
  { template: 'decision-queue.template.json', target: defaultArtifacts.decisionQueue },
  { template: 'change-tree.template.json', target: defaultArtifacts.changeTree },
  { template: 'impact-tree.template.json', target: defaultArtifacts.impactTree },
  { template: 'product-patch-tree.template.json', target: defaultArtifacts.productPatchTree },
  { template: 'acceptance-tree.template.json', target: defaultArtifacts.acceptanceTree },
  { template: 'evidence-tree.template.json', target: defaultArtifacts.evidenceTree },
  { template: 'visual-reference.template.json', target: defaultArtifacts.visualReference },
  { template: 'design-tokens.template.json', target: defaultArtifacts.designTokens },
  { template: 'component-style-contract.template.json', target: defaultArtifacts.componentStyleContract },
  { template: 'ui-surface-inventory.template.json', target: defaultArtifacts.uiSurfaceInventory },
  { template: 'component-style-inventory.template.json', target: defaultArtifacts.componentStyleInventory },
  { template: 'visual-verification-profile.template.json', target: defaultArtifacts.visualVerificationProfile },
  {
    template: 'requirement-tree.template.json',
    target: defaultArtifacts.requirementTree,
    transform: transformRequirementTree,
  },
  { template: 'devview-state.template.json', target: defaultArtifacts.devviewState, transform: transformPbeState },
]

const textTemplateTargets: Array<{ template?: string; target: string; fallback: (context: CommandContext) => string }> =
  [
    {
      target: defaultArtifacts.projectBrief,
      fallback: (context) => `# Project Brief\n\n${context.options.brief || 'Initial DevView project brief.'}\n`,
    },
    {
      target: defaultArtifacts.requirementTreeMarkdown,
      fallback: (context) =>
        `# Requirement Tree\n\nRoot request: ${context.options.brief || 'Initial project request'}\n`,
    },
    { target: defaultArtifacts.rpdInterviewLog, fallback: () => '# RPD Interview Log\n\n' },
    { target: defaultArtifacts.rpdSummary, fallback: () => '# RPD Summary\n\nRPD is not closed yet.\n' },
    {
      template: 'source-of-truth-matrix-template.md',
      target: defaultArtifacts.sourceOfTruthMatrix,
      fallback: () => '# Source Of Truth Matrix\n\n',
    },
    {
      template: 'devview-routing-contract-template.md',
      target: defaultArtifacts.devviewRoutingContract,
      fallback: () => '# DevView Routing Contract\n\n',
    },
    {
      template: 'pbe-invariants-template.md',
      target: defaultArtifacts.pbeInvariants,
      fallback: () => '# DevView Invariants\n\n',
    },
    {
      template: 'visual-reference-template.md',
      target: defaultArtifacts.visualReferenceMarkdown,
      fallback: () => '# Visual Reference\n\nNo visual work selected yet.\n',
    },
    {
      template: 'ui-theme-spec-template.md',
      target: defaultArtifacts.uiThemeSpec,
      fallback: () => '# UI Theme Spec\n\nNo visual work selected yet.\n',
    },
    {
      template: 'visual-audit-template.md',
      target: defaultArtifacts.visualAudit,
      fallback: () => '# Visual Implementation Audit\n\nNot run yet.\n',
    },
  ]

export async function initCommand(context: CommandContext): Promise<CommandResult> {
  const profile = context.options.profile || 'full'
  if (!['full', 'lite', 'bypass'].includes(profile)) {
    return invalidCommand(`Invalid profile: ${String(profile)}`)
  }

  const storageRoot = projectStorageRoot(context.options.root)
  const resolveStorageTarget = (target: string): string => {
    if (target === defaultArtifacts.devviewState || target === defaultArtifacts.devviewRoutingContract) {
      return target.replace(/^\.pbe\//, '.devview/')
    }
    return storageRoot === '.devview' ? target.replace(/^\.pbe\//, '.devview/') : target
  }
  const created: string[] = []
  const skipped: string[] = []
  for (const dir of initDirs) {
    await ensureDir(path.join(context.options.root, resolveStorageTarget(dir)))
  }

  for (const target of jsonTemplateTargets) {
    const resolvedTarget = resolveStorageTarget(target.target)
    const outputPath = path.join(context.options.root, resolvedTarget)
    if (existsSync(outputPath) && !context.options.force) {
      skipped.push(resolvedTarget)
      continue
    }
    const templatePath = path.join(context.env.pluginRoot, 'templates', target.template)
    const parsed = JSON.parse(readFileSync(templatePath, 'utf8')) as Record<string, unknown>
    const value = target.transform ? target.transform(parsed, context) : parsed
    await writeJsonAtomic(outputPath, value)
    created.push(resolvedTarget)
  }

  for (const target of textTemplateTargets) {
    const resolvedTarget = resolveStorageTarget(target.target)
    const outputPath = path.join(context.options.root, resolvedTarget)
    if (existsSync(outputPath) && !context.options.force) {
      skipped.push(resolvedTarget)
      continue
    }
    let value = target.fallback(context)
    if (target.template) {
      const templatePath = path.join(context.env.pluginRoot, 'templates', target.template)
      if (existsSync(templatePath)) {
        value = readFileSync(templatePath, 'utf8')
      }
    }
    await writeTextAtomic(outputPath, value)
    created.push(resolvedTarget)
  }

  return {
    ok: true,
    command: 'init',
    exitCode: ExitCode.Success,
    message: 'DevView initialized.',
    issues: [],
    data: {
      profile,
      created,
      skipped,
      state: {
        autoflow: {
          enabled: true,
          state: 'INIT',
          nextStep: 'rpd',
        },
      },
      next: 'Run product intent growth. Use `devview rpd check` to see what still blocks close.',
    },
  }
}

function transformProductTree(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const brief = context.options.brief
  if (brief && Array.isArray(value.nodes)) {
    const root = value.nodes.find(
      (node): node is Record<string, unknown> =>
        typeof node === 'object' && node !== null && (node as Record<string, unknown>).id === value.rootNodeId,
    )
    if (root) {
      root.title = brief
      root.why = 'Initial user brief captured by devview init.'
    }
  }
  return value
}

function transformRequirementTree(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const brief = context.options.brief
  if (brief && Array.isArray(value.nodes)) {
    const root = value.nodes.find(
      (node): node is Record<string, unknown> =>
        typeof node === 'object' && node !== null && (node as Record<string, unknown>).id === value.rootNodeId,
    )
    if (root) {
      root.title = brief
      root.summary = brief
    }
  }
  return value
}

function transformPbeState(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const now = new Date().toISOString()
  const storageRoot = projectStorageRoot(context.options.root)
  value.createdAt = now
  value.updatedAt = now
  value.deliveryStatus = 'waiting_root_confirmation'
  if (typeof value.artifacts === 'object' && value.artifacts !== null) {
    const artifacts = value.artifacts as Record<string, unknown>
    for (const [key, artifactPath] of Object.entries(artifacts)) {
      if (typeof artifactPath === 'string' && artifactPath.startsWith('.pbe/')) {
        artifacts[key] = storageRoot === '.devview' ? artifactPath.replace(/^\.pbe\//, '.devview/') : artifactPath
      }
    }
  }
  if (typeof value.autoflow === 'object' && value.autoflow !== null) {
    const autoflow = value.autoflow as Record<string, unknown>
    autoflow.enabled = true
    autoflow.profile = context.options.profile || 'full'
    autoflow.state = PBE_STATE.INIT
    autoflow.completedSteps = ['start']
    autoflow.currentGate = null
    autoflow.nextStep = 'rpd'
  }
  return value
}
