import {
  getSliceReadModelProfile,
  loadGraphSourceProjectionArtifact,
  loadReadModelSliceRegistry,
  loadStructureOnlyGraphSourceCandidateProjectionArtifact,
  todoAppDevviewRunStructureOnlyProfile,
  todoSearchReadModelProfile,
  type ReadModelSliceRegistryProfile,
  type SliceReadModelConfig,
} from './read-model-evidence.js'

type ProjectionNode = {
  id: string
  nodeKind: string
  title: string
  status: string
  sourceArtifact: string
  viewScopedTags: string[]
  includedInViewIds: string[]
}

type ProjectionArtifact = {
  metadata: {
    artifactRole: string
    sourceArtifact: string
    sourceSlice: string
    sourceProfile: string
    projectionBoundary: string
  }
  nodes: ProjectionNode[]
  edges: unknown[]
  coreViewCoverage: unknown[]
  fallbackReferences: string[]
  retainedCompatibilityArtifacts: string[]
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  userAcceptanceBoundary: string
}

export interface GraphExecutionContractReport {
  version: '0.1.0-graph-native-execution-contract-report'
  status: 'report-only'
  contractRole: 'graph-native-execution-contract-first-surface'
  source: {
    profileId: string
    displayName: string
    sourceSlice: string
    policyLevel: SliceReadModelConfig['policyLevel']
    sourceLayout: SliceReadModelConfig['sourceLayout']
    graphSourceArtifact: string
    readModelProjection: string
    projectionArtifactRole: string
  }
  selectedSliceSummary: {
    nodeCount: number
    edgeCount: number
    coreViewCount: number
    expectedCounts: SliceReadModelConfig['expectedCounts']
    retainedWarnings: string[]
  }
  sourceAuthorityBoundary: string
  nonPromotionStatement: string
  userAcceptanceBoundary: string
  references: {
    productNodeIds: string[]
    acceptanceCriteriaIds: string[]
    workNodeIds: string[]
    testNodeIds: string[]
    evidenceNodeIds: string[]
    acceptanceNodeIds: string[]
  }
  executableWorkNodes: Array<{
    id: string
    nodeKind: string
    title: string
    status: string
    sourceArtifact: string
    scopeTags: string[]
  }>
  verificationRequirements: {
    testNodeIds: string[]
    evidenceNodeIds: string[]
    requiredCommands: string[]
    requiredArtifacts: Record<string, string>
    optionalArtifacts: Record<string, string>
  }
  fileChangeGuardContract: {
    expectedFiles: string[]
    forbiddenFiles: string[]
    expectedSharedFiles: string[]
    sourceFiles: string[]
    note: string
  }
  commandPlan: {
    readModelCommands: string[]
    compatibilityExecutionCommands: string[]
    sequentialDefault: true
  }
  escalationTriggers: string[]
  compatibility: {
    acepRemainsExecutionPackagingPath: true
    note: string
    retainedCompatibilityArtifacts: string[]
    fallbackReferences: string[]
  }
  limitations: string[]
}

export async function buildGraphExecutionContractReport(
  root: string,
  slice: string,
): Promise<GraphExecutionContractReport> {
  const profile = getSliceReadModelProfile(slice)
  const registry = await loadReadModelSliceRegistry(root)
  const registryProfile = registry.profiles.find((entry) => entry.profileId === profile.profileId)
  if (!registryProfile) {
    throw new Error(`Read-model registry does not include configured profile ${profile.profileId}.`)
  }

  const graphSourceArtifact = registrySliceArtifact(
    registryProfile,
    requiredOptionalArtifact(registryProfile, 'graphSource'),
  )
  const readModelProjection = registrySliceArtifact(
    registryProfile,
    requiredOptionalArtifact(registryProfile, 'graphSourceProjection'),
  )
  const projection = await loadProjection(root, profile, readModelProjection, graphSourceArtifact)
  const executableWorkNodes = selectExecutableWorkNodes(profile, projection.nodes)

  return {
    version: '0.1.0-graph-native-execution-contract-report',
    status: 'report-only',
    contractRole: 'graph-native-execution-contract-first-surface',
    source: {
      profileId: profile.profileId,
      displayName: profile.displayName,
      sourceSlice: profile.supportedSlice,
      policyLevel: profile.policyLevel,
      sourceLayout: profile.sourceLayout,
      graphSourceArtifact,
      readModelProjection,
      projectionArtifactRole: projection.metadata.artifactRole,
    },
    selectedSliceSummary: {
      nodeCount: projection.nodes.length,
      edgeCount: projection.edges.length,
      coreViewCount: projection.coreViewCoverage.length,
      expectedCounts: profile.expectedCounts,
      retainedWarnings: registryProfile.retainedWarnings,
    },
    sourceAuthorityBoundary: projection.sourceAuthorityBoundary,
    nonPromotionStatement: projection.nonPromotionStatement,
    userAcceptanceBoundary: projection.userAcceptanceBoundary,
    references: {
      productNodeIds: idsByPrefix(projection.nodes, 'PT-'),
      acceptanceCriteriaIds: idsByPrefix(projection.nodes, 'AC-'),
      workNodeIds: idsByPrefix(projection.nodes, 'WT-'),
      testNodeIds: idsByPrefix(projection.nodes, 'TT-'),
      evidenceNodeIds: idsByPrefix(projection.nodes, 'EV-'),
      acceptanceNodeIds: idsByPrefixes(projection.nodes, ['AT-', 'ACCEPT-']),
    },
    executableWorkNodes,
    verificationRequirements: {
      testNodeIds: idsByPrefix(projection.nodes, 'TT-'),
      evidenceNodeIds: idsByPrefix(projection.nodes, 'EV-'),
      requiredCommands: registryProfile.requiredCommands.map((command) => `graph read-model ${command}`),
      requiredArtifacts: registryProfile.requiredArtifacts,
      optionalArtifacts: registryProfile.optionalArtifacts,
    },
    fileChangeGuardContract: {
      expectedFiles: [],
      forbiddenFiles: [],
      expectedSharedFiles: [],
      sourceFiles: profile.sourceArtifactRelativePaths.map((entry) =>
        isSliceRelativeArtifact(entry) ? `${profile.supportedSlice}/${entry}` : entry,
      ),
      note: 'This first surface reports source files only. Concrete expectedFiles/forbiddenFiles remain in ACEP or tree-native Work artifacts until graph-native execution contracts are promoted.',
    },
    commandPlan: {
      readModelCommands: [
        `node dist/cli/index.js graph read-model validate --slice ${profile.supportedSlice} --json`,
        'node dist/cli/index.js graph read-model validate --all --json',
        'node dist/cli/index.js graph read-model report-health --json',
      ],
      compatibilityExecutionCommands: ['devview acep check', 'devview acep ready', 'devview execution start'],
      sequentialDefault: true,
    },
    escalationTriggers: [
      'product meaning change',
      'acceptance criteria change',
      'scope boundary change',
      'unexpected file change',
      'verification strategy change',
      'source-authority or projection drift',
      'required evidence missing or stale',
      'review/user acceptance disagreement',
    ],
    compatibility: {
      acepRemainsExecutionPackagingPath: true,
      note: 'ACEP, codex-execution-pack, Cycle Contracts, Node Execution Contracts, and task-card views remain the compatibility execution packaging path. This report does not replace or weaken them.',
      retainedCompatibilityArtifacts: projection.retainedCompatibilityArtifacts,
      fallbackReferences: projection.fallbackReferences,
    },
    limitations: [
      'report-only first implementation',
      'does not mutate .devview active state',
      'does not create a required validation gate',
      'does not expand source authority',
      'does not replace user acceptance',
      'does not retire ACEP or tree-native compatibility artifacts',
    ],
  }
}

async function loadProjection(
  root: string,
  profile: SliceReadModelConfig,
  projectionPath: string,
  graphSourcePath: string,
): Promise<ProjectionArtifact> {
  if (profile.profileId === todoSearchReadModelProfile.profileId) {
    return loadGraphSourceProjectionArtifact(root, projectionPath, graphSourcePath)
  }
  if (profile.profileId === todoAppDevviewRunStructureOnlyProfile.profileId) {
    return loadStructureOnlyGraphSourceCandidateProjectionArtifact(root, projectionPath, graphSourcePath)
  }
  throw new Error(`No graph-native execution contract projection loader is configured for ${profile.profileId}.`)
}

function selectExecutableWorkNodes(
  profile: SliceReadModelConfig,
  nodes: ProjectionNode[],
): GraphExecutionContractReport['executableWorkNodes'] {
  const executableIds = new Set([profile.ids.work, profile.ids.cycleContract, profile.ids.nodeExecutionContract])
  return nodes
    .filter(
      (node) =>
        executableIds.has(node.id) ||
        node.viewScopedTags.includes('target') ||
        node.includedInViewIds.includes('scope-execution-view'),
    )
    .map((node) => ({
      id: node.id,
      nodeKind: node.nodeKind,
      title: node.title,
      status: node.status,
      sourceArtifact: node.sourceArtifact,
      scopeTags: node.viewScopedTags,
    }))
}

function idsByPrefix(nodes: ProjectionNode[], prefix: string): string[] {
  return idsByPrefixes(nodes, [prefix])
}

function idsByPrefixes(nodes: ProjectionNode[], prefixes: string[]): string[] {
  return [...new Set(nodes.map((node) => node.id).filter((id) => prefixes.some((prefix) => id.startsWith(prefix))))]
}

function requiredOptionalArtifact(registryProfile: ReadModelSliceRegistryProfile, key: string): string {
  const artifact = registryProfile.optionalArtifacts[key]
  if (!artifact) {
    throw new Error(`Read-model registry profile ${registryProfile.profileId} must declare optionalArtifacts.${key}.`)
  }
  return artifact
}

function registrySliceArtifact(registryProfile: ReadModelSliceRegistryProfile, artifactPath: string): string {
  return `${registryProfile.sourceSlice}/${artifactPath}`
}

function isSliceRelativeArtifact(relativePathFromProfile: string): boolean {
  return !relativePathFromProfile.startsWith('docs/') && !relativePathFromProfile.startsWith('examples/')
}
