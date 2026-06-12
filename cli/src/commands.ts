import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  artifactPath,
  defaultArtifacts,
  getAutoflow,
  getOpenBlockingDecisions,
  loadProject,
} from './core/project.js'
import { ensureDir, readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './core/fs.js'
import { isPbeState } from './core/state-machine.js'
import type { CliEnvironment, CliOptions, CommandResult, ValidationIssue } from './core/types.js'
import { ExitCode, hasErrors, issue } from './core/types.js'
import {
  validateAcceptedActors,
  validateAcep,
  validateEvidence,
  validateRpd,
  validateTraceability,
  validateVd,
  validateVisualDesign,
  validateWpd,
} from './validators/pbe-validators.js'

interface CommandContext {
  options: CliOptions
  env: Required<CliEnvironment>
}

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

const jsonTemplateTargets: Array<{ template: string; target: string; transform?: (value: Record<string, unknown>, context: CommandContext) => Record<string, unknown> }> = [
  { template: 'product-tree.template.json', target: defaultArtifacts.productTree, transform: transformProductTree },
  { template: 'project-tree.template.json', target: defaultArtifacts.projectTree },
  { template: 'work-tree.template.json', target: defaultArtifacts.workTree },
  { template: 'test-tree.template.json', target: defaultArtifacts.testTree },
  { template: 'decision-queue.template.json', target: defaultArtifacts.decisionQueue },
  { template: 'change-tree.template.json', target: defaultArtifacts.changeTree },
  { template: 'impact-tree.template.json', target: defaultArtifacts.impactTree },
  { template: 'acceptance-tree.template.json', target: defaultArtifacts.acceptanceTree },
  { template: 'evidence-tree.template.json', target: defaultArtifacts.evidenceTree },
  { template: 'visual-reference.template.json', target: defaultArtifacts.visualReference },
  { template: 'design-tokens.template.json', target: defaultArtifacts.designTokens },
  { template: 'component-style-contract.template.json', target: defaultArtifacts.componentStyleContract },
  { template: 'ui-surface-inventory.template.json', target: defaultArtifacts.uiSurfaceInventory },
  { template: 'component-style-inventory.template.json', target: defaultArtifacts.componentStyleInventory },
  { template: 'visual-verification-profile.template.json', target: defaultArtifacts.visualVerificationProfile },
  { template: 'requirement-tree.template.json', target: defaultArtifacts.requirementTree, transform: transformRequirementTree },
  { template: 'pbe-state.template.json', target: defaultArtifacts.pbeState, transform: transformPbeState },
]

const textTemplateTargets: Array<{ template?: string; target: string; fallback: (context: CommandContext) => string }> = [
  { target: defaultArtifacts.projectBrief, fallback: (context) => `# Project Brief\n\n${context.options.brief || 'Initial PBE project brief.'}\n` },
  { target: defaultArtifacts.requirementTreeMarkdown, fallback: (context) => `# Requirement Tree\n\nRoot request: ${context.options.brief || 'Initial project request'}\n` },
  { target: defaultArtifacts.rpdInterviewLog, fallback: () => '# RPD Interview Log\n\n' },
  { target: defaultArtifacts.rpdSummary, fallback: () => '# RPD Summary\n\nRPD is not closed yet.\n' },
  { template: 'source-of-truth-matrix-template.md', target: defaultArtifacts.sourceOfTruthMatrix, fallback: () => '# Source Of Truth Matrix\n\n' },
  { template: 'pbe-invariants-template.md', target: defaultArtifacts.pbeInvariants, fallback: () => '# PBE Invariants\n\n' },
  { template: 'visual-reference-template.md', target: defaultArtifacts.visualReferenceMarkdown, fallback: () => '# Visual Reference\n\nNo visual work selected yet.\n' },
  { template: 'ui-theme-spec-template.md', target: defaultArtifacts.uiThemeSpec, fallback: () => '# UI Theme Spec\n\nNo visual work selected yet.\n' },
  { template: 'visual-audit-template.md', target: defaultArtifacts.visualAudit, fallback: () => '# Visual Implementation Audit\n\nNot run yet.\n' },
]

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
    return gateCommand(positionals[1], context)
  }
  if (command === 'rpd' && subcommand === 'check') {
    return checkResult('rpd check', await validateRpd(context.options.root, { completionMode: true }))
  }
  if (command === 'rpd' && subcommand === 'close') {
    return rpdCloseCommand(context)
  }
  if (command === 'trace' && subcommand === 'check') {
    return checkResult('trace check', await validateTraceability(context.options.root))
  }
  if (command === 'wpd' && subcommand === 'check') {
    return checkResult('wpd check', await validateWpd(context.options.root))
  }
  if (command === 'vd' && subcommand === 'check') {
    return checkResult('vd check', await validateVd(context.options.root))
  }
  if (command === 'acep' && subcommand === 'check') {
    return checkResult('acep check', await validateAcep(context.options.root))
  }
  if (command === 'evidence' && subcommand === 'check') {
    return checkResult('evidence check', await validateEvidence(context.options.root))
  }
  if (command === 'visual' && subcommand === 'check') {
    return checkResult('visual check', await validateVisualDesign(context.options.root))
  }
  return invalidCommand(`Unknown command: ${positionals.join(' ')}`)
}

async function initCommand(context: CommandContext): Promise<CommandResult> {
  const profile = context.options.profile || 'full'
  if (!['full', 'lite', 'bypass'].includes(profile)) {
    return invalidCommand(`Invalid profile: ${String(profile)}`)
  }

  const created: string[] = []
  const skipped: string[] = []
  for (const dir of initDirs) {
    await ensureDir(path.join(context.options.root, dir))
  }

  for (const target of jsonTemplateTargets) {
    const outputPath = path.join(context.options.root, target.target)
    if (existsSync(outputPath) && !context.options.force) {
      skipped.push(target.target)
      continue
    }
    const templatePath = path.join(context.env.pluginRoot, 'templates', target.template)
    const parsed = JSON.parse(readFileSync(templatePath, 'utf8')) as Record<string, unknown>
    const value = target.transform ? target.transform(parsed, context) : parsed
    await writeJsonAtomic(outputPath, value)
    created.push(target.target)
  }

  for (const target of textTemplateTargets) {
    const outputPath = path.join(context.options.root, target.target)
    if (existsSync(outputPath) && !context.options.force) {
      skipped.push(target.target)
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
    created.push(target.target)
  }

  return {
    ok: true,
    command: 'init',
    exitCode: ExitCode.Success,
    message: 'PBE initialized.',
    issues: [],
    data: {
      profile,
      created,
      skipped,
      state: {
        autoflow: {
          enabled: true,
          state: 'STARTED',
          nextStep: 'rpd',
        },
      },
      next: 'Run RPD/Product Tree growth. Use `pbe rpd check` to see what still blocks RPD close.',
    },
  }
}

async function statusCommand(context: CommandContext): Promise<CommandResult> {
  const { project, issues } = await loadProject(context.options.root)
  if (!project.initialized || !project.state) {
    return {
      ok: false,
      command: 'status',
      exitCode: issues.length > 0 ? ExitCode.SchemaError : ExitCode.NotInitialized,
      message: 'PBE project is not initialized.',
      issues: issues.length > 0 ? issues : [issue({
        validator: 'Project',
        code: 'PBE_NOT_INITIALIZED',
        severity: 'error',
        message: '.pbe/blueprint/pbe-state.json was not found.',
        suggestedFix: 'Run `pbe init --profile full --brief "..."` in the target project.',
      })],
      data: {
        initialized: false,
      },
    }
  }

  const autoflow = getAutoflow(project.state)
  const openDecisions = getOpenBlockingDecisions(project.decisionQueue)
  return {
    ok: true,
    command: 'status',
    exitCode: ExitCode.Success,
    message: [
      'PBE Status',
      '',
      `Initialized: yes`,
      `Profile: ${String(autoflow.profile || 'unknown')}`,
      `Autoflow state: ${String(autoflow.state || 'unknown')}`,
      `Current gate: ${String(autoflow.currentGate || 'none')}`,
      `Next step: ${String(autoflow.nextStep || 'unknown')}`,
      `Open blocking decisions: ${openDecisions.length}`,
    ].join('\n'),
    issues,
    data: {
      initialized: true,
      profile: autoflow.profile || null,
      state: autoflow.state || null,
      currentGate: autoflow.currentGate || null,
      nextStep: autoflow.nextStep || null,
      openBlockingDecisions: openDecisions,
      artifacts: project.state.artifacts || {},
    },
  }
}

async function validateCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const validators = [
    {
      name: 'legacy validate:pbe',
      code: 'LEGACY_PBE_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-pbe-files.js'),
    },
    {
      name: 'v2 tree system',
      code: 'V2_TREE_VALIDATOR_FAILED',
      script: path.join(context.env.pluginRoot, 'scripts', 'validate-pbe-tree-system.js'),
    },
  ]

  const reports: Array<{ name: string; ok: boolean; output: string }> = []
  for (const validator of validators) {
    const result = runNodeScript(validator.script, context.options.root)
    reports.push({ name: validator.name, ok: result.ok, output: result.output })
    if (!result.ok) {
      issues.push(issue({
        validator: validator.name,
        code: validator.code,
        severity: 'error',
        message: result.output || `${validator.name} failed.`,
        suggestedFix: 'Fix the validator output before advancing PBE gates.',
      }))
    }
  }

  if (existsSync(path.join(context.options.root, '.pbe'))) {
    issues.push(...await validateAcceptedActors(context.options.root))
    issues.push(...await validateVisualDesign(context.options.root))
  }

  return {
    ok: !hasErrors(issues),
    command: 'validate',
    exitCode: hasErrors(issues) ? ExitCode.ValidationFailed : ExitCode.Success,
    message: hasErrors(issues) ? 'PBE validation failed.' : 'PBE validation passed.',
    issues,
    data: {
      validators: reports,
    },
  }
}

async function gateCommand(stage: string | undefined, context: CommandContext): Promise<CommandResult> {
  const allowedStages = new Set(['rpd', 'wpd', 'vd', 'acep', 'code-start', 'review-submit', 'accept'])
  if (!stage || !allowedStages.has(stage)) {
    return invalidCommand(`Unsupported gate stage: ${stage || '<missing>'}`)
  }

  const loadedProject = await loadProject(context.options.root)
  const projectIssues = loadedProject.issues
  const issues: ValidationIssue[] = [...projectIssues]
  if (!existsSync(path.join(context.options.root, '.pbe'))) {
    issues.push(issue({
      validator: 'Gate',
      code: 'PBE_NOT_INITIALIZED',
      severity: 'error',
      message: 'PBE project is not initialized.',
      suggestedFix: 'Run `pbe init` before entering PBE stages.',
    }))
  }
  issues.push(...stageStateIssues(stage, loadedProject.project.state))

  if (stage === 'wpd') {
    issues.push(...await validateRpd(context.options.root, { completionMode: true }))
  } else if (stage === 'vd') {
    issues.push(...await validateRpd(context.options.root, { completionMode: true }))
    issues.push(...await validateWpd(context.options.root))
  } else if (stage === 'acep') {
    issues.push(...await validateRpd(context.options.root, { completionMode: true }))
    issues.push(...await validateVd(context.options.root))
    issues.push(...await validateVisualDesign(context.options.root))
  } else if (stage === 'code-start') {
    issues.push(...await validateAcep(context.options.root))
    issues.push(...implementationScopeIssues(await loadState(context.options.root)))
  } else if (stage === 'review-submit') {
    issues.push(...await validateEvidence(context.options.root))
    issues.push(...await validateVisualDesign(context.options.root, { requireEvidence: true }))
  } else if (stage === 'accept') {
    issues.push(...await validateAcceptedActors(context.options.root))
    if (!await hasUserAcceptedBranch(context.options.root)) {
      issues.push(issue({
        validator: 'Gate',
        code: 'USER_APPROVAL_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.acceptanceTree,
        message: 'Accept gate requires explicit user approval in Acceptance Tree.',
        suggestedFix: 'Ask the user to approve the result, then record decisionSource.actor = "user".',
      }))
    }
  }

  return {
    ok: !hasErrors(issues),
    command: `gate ${stage}`,
    exitCode: hasErrors(issues) ? ExitCode.TransitionBlocked : ExitCode.Success,
    message: hasErrors(issues) ? `Cannot enter ${stage}.` : `Gate ${stage} passed.`,
    issues,
  }
}

async function rpdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues = await validateRpd(context.options.root, { completionMode: true })
  if (hasErrors(issues)) {
    return {
      ok: false,
      command: 'rpd close',
      exitCode: ExitCode.ValidationFailed,
      message: 'RPD close failed. State was not changed.',
      issues,
    }
  }

  const statePath = artifactPath(context.options.root, 'pbeState')
  const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
  if (!parsed.ok) {
    return {
      ok: false,
      command: 'rpd close',
      exitCode: ExitCode.SchemaError,
      message: 'RPD close failed. pbe-state.json is invalid.',
      issues: [issue({
        validator: 'RPD',
        code: 'PBE_STATE_INVALID_JSON',
        severity: 'error',
        file: defaultArtifacts.pbeState,
        message: parsed.error,
        suggestedFix: 'Fix pbe-state.json before closing RPD.',
      })],
    }
  }

  const state = parsed.value
  const autoflow = typeof state.autoflow === 'object' && state.autoflow !== null
    ? state.autoflow as Record<string, unknown>
    : {}
  const completedSteps = new Set(Array.isArray(autoflow.completedSteps) ? autoflow.completedSteps.map(String) : [])
  completedSteps.add('rpd')
  autoflow.state = 'RPD_DONE'
  autoflow.completedSteps = [...completedSteps]
  autoflow.currentGate = hasUiWork(context.options.root) ? 'ui_ux_confirm' : null
  autoflow.nextStep = hasUiWork(context.options.root) ? 'ui_ux_confirm' : 'wpd'
  state.autoflow = autoflow
  state.updatedAt = new Date().toISOString()
  await writeJsonAtomic(statePath, state)

  return {
    ok: true,
    command: 'rpd close',
    exitCode: ExitCode.Success,
    message: 'RPD closed. Autoflow state is RPD_DONE.',
    issues: [],
    data: {
      state: autoflow.state,
      currentGate: autoflow.currentGate,
      nextStep: autoflow.nextStep,
      next: autoflow.currentGate ? 'Confirm UI/UX before WPD.' : 'Run WPD.',
    },
  }
}

function checkResult(command: string, issues: ValidationIssue[]): CommandResult {
  return {
    ok: !hasErrors(issues),
    command,
    exitCode: hasErrors(issues) ? ExitCode.ValidationFailed : ExitCode.Success,
    message: hasErrors(issues) ? `${command} failed.` : `${command} passed.`,
    issues,
  }
}

function invalidCommand(message: string): CommandResult {
  return {
    ok: false,
    command: 'unknown',
    exitCode: ExitCode.InvalidArguments,
    message,
    issues: [issue({
      validator: 'CLI',
      code: 'INVALID_COMMAND',
      severity: 'error',
      message,
      suggestedFix: 'Run `pbe --help` to see supported commands.',
    })],
  }
}

function runNodeScript(scriptPath: string, cwd: string): { ok: boolean; output: string } {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    return { ok: true, output: stdout.trim() }
  } catch (error) {
    const maybeError = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string }
    const output = [maybeError.stdout, maybeError.stderr]
      .filter(Boolean)
      .map((entry) => Buffer.isBuffer(entry) ? entry.toString('utf8') : String(entry))
      .join('\n')
      .trim()
    return { ok: false, output: output || maybeError.message || String(error) }
  }
}

function transformProductTree(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const brief = context.options.brief
  if (brief && Array.isArray(value.nodes)) {
    const root = value.nodes.find((node): node is Record<string, unknown> => typeof node === 'object' && node !== null && (node as Record<string, unknown>).id === value.rootNodeId)
    if (root) {
      root.title = brief
      root.why = 'Initial user brief captured by pbe init.'
    }
  }
  return value
}

function transformRequirementTree(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const brief = context.options.brief
  if (brief && Array.isArray(value.nodes)) {
    const root = value.nodes.find((node): node is Record<string, unknown> => typeof node === 'object' && node !== null && (node as Record<string, unknown>).id === value.rootNodeId)
    if (root) {
      root.title = brief
      root.summary = brief
    }
  }
  return value
}

function transformPbeState(value: Record<string, unknown>, context: CommandContext): Record<string, unknown> {
  const now = new Date().toISOString()
  value.createdAt = now
  value.updatedAt = now
  value.deliveryStatus = 'waiting_root_confirmation'
  if (typeof value.autoflow === 'object' && value.autoflow !== null) {
    const autoflow = value.autoflow as Record<string, unknown>
    autoflow.enabled = true
    autoflow.profile = context.options.profile || 'full'
    autoflow.state = 'STARTED'
    autoflow.completedSteps = ['start']
    autoflow.currentGate = null
    autoflow.nextStep = 'rpd'
  }
  return value
}

async function loadState(root: string): Promise<Record<string, unknown> | null> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'pbeState'))
  return parsed.ok ? parsed.value : null
}

function implementationScopeIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  const autoflow = typeof state?.autoflow === 'object' && state.autoflow !== null ? state.autoflow as Record<string, unknown> : {}
  const stateValue = String(autoflow.state || '')
  if (['IMPLEMENTATION_SCOPE_CONFIRMED', 'ACEP_GENERATED', 'ACEP_VALIDATED', 'EXECUTION_IN_PROGRESS', 'EXECUTION_DONE'].includes(stateValue)) {
    return []
  }
  return [issue({
    validator: 'Gate',
    code: 'IMPLEMENTATION_SCOPE_UNCONFIRMED',
    severity: 'error',
    file: defaultArtifacts.pbeState,
    message: `Implementation scope is not confirmed. Current state: ${stateValue || 'unknown'}.`,
    suggestedFix: 'Stop at the implementation scope gate and ask the user to select the current slice scope.',
  })]
}

function stageStateIssues(stage: string, state: Record<string, unknown> | null): ValidationIssue[] {
  if (stage === 'rpd') {
    return []
  }
  const autoflow = typeof state?.autoflow === 'object' && state.autoflow !== null ? state.autoflow as Record<string, unknown> : {}
  const currentState = String(autoflow.state || '')
  const allowedByStage: Record<string, string[]> = {
    wpd: ['RPD_DONE', 'WAITING_UI_UX_CONFIRMATION', 'UI_UX_CONFIRMED', 'WPD_IN_PROGRESS', 'WPD_DONE', 'VD_IN_PROGRESS', 'VD_DONE', 'WAITING_IMPLEMENTATION_SCOPE_CONFIRMATION', 'IMPLEMENTATION_SCOPE_CONFIRMED', 'ACEP_GENERATED', 'ACEP_VALIDATED', 'EXECUTION_IN_PROGRESS', 'EXECUTION_DONE', 'WAITING_REVIEW', 'REVISION_REQUESTED'],
    vd: ['WPD_DONE', 'VD_IN_PROGRESS', 'VD_DONE', 'WAITING_IMPLEMENTATION_SCOPE_CONFIRMATION', 'IMPLEMENTATION_SCOPE_CONFIRMED', 'ACEP_GENERATED', 'ACEP_VALIDATED', 'EXECUTION_IN_PROGRESS', 'EXECUTION_DONE', 'WAITING_REVIEW', 'REVISION_REQUESTED'],
    acep: ['VD_DONE', 'WAITING_IMPLEMENTATION_SCOPE_CONFIRMATION', 'IMPLEMENTATION_SCOPE_CONFIRMED', 'ACEP_GENERATED', 'ACEP_VALIDATED', 'EXECUTION_IN_PROGRESS', 'EXECUTION_DONE', 'WAITING_REVIEW', 'REVISION_REQUESTED'],
    'code-start': ['IMPLEMENTATION_SCOPE_CONFIRMED', 'ACEP_GENERATED', 'ACEP_VALIDATED', 'EXECUTION_IN_PROGRESS', 'EXECUTION_DONE', 'WAITING_REVIEW', 'REVISION_REQUESTED'],
    'review-submit': ['EXECUTION_DONE', 'WAITING_REVIEW', 'REVISION_REQUESTED'],
    accept: ['WAITING_REVIEW', 'REVISION_REQUESTED', 'ACCEPTED', 'CLOSED'],
  }
  if (allowedByStage[stage]?.includes(currentState)) {
    return []
  }
  return [issue({
    validator: 'Gate',
    code: 'GATE_BLOCKED',
    severity: 'error',
    file: defaultArtifacts.pbeState,
    message: `Gate ${stage} is blocked from current state ${currentState || 'unknown'}.`,
    suggestedFix: 'Run the previous required PBE close/check command instead of skipping stages.',
  })]
}

async function hasUserAcceptedBranch(root: string): Promise<boolean> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'acceptanceTree'))
  if (!parsed.ok || !Array.isArray(parsed.value.branches)) {
    return false
  }
  return parsed.value.branches.some((branch) =>
    typeof branch === 'object' &&
    branch !== null &&
    (branch as Record<string, unknown>).status === 'accepted_done' &&
    ((branch as Record<string, unknown>).decisionSource as Record<string, unknown> | undefined)?.actor === 'user',
  )
}

function hasUiWork(root: string): boolean {
  const productPath = artifactPath(root, 'productTree')
  if (!existsSync(productPath)) {
    return false
  }
  try {
    const product = JSON.parse(readFileSync(productPath, 'utf8')) as Record<string, unknown>
    const nodes = Array.isArray(product.nodes) ? product.nodes : []
    return nodes.some((node) => {
      if (typeof node !== 'object' || node === null) {
        return false
      }
      const entry = node as Record<string, unknown>
      return String(entry.type || '').startsWith('ui_') || typeof entry.ux === 'object'
    })
  } catch {
    return false
  }
}

export function summarizeCreated(root: string, files: string[]): string[] {
  return files.map((file) => relativePath(root, path.join(root, file)))
}

export { isPbeState }
