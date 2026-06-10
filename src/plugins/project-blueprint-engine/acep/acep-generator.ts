import { getRootToLeafNodes } from '../../../domain/tree'
import { createPbeId, nowIso } from '../shared/ids'
import {
  getNodeFacts,
  getNodeTitle,
} from '../shared/tree-context'
import { validateAcePack } from '../shared/schema-validation'
import type { WorkDesign } from '../wpd/wpd-types'
import {
  bulletList,
  numberedList,
  writeTaskCardMarkdown,
  writeTopLevelCodexPrompt,
} from './acep-templates'
import type {
  AceFile,
  AutonomousCodexExecutionPack,
  CodexTaskCard,
  ExecutionManifest,
  GenerateAcePackInput,
} from './acep-types'
import { writeManifestJson } from './manifest-writer'

const DEFAULT_VALIDATION_COMMAND =
  'Codex must inspect package scripts and choose the closest available command.'

export function generateAutonomousCodexExecutionPack(
  input: GenerateAcePackInput,
): AutonomousCodexExecutionPack {
  const createdAt = nowIso()
  const autonomyLevel = input.autonomyLevel ?? 'autonomous_until_stop'
  const taskCards = createTaskCards(input)
  const taskFiles: AceFile[] = taskCards.map((card, index) => ({
    path: `07-task-cards/${card.id}.md`,
    content: writeTaskCardMarkdown(card, index),
    kind: 'markdown',
  }))
  const requiredValidation = collectRequiredValidation(input)
  const manifest: ExecutionManifest = {
    version: '1.0',
    mode: 'autonomous',
    projectName: input.blueprint.name,
    entrypoint: '00-readme.md',
    policyFile: '01-autonomous-execution-policy.md',
    operatingLoop: '06-codex-operating-loop.md',
    tasks: taskCards.map((card, index) => ({
      id: card.id,
      file: `07-task-cards/${card.id}.md`,
      title: card.title,
      dependsOn: index === 0 ? [] : [taskCards[index - 1].id],
      phase: findPhaseForNode(input, card.nodeId),
      nodeId: card.nodeId,
    })),
    requiredValidation,
    completionCriteriaFile: '09-completion-criteria.md',
    failureRecoveryFile: '10-failure-recovery.md',
    finalReportTemplateFile: '11-final-report-template.md',
  }
  const files: AceFile[] = [
    md('00-readme.md', readme(input, taskCards)),
    md('01-autonomous-execution-policy.md', policy(input, autonomyLevel)),
    md('02-project-blueprint.md', projectBlueprint(input)),
    md('03-requirement-tree.md', requirementTree(input)),
    md('04-work-roadmap.md', workRoadmap(input)),
    md('05-verification-plan.md', verificationPlan(input)),
    md('06-codex-operating-loop.md', operatingLoop()),
    ...taskFiles,
    md('08-validation-commands.md', validationCommands(requiredValidation)),
    md('09-completion-criteria.md', completionCriteria(input)),
    md('10-failure-recovery.md', failureRecovery()),
    md('11-final-report-template.md', finalReportTemplate()),
    {
      path: 'execution-manifest.json',
      content: writeManifestJson(manifest),
      kind: 'json',
    },
  ]

  return validateAcePack({
    id: createPbeId('acep'),
    projectName: input.blueprint.name,
    autonomyLevel,
    files,
    manifest,
    taskCards,
    topLevelPrompt: writeTopLevelCodexPrompt(),
    createdAt,
  })
}

function createTaskCards(input: GenerateAcePackInput): CodexTaskCard[] {
  const designs = orderedLeafWorkDesigns(input)

  return designs.map((workDesign, index) => {
    const node = input.project.nodes[workDesign.nodeId]
    const verification = input.blueprint.verificationDesigns[workDesign.nodeId]
    const title = node?.title ?? `Task ${index + 1}`
    const validationPlan =
      verification?.validationCommands.length
        ? verification.validationCommands
        : [DEFAULT_VALIDATION_COMMAND]

    return {
      id: `task-${String(index + 1).padStart(3, '0')}`,
      nodeId: workDesign.nodeId,
      title,
      goal: workDesign.goal,
      context: [
        workDesign.context,
        node ? `Requirement facts: ${getNodeFacts(input.project, node).join(' ')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      scope: workDesign.scope,
      nonScope: workDesign.nonScope,
      expectedChanges: workDesign.expectedOutputs,
      acceptanceCriteria: workDesign.acceptanceCriteria,
      validationPlan,
      evidenceRequired: verification?.evidenceRequired ?? [
        'Command output or written validation note.',
      ],
      humanReviewPoints: workDesign.humanReviewNotes,
      stopConditions: workDesign.stopConditions,
      dependencies: workDesign.dependencies.map((dependency) =>
        dependency.nodeId
          ? `${dependency.nodeId}: ${dependency.description}`
          : dependency.description,
      ),
      prompt: [
        `Implement only the task card "${title}".`,
        'Inspect the repository first, make the smallest coherent change, add or update validation, and record evidence.',
        'Continue without asking the user unless a stop condition is reached.',
      ].join(' '),
    }
  })
}

function orderedLeafWorkDesigns(input: GenerateAcePackInput): WorkDesign[] {
  const designs = input.blueprint.workDesigns
  const roadmapOrder = input.blueprint.implementationRoadmap?.recommendedOrder ?? []
  const leafDesigns = Object.values(designs).filter((design) => design.type === 'leaf')
  const byNodeId = new Map(leafDesigns.map((design) => [design.nodeId, design]))
  const ordered = roadmapOrder
    .map((nodeId) => byNodeId.get(nodeId))
    .filter((design): design is WorkDesign => Boolean(design))
  const remaining = leafDesigns.filter((design) => !roadmapOrder.includes(design.nodeId))

  return [...ordered, ...remaining]
}

function collectRequiredValidation(input: GenerateAcePackInput) {
  const commands = input.blueprint.acceptancePlan?.suggestedValidationCommands ?? []
  const fromDesigns = Object.values(input.blueprint.verificationDesigns).flatMap(
    (design) => design.validationCommands,
  )
  const unique = [...new Set([...commands, ...fromDesigns].filter(Boolean))]

  return unique.length > 0 ? unique : [DEFAULT_VALIDATION_COMMAND]
}

function findPhaseForNode(input: GenerateAcePackInput, nodeId: string) {
  const phase = input.blueprint.implementationRoadmap?.phases.find((item) =>
    item.nodeIds.includes(nodeId),
  )

  return phase?.id ?? 'implementation'
}

function readme(input: GenerateAcePackInput, taskCards: CodexTaskCard[]) {
  return [
    '# Autonomous Codex Execution Pack',
    '',
    `Project: ${input.blueprint.name}`,
    '',
    'This folder was generated by Project Blueprint Engine. It is an instruction bundle for Codex, not an automatic deployment system.',
    '',
    '## Read Order',
    '1. `00-readme.md`',
    '2. `01-autonomous-execution-policy.md`',
    '3. `execution-manifest.json`',
    '4. `06-codex-operating-loop.md`',
    '5. Task cards under `07-task-cards/` in manifest order',
    '',
    'Codex must follow `execution-manifest.json` for task order and must not ask the user unless a stop condition is reached.',
    '',
    '## Tasks',
    numberedList(taskCards.map((card) => `${card.id}: ${card.title}`)),
  ].join('\n')
}

function policy(input: GenerateAcePackInput, autonomyLevel: string) {
  const stopConditions = unique(
    Object.values(input.blueprint.workDesigns).flatMap(
      (design) => design.stopConditions,
    ),
  )

  return [
    '# Autonomous Execution Policy',
    '',
    `Autonomy Level: ${autonomyLevel}`,
    '',
    '## Allowed Work',
    bulletList([
      'Create new source files inside approved task scope.',
      'Modify existing source files inside approved task scope.',
      'Add or update tests.',
      'Add or update documentation.',
      'Fix type, lint, build, and focused test failures caused by the task.',
    ]),
    '',
    '## Prohibited Work',
    bulletList([
      'Create or expose secrets.',
      'Run real deployment.',
      'Change payment, permission, or security policy without explicit scope.',
      'Perform destructive migration or delete user data.',
      'Do unrelated large refactors.',
      'Add features outside the approved scope.',
    ]),
    '',
    '## Stop Conditions',
    bulletList(
      stopConditions.length > 0
        ? stopConditions
        : ['Stop if the task needs approval outside the package scope.'],
    ),
    '',
    '## Scope Rules',
    'Task card scope is the allowed work boundary. Task card non-scope is forbidden even if it seems convenient.',
    '',
    '## Dependency Policy',
    'Prefer existing dependencies. Add a dependency only when the task cannot be completed safely without it and document the reason.',
    '',
    '## Failure Policy',
    'Fix related validation failures and rerun. Record unrelated failures as known issues. Stop after the same failure repeats three times.',
  ].join('\n')
}

function projectBlueprint(input: GenerateAcePackInput) {
  const root = input.project.rootNodeId
    ? input.project.nodes[input.project.rootNodeId]
    : null
  const workDesigns = Object.values(input.blueprint.workDesigns)

  return [
    '# Project Blueprint',
    '',
    `Project Goal: ${root?.description ?? input.blueprint.name}`,
    '',
    '## Core Features',
    bulletList(
      getRootToLeafNodes(input.project)
        .filter((node) => node.depth <= 2)
        .map((node) => `${node.title}: ${node.summary ?? node.description}`),
    ),
    '',
    '## Overall Scope',
    bulletList(unique(workDesigns.flatMap((design) => design.scope))),
    '',
    '## Overall Non-Scope',
    bulletList(unique(workDesigns.flatMap((design) => design.nonScope))),
    '',
    '## Definition Of Done',
    bulletList(input.blueprint.acceptancePlan?.rootAcceptanceCriteria ?? []),
  ].join('\n')
}

function requirementTree(input: GenerateAcePackInput) {
  const lines = getRootToLeafNodes(input.project).flatMap((node) => {
    const indent = '  '.repeat(node.depth)
    return [
      `${indent}- ${node.title}`,
      `${indent}  - node id: ${node.id}`,
      `${indent}  - description: ${node.description}`,
      `${indent}  - status: ${node.status}`,
      `${indent}  - extracted facts: ${getNodeFacts(input.project, node).join('; ') || 'None'}`,
      `${indent}  - unresolved questions: ${node.interviewSessionIds
        .flatMap((sessionId) => input.project.interviewSessions[sessionId]?.unresolvedQuestions ?? [])
        .join('; ') || 'None'}`,
    ]
  })

  return ['# Requirement Tree', '', '```text', ...lines, '```'].join('\n')
}

function workRoadmap(input: GenerateAcePackInput) {
  const roadmap = input.blueprint.implementationRoadmap
  const workDesigns = Object.values(input.blueprint.workDesigns)

  return [
    '# Work Roadmap',
    '',
    '## Phases',
    bulletList(
      roadmap?.phases.map(
        (phase) =>
          `${phase.title}: ${phase.goal} (${phase.nodeIds.map((nodeId) => getNodeTitle(input.project, nodeId)).join(', ')})`,
      ) ?? [],
    ),
    '',
    '## Recommended Order',
    numberedList(
      roadmap?.recommendedOrder.map((nodeId) => getNodeTitle(input.project, nodeId)) ??
        [],
    ),
    '',
    '## Dependency Graph',
    bulletList(
      roadmap?.dependencyGraph.map(
        (edge) =>
          `${getNodeTitle(input.project, edge.fromNodeId)} -> ${getNodeTitle(input.project, edge.toNodeId)}: ${edge.reason}`,
      ) ?? [],
    ),
    '',
    '## Node Work Design Summary',
    workDesigns
      .map(
        (design) =>
          `### ${getNodeTitle(input.project, design.nodeId)}\n${design.summary}\n\nAcceptance:\n${bulletList(design.acceptanceCriteria)}`,
      )
      .join('\n\n'),
    '',
    '## Human Review Points',
    bulletList(
      roadmap?.humanReviewPoints.map(
        (point) => `${point.title}: ${point.requiredDecision}`,
      ) ?? [],
    ),
  ].join('\n')
}

function verificationPlan(input: GenerateAcePackInput) {
  const designs = Object.values(input.blueprint.verificationDesigns)
  const acceptance = input.blueprint.acceptancePlan

  return [
    '# Verification Plan',
    '',
    '## Node Verification Designs',
    designs
      .map(
        (design) =>
          `### ${getNodeTitle(input.project, design.nodeId)}\n${design.summary}\n\nCommands:\n${bulletList(design.validationCommands)}\n\nEvidence:\n${bulletList(design.evidenceRequired)}`,
      )
      .join('\n\n'),
    '',
    '## Root Acceptance Plan',
    bulletList(acceptance?.rootAcceptanceCriteria ?? []),
    '',
    '## Regression Risks',
    bulletList(acceptance?.regressionRiskAreas ?? []),
    '',
    '## Manual Checks',
    bulletList(acceptance?.manualReviewChecklist ?? []),
  ].join('\n')
}

function operatingLoop() {
  return [
    '# Codex Operating Loop',
    '',
    'For each task:',
    '',
    '1. Read the task card.',
    '2. Inspect related files.',
    '3. Make the smallest coherent implementation.',
    '4. Add or update tests.',
    '5. Run focused validation.',
    '6. Fix failures.',
    '7. Run broader validation when appropriate.',
    '8. Record evidence.',
    '9. Mark the task complete in the final report notes.',
    '10. Move to the next task.',
    '',
    'Do not ask the user unless a stop condition is reached.',
  ].join('\n')
}

function validationCommands(requiredValidation: string[]) {
  return [
    '# Validation Commands',
    '',
    '## Required Validation',
    bulletList(requiredValidation),
    '',
    '## Focused Validation',
    '- Prefer the smallest command that exercises the touched behavior.',
    '',
    '## Broad Validation',
    '- Run typecheck, test, lint, and build when available and appropriate.',
    '',
    '## Known Unavailable Commands',
    '- If commands are unavailable, document the reason in the final report.',
  ].join('\n')
}

function completionCriteria(input: GenerateAcePackInput) {
  return [
    '# Completion Criteria',
    '',
    bulletList([
      'All task cards are complete.',
      'All acceptance criteria are satisfied.',
      'Required validation passes or unavailability is documented.',
      'Build passes when a build command exists.',
      'Final report is written.',
      'Known issues are not stop conditions.',
      ...(input.blueprint.acceptancePlan?.rootAcceptanceCriteria ?? []),
    ]),
  ].join('\n')
}

function failureRecovery() {
  return [
    '# Failure Recovery',
    '',
    bulletList([
      'Read the failure log.',
      'Decide whether the failure belongs to the current task.',
      'If related, fix it and rerun validation.',
      'If unrelated, record it as a known issue.',
      'If the same failure repeats three times, treat it as a stop condition.',
      'If validation commands are missing or the environment is unavailable, state that in the final report.',
    ]),
  ].join('\n')
}

function finalReportTemplate() {
  return [
    '# Final Report',
    '',
    '## Summary',
    '',
    '## Completed Tasks',
    '',
    '## Files Changed',
    '',
    '## Validation Results',
    '',
    '## Evidence',
    '',
    '## Deviations From Plan',
    '',
    '## Known Issues',
    '',
    '## Stop Conditions Encountered',
    '',
    '## Remaining Manual Checks',
  ].join('\n')
}

function md(path: string, content: string): AceFile {
  return {
    path,
    content,
    kind: 'markdown',
  }
}

function unique(items: string[]) {
  return [...new Set(items.filter((item) => item.trim()))]
}
