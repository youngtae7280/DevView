import { execFileSync } from 'node:child_process'
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

const validators = [
  ['Plugin structure', runPluginStructureValidator, pluginRoot],
  ['Skills', runSkillsValidator, pluginRoot],
  ['Skills CLI sync', runSkillsCliSyncValidator, pluginRoot],
  ['Templates', runTemplatesValidator, pluginRoot],
  ['Schemas', runSchemasValidator, pluginRoot],
  ['PBE layout', runPbeLayoutValidator, targetRoot],
  ['Autoflow state', runAutoflowStateValidator, targetRoot],
  ['RPD transition guard', runRpdTransitionValidator, targetRoot],
  ['WorkGraph', runWorkgraphValidator, targetRoot],
  ['ACEP manifest', runAcepManifestValidator, targetRoot],
  ['Revision', runRevisionValidator, targetRoot],
  ['Examples', runExamplesValidator, pluginRoot],
]

const results = []

for (const [name, run, root] of validators) {
  try {
    results.push({ name, issues: run({ root }) })
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
results.push({ name: 'Compatibility core', issues: runCompatibilityCore(pluginRoot, targetRoot) })

const report = formatValidationReport(results)
console.log(report)

if (results.some((result) => result.issues.length > 0)) {
  process.exit(1)
}

console.log('PBE validation passed.')

function runCompatibilityCore(repoRoot, cwd) {
  try {
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts', 'validators', 'legacy-core.js')], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PBE_REPO_ROOT: repoRoot,
        PBE_TARGET_ROOT: cwd,
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
