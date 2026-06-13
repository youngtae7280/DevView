import { createIssue } from '../validator-utils/report-utils.js'
import { listFiles, readText } from '../validator-utils/fs-utils.js'

const validator = 'Skills CLI sync'

const forbiddenPatterns = [
  {
    code: 'SKILL_FORBIDDEN_LEGACY_GATE',
    label: 'pbe gate code-start',
    pattern: /\bpbe\s+gate\s+code-start\b/i,
    suggestedFix: 'Use `pbe execution start` instead of the legacy gate command.',
  },
  {
    code: 'SKILL_FORBIDDEN_LEGACY_GATE',
    label: 'pbe gate review-result',
    pattern: /\bpbe\s+gate\s+review-result\b/i,
    suggestedFix: 'Use `pbe files check`, `pbe execution complete`, then `pbe review submit`.',
  },
  {
    code: 'SKILL_FORBIDDEN_LEGACY_GATE',
    label: 'pbe gate accept',
    pattern: /\bpbe\s+gate\s+accept\b/i,
    suggestedFix: 'Use explicit user approval recorded in Acceptance Tree, then `pbe accept`.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'pbe-state.json.autoflow.completedSteps',
    pattern: /pbe-state\.json\.autoflow\.completedSteps/i,
    suggestedFix: 'Use the matching CLI transition command and let the CLI write state history/checkpoints.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'autoflow.completedSteps',
    pattern: /\bautoflow\.completedSteps\b/i,
    suggestedFix: 'Use the matching CLI transition command and let the CLI write completed steps.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'autoflow.nextStep',
    pattern: /\bautoflow\.nextStep\b/i,
    suggestedFix: 'Use the matching CLI transition command and follow its reported next command.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'Set autoflow.state',
    pattern: /\bSet\s+autoflow\.state\b/i,
    suggestedFix: 'Run the appropriate CLI transition command instead of setting autoflow.state directly.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'Update autoflow.state',
    pattern: /\bUpdate\s+autoflow\.state\b/i,
    suggestedFix: 'Run the appropriate CLI transition command instead of updating autoflow.state directly.',
  },
  {
    code: 'SKILL_FORBIDDEN_LEGACY_REVISION_ROUTE',
    label: 'Continue automatically to `pbe-run-revision`',
    pattern: /Continue automatically to `?pbe-run-revision`?/i,
    suggestedFix:
      'Use the CLI revision route: `pbe change create`, `pbe impact analyze`, `pbe revision start`, bounded revision work, `pbe revision complete`.',
  },
  {
    code: 'SKILL_FORBIDDEN_STATE_EDIT',
    label: 'Add ... to pbe-state.json.autoflow.completedSteps',
    pattern: /\bAdd\b.+\bto\s+pbe-state\.json\.autoflow\.completedSteps\b/i,
    suggestedFix: 'Use `pbe revision complete` or the matching CLI transition command to record state progress.',
  },
  {
    code: 'SKILL_FORBIDDEN_ACCEPTANCE_WRITE',
    label: 'write accepted',
    pattern: /\bwrite\s+accepted\b/i,
    suggestedFix: 'Codex must not write acceptance state directly; use explicit user approval and `pbe accept`.',
  },
  {
    code: 'SKILL_FORBIDDEN_ACCEPTANCE_WRITE',
    label: 'write accepted_done',
    pattern: /\bwrite\s+accepted_done\b/i,
    suggestedFix: 'Codex must not write acceptance state directly; use explicit user approval and `pbe accept`.',
  },
  {
    code: 'SKILL_FORBIDDEN_ACCEPTANCE_WRITE',
    label: 'Codex may mark accepted',
    pattern: /\bCodex may mark accepted\b/i,
    suggestedFix: 'Codex must not replace user acceptance; use explicit user approval and `pbe accept`.',
  },
]

const allowedLinePatterns = [
  /\bdo not edit\b.*\bpbe-state\.json\b.*\bdirectly\b/i,
  /\bread\b.*\bpbe-state\.json\b/i,
  /\bautoflow\.state should be written by CLI\b/i,
  /\bCLI writes autoflow\.state\b/i,
]

export function runSkillsCliSyncValidator({ root }) {
  const issues = []
  const skillFiles = listFiles(root, 'skills', (file) => /^skills\/[^/]+\/SKILL\.md$/.test(file))

  for (const file of skillFiles) {
    const content = readText(root, file)
    const lines = content.split(/\r?\n/)

    lines.forEach((line, index) => {
      for (const forbidden of forbiddenPatterns) {
        if (!forbidden.pattern.test(line) || isAllowedLine(line)) {
          continue
        }

        issues.push(
          createIssue({
            validator,
            file: `${file}:${index + 1}`,
            code: forbidden.code,
            message: `${file}:${index + 1} contains forbidden legacy CLI-sync instruction: ${forbidden.label}.`,
            suggestedFix: forbidden.suggestedFix,
          }),
        )
      }
    })
  }

  return issues
}

function isAllowedLine(line) {
  return allowedLinePatterns.some((pattern) => pattern.test(line))
}
