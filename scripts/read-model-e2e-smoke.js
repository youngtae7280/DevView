import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = join(repoRoot, 'dist/cli/index.js')
const tempRoot = mkdtempSync(join(tmpdir(), 'pbe-read-model-e2e-'))
const outputArgIndex = process.argv.indexOf('--output')
const outputPath = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : null

function copyPath(relativePath) {
  const from = join(repoRoot, relativePath)
  const to = join(tempRoot, relativePath)
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true })
}

function runCli(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: tempRoot,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(
      [`Command failed: pbe ${args.join(' ')}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n'),
    )
  }
  try {
    return JSON.parse(result.stdout)
  } catch (error) {
    throw new Error(`Command did not return JSON: pbe ${args.join(' ')}\n${result.stdout}\n${error.message}`)
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(tempRoot, relativePath), 'utf8'))
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`)
  }
}

function assertIncludes(values, expected, label) {
  if (!values.includes(expected)) {
    throw new Error(`${label}: expected ${expected} in ${JSON.stringify(values)}`)
  }
}

function commandResult(profile, command) {
  const result = profile?.commands?.find((entry) => entry.command === command)
  if (!result) {
    throw new Error(`Missing ${command} result for ${profile?.profileId ?? 'unknown profile'}`)
  }
  return result
}

try {
  copyPath('docs/concept')
  copyPath('examples/adoption/todo-search-slice')
  copyPath('examples/adoption/compatibility-mismatch-slice')
  copyPath('examples/valid/todo-app-pbe-run')
  copyPath('examples/read-model-aggregate')
  copyPath('examples/intent-critical')
  copyPath('.github/workflows/read-model-evidence.yml')

  const todoSearchGenerate = runCli([
    'graph',
    'read-model',
    'generate',
    '--slice',
    'examples/adoption/todo-search-slice',
    '--json',
  ])
  assertEqual(todoSearchGenerate.nodeCount, 40, 'Todo Search generated node count')
  assertEqual(todoSearchGenerate.edgeCount, 59, 'Todo Search generated edge count')

  const todoSearchGenerated = readJson('examples/adoption/todo-search-slice/generated/generated-read-model.json')
  assertEqual(todoSearchGenerated.metadata.readModelSourceMode, 'graph-source-backed', 'Todo Search source mode')
  assertEqual(
    todoSearchGenerated.metadata.graphSourceArtifact,
    'examples/adoption/todo-search-slice/graph-source.json',
    'Todo Search graph source artifact',
  )
  assertEqual(todoSearchGenerated.coreViewCoverage.length, 7, 'Todo Search Core View count')

  const todoSearchCompare = runCli([
    'graph',
    'read-model',
    'compare',
    '--generated',
    'examples/adoption/todo-search-slice/generated/generated-read-model.json',
    '--manual',
    'examples/adoption/todo-search-slice/maintainability-graph-read-model.json',
    '--json',
  ])
  assertEqual(todoSearchCompare.status, 'comparison-pass', 'Todo Search parity status')
  assertEqual(todoSearchCompare.mismatchCount, 0, 'Todo Search parity mismatch count')

  const todoSearchValidate = runCli([
    'graph',
    'read-model',
    'validate',
    '--slice',
    'examples/adoption/todo-search-slice',
    '--json',
  ])
  assertEqual(todoSearchValidate.status, 'validation-pass', 'Todo Search validation status')
  assertEqual(todoSearchValidate.checkCount, 20, 'Todo Search validation check count')

  const todoAppGenerate = runCli([
    'graph',
    'read-model',
    'generate',
    '--slice',
    'examples/valid/todo-app-pbe-run',
    '--json',
  ])
  assertEqual(todoAppGenerate.nodeCount, 22, 'Todo App generated node count')
  assertEqual(todoAppGenerate.edgeCount, 38, 'Todo App generated edge count')

  const todoAppGenerated = readJson('examples/valid/todo-app-pbe-run/generated/generated-read-model.json')
  assertEqual(todoAppGenerated.metadata.readModelSourceMode, 'graph-source-backed', 'Todo App source mode')
  assertEqual(
    todoAppGenerated.metadata.graphSourceArtifact,
    'examples/valid/todo-app-pbe-run/graph-source.json',
    'Todo App graph source candidate artifact',
  )
  assertEqual(
    todoAppGenerated.metadata.graphSourceAuthorityStatus,
    'confirmed-structure-only-graph-source',
    'Todo App graph source authority status',
  )
  assertEqual(todoAppGenerated.coreViewCoverage.length, 7, 'Todo App Core View count')

  const todoAppValidate = runCli([
    'graph',
    'read-model',
    'validate',
    '--slice',
    'examples/valid/todo-app-pbe-run',
    '--json',
  ])
  assertEqual(todoAppValidate.status, 'validation-pass', 'Todo App validation status')
  assertEqual(todoAppValidate.checkCount, 16, 'Todo App validation check count')

  const validateAll = runCli(['graph', 'read-model', 'validate', '--all', '--json'])
  assertEqual(validateAll.status, 'aggregate-pass', 'validate-all status')
  assertEqual(validateAll.validateAllStatus, 'aggregate-pass', 'validate-all aggregate status')
  assertEqual(validateAll.aggregateStatus, 'aggregate-pass', 'aggregate summary status')
  assertEqual(validateAll.sliceCount, 2, 'validate-all slice count')

  const transitionStatus = readJson('examples/read-model-aggregate/graph-source-transition-status.json')
  assertEqual(
    transitionStatus.status,
    'confirmed-graph-source-transition-mechanics',
    'Graph-source transition mechanics status',
  )
  assertEqual(
    transitionStatus.sourceDirection,
    'graph-source-confirmed-for-configured-read-model-slices',
    'Graph-source transition source direction',
  )
  assertEqual(
    transitionStatus.treeNativeRole,
    'compatibility-fallback-reference-with-todo-search-deprecated-fallback',
    'Tree-native compatibility/fallback role',
  )
  assertEqual(
    transitionStatus.repoWideBoundaries?.treeNativeRetirement,
    'not-complete',
    'Tree-native retirement boundary',
  )
  assertEqual(transitionStatus.repoWideBoundaries?.ciEnforcement, 'not-enabled', 'CI enforcement boundary')
  assertEqual(
    transitionStatus.retirementReadinessSummary?.status,
    'retirement-not-ready',
    'Tree-native retirement readiness summary',
  )
  assertEqual(
    transitionStatus.retirementReadinessSummary?.explicitRetirementApproval,
    'not-approved',
    'Tree-native explicit retirement approval boundary',
  )
  assertEqual(
    transitionStatus.retirementReadinessSummary?.retirementAction,
    'todo-search-fallback-deprecated-not-deleted',
    'Tree-native retirement action boundary',
  )
  if (
    !Array.isArray(transitionStatus.retirementReadinessCriteria) ||
    transitionStatus.retirementReadinessCriteria.length < 8
  ) {
    throw new Error('Tree-native retirement readiness criteria must remain explicit')
  }
  if (
    !Array.isArray(transitionStatus.retirementApprovalPackages) ||
    transitionStatus.retirementApprovalPackages.length !== 3
  ) {
    throw new Error('Tree-native retirement approval packages must cover Todo Search, Todo App, and repo-wide scopes')
  }
  const todoSearchRetirementPackage = transitionStatus.retirementApprovalPackages.find(
    (entry) => entry.scope === 'todo-search-selected-slice',
  )
  const todoAppRetirementPackage = transitionStatus.retirementApprovalPackages.find(
    (entry) => entry.scope === 'todo-app-pbe-run-structure-only',
  )
  const repoWideRetirementPackage = transitionStatus.retirementApprovalPackages.find(
    (entry) => entry.scope === 'repo-wide',
  )
  assertEqual(
    todoSearchRetirementPackage?.status,
    'retirement-candidate-not-deleted',
    'Todo Search retirement approval package status',
  )
  assertEqual(
    todoAppRetirementPackage?.status,
    'not-ready-structure-only',
    'Todo App retirement approval package status',
  )
  assertEqual(repoWideRetirementPackage?.status, 'not-ready', 'Repo-wide retirement approval package status')

  const todoSearchProfile = validateAll.perSliceResults.find(
    (entry) => entry.profileId === 'todo-search-selected-slice',
  )
  const todoAppProfile = validateAll.perSliceResults.find(
    (entry) => entry.profileId === 'todo-app-pbe-run-structure-only',
  )
  const todoSearchTransition = transitionStatus.configuredSlices.find(
    (entry) => entry.profileId === 'todo-search-selected-slice',
  )
  const todoAppTransition = transitionStatus.configuredSlices.find(
    (entry) => entry.profileId === 'todo-app-pbe-run-structure-only',
  )
  assertEqual(todoSearchTransition?.sourceRole, 'limited-graph-source-promoted', 'Todo Search transition source role')
  assertEqual(todoSearchTransition?.generationMode, 'graph-source-backed', 'Todo Search transition generation mode')
  assertEqual(todoSearchTransition?.expectedCounts?.nodes, 40, 'Todo Search transition node count')
  assertEqual(todoSearchTransition?.expectedCounts?.edges, 59, 'Todo Search transition edge count')
  assertEqual(todoSearchTransition?.expectedCounts?.coreViews, 7, 'Todo Search transition Core View count')
  assertEqual(
    todoSearchTransition?.retirementReadiness?.status,
    'deprecated-fallback-reference-not-deleted',
    'Todo Search retirement readiness status',
  )
  assertEqual(
    todoSearchTransition?.retirementReadiness?.criteriaStatus?.narrowFallbackDeprecationMechanicsApproved,
    'present',
    'Todo Search narrow fallback deprecation mechanics readiness',
  )
  assertEqual(
    todoSearchTransition?.retirementReadiness?.criteriaStatus?.explicitFileRetirementOrDeletionApprovalPresent,
    'missing',
    'Todo Search explicit file retirement/deletion approval readiness',
  )
  assertEqual(todoAppTransition?.sourceRole, 'confirmed-structure-only-graph-source', 'Todo App transition source role')
  assertEqual(todoAppTransition?.generationMode, 'graph-source-backed', 'Todo App transition generation mode')
  assertEqual(todoAppTransition?.expectedCounts?.nodes, 22, 'Todo App transition node count')
  assertEqual(todoAppTransition?.expectedCounts?.edges, 38, 'Todo App transition edge count')
  assertEqual(todoAppTransition?.expectedCounts?.coreViews, 7, 'Todo App transition Core View count')
  assertEqual(
    todoAppTransition?.retirementReadiness?.status,
    'not-retirement-ready',
    'Todo App retirement readiness status',
  )
  assertEqual(
    todoAppTransition?.retirementReadiness?.criteriaStatus?.sourceAuthorityBeyondStructureOnly,
    'not-approved',
    'Todo App source authority beyond structure-only readiness',
  )
  const todoSearchProjection = commandResult(todoSearchProfile, 'project-contract')
  assertEqual(todoSearchProjection.status, 'projection-contract-pass', 'Todo Search projection contract status')
  assertEqual(todoSearchProjection.nodeCount, 40, 'Todo Search projection node count')
  assertEqual(todoSearchProjection.edgeCount, 59, 'Todo Search projection edge count')
  assertEqual(todoSearchProjection.coreViewCount, 7, 'Todo Search projection Core View count')

  const todoAppProjection = commandResult(todoAppProfile, 'project-contract')
  assertEqual(todoAppProjection.status, 'projection-contract-pass', 'Todo App candidate projection contract status')
  assertEqual(todoAppProjection.contractMode, 'structure-only-confirmed', 'Todo App projection contract mode')
  assertEqual(todoAppProjection.nodeCount, 22, 'Todo App projection node count')
  assertEqual(todoAppProjection.edgeCount, 38, 'Todo App projection edge count')
  assertEqual(todoAppProjection.coreViewCount, 7, 'Todo App projection Core View count')

  const projectionStatuses = validateAll.projectionContractStatus.map((entry) => entry.status)
  assertIncludes(projectionStatuses, 'projection-contract-pass', 'validate-all projection statuses')
  assertIncludes(projectionStatuses, 'projection-contract-pass', 'validate-all projection statuses')

  const candidateObservation = runCli(['graph', 'read-model', 'observe-candidates', '--json'])
  assertEqual(candidateObservation.status, 'candidate-observation-pass', 'candidate observation status')
  assertEqual(
    candidateObservation.observedCandidates[0].status,
    'projection-contract-pass',
    'candidate observation Todo App status',
  )
  if (!candidateObservation.validateAllBoundary.includes('separate report-only command')) {
    throw new Error('Candidate observation boundary must remain separate report-only command')
  }

  const intentReport = runCli(['graph', 'read-model', 'report-intent', '--json'])
  assertEqual(intentReport.status, 'intent-report-pass', 'edgeIntent report status')
  assertEqual(intentReport.projectedFixtureCount, 2, 'edgeIntent projected fixture count')
  if (!Array.isArray(intentReport.fixtures) || intentReport.fixtures.length !== 2) {
    throw new Error('edgeIntent report must include native and retrofit fixture summaries')
  }
  if (intentReport.edgeIntentCount <= 0) {
    throw new Error('edgeIntent report must include at least one edgeIntent')
  }
  if (intentReport.claimCount <= 0) {
    throw new Error('edgeIntent report must include preserved claim text')
  }
  if (intentReport.classificationCount <= 0) {
    throw new Error('edgeIntent report must include vocabulary classifications')
  }
  if (intentReport.anchorCount <= 0) {
    throw new Error('edgeIntent report must include source signal anchors')
  }
  assertEqual(intentReport.missingClassificationCount, 0, 'edgeIntent missing classification count')
  assertEqual(intentReport.missingAnchorCount, 0, 'edgeIntent missing anchor count')
  const intentKinds = intentReport.fixtures.map((entry) => entry.sourceExampleKind)
  assertIncludes(intentKinds, 'native-pbe', 'edgeIntent report fixture kinds')
  assertIncludes(intentKinds, 'retrofit-pbe', 'edgeIntent report fixture kinds')

  const compilerBoundary = runCli(['graph', 'read-model', 'report-compiler-boundary', '--json'])
  assertEqual(compilerBoundary.status, 'compiler-boundary-mvp-pass', 'compiler boundary status')
  assertEqual(compilerBoundary.taskRegistryStatus, 'task-registry-pass', 'compiler boundary task registry status')
  assertEqual(compilerBoundary.contractSchemaStatus, 'contract-schema-pass', 'compiler boundary contract schema status')
  assertEqual(
    compilerBoundary.contractValidatorStatus,
    'contract-validator-pass',
    'compiler boundary contract validator status',
  )
  assertEqual(compilerBoundary.dryRunContractStatus, 'dry-run-contract-pass', 'compiler boundary dry-run status')
  if (compilerBoundary.taskCounts.compilerRequired <= 0) {
    throw new Error('Compiler boundary report must include compiler-required tasks')
  }
  if (compilerBoundary.taskCounts.aiAdvisory <= 0) {
    throw new Error('Compiler boundary report must include ai-advisory tasks')
  }
  if (compilerBoundary.dryRunContract.requiredCheckCount <= 0) {
    throw new Error('Compiler boundary dry-run contract must include required checks')
  }
  if (compilerBoundary.dryRunContract.requiredEvidenceCount <= 0) {
    throw new Error('Compiler boundary dry-run contract must include required evidence')
  }

  const compilerInputModel = runCli(['graph', 'read-model', 'report-compiler-input', '--json'])
  assertEqual(compilerInputModel.status, 'compiler-input-model-pass', 'compiler input model status')
  assertEqual(compilerInputModel.inputSchemaStatus, 'compiler-input-schema-pass', 'compiler input schema status')
  assertEqual(compilerInputModel.dryRunInputStatus, 'compiler-input-dry-run-pass', 'compiler input dry-run status')
  if (compilerInputModel.dryRunInput.graphSnapshotArtifactCount <= 0) {
    throw new Error('Compiler input model must include graph snapshot artifacts')
  }
  if (compilerInputModel.dryRunInput.targetScopeCandidateCount <= 0) {
    throw new Error('Compiler input model must include target scope candidates')
  }
  if (compilerInputModel.dryRunInput.riskSourceCount <= 0) {
    throw new Error('Compiler input model must include risk sources')
  }

  const contractCompilerDryRun = runCli(['graph', 'read-model', 'compile-contract', '--dry-run', '--json'])
  assertEqual(contractCompilerDryRun.status, 'contract-compiler-dry-run-pass', 'contract compiler dry-run status')
  assertEqual(contractCompilerDryRun.inputModelStatus, 'compiler-input-model-pass', 'contract compiler input status')
  assertEqual(contractCompilerDryRun.candidateStatus, 'contract-candidate-pass', 'contract compiler candidate status')
  assertEqual(
    contractCompilerDryRun.candidateDiff.status,
    'contract-diff-detected',
    'contract compiler generated-vs-handwritten diff status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.reviewStatus,
    'non-blocking-review-diff',
    'contract compiler diff review status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalenceStatus,
    'compiler-equivalence-not-proven',
    'contract compiler equivalence status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.compilerPromotionReadiness,
    'compiler-promotion-review-required',
    'contract compiler promotion readiness',
  )
  if ((contractCompilerDryRun.candidateDiff.semanticClassificationCounts['semantic-loss'] || 0) !== 0) {
    throw new Error('Contract compiler semantic-loss should be resolved by risk source authority mapping')
  }
  if ((contractCompilerDryRun.candidateDiff.semanticClassificationCounts['conservative-restriction'] || 0) !== 0) {
    throw new Error('Contract compiler allowed-scope conservative review debt should be resolved by source authority')
  }
  if ((contractCompilerDryRun.candidateDiff.semanticClassificationCounts['policy-loss'] || 0) !== 0) {
    throw new Error('Contract compiler policy-loss should be resolved by stop-condition source authority mapping')
  }
  if ((contractCompilerDryRun.candidateDiff.semanticClassificationCounts['evidence-chain-mismatch'] || 0) !== 0) {
    throw new Error('Contract compiler evidence-chain mismatch should be resolved by evidence source authority mapping')
  }
  if ((contractCompilerDryRun.candidateDiff.semanticClassificationCounts['output-requirement-loss'] || 0) !== 0) {
    throw new Error('Contract compiler output requirement loss should be resolved by source authority mapping')
  }
  const semanticDiffCoverage = contractCompilerDryRun.candidateDiff.semanticDiffRuleCoverage
  if (
    semanticDiffCoverage.totalDiffs !== semanticDiffCoverage.classifiedDiffs + semanticDiffCoverage.unknownDiffs ||
    semanticDiffCoverage.unknownDiffs !== 0
  ) {
    throw new Error('Contract compiler semantic diff coverage must classify the current dry-run diff set')
  }
  assertEqual(
    contractCompilerDryRun.candidateDiff.v01CloseoutStatus,
    'contract-compiler-dry-run-v0.1-classification-complete',
    'contract compiler v0.1 closeout status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.semanticDiffUnknownsStatus,
    'semantic-diff-unknowns-zero',
    'contract compiler semantic diff unknowns status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.semanticDiffCoverageComplete,
    true,
    'contract compiler semantic diff coverage complete flag',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalenceProven,
    false,
    'contract compiler equivalence proven flag',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.sourceAuthorityPreservationStatus,
    'source-authority-preserved',
    'contract compiler source authority preservation status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.semanticDiffPolicyStatus,
    'semantic-diff-clean',
    'contract compiler semantic diff policy status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.reviewOnlyDiffStatus,
    'review-only-diff-detected',
    'contract compiler review-only diff status',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.blockingSemanticLossCount,
    0,
    'contract compiler blocking semantic loss count',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.reviewOnlyDiffCount,
    3,
    'contract compiler review-only diff count',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.equivalenceCandidate,
    true,
    'contract compiler equivalence candidate flag',
  )
  assertEqual(
    contractCompilerDryRun.candidateDiff.equivalencePolicy.equivalenceProven,
    false,
    'contract compiler equivalence policy proven flag',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.status,
    'promotion-review-ready-for-human',
    'contract compiler promotion review packet status',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.approvalStatus,
    'not-approved',
    'contract compiler promotion review approval status',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.equivalenceCandidate,
    true,
    'contract compiler promotion review equivalence candidate flag',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.equivalenceProven,
    false,
    'contract compiler promotion review equivalence proven flag',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.reviewOnlyDiffCount,
    3,
    'contract compiler promotion review-only diff count',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.reviewOnlyDiffClassifications['source-mode-metadata-only'],
    1,
    'contract compiler source mode review-only diff classification count',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.reviewOnlyDiffClassifications['validation-superset-review-only'],
    1,
    'contract compiler validation superset review-only diff classification count',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.reviewOnlyDiffClassifications['boundary-wording-review-required'],
    1,
    'contract compiler boundary wording review-only diff classification count',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.boundaryWordingReviewRequired,
    true,
    'contract compiler boundary wording review required flag',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.blockingSemanticLossCount,
    0,
    'contract compiler promotion review blocking semantic loss count',
  )
  assertEqual(
    contractCompilerDryRun.promotionReview.unknownDiffCount,
    0,
    'contract compiler promotion review unknown diff count',
  )
  if (!contractCompilerDryRun.paths.promotionReviewPacket) {
    throw new Error('Contract compiler dry-run must expose a promotion review packet path')
  }
  if (contractCompilerDryRun.candidate.requiredCheckCount <= 0) {
    throw new Error('Contract compiler dry-run candidate must include required checks')
  }
  if (contractCompilerDryRun.candidate.requiredEvidenceCount <= 0) {
    throw new Error('Contract compiler dry-run candidate must include required evidence')
  }
  if (!contractCompilerDryRun.paths.diffReport) {
    throw new Error('Contract compiler dry-run must expose a diff report path')
  }
  assertEqual(
    contractCompilerDryRun.outputRequirementSourceAuthorityPreview.status,
    'output-requirement-source-authority-preview-pass',
    'output requirement source authority preview status',
  )
  assertEqual(
    contractCompilerDryRun.outputRequirementSourceAuthorityPreview.unresolvedObligationCount,
    0,
    'output requirement source authority unresolved obligation count',
  )
  assertEqual(
    contractCompilerDryRun.outputRequirementSourceAuthorityPreview.generatedPreservationStatus,
    'generated-output-requirements-preserved',
    'output requirement generated preservation status',
  )
  assertEqual(
    contractCompilerDryRun.sourceAuthorityGapPreview.status,
    'contract-source-authority-gap-preview-pass',
    'contract source authority gap preview status',
  )
  assertEqual(
    contractCompilerDryRun.sourceAuthorityGapPreview.remainingLossCount,
    0,
    'contract source authority remaining loss count',
  )
  assertEqual(
    contractCompilerDryRun.sourceAuthorityGapPreview.nextRecommendedResolver,
    'none',
    'contract source authority next recommended resolver',
  )

  const payload = {
    ok: true,
    command: 'test:read-model:e2e',
    status: 'e2e-smoke-pass',
    tempWorkspaceRemovedAfterRun: true,
    todoSearch: {
      sourceMode: todoSearchGenerated.metadata.readModelSourceMode,
      nodes: todoSearchGenerate.nodeCount,
      edges: todoSearchGenerate.edgeCount,
      coreViews: todoSearchGenerated.coreViewCoverage.length,
      parity: todoSearchCompare.status,
      validation: todoSearchValidate.status,
      projection: todoSearchProjection.status,
    },
    todoApp: {
      policyLevel: 'structure-only',
      sourceMode: todoAppGenerated.metadata.readModelSourceMode,
      authorityStatus: todoAppGenerated.metadata.graphSourceAuthorityStatus,
      nodes: todoAppGenerate.nodeCount,
      edges: todoAppGenerate.edgeCount,
      coreViews: todoAppGenerated.coreViewCoverage.length,
      validation: todoAppValidate.status,
      projection: todoAppProjection.status,
      projectionMode: todoAppProjection.contractMode,
    },
    validateAll: {
      status: validateAll.status,
      aggregateStatus: validateAll.aggregateStatus,
      sliceCount: validateAll.sliceCount,
    },
    graphSourceTransition: {
      status: transitionStatus.status,
      sourceDirection: transitionStatus.sourceDirection,
      treeNativeRole: transitionStatus.treeNativeRole,
      repoWidePromotion: transitionStatus.repoWideBoundaries.repoWidePromotion,
      treeNativeRetirement: transitionStatus.repoWideBoundaries.treeNativeRetirement,
      retirementReadinessStatus: transitionStatus.retirementReadinessSummary.status,
      todoSearchRetirementReadiness: todoSearchTransition.retirementReadiness.status,
      todoAppRetirementReadiness: todoAppTransition.retirementReadiness.status,
      retirementApprovalPackages: {
        todoSearch: todoSearchRetirementPackage.status,
        todoApp: todoAppRetirementPackage.status,
        repoWide: repoWideRetirementPackage.status,
      },
    },
    candidateObservation: {
      status: candidateObservation.status,
      separated: true,
    },
    intentReport: {
      status: intentReport.status,
      projectedFixtureCount: intentReport.projectedFixtureCount,
      edgeIntentCount: intentReport.edgeIntentCount,
      claimCount: intentReport.claimCount,
      classificationCount: intentReport.classificationCount,
      anchorCount: intentReport.anchorCount,
      missingClassificationCount: intentReport.missingClassificationCount,
      missingAnchorCount: intentReport.missingAnchorCount,
      fixtureKinds: intentReport.fixtures.map((entry) => entry.sourceExampleKind),
      separatedFromValidateAll: true,
    },
    compilerBoundary: {
      status: compilerBoundary.status,
      taskRegistryStatus: compilerBoundary.taskRegistryStatus,
      contractSchemaStatus: compilerBoundary.contractSchemaStatus,
      contractValidatorStatus: compilerBoundary.contractValidatorStatus,
      dryRunContractStatus: compilerBoundary.dryRunContractStatus,
      compilerRequiredTaskCount: compilerBoundary.taskCounts.compilerRequired,
      aiAdvisoryTaskCount: compilerBoundary.taskCounts.aiAdvisory,
      dryRunChangeId: compilerBoundary.dryRunContract.changeId,
      requiredCheckCount: compilerBoundary.dryRunContract.requiredCheckCount,
      requiredEvidenceCount: compilerBoundary.dryRunContract.requiredEvidenceCount,
      nonEnforcing: true,
    },
    compilerInputModel: {
      status: compilerInputModel.status,
      inputSchemaStatus: compilerInputModel.inputSchemaStatus,
      dryRunInputStatus: compilerInputModel.dryRunInputStatus,
      dryRunChangeId: compilerInputModel.dryRunInput.changeId,
      graphSnapshotArtifactCount: compilerInputModel.dryRunInput.graphSnapshotArtifactCount,
      policyCount: compilerInputModel.dryRunInput.policyCount,
      evidenceEntryCount: compilerInputModel.dryRunInput.evidenceEntryCount,
      targetScopeCandidateCount: compilerInputModel.dryRunInput.targetScopeCandidateCount,
      riskSourceCount: compilerInputModel.dryRunInput.riskSourceCount,
      nonExecuting: true,
    },
    contractCompilerDryRun: {
      status: contractCompilerDryRun.status,
      inputModelStatus: contractCompilerDryRun.inputModelStatus,
      candidateStatus: contractCompilerDryRun.candidateStatus,
      dryRunChangeId: contractCompilerDryRun.candidate.changeId,
      requiredCheckCount: contractCompilerDryRun.candidate.requiredCheckCount,
      requiredEvidenceCount: contractCompilerDryRun.candidate.requiredEvidenceCount,
      outputCandidate: contractCompilerDryRun.paths.outputCandidate,
      candidateDiffStatus: contractCompilerDryRun.candidateDiff.status,
      candidateDiffReviewStatus: contractCompilerDryRun.candidateDiff.reviewStatus,
      candidateEquivalenceStatus: contractCompilerDryRun.candidateDiff.equivalenceStatus,
      compilerPromotionReadiness: contractCompilerDryRun.candidateDiff.compilerPromotionReadiness,
      promotionReadiness: contractCompilerDryRun.candidateDiff.promotionReadiness,
      highestReviewSeverity: contractCompilerDryRun.candidateDiff.highestReviewSeverity,
      semanticClassificationCounts: contractCompilerDryRun.candidateDiff.semanticClassificationCounts,
      semanticDiffRuleCoverage: contractCompilerDryRun.candidateDiff.semanticDiffRuleCoverage,
      v01CloseoutStatus: contractCompilerDryRun.candidateDiff.v01CloseoutStatus,
      semanticDiffUnknownsStatus: contractCompilerDryRun.candidateDiff.semanticDiffUnknownsStatus,
      semanticDiffUnknownsResolved: contractCompilerDryRun.candidateDiff.semanticDiffUnknownsResolved,
      semanticDiffCoverageComplete: contractCompilerDryRun.candidateDiff.semanticDiffCoverageComplete,
      equivalencePolicy: contractCompilerDryRun.candidateDiff.equivalencePolicy,
      equivalenceProven: contractCompilerDryRun.candidateDiff.equivalenceProven,
      outputRequirementSourceAuthorityPreview: contractCompilerDryRun.outputRequirementSourceAuthorityPreview,
      outputRequirementSourceAuthorityPreviewPath: contractCompilerDryRun.paths.outputRequirementSourceAuthorityPreview,
      sourceAuthorityGapPreview: contractCompilerDryRun.sourceAuthorityGapPreview,
      sourceAuthorityGapPreviewPath: contractCompilerDryRun.paths.sourceAuthorityGapPreview,
      promotionReview: contractCompilerDryRun.promotionReview,
      promotionReviewPacketPath: contractCompilerDryRun.paths.promotionReviewPacket,
      differingFieldCount: contractCompilerDryRun.candidateDiff.differingFieldCount,
      diffReport: contractCompilerDryRun.paths.diffReport,
      nonExecuting: true,
    },
  }

  if (outputPath) {
    mkdirSync(dirname(resolve(outputPath)), { recursive: true })
    writeFileSync(resolve(outputPath), `${JSON.stringify(payload, null, 2)}\n`)
  }

  console.log(JSON.stringify(payload, null, 2))
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
