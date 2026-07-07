import { createIssue } from '../validator-utils/report-utils.js'
import { fileExists, readText } from '../validator-utils/fs-utils.js'
import { missingTerms } from '../validator-utils/markdown-utils.js'

const validator = 'Examples'

const requiredExampleFiles = [
  'examples/valid/todo-app-devview-run/README.md',
  'examples/valid/todo-app-devview-run/.devview/tree/product-tree.json',
  'examples/valid/todo-app-devview-run/.devview/tree/project-tree.json',
  'examples/valid/todo-app-devview-run/.devview/tree/work-tree.json',
  'examples/valid/todo-app-devview-run/.devview/tree/test-tree.json',
  'examples/valid/todo-app-devview-run/.devview/evidence/evidence-tree.json',
  'examples/valid/todo-app-devview-run/.devview/blueprint/devview-state.json',
  'examples/valid/todo-app-devview-run/.devview/blueprint/devview-routing-contract.md',
  'examples/valid/todo-app-devview-run/.devview/control/acceptance-tree.json',
  'examples/valid/todo-app-devview-run/.devview/control/change-tree.json',
  'examples/valid/todo-app-devview-run/.devview/control/impact-tree.json',
  'examples/invalid/ambiguous-acceptance/fixture.json',
  'examples/invalid/missing-work-link/fixture.json',
  'examples/invalid/missing-test-coverage/fixture.json',
  'examples/invalid/missing-evidence/fixture.json',
  'examples/invalid/stale-evidence/fixture.json',
  'examples/invalid/assistant-accepted/fixture.json',
  'examples/invalid/deferred-scope-leak/fixture.json',
  'examples/invalid/change-without-impact/fixture.json',
]

const requiredReadmeTerms = ['Product', 'Work', 'Test', 'Evidence', 'Change', 'Impact', 'Acceptance']

export function runExamplesValidator({ root }) {
  const issues = []

  for (const relativePath of requiredExampleFiles) {
    if (!fileExists(root, relativePath)) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'EXAMPLE_FILE_MISSING',
          message: `${relativePath} is required by the example regression suite.`,
          suggestedFix: `Restore ${relativePath}.`,
        }),
      )
    }
  }

  const readmePath = 'examples/valid/todo-app-devview-run/README.md'
  if (fileExists(root, readmePath)) {
    const readme = readText(root, readmePath)
    for (const term of missingTerms(readme, requiredReadmeTerms)) {
      issues.push(
        createIssue({
          validator,
          file: readmePath,
          code: 'EXAMPLE_TRACEABILITY_TERM_MISSING',
          message: `Todo golden example README does not mention ${term}.`,
          suggestedFix: `Document ${term} linkage in the Todo example README.`,
        }),
      )
    }
  }

  return issues
}
