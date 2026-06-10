import type { Project } from '../../../domain/types'
import { createPbeId, nowIso } from '../shared/ids'
import type { ProjectBlueprint } from '../types'

export function createProjectBlueprintFromRpd(
  project: Project,
  existing?: ProjectBlueprint | null,
): ProjectBlueprint {
  const timestamp = nowIso()

  return {
    id: existing?.id ?? createPbeId('blueprint'),
    name: project.title,
    status: existing?.status ?? 'rpd_in_progress',
    rootNodeId: project.rootNodeId ?? '',
    requirementNodes: project.nodes,
    interviewSessions: project.interviewSessions,
    workDesigns: existing?.workDesigns ?? {},
    verificationDesigns: existing?.verificationDesigns ?? {},
    implementationRoadmap: existing?.implementationRoadmap,
    acceptancePlan: existing?.acceptancePlan,
    acep: existing?.acep,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}
