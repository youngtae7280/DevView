import type { Project } from '../../domain/types'
import { getRpdCompletionIssues } from './rpd/rpd-engine'
import { createProjectBlueprintFromRpd } from './rpd/rpd-state'
import { createPbeId, nowIso } from './shared/ids'
import type { PbeLlmProvider } from './shared/llm-provider'
import {
  validateAcePack,
  validateVerificationDesign,
  validateWorkDesign,
} from './shared/schema-validation'
import {
  getConfirmedRequirementLeaves,
  getNodeFacts,
  getNodesBottomUp,
} from './shared/tree-context'
import type { ProjectBlueprint, ProjectBlueprintStatus } from './types'

export function ensureProjectBlueprint(project: Project): ProjectBlueprint {
  return createProjectBlueprintFromRpd(project, project.pbe)
}

export { canCompleteRpd, getRpdCompletionIssues } from './rpd/rpd-engine'

export function setProjectBlueprint(
  project: Project,
  blueprint: ProjectBlueprint,
): Project {
  return {
    ...project,
    pbe: {
      ...blueprint,
      requirementNodes: project.nodes,
      interviewSessions: project.interviewSessions,
      updatedAt: nowIso(),
    },
    updatedAt: nowIso(),
  }
}

export function getProjectBlueprintStatus(project: Project): ProjectBlueprintStatus {
  return ensureProjectBlueprint(project).status
}

export function completeRpdAndStartWpd(project: Project) {
  const issues = getRpdCompletionIssues(project)

  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }

  return setProjectBlueprint(project, {
    ...ensureProjectBlueprint(project),
    status: 'wpd_in_progress',
  })
}

export async function generateLeafWorkDesigns(
  project: Project,
  provider: PbeLlmProvider,
) {
  let blueprint = ensureProjectBlueprint(project)
  const workDesigns = { ...blueprint.workDesigns }

  for (const node of getConfirmedRequirementLeaves(project)) {
    if (workDesigns[node.id]) {
      continue
    }

    workDesigns[node.id] = validateWorkDesign(
      await provider.generateLeafWorkDesign({
        project,
        node,
        facts: getNodeFacts(project, node),
      }),
    )
  }

  blueprint = {
    ...blueprint,
    status: 'wpd_in_progress',
    workDesigns,
  }

  return setProjectBlueprint(project, blueprint)
}

export async function synthesizeParentWorkDesigns(
  project: Project,
  provider: PbeLlmProvider,
) {
  let blueprint = ensureProjectBlueprint(project)
  const workDesigns = { ...blueprint.workDesigns }

  for (const node of getNodesBottomUp(project)) {
    if (node.children.length === 0 || workDesigns[node.id]) {
      continue
    }

    const childDesigns = node.children
      .map((childId) => workDesigns[childId])
      .filter(Boolean)

    if (childDesigns.length === 0) {
      continue
    }

    workDesigns[node.id] = validateWorkDesign(
      await provider.synthesizeParentWorkDesign({
        project,
        node,
        childDesigns,
      }),
    )
  }

  blueprint = {
    ...blueprint,
    status: 'wpd_in_progress',
    workDesigns,
  }

  return setProjectBlueprint(project, blueprint)
}

export async function generateImplementationRoadmap(
  project: Project,
  provider: PbeLlmProvider,
) {
  const rootNode = project.rootNodeId ? project.nodes[project.rootNodeId] : null

  if (!rootNode) {
    throw new Error('Root node is required for the implementation roadmap.')
  }

  const blueprint = ensureProjectBlueprint(project)
  const implementationRoadmap = await provider.generateImplementationRoadmap({
    project,
    rootNode,
    workDesigns: blueprint.workDesigns,
  })

  return setProjectBlueprint(project, {
    ...blueprint,
    status: 'wpd_in_progress',
    implementationRoadmap,
  })
}

export function getWpdCompletionIssues(project: Project) {
  const blueprint = ensureProjectBlueprint(project)
  const issues: string[] = []

  getConfirmedRequirementLeaves(project).forEach((node) => {
    if (!blueprint.workDesigns[node.id]) {
      issues.push(`Missing leaf WorkDesign for ${node.title}.`)
    }
  })

  Object.values(blueprint.workDesigns).forEach((design) => {
    try {
      validateWorkDesign(design)
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error))
    }
  })

  if (!blueprint.implementationRoadmap) {
    issues.push('ImplementationRoadmap is missing.')
  }

  return issues
}

export function completeWpdAndStartVd(project: Project) {
  const issues = getWpdCompletionIssues(project)

  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }

  return setProjectBlueprint(project, {
    ...ensureProjectBlueprint(project),
    status: 'vd_in_progress',
  })
}

export async function generateLeafVerificationDesigns(
  project: Project,
  provider: PbeLlmProvider,
) {
  let blueprint = ensureProjectBlueprint(project)
  const verificationDesigns = { ...blueprint.verificationDesigns }

  for (const node of getConfirmedRequirementLeaves(project)) {
    if (verificationDesigns[node.id]) {
      continue
    }

    const workDesign = blueprint.workDesigns[node.id]
    if (!workDesign) {
      continue
    }

    verificationDesigns[node.id] = validateVerificationDesign(
      await provider.generateLeafVerificationDesign({
        project,
        node,
        workDesign,
      }),
    )
  }

  blueprint = {
    ...blueprint,
    status: 'vd_in_progress',
    verificationDesigns,
  }

  return setProjectBlueprint(project, blueprint)
}

export async function synthesizeParentVerificationDesigns(
  project: Project,
  provider: PbeLlmProvider,
) {
  let blueprint = ensureProjectBlueprint(project)
  const verificationDesigns = { ...blueprint.verificationDesigns }

  for (const node of getNodesBottomUp(project)) {
    if (node.children.length === 0 || verificationDesigns[node.id]) {
      continue
    }

    const childDesigns = node.children
      .map((childId) => verificationDesigns[childId])
      .filter(Boolean)

    if (childDesigns.length === 0) {
      continue
    }

    verificationDesigns[node.id] = validateVerificationDesign(
      await provider.synthesizeParentVerificationDesign({
        project,
        node,
        childDesigns,
        workDesign: blueprint.workDesigns[node.id],
      }),
    )
  }

  blueprint = {
    ...blueprint,
    status: 'vd_in_progress',
    verificationDesigns,
  }

  return setProjectBlueprint(project, blueprint)
}

export async function generateAcceptancePlan(
  project: Project,
  provider: PbeLlmProvider,
) {
  const rootNode = project.rootNodeId ? project.nodes[project.rootNodeId] : null

  if (!rootNode) {
    throw new Error('Root node is required for the acceptance plan.')
  }

  const blueprint = ensureProjectBlueprint(project)
  const acceptancePlan = await provider.generateAcceptancePlan({
    project,
    rootNode,
    verificationDesigns: blueprint.verificationDesigns,
    workDesigns: blueprint.workDesigns,
  })

  return setProjectBlueprint(project, {
    ...blueprint,
    status: 'vd_in_progress',
    acceptancePlan,
  })
}

export function getVdCompletionIssues(project: Project) {
  const blueprint = ensureProjectBlueprint(project)
  const issues: string[] = []

  getConfirmedRequirementLeaves(project).forEach((node) => {
    if (!blueprint.verificationDesigns[node.id]) {
      issues.push(`Missing leaf VerificationDesign for ${node.title}.`)
    }
  })

  Object.values(blueprint.verificationDesigns).forEach((design) => {
    try {
      validateVerificationDesign(design)
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error))
    }
  })

  if (!blueprint.acceptancePlan) {
    issues.push('AcceptancePlan is missing.')
  }

  return issues
}

export async function completeVdAndGenerateAcep(
  project: Project,
  provider: PbeLlmProvider,
) {
  const issues = getVdCompletionIssues(project)

  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }

  const blueprint = ensureProjectBlueprint(project)
  const acep = validateAcePack(
    await provider.generateAutonomousCodexExecutionPack({
      project,
      blueprint,
      autonomyLevel: 'autonomous_until_stop',
    }),
  )

  return setProjectBlueprint(project, {
    ...blueprint,
    status: 'acep_ready',
    acep,
  })
}

export function markAcepExported(project: Project) {
  const blueprint = ensureProjectBlueprint(project)

  if (!blueprint.acep) {
    throw new Error('ACEP must be generated before export can be marked.')
  }

  return setProjectBlueprint(project, {
    ...blueprint,
    status: 'exported',
  })
}

export function createSeedTaskCardId(index: number) {
  return `task-${String(index + 1).padStart(3, '0')}-${createPbeId('seed')}`
}
