import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { artifactPath, defaultArtifacts, getAutoflow, getOpenBlockingDecisions, loadProject } from './core/project.js'
import { ensureDir, readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './core/fs.js'
import {
  isPbeState,
  normalizePbeState,
  PBE_STATE,
  pbeStates,
  stateMachineIssues,
  type PbeState,
} from './core/state-machine.js'
import { transitionPbeState } from './core/state-transition.js'
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
  { template: 'pbe-state.template.json', target: defaultArtifacts.pbeState, transform: transformPbeState },
]

const textTemplateTargets: Array<{ template?: string; target: string; fallback: (context: CommandContext) => string }> =
  [
    {
      target: defaultArtifacts.projectBrief,
      fallback: (context) => `# Project Brief\n\n${context.options.brief || 'Initial PBE project brief.'}\n`,
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
      template: 'pbe-invariants-template.md',
      target: defaultArtifacts.pbeInvariants,
      fallback: () => '# PBE Invariants\n\n',
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
  if (command === 'ui' && subcommand === 'approve') {
    return uiApproveCommand(context)
  }
  if (command === 'trace' && subcommand === 'check') {
    return checkResult('trace check', await validateTraceability(context.options.root))
  }
  if (command === 'wpd' && subcommand === 'check') {
    return checkResult('wpd check', await validateWpd(context.options.root))
  }
  if (command === 'wpd' && subcommand === 'close') {
    return wpdCloseCommand(context)
  }
  if (command === 'vd' && subcommand === 'check') {
    return checkResult('vd check', await validateVd(context.options.root))
  }
  if (command === 'vd' && subcommand === 'close') {
    return vdCloseCommand(context)
  }
  if (command === 'scope' && subcommand === 'select') {
    return scopeSelectCommand(context)
  }
  if (command === 'acep' && subcommand === 'check') {
    return checkResult('acep check', await validateAcep(context.options.root))
  }
  if (command === 'acep' && subcommand === 'ready') {
    return acepReadyCommand(context)
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
          state: 'INIT',
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
      issues.push(
        issue({
          validator: validator.name,
          code: validator.code,
          severity: 'error',
          message: result.output || `${validator.name} failed.`,
          suggestedFix: 'Fix the validator output before advancing PBE gates.',
        }),
      )
    }
  }

  if (existsSync(path.join(context.options.root, '.pbe'))) {
    const state = await loadState(context.options.root)
    issues.push(...stateMachineIssues(state))
    issues.push(...(await validateAcceptedActors(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
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
  const canonicalStage = normalizeGateStage(stage)
  if (!canonicalStage) {
    return invalidCommand(`Unsupported gate stage: ${stage || '<missing>'}`)
  }

  const loadedProject = await loadProject(context.options.root)
  const projectIssues = loadedProject.issues
  const issues: ValidationIssue[] = [...projectIssues]
  if (!existsSync(path.join(context.options.root, '.pbe'))) {
    issues.push(
      issue({
        validator: 'Gate',
        code: 'PBE_NOT_INITIALIZED',
        severity: 'error',
        message: 'PBE project is not initialized.',
        suggestedFix: 'Run `pbe init` before entering PBE stages.',
      }),
    )
  }
  issues.push(...stageStateIssues(canonicalStage, loadedProject.project.state))

  if (canonicalStage === 'wpd') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...uiUxApprovalIssues(context.options.root, loadedProject.project.state))
    issues.push(...(await validateVisualDesign(context.options.root, { requireInventory: false })))
  } else if (canonicalStage === 'vd') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...(await validateWpd(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
  } else if (canonicalStage === 'acep') {
    issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
    issues.push(...(await validateVd(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root)))
  } else if (canonicalStage === 'code-start') {
    issues.push(...(await validateAcep(context.options.root)))
    issues.push(...implementationScopeIssues(await loadState(context.options.root)))
  } else if (canonicalStage === 'review-result') {
    issues.push(...(await validateEvidence(context.options.root)))
    issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  } else if (canonicalStage === 'accept') {
    issues.push(...(await validateAcceptedActors(context.options.root)))
    issues.push(...(await validateEvidence(context.options.root)))
    if (!(await hasUserAcceptedBranch(context.options.root))) {
      issues.push(
        issue({
          validator: 'Gate',
          code: 'USER_APPROVAL_REQUIRED',
          severity: 'error',
          file: defaultArtifacts.acceptanceTree,
          message: 'Accept gate requires explicit user approval in Acceptance Tree.',
          suggestedFix: 'Ask the user to approve the result, then record decisionSource.actor = "user".',
        }),
      )
    }
  }

  return {
    ok: !hasErrors(issues),
    command: `gate ${canonicalStage}`,
    exitCode: hasErrors(issues) ? ExitCode.TransitionBlocked : ExitCode.Success,
    message: hasErrors(issues) ? `Cannot enter ${canonicalStage}.` : `Gate ${canonicalStage} passed.`,
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

  const uiWork = hasUiWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'rpd close',
    uiWork ? [PBE_STATE.RPD_DONE, PBE_STATE.WAITING_UI_UX_CONFIRM] : [PBE_STATE.RPD_DONE],
    {
      completedSteps: ['rpd'],
      stage: 'rpd',
      mode: 'rpd_tree_walk',
      currentGate: uiWork ? 'ui_ux_confirm' : null,
      nextStep: uiWork ? 'ui_ux_confirm' : 'wpd',
      data: {
        next: uiWork
          ? 'Confirm UI/UX with `pbe ui approve` before WPD.'
          : 'Run `pbe wpd close` after WPD artifacts are ready.',
      },
    },
  )
}

async function uiApproveCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  if (!hasUiWork(context.options.root)) {
    issues.push(
      issue({
        validator: 'Gate',
        code: 'UI_UX_NOT_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.productTree,
        message: 'No UI/UX work was detected, so UI/UX approval should not create a state transition.',
        suggestedFix: 'Continue to WPD and use `pbe wpd close` after WPD artifacts are ready.',
      }),
    )
  }
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...uiUxConfirmationArtifactIssues(context.options.root))
  if (hasErrors(issues)) {
    return transitionFailed('ui approve', 'UI/UX approval failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'ui approve',
    [PBE_STATE.WAITING_UI_UX_CONFIRM, PBE_STATE.UI_UX_APPROVED],
    {
      completedSteps: ['ui_ux_confirm'],
      stage: 'ui_ux_confirm',
      mode: 'ui_ux_confirmation',
      currentGate: null,
      nextStep: visualWork ? 'visual_reference_intake' : 'wpd',
      lastUserAction: 'approve',
      actor: 'user',
      data: {
        next: visualWork
          ? 'Create Visual Design Contract, then run `pbe wpd close`.'
          : 'Derive WPD artifacts, then run `pbe wpd close`.',
      },
    },
  )
}

async function wpdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const visualWork = hasVisualWork(context.options.root)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...uiUxApprovalIssues(context.options.root, await loadState(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root, { requireInventory: false })))
  issues.push(...(await validateWpd(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('wpd close', 'WPD close failed. State was not changed.', issues)
  }
  return transitionPbeState(
    context.options.root,
    'wpd close',
    visualWork ? [PBE_STATE.VISUAL_CONTRACT_READY, PBE_STATE.WPD_DONE] : [PBE_STATE.WPD_DONE],
    {
      completedSteps: visualWork ? ['visual_reference_intake', 'design_system_derive', 'wpd'] : ['wpd'],
      stage: 'wpd',
      mode: 'wpd_generation',
      currentGate: null,
      nextStep: visualWork ? 'ui_surface_inventory' : 'vd',
      data: {
        next: visualWork
          ? 'Run UI Surface Inventory, then `pbe vd close`.'
          : 'Run `pbe vd close` after VD artifacts are ready.',
      },
    },
  )
}

async function vdCloseCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const visualWork = hasVisualWork(context.options.root)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('vd close', 'VD close failed. State was not changed.', issues)
  }
  return transitionPbeState(
    context.options.root,
    'vd close',
    visualWork ? [PBE_STATE.UI_SURFACE_INVENTORY_DONE, PBE_STATE.VD_DONE] : [PBE_STATE.VD_DONE],
    {
      completedSteps: visualWork ? ['ui_surface_inventory', 'vd'] : ['vd'],
      stage: 'vd',
      mode: 'vd_generation',
      currentGate: 'implementation_scope',
      nextStep: 'implementation_scope',
      data: {
        next: 'Select implementation scope with `pbe scope select` after the user approves the current slice scope.',
      },
    },
  )
}

async function scopeSelectCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  const loadedProject = await loadProject(context.options.root)
  issues.push(...loadedProject.issues)
  issues.push(...(await validateRpd(context.options.root, { completionMode: true })))
  issues.push(...(await validateWpd(context.options.root)))
  issues.push(...(await validateVd(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root)))
  for (const decision of getOpenBlockingDecisions(loadedProject.project.decisionQueue)) {
    issues.push(
      issue({
        validator: 'Scope',
        code: 'BLOCKING_DECISION_OPEN',
        severity: 'error',
        file: defaultArtifacts.decisionQueue,
        nodeId: String(decision.id || decision.targetNodeId || ''),
        message: `Cannot select implementation scope while blocking decision is open: ${String(decision.question || decision.reason || decision.id || '')}`,
        suggestedFix: 'Resolve blocking decisions before selecting implementation scope.',
      }),
    )
  }
  if (hasErrors(issues)) {
    return transitionFailed('scope select', 'Scope selection failed. State was not changed.', issues)
  }
  return transitionPbeState(
    context.options.root,
    'scope select',
    [PBE_STATE.WAITING_IMPLEMENTATION_SCOPE, PBE_STATE.SCOPE_SELECTED],
    {
      completedSteps: ['implementation_scope'],
      stage: 'execution_planning',
      mode: 'execution_planning',
      currentGate: null,
      nextStep: 'generate_acep',
      lastUserAction: 'select_scope',
      actor: 'user',
      data: {
        next: 'Generate ACEP artifacts, then run `pbe acep ready`.',
      },
    },
  )
}

async function acepReadyCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...implementationScopeIssues(await loadState(context.options.root)))
  issues.push(...(await validateAcep(context.options.root)))
  if (hasErrors(issues)) {
    return transitionFailed('acep ready', 'ACEP ready failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'acep ready', [PBE_STATE.ACEP_READY], {
    completedSteps: ['generate_acep'],
    stage: 'acep_ready',
    mode: 'acep_generation',
    currentGate: null,
    nextStep: 'run_acep',
    data: {
      next: 'Execute the ACEP, attach evidence, then run `pbe execution complete`.',
    },
  })
}

async function executionCompleteCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateAcep(context.options.root)))
  issues.push(...(await validateEvidence(context.options.root, { requireVisualAudit: false })))
  if (hasErrors(issues)) {
    return transitionFailed('execution complete', 'Execution completion failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionPbeState(context.options.root, 'execution complete', [PBE_STATE.ACEP_RUN_DONE], {
    completedSteps: ['run_acep'],
    stage: 'acep_running',
    mode: 'acep_execution',
    deliveryStatus: 'verified',
    currentGate: null,
    nextStep: visualWork ? 'visual_implementation_audit' : 'review_result',
    data: {
      next: visualWork
        ? 'Run Visual Implementation Audit, then `pbe review submit`.'
        : 'Submit for review with `pbe review submit`.',
    },
  })
}

async function reviewSubmitCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateEvidence(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  if (hasErrors(issues)) {
    return transitionFailed('review submit', 'Review submit failed. State was not changed.', issues)
  }
  const visualWork = hasVisualWork(context.options.root)
  return transitionPbeState(
    context.options.root,
    'review submit',
    visualWork ? [PBE_STATE.VISUAL_AUDIT_DONE, PBE_STATE.WAITING_REVIEW_RESULT] : [PBE_STATE.WAITING_REVIEW_RESULT],
    {
      completedSteps: visualWork ? ['visual_implementation_audit', 'review_result'] : ['review_result'],
      stage: 'complete',
      deliveryStatus: 'submitted_for_review',
      currentGate: 'review_result',
      nextStep: 'review_result',
      data: {
        next: 'Wait for user review. Only the user can approve with accepted metadata before `pbe accept`.',
      },
    },
  )
}

async function acceptCommand(context: CommandContext): Promise<CommandResult> {
  const issues: ValidationIssue[] = []
  issues.push(...(await validateAcceptedActors(context.options.root)))
  issues.push(...(await validateEvidence(context.options.root)))
  issues.push(...(await validateVisualDesign(context.options.root, { requireEvidence: true })))
  const userAccepted = await hasUserAcceptedBranch(context.options.root)
  if (!userAccepted) {
    issues.push(
      issue({
        validator: 'Acceptance',
        code: 'USER_APPROVAL_REQUIRED',
        severity: 'error',
        file: defaultArtifacts.acceptanceTree,
        message: 'PBE cannot move to DONE until Acceptance Tree records decisionSource.actor = "user".',
        suggestedFix: 'Record the explicit user approval in acceptance-tree.json, then rerun `pbe accept`.',
      }),
    )
  }
  if (hasErrors(issues)) {
    return transitionFailed('accept', 'Accept failed. State was not changed.', issues)
  }
  return transitionPbeState(context.options.root, 'accept', [PBE_STATE.DONE], {
    completedSteps: ['complete'],
    stage: 'complete',
    deliveryStatus: 'accepted',
    currentGate: null,
    nextStep: null,
    lastUserAction: 'approve',
    actor: 'user',
    acceptance: {
      setBy: 'user',
      acceptedAt: new Date().toISOString(),
      acceptanceSource: 'explicit_user_reply',
      reviewGateId: 'review_result',
    },
    data: {
      next: 'PBE branch/slice is DONE. Start a new slice only through scope selection.',
    },
  })
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
    issues: [
      issue({
        validator: 'CLI',
        code: 'INVALID_COMMAND',
        severity: 'error',
        message,
        suggestedFix: 'Run `pbe --help` to see supported commands.',
      }),
    ],
  }
}

function transitionFailed(command: string, message: string, issues: ValidationIssue[]): CommandResult {
  return {
    ok: false,
    command,
    exitCode: ExitCode.ValidationFailed,
    message,
    issues,
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
      .map((entry) => (Buffer.isBuffer(entry) ? entry.toString('utf8') : String(entry)))
      .join('\n')
      .trim()
    return { ok: false, output: output || maybeError.message || String(error) }
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
      root.why = 'Initial user brief captured by pbe init.'
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
  value.createdAt = now
  value.updatedAt = now
  value.deliveryStatus = 'waiting_root_confirmation'
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

async function loadState(root: string): Promise<Record<string, unknown> | null> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'pbeState'))
  return parsed.ok ? parsed.value : null
}

function implementationScopeIssues(state: Record<string, unknown> | null): ValidationIssue[] {
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawStateValue = String(autoflow.state || '')
  const stateValue = normalizePbeState(rawStateValue)
  if (stateValue && statesFrom(PBE_STATE.SCOPE_SELECTED).includes(stateValue)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'IMPLEMENTATION_SCOPE_UNCONFIRMED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `Implementation scope is not confirmed. Current state: ${rawStateValue || 'unknown'}.`,
      suggestedFix: 'Stop at the implementation scope gate and ask the user to select the current slice scope.',
    }),
  ]
}

function stageStateIssues(stage: string, state: Record<string, unknown> | null): ValidationIssue[] {
  if (stage === 'rpd') {
    return []
  }
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawState = String(autoflow.state || '')
  const currentState = normalizePbeState(rawState)
  const allowedByStage: Record<string, PbeState[]> = {
    wpd: [PBE_STATE.RPD_DONE, ...statesFrom(PBE_STATE.UI_UX_APPROVED)],
    vd: statesFrom(PBE_STATE.WPD_DONE),
    acep: statesFrom(PBE_STATE.VD_DONE),
    'code-start': statesFrom(PBE_STATE.SCOPE_SELECTED),
    'review-result': statesFrom(PBE_STATE.ACEP_RUN_DONE),
    accept: statesFrom(PBE_STATE.WAITING_REVIEW_RESULT),
  }
  if (currentState && allowedByStage[stage]?.includes(currentState)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'GATE_BLOCKED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `Gate ${stage} is blocked from current state ${rawState || 'unknown'}.`,
      suggestedFix: 'Run the previous required PBE close/check command instead of skipping stages.',
    }),
  ]
}

function normalizeGateStage(stage: string | undefined): string | null {
  const aliases: Record<string, string> = {
    'review-submit': 'review-result',
    review: 'review-result',
    'implementation-start': 'code-start',
    implementation: 'code-start',
  }
  if (!stage) {
    return null
  }
  const normalized = aliases[stage] || stage
  return ['rpd', 'wpd', 'vd', 'acep', 'code-start', 'review-result', 'accept'].includes(normalized) ? normalized : null
}

function uiUxApprovalIssues(root: string, state: Record<string, unknown> | null): ValidationIssue[] {
  if (!hasUiWork(root)) {
    return []
  }
  const autoflow =
    typeof state?.autoflow === 'object' && state.autoflow !== null ? (state.autoflow as Record<string, unknown>) : {}
  const rawState = String(autoflow.state || '')
  const currentState = normalizePbeState(rawState)
  const statesAfterApproval = statesFrom(PBE_STATE.UI_UX_APPROVED)
  if (currentState && statesAfterApproval.includes(currentState)) {
    return []
  }
  return [
    issue({
      validator: 'Gate',
      code: 'UI_UX_CONFIRM_REQUIRED',
      severity: 'error',
      file: defaultArtifacts.pbeState,
      message: `UI/UX work cannot enter WPD before UI_UX_APPROVED. Current state: ${rawState || 'unknown'}.`,
      suggestedFix: 'Stop at the UI/UX confirmation gate, get user approval, then continue to Visual Contract or WPD.',
    }),
  ]
}

function uiUxConfirmationArtifactIssues(root: string): ValidationIssue[] {
  if (!hasUiWork(root)) {
    return []
  }
  const confirmationPath = artifactPath(root, 'uiUxConfirmation')
  if (!existsSync(confirmationPath)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_MISSING',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX approval requires a confirmation artifact before the state can advance.',
        suggestedFix:
          'Create .pbe/blueprint/ui-ux-confirmation.md from the user-approved preview, then rerun `pbe ui approve`.',
      }),
    ]
  }
  const content = readFileSync(confirmationPath, 'utf8')
  if (/\b(revision_requested|blocked|preview_needed|preview_generated)\b/i.test(content)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_NOT_APPROVED',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX confirmation artifact still contains a non-approved status.',
        suggestedFix:
          'Resolve UI/UX revision or blocker items and record the user-approved direction before rerunning `pbe ui approve`.',
      }),
    ]
  }
  if (/Pending user confirmation/i.test(content)) {
    return [
      issue({
        validator: 'Gate',
        code: 'UI_UX_CONFIRMATION_PENDING',
        severity: 'error',
        file: defaultArtifacts.uiUxConfirmation,
        message: 'UI/UX confirmation artifact still says user confirmation is pending.',
        suggestedFix: 'Record the explicit user approval and confirmed direction before rerunning `pbe ui approve`.',
      }),
    ]
  }
  return []
}

async function hasUserAcceptedBranch(root: string): Promise<boolean> {
  const parsed = await readJsonSafe<Record<string, unknown>>(artifactPath(root, 'acceptanceTree'))
  if (!parsed.ok || !Array.isArray(parsed.value.branches)) {
    return false
  }
  return parsed.value.branches.some(
    (branch) =>
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

function hasVisualWork(root: string): boolean {
  const productPath = artifactPath(root, 'productTree')
  if (existsSync(productPath)) {
    try {
      const product = JSON.parse(readFileSync(productPath, 'utf8')) as Record<string, unknown>
      const nodes = Array.isArray(product.nodes) ? product.nodes : []
      if (
        nodes.some((node) => {
          if (typeof node !== 'object' || node === null) {
            return false
          }
          const entry = node as Record<string, unknown>
          const scopeClass = String(entry.scopeClass || '')
          const ux = typeof entry.ux === 'object' && entry.ux !== null ? (entry.ux as Record<string, unknown>) : {}
          return (
            ['selected', 'foundation'].includes(scopeClass) &&
            (entry.visualImpact === true || ux.visualAffected === true || ux.visualWorkRequired === true)
          )
        })
      ) {
        return true
      }
    } catch {
      return false
    }
  }

  const visualReferencePath = artifactPath(root, 'visualReference')
  if (!existsSync(visualReferencePath)) {
    return false
  }
  try {
    const visualReference = JSON.parse(readFileSync(visualReferencePath, 'utf8')) as Record<string, unknown>
    return (
      visualReference.visualWorkRequired === true &&
      !['not_required', 'visual_quality_waived'].includes(String(visualReference.primarySource || ''))
    )
  } catch {
    return false
  }
}

export function summarizeCreated(root: string, files: string[]): string[] {
  return files.map((file) => relativePath(root, path.join(root, file)))
}

function statesFrom(state: PbeState): PbeState[] {
  const index = pbeStates.indexOf(state)
  return index === -1 ? [] : [...pbeStates.slice(index)]
}

export { isPbeState }
