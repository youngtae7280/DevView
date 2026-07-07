import { createIssue } from './report-utils.js'
import { fileExists, readText } from './fs-utils.js'

export function readJson(root, relativePath, validator) {
  if (!fileExists(root, relativePath)) {
    return {
      data: null,
      issue: createIssue({
        validator,
        file: relativePath,
        code: 'FILE_MISSING',
        message: `${relativePath} does not exist.`,
        suggestedFix: `Create ${relativePath}.`,
      }),
    }
  }

  try {
    return { data: JSON.parse(readText(root, relativePath)), issue: null }
  } catch (error) {
    return {
      data: null,
      issue: createIssue({
        validator,
        file: relativePath,
        code: 'JSON_PARSE_FAILED',
        message: error instanceof Error ? error.message : String(error),
        suggestedFix: `Fix invalid JSON syntax in ${relativePath}.`,
      }),
    }
  }
}

export function readOptionalJson(root, relativePath, validator) {
  if (!fileExists(root, relativePath)) {
    return { data: null, issue: null }
  }

  return readJson(root, relativePath, validator)
}

export function readFirstOptionalJson(root, relativePaths, validator) {
  for (const relativePath of relativePaths) {
    if (fileExists(root, relativePath)) {
      return { ...readJson(root, relativePath, validator), relativePath }
    }
  }

  return { data: null, issue: null, relativePath: relativePaths[0] }
}
