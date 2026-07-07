import { createIssue } from '../validator-utils/report-utils.js'
import { dirExists, listFiles } from '../validator-utils/fs-utils.js'
import { readJson } from '../validator-utils/json-utils.js'

const validator = 'Revision'

export function runRevisionValidator({ root }) {
  const issues = []
  if (!dirExists(root, '.devview/revisions')) {
    return issues
  }

  const manifests = listFiles(root, '.devview/revisions', (file) => file.endsWith('revision-manifest.json'))
  for (const relativePath of manifests) {
    const { data: manifest, issue } = readJson(root, relativePath, validator)
    if (issue) {
      issues.push(issue)
      continue
    }

    if (!Array.isArray(manifest.allowedFiles) || manifest.allowedFiles.length === 0) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'REVISION_ALLOWED_FILES_MISSING',
          message: `${relativePath} lacks allowedFiles.`,
          suggestedFix: 'Declare allowedFiles so revision work stays bounded.',
        }),
      )
    }

    if (!Array.isArray(manifest.forbiddenFiles)) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'REVISION_FORBIDDEN_FILES_MISSING',
          message: `${relativePath} lacks forbiddenFiles.`,
          suggestedFix: 'Declare forbiddenFiles, even if the array is empty.',
        }),
      )
    }
  }

  return issues
}
