import { createIssue } from '../validator-utils/report-utils.js'
import { fileExists, listDirNames, readText } from '../validator-utils/fs-utils.js'

const validator = 'Skills'

const requiredSkills = [
  'devview-autoflow',
  'devview-start',
  'devview-product-intake',
  'devview-ui-ux-confirm',
  'devview-visual-reference-intake',
  'devview-design-system-derive',
  'devview-work-planning',
  'devview-ui-surface-inventory',
  'devview-verification-design',
  'devview-dependency-impact-audit',
  'devview-plan-execution',
  'devview-coverage-audit',
  'devview-ux-audit',
  'devview-visual-implementation-audit',
  'devview-generate-execution-pack',
  'devview-run-execution-pack',
  'devview-review-result',
  'devview-collect-feedback',
  'devview-create-revision-pack',
  'devview-run-revision',
]

export function runSkillsValidator({ root }) {
  const issues = []
  const skillDirs = new Set(listDirNames(root, 'skills'))

  for (const skillName of requiredSkills) {
    if (!skillDirs.has(skillName)) {
      issues.push(
        createIssue({
          validator,
          file: `skills/${skillName}/SKILL.md`,
          code: 'PUBLIC_SKILL_MISSING',
          message: `${skillName} is a public DevView skill and must remain available.`,
          suggestedFix: `Restore skills/${skillName}/SKILL.md.`,
        }),
      )
      continue
    }

    const skillPath = `skills/${skillName}/SKILL.md`
    if (!fileExists(root, skillPath)) {
      issues.push(
        createIssue({
          validator,
          file: skillPath,
          code: 'SKILL_FILE_MISSING',
          message: `${skillPath} is missing.`,
          suggestedFix: `Restore ${skillPath}.`,
        }),
      )
      continue
    }

    const content = readText(root, skillPath)
    if (!content.startsWith('---')) {
      issues.push(
        createIssue({
          validator,
          file: skillPath,
          code: 'SKILL_FRONTMATTER_MISSING',
          message: `${skillPath} lacks YAML frontmatter.`,
          suggestedFix: 'Add frontmatter with name and description.',
        }),
      )
    }

    if (!content.includes(`name: ${skillName}`)) {
      issues.push(
        createIssue({
          validator,
          file: skillPath,
          code: 'SKILL_NAME_MISMATCH',
          message: `${skillPath} does not declare name: ${skillName}.`,
          suggestedFix: `Set the skill frontmatter name to ${skillName}.`,
        }),
      )
    }

    if (!content.includes('description:')) {
      issues.push(
        createIssue({
          validator,
          file: skillPath,
          code: 'SKILL_DESCRIPTION_MISSING',
          message: `${skillPath} lacks a description.`,
          suggestedFix: 'Add a concise skill description in frontmatter.',
        }),
      )
    }
  }

  return issues
}
