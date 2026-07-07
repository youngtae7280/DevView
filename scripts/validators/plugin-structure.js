import { createIssue } from '../validator-utils/report-utils.js'
import { dirExists, fileExists } from '../validator-utils/fs-utils.js'
import { readJson } from '../validator-utils/json-utils.js'

const validator = 'Plugin structure'

export function runPluginStructureValidator({ root }) {
  const issues = []
  const requiredFiles = ['.codex-plugin/plugin.json', 'package.json', 'README.md']
  const requiredDirs = ['skills', 'templates', 'schemas', 'scripts']

  for (const relativePath of requiredFiles) {
    if (!fileExists(root, relativePath)) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'REQUIRED_FILE_MISSING',
          message: `${relativePath} is required for plugin distribution.`,
          suggestedFix: `Restore ${relativePath}.`,
        }),
      )
    }
  }

  for (const relativePath of requiredDirs) {
    if (!dirExists(root, relativePath)) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'REQUIRED_DIRECTORY_MISSING',
          message: `${relativePath}/ is required for plugin distribution.`,
          suggestedFix: `Restore ${relativePath}/.`,
        }),
      )
    }
  }

  const { data: plugin, issue } = readJson(root, '.codex-plugin/plugin.json', validator)
  if (issue) {
    issues.push(issue)
    return issues
  }

  if (plugin.name !== 'devview') {
    issues.push(
      createIssue({
        validator,
        file: '.codex-plugin/plugin.json',
        code: 'PLUGIN_NAME_CHANGED',
        message: `Plugin name is ${plugin.name}.`,
        suggestedFix: 'Keep the public plugin name as devview.',
      }),
    )
  }

  if (plugin.skills !== './skills/') {
    issues.push(
      createIssue({
        validator,
        file: '.codex-plugin/plugin.json',
        code: 'SKILL_PATH_CHANGED',
        message: `Plugin skill path is ${plugin.skills}.`,
        suggestedFix: 'Keep skills at ./skills/ for install compatibility.',
      }),
    )
  }

  return issues
}
