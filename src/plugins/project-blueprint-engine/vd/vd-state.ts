import type { ProjectBlueprint } from '../types'

export function withVerificationDesigns(
  blueprint: ProjectBlueprint,
  verificationDesigns: ProjectBlueprint['verificationDesigns'],
) {
  return {
    ...blueprint,
    verificationDesigns,
  }
}
