import { createIssue } from '../validator-utils/report-utils.js'
import { readOptionalJson } from '../validator-utils/json-utils.js'

const validator = 'Execution Pack manifest'

export function runExecutionPackManifestValidator({ root }) {
  const issues = []
  const { data: manifest, issue } = readOptionalJson(
    root,
    '.devview/codex-execution-pack/execution-manifest.json',
    validator,
  )
  if (issue) {
    issues.push(issue)
  }
  if (!manifest) {
    return issues
  }

  if (!Array.isArray(manifest.phases)) {
    issues.push(
      createIssue({
        validator,
        file: '.devview/codex-execution-pack/execution-manifest.json',
        code: 'EXECUTION_PACK_MANIFEST_FIELD_INVALID',
        message: 'phases must be an array.',
        suggestedFix: 'Regenerate Execution Pack manifest with phases[].',
      }),
    )
  }

  if (manifest.validationCommands !== undefined && !Array.isArray(manifest.validationCommands)) {
    issues.push(
      createIssue({
        validator,
        file: '.devview/codex-execution-pack/execution-manifest.json',
        code: 'EXECUTION_PACK_MANIFEST_FIELD_INVALID',
        message: 'validationCommands must be an array when present.',
        suggestedFix: 'Regenerate Execution Pack manifest with validationCommands[] or omit the optional package.',
      }),
    )
  }

  if (manifest.finalState === 'accepted') {
    issues.push(
      createIssue({
        validator,
        file: '.devview/codex-execution-pack/execution-manifest.json',
        code: 'CODEX_SELF_ACCEPTANCE',
        message: 'Execution Pack manifest cannot end in accepted because only the user can accept results.',
        suggestedFix: 'Use submitted_for_review and wait for the review result gate.',
      }),
    )
  }

  return issues
}
