import type {
  AutonomousCodexExecutionPack,
  CodexTaskCard,
} from './acep-types'

export const REQUIRED_ACEP_FILES = [
  '00-readme.md',
  '01-autonomous-execution-policy.md',
  '02-project-blueprint.md',
  '03-requirement-tree.md',
  '04-work-roadmap.md',
  '05-verification-plan.md',
  '06-codex-operating-loop.md',
  '08-validation-commands.md',
  '09-completion-criteria.md',
  '10-failure-recovery.md',
  '11-final-report-template.md',
  'execution-manifest.json',
] as const

export function writeTaskCardMarkdown(card: CodexTaskCard, index: number) {
  return [
    `# Task ${String(index + 1).padStart(3, '0')}: ${card.title}`,
    '',
    '## Goal',
    card.goal,
    '',
    '## Context',
    card.context,
    '',
    '## Scope',
    bulletList(card.scope),
    '',
    '## Non-Scope',
    bulletList(card.nonScope),
    '',
    '## Expected Changes',
    bulletList(card.expectedChanges),
    '',
    '## Acceptance Criteria',
    bulletList(card.acceptanceCriteria),
    '',
    '## Validation',
    bulletList(card.validationPlan),
    '',
    '## Evidence Required',
    bulletList(card.evidenceRequired),
    '',
    '## Dependencies',
    bulletList(card.dependencies.length > 0 ? card.dependencies : ['None']),
    '',
    '## Stop Conditions',
    bulletList(card.stopConditions),
    '',
    '## Codex Prompt',
    card.prompt,
  ].join('\n')
}

export function writeTopLevelCodexPrompt() {
  return [
    'Read and work from `.pbe/codex-execution-pack/` in this repo.',
    '',
    'Rules:',
    '1. Read `00-readme.md` first.',
    '2. Follow the task order in `execution-manifest.json`.',
    '3. Follow the loop in `06-codex-operating-loop.md`.',
    '4. Obey each task card scope, non-scope, acceptance criteria, and validation plan.',
    '5. Do not ask the user unless a stop condition is reached.',
    '6. Record evidence after each task.',
    '7. After all tasks, write the final report using `11-final-report-template.md`.',
    '8. If required validation fails, fix the failure and rerun it.',
    '9. Repeat until the completion criteria are satisfied.',
  ].join('\n')
}

export function writeFileIndex(pack: AutonomousCodexExecutionPack) {
  return pack.files
    .map((file) => `- ${file.path} (${file.kind}, ${file.content.length} chars)`)
    .join('\n')
}

export function bulletList(items: string[]) {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : '- None'
}

export function numberedList(items: string[]) {
  return items.length > 0
    ? items.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : '1. None'
}
