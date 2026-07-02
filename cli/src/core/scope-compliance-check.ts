import path from 'node:path'
import {
  collectGitDerivedChangedFileArtifact,
  type GitDerivedChangedFileCollectionArtifact,
} from './git-derived-changed-file-collection.js'
import { readJsonSafe, relativePath, writeJsonAtomic } from './fs.js'
import {
  evaluateScopeCompliance,
  type ScopeComplianceEvaluationResult,
  type ScopeComplianceFinding,
} from './scope-compliance-evaluator.js'

export const defaultScopeComplianceCalibrationDraftPath =
  'examples/valid/todo-app-pbe-run/generated/compiler-input-model-calibration-draft.runtime-evidence-only.json'

export const defaultScopeComplianceEvaluationArtifactPath =
  'examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation.runtime-evidence-only.preview.json'

export interface AdvisoryScopeComplianceCheckOptions {
  baseRef: string
  headRef: string
  output?: string
}

export interface AdvisoryScopeComplianceCheckArtifact extends ScopeComplianceEvaluationResult {
  schemaVersion: 1
  artifactRole: 'scope-compliance-advisory-evaluation'
  status: 'scope-compliance-advisory-evaluation-complete'
  command: 'graph read-model check-scope'
  fixtureId: 'calibration-fixture-todo-app-runtime-evidence-only'
  fixtureShape: 'test-only-behavior-proof'
  checkerAxis: 'scope-compliance-preview'
  evaluationMode: 'non-enforcing-local-deterministic-cli'
  baseRef: string
  headRef: string
  resolvedBaseRef?: string
  resolvedHeadRef?: string
  changedFilesCollected: true
  inputConsumedForEvaluation: true
  changedFileInputConsumedForEvaluation: true
  scopeInputsConsumedForEvaluation: true
  pathPolicyConsumedForEvaluation: true
  pathMatchingHelperConsumedForEvaluation: true
  categorySchemaConsumedForEvaluation: true
  actualDiffInspected: false
  patchContentsInspected: false
  cleanClaimed: boolean
  actualViolationClaimed: boolean
  collectionOutputWritten: false
  changedFileInputArtifact: 'in-memory-git-derived-changed-file-collection'
  scopeInputBindingArtifact: string
  pathPatternPolicyArtifact: string
  pathMatchingHelperArtifact: string
  violationCategorySchemaArtifact: string
  resultShapeArtifact: string
  sourceArtifacts: {
    compilerInputCalibrationDraft: string
    scopeComplianceScopeInputBinding: string
    scopeCompliancePathPatternPolicy: string
    scopeComplianceViolationCategorySchema: string
    scopeComplianceEvaluationResultShape: string
  }
  allowedScopePatterns: string[]
  forbiddenScopePatterns: string[]
  evaluatedViolationCount: number
  reviewRequiredFindingCount: number
  blockingFindingCount: number
  unknownFindingCount: number
  advisoryFindingCount: number
  nonEnforcementBoundary: string
  allowedUse: string[]
  forbiddenUse: string[]
}

export interface AdvisoryScopeComplianceCheckResult {
  artifact: AdvisoryScopeComplianceCheckArtifact
  outputPath?: string
}

interface ScopePatternSource {
  allowedScopePatterns: string[]
  forbiddenScopePatterns: string[]
}

export async function runAdvisoryScopeComplianceCheck(
  root: string,
  options: AdvisoryScopeComplianceCheckOptions,
): Promise<AdvisoryScopeComplianceCheckResult> {
  const [collectionArtifact, scopePatterns] = await Promise.all([
    collectGitDerivedChangedFileArtifact(root, {
      baseRef: options.baseRef,
      headRef: options.headRef,
    }),
    loadScopeCompliancePatterns(root),
  ])

  const evaluation = evaluateScopeCompliance({
    changedFiles: collectionArtifact.normalizedChangedFiles,
    allowedScopePatterns: scopePatterns.allowedScopePatterns,
    forbiddenScopePatterns: scopePatterns.forbiddenScopePatterns,
  })
  const artifact = buildAdvisoryScopeComplianceCheckArtifact({
    baseRef: options.baseRef,
    headRef: options.headRef,
    collectionArtifact,
    scopePatterns,
    evaluation,
  })

  if (!options.output) {
    return { artifact }
  }

  const outputPath = path.resolve(root, options.output)
  await writeJsonAtomic(outputPath, artifact)
  return {
    artifact,
    outputPath: relativePath(root, outputPath),
  }
}

export function buildAdvisoryScopeComplianceCheckArtifact(input: {
  baseRef: string
  headRef: string
  collectionArtifact: GitDerivedChangedFileCollectionArtifact
  scopePatterns: ScopePatternSource
  evaluation: ScopeComplianceEvaluationResult
}): AdvisoryScopeComplianceCheckArtifact {
  const advisoryFindingCount = countFindings([
    input.evaluation.evaluatedViolations,
    input.evaluation.reviewRequiredFindings,
    input.evaluation.blockingFindings,
    input.evaluation.unknownFindings,
  ])
  return {
    schemaVersion: 1,
    artifactRole: 'scope-compliance-advisory-evaluation',
    status: 'scope-compliance-advisory-evaluation-complete',
    command: 'graph read-model check-scope',
    fixtureId: 'calibration-fixture-todo-app-runtime-evidence-only',
    fixtureShape: 'test-only-behavior-proof',
    checkerAxis: 'scope-compliance-preview',
    evaluationMode: 'non-enforcing-local-deterministic-cli',
    baseRef: input.baseRef,
    headRef: input.headRef,
    ...(input.collectionArtifact.resolvedBaseRef ? { resolvedBaseRef: input.collectionArtifact.resolvedBaseRef } : {}),
    ...(input.collectionArtifact.resolvedHeadRef ? { resolvedHeadRef: input.collectionArtifact.resolvedHeadRef } : {}),
    changedFilesCollected: true,
    inputConsumedForEvaluation: true,
    changedFileInputConsumedForEvaluation: true,
    scopeInputsConsumedForEvaluation: true,
    pathPolicyConsumedForEvaluation: true,
    pathMatchingHelperConsumedForEvaluation: true,
    categorySchemaConsumedForEvaluation: true,
    actualDiffInspected: false,
    patchContentsInspected: false,
    cleanClaimed: false,
    actualViolationClaimed: false,
    collectionOutputWritten: false,
    changedFileInputArtifact: 'in-memory-git-derived-changed-file-collection',
    scopeInputBindingArtifact:
      'examples/valid/todo-app-pbe-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json',
    pathPatternPolicyArtifact:
      'examples/valid/todo-app-pbe-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json',
    pathMatchingHelperArtifact: 'cli/src/core/scope-compliance-path-pattern.ts',
    violationCategorySchemaArtifact:
      'examples/valid/todo-app-pbe-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json',
    resultShapeArtifact:
      'examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json',
    sourceArtifacts: {
      compilerInputCalibrationDraft: defaultScopeComplianceCalibrationDraftPath,
      scopeComplianceScopeInputBinding:
        'examples/valid/todo-app-pbe-run/generated/scope-compliance-scope-input-binding.runtime-evidence-only.preview.json',
      scopeCompliancePathPatternPolicy:
        'examples/valid/todo-app-pbe-run/generated/scope-compliance-path-pattern-policy.runtime-evidence-only.preview.json',
      scopeComplianceViolationCategorySchema:
        'examples/valid/todo-app-pbe-run/generated/scope-compliance-violation-category-schema.runtime-evidence-only.preview.json',
      scopeComplianceEvaluationResultShape:
        'examples/valid/todo-app-pbe-run/generated/scope-compliance-evaluation-result-shape.runtime-evidence-only.preview.json',
    },
    allowedScopePatterns: input.scopePatterns.allowedScopePatterns,
    forbiddenScopePatterns: input.scopePatterns.forbiddenScopePatterns,
    ...input.evaluation,
    evaluatedViolationCount: input.evaluation.evaluatedViolations.length,
    reviewRequiredFindingCount: input.evaluation.reviewRequiredFindings.length,
    blockingFindingCount: input.evaluation.blockingFindings.length,
    unknownFindingCount: input.evaluation.unknownFindings.length,
    advisoryFindingCount,
    nonEnforcementBoundary:
      'This command runs the first advisory scope compliance evaluator surface. It collects changed-file names/status in memory and compares them with the current Todo App runtime Evidence-only scope inputs, but it remains non-enforcing. Advisory findings do not reject diffs, fail CI, configure required checks, approve fixtures, satisfy runtime Evidence, prove equivalence, apply graph deltas, or replace user acceptance.',
    allowedUse: [
      'inspect advisory scope compliance findings from explicit base/head refs',
      'include local deterministic evaluator timing in DevView runtime smoke',
      'write an advisory evaluation artifact only when --output is explicitly provided',
      'review blocking or review-required findings without treating them as enforcement',
    ],
    forbiddenUse: [
      'diff rejection',
      'scope enforcement',
      'CI enforcement',
      'required check configuration',
      'branch protection',
      'fixture support',
      'fixture approval',
      'runtime Evidence satisfaction',
      'equivalence proof',
      'graph delta apply',
      'user acceptance',
      'production source edit permission',
    ],
  }
}

async function loadScopeCompliancePatterns(root: string): Promise<ScopePatternSource> {
  const draftPath = path.resolve(root, defaultScopeComplianceCalibrationDraftPath)
  const parsed = await readJsonSafe<Record<string, unknown>>(draftPath)
  if (!parsed.ok) {
    throw new Error(`Unable to read scope compliance calibration draft: ${parsed.error}`)
  }
  const allowedScopePatterns = extractPathPatterns(
    parsed.value.targetScopeCandidates,
    'targetScopeCandidates',
    defaultScopeComplianceCalibrationDraftPath,
  )
  const policySnapshot =
    typeof parsed.value.policySnapshot === 'object' && parsed.value.policySnapshot !== null
      ? (parsed.value.policySnapshot as Record<string, unknown>)
      : {}
  const forbiddenScopePatterns = extractPathPatterns(
    policySnapshot.forbiddenScopeRules,
    'policySnapshot.forbiddenScopeRules',
    defaultScopeComplianceCalibrationDraftPath,
  )
  if (allowedScopePatterns.length === 0) {
    throw new Error('Scope compliance allowedScope pattern source is empty.')
  }
  if (forbiddenScopePatterns.length === 0) {
    throw new Error('Scope compliance forbiddenScope pattern source is empty.')
  }
  return {
    allowedScopePatterns: [...new Set(allowedScopePatterns)],
    forbiddenScopePatterns: [...new Set(forbiddenScopePatterns)],
  }
}

function extractPathPatterns(value: unknown, label: string, sourcePath: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${sourcePath}.${label} must be an array before scope compliance can run.`)
  }
  const paths: string[] = []
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`${sourcePath}.${label}[${index}] must be an object.`)
    }
    const entryPaths = (entry as Record<string, unknown>).paths
    if (!Array.isArray(entryPaths)) {
      throw new Error(`${sourcePath}.${label}[${index}].paths must be an array.`)
    }
    for (const [pathIndex, entryPath] of entryPaths.entries()) {
      if (typeof entryPath !== 'string' || entryPath.length === 0) {
        throw new Error(`${sourcePath}.${label}[${index}].paths[${pathIndex}] must be a non-empty string.`)
      }
      paths.push(entryPath)
    }
  }
  return paths
}

function countFindings(groups: ScopeComplianceFinding[][]): number {
  return new Set(
    groups
      .flat()
      .map((finding) =>
        [finding.category, finding.path || '', finding.pattern || '', finding.severity, finding.reason].join('\0'),
      ),
  ).size
}
