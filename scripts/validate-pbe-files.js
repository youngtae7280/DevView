import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { runAcepManifestValidator } from './validators/acep-manifest.js'
import { runAutoflowStateValidator } from './validators/autoflow-state.js'
import { runExamplesValidator } from './validators/examples.js'
import { runPbeLayoutValidator } from './validators/pbe-layout.js'
import { runPluginStructureValidator } from './validators/plugin-structure.js'
import { runRevisionValidator } from './validators/revision.js'
import { runRpdTransitionValidator } from './validators/rpd-transition.js'
import { runSchemasValidator } from './validators/schemas.js'
import { runSkillsCliSyncValidator } from './validators/skills-cli-sync.js'
import { runSkillsValidator } from './validators/skills.js'
import { runTemplatesValidator } from './validators/templates.js'
import { runWorkgraphValidator } from './validators/workgraph.js'
import { createIssue, formatValidationReport } from './validator-utils/report-utils.js'

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targetRoot = process.cwd()
const validationTarget = classifyValidationTarget(pluginRoot, targetRoot)

const repoValidators = [
  ['Plugin structure', runPluginStructureValidator, pluginRoot],
  ['Skills', runSkillsValidator, pluginRoot],
  ['Skills CLI sync', runSkillsCliSyncValidator, pluginRoot],
  ['Templates', runTemplatesValidator, pluginRoot],
  ['Schemas', runSchemasValidator, pluginRoot],
  ['Examples', runExamplesValidator, pluginRoot],
]

const projectValidators = [
  [
    'DevView public terminology and legacy layout',
    runPbeLayoutValidator,
    targetRoot,
    { requireReadmeTerms: validationTarget.kind === 'plugin-repository' },
  ],
  ['Autoflow state', runAutoflowStateValidator, targetRoot],
  ['RPD transition guard', runRpdTransitionValidator, targetRoot],
  ['WorkGraph', runWorkgraphValidator, targetRoot],
  ['ACEP manifest', runAcepManifestValidator, targetRoot],
  ['Revision', runRevisionValidator, targetRoot],
]

const validators =
  validationTarget.kind === 'plugin-repository'
    ? [...repoValidators, ...projectValidators]
    : validationTarget.kind === 'initialized-project'
      ? projectValidators
      : []

const results = []

for (const [name, run, root, options] of validators) {
  try {
    results.push({ name, issues: run({ root, ...(options || {}) }) })
  } catch (error) {
    results.push({
      name,
      issues: [
        createIssue({
          validator: name,
          file: '<validator>',
          code: 'VALIDATOR_RUNTIME_ERROR',
          message: error instanceof Error ? error.message : String(error),
          suggestedFix: `Inspect scripts/validators/${name.toLowerCase().replaceAll(' ', '-')}.js.`,
        }),
      ],
    })
  }
}

if (validationTarget.kind === 'plugin-repository') {
  results.push({
    name: 'Compatibility core',
    issues: runCompatibilityCore(pluginRoot, targetRoot, validationTarget.kind),
  })
} else if (validationTarget.kind === 'initialized-project') {
  results.push({
    name: 'Project compatibility core',
    issues: runCompatibilityCore(pluginRoot, targetRoot, validationTarget.kind),
  })
} else {
  results.push({
    name: 'DevView target',
    issues: [
      createIssue({
        validator: 'DevView target',
        file: '.pbe',
        code: 'PBE_NOT_INITIALIZED',
        message:
          'Target root is not the DevView plugin repository and does not contain legacy migration input storage.',
        suggestedFix: 'Run validation from the DevView repository or an initialized legacy migration root.',
      }),
    ],
  })
}

const report = formatValidationReport(results)
console.log(report)

if (results.some((result) => result.issues.length > 0)) {
  process.exit(1)
}

console.log('DevView validation passed.')

function classifyValidationTarget(repoRoot, cwd) {
  const pluginMarkers = ['.codex-plugin/plugin.json', 'skills', 'templates', 'schemas', 'scripts/validate-pbe-files.js']
  const isPluginRepository =
    path.resolve(repoRoot) === path.resolve(cwd) && pluginMarkers.every((marker) => existsSync(path.join(cwd, marker)))

  if (isPluginRepository) {
    return { kind: 'plugin-repository' }
  }
  if (existsSync(path.join(cwd, '.pbe'))) {
    return { kind: 'initialized-project' }
  }
  return { kind: 'uninitialized' }
}

function runCompatibilityCore(repoRoot, cwd, targetKind) {
  try {
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts', 'validators', 'legacy-core.js')], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PBE_REPO_ROOT: repoRoot,
        PBE_TARGET_ROOT: cwd,
        PBE_VALIDATION_TARGET_KIND: targetKind,
      },
      encoding: 'utf8',
      stdio: 'pipe',
    })
    return []
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim()
    return [
      createIssue({
        validator: 'Compatibility core',
        file: 'scripts/validators/legacy-core.js',
        code: 'LEGACY_CORE_FAILED',
        message: output || (error instanceof Error ? error.message : String(error)),
        suggestedFix: 'Fix the compatibility validation errors reported by the preserved legacy core.',
      }),
    ]
  }
}
