import type { GeneratedArtifacts, Project } from '../domain/types'

export function downloadTextFile(
  contents: string,
  filename: string,
  type = 'text/plain;charset=utf-8',
) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function exportProjectJson(project: Project) {
  downloadTextFile(
    JSON.stringify(project, null, 2),
    'project-blueprint-engine-project.json',
    'application/json;charset=utf-8',
  )
}

export function artifactsToMarkdown(artifacts: GeneratedArtifacts) {
  return [
    artifacts.productCharter,
    artifacts.requirementTree,
    artifacts.workUnitList,
    artifacts.architectureDraft,
    artifacts.implementationPlan,
    artifacts.verificationPlan,
    artifacts.aiCodingPrompt,
    '',
    `Generated at: ${artifacts.generatedAt}`,
  ].join('\n\n---\n\n')
}

export function exportArtifactsMarkdown(project: Project) {
  if (!project.artifacts) {
    return false
  }

  downloadTextFile(
    artifactsToMarkdown(project.artifacts),
    'program-design-package.md',
    'text/markdown;charset=utf-8',
  )

  return true
}
