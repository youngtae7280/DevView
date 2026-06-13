import Ajv2020 from 'ajv/dist/2020.js'
import { createIssue } from '../validator-utils/report-utils.js'
import { listFiles } from '../validator-utils/fs-utils.js'
import { readJson } from '../validator-utils/json-utils.js'

const validator = 'Schemas'

const requiredSchemas = [
  'schemas/visual-reference.schema.json',
  'schemas/design-tokens.schema.json',
  'schemas/component-style-contract.schema.json',
  'schemas/ui-surface-inventory.schema.json',
  'schemas/component-style-inventory.schema.json',
  'schemas/visual-verification-profile.schema.json',
  'schemas/product-patch-tree.schema.json',
]

export function runSchemasValidator({ root }) {
  const issues = []
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const schemas = []
  const schemaFiles = listFiles(root, 'schemas', (file) => file.endsWith('.schema.json'))

  if (schemaFiles.length === 0) {
    return [
      createIssue({
        validator,
        file: 'schemas',
        code: 'NO_SCHEMAS_FOUND',
        message: 'No JSON schemas were found.',
        suggestedFix: 'Restore schema files under schemas/.',
      }),
    ]
  }

  const schemaFileSet = new Set(schemaFiles)
  for (const relativePath of requiredSchemas) {
    if (!schemaFileSet.has(relativePath)) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'REQUIRED_SCHEMA_MISSING',
          message: `${relativePath} is required by the Visual Design Contract workflow.`,
          suggestedFix: `Restore ${relativePath}.`,
        }),
      )
    }
  }

  for (const relativePath of schemaFiles) {
    const { data, issue } = readJson(root, relativePath, validator)
    if (issue) {
      issues.push(issue)
      continue
    }
    schemas.push([relativePath, data])
  }

  for (const [relativePath, schema] of schemas) {
    try {
      ajv.addSchema(schema)
    } catch (error) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'SCHEMA_ADD_FAILED',
          message: error instanceof Error ? error.message : String(error),
          suggestedFix: `Fix schema id or structure in ${relativePath}.`,
        }),
      )
    }
  }

  for (const [relativePath, schema] of schemas) {
    try {
      ajv.compile(schema)
    } catch (error) {
      issues.push(
        createIssue({
          validator,
          file: relativePath,
          code: 'SCHEMA_COMPILE_FAILED',
          message: error instanceof Error ? error.message : String(error),
          suggestedFix: `Fix JSON Schema errors in ${relativePath}.`,
        }),
      )
    }
  }

  return issues
}
