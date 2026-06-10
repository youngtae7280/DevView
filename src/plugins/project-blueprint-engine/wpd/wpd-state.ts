import type { ProjectBlueprint } from '../types'

export function withWorkDesigns(
  blueprint: ProjectBlueprint,
  workDesigns: ProjectBlueprint['workDesigns'],
) {
  return {
    ...blueprint,
    workDesigns,
  }
}
