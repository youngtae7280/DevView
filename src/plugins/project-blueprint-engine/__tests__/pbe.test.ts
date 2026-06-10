import { describe, expect, it } from 'vitest'
import {
  addChildNodes,
  createProjectWithRoot,
} from '../../../domain/tree'
import type { ProgramNode, Project } from '../../../domain/types'
import { MockLlmProvider } from '../../../providers/llm/mockProvider'
import { REQUIRED_ACEP_FILES } from '../acep/acep-templates'
import {
  getAceFileContent,
  writeBundlePreview,
  writeVirtualFileList,
} from '../acep/file-pack-writer'
import { writeManifestJson } from '../acep/manifest-writer'
import { writeMarkdownBundle } from '../acep/markdown-writer'
import {
  completeRpdAndStartWpd,
  completeVdAndGenerateAcep,
  completeWpdAndStartVd,
  ensureProjectBlueprint,
  generateAcceptancePlan,
  generateImplementationRoadmap,
  generateLeafVerificationDesigns,
  generateLeafWorkDesigns,
  getRpdCompletionIssues,
  synthesizeParentVerificationDesigns,
  synthesizeParentWorkDesigns,
} from '../plugin'
import { createNodeContext } from '../shared/node-context'

describe('Project Blueprint Engine flow', () => {
  it('blocks RPD completion when there is no confirmed leaf', () => {
    const project = createProjectWithRoot('Build inventory management software')

    expect(getRpdCompletionIssues(project).join('\n')).toContain(
      'confirmed_leaf',
    )
    expect(() => completeRpdAndStartWpd(project)).toThrow(/confirmed_leaf/)
  })

  it('allows RPD completion when at least one confirmed leaf exists', () => {
    const project = createConfirmedLeafProject()
    const nextProject = completeRpdAndStartWpd(project)

    expect(ensureProjectBlueprint(nextProject).status).toBe('wpd_in_progress')
  })

  it('generates WPD, VD, and ACEP with the Mock Provider', async () => {
    const provider = new MockLlmProvider()
    let project = completeRpdAndStartWpd(createConfirmedLeafProject())

    project = await generateLeafWorkDesigns(project, provider)
    expect(Object.values(ensureProjectBlueprint(project).workDesigns)).toHaveLength(2)

    project = await synthesizeParentWorkDesigns(project, provider)
    expect(
      ensureProjectBlueprint(project).workDesigns[project.rootNodeId!],
    ).toBeDefined()

    project = await generateImplementationRoadmap(project, provider)
    expect(ensureProjectBlueprint(project).implementationRoadmap).toBeDefined()

    project = completeWpdAndStartVd(project)
    project = await generateLeafVerificationDesigns(project, provider)
    expect(
      Object.values(ensureProjectBlueprint(project).verificationDesigns).filter(
        (design) => design.type === 'leaf',
      ),
    ).toHaveLength(2)

    project = await synthesizeParentVerificationDesigns(project, provider)
    project = await generateAcceptancePlan(project, provider)
    expect(ensureProjectBlueprint(project).acceptancePlan).toBeDefined()

    project = await completeVdAndGenerateAcep(project, provider)
    const acep = ensureProjectBlueprint(project).acep

    expect(acep).toBeDefined()
    expect(ensureProjectBlueprint(project).status).toBe('acep_ready')

    const filePaths = new Set(acep!.files.map((file) => file.path))
    REQUIRED_ACEP_FILES.forEach((path) => expect(filePaths.has(path)).toBe(true))
    acep!.manifest.tasks.forEach((task) => {
      expect(filePaths.has(task.file)).toBe(true)
    })
    acep!.taskCards.forEach((taskCard) => {
      expect(taskCard.goal).toBeTruthy()
      expect(taskCard.scope.length).toBeGreaterThan(0)
      expect(taskCard.nonScope.length).toBeGreaterThan(0)
      expect(taskCard.acceptanceCriteria.length).toBeGreaterThan(0)
      expect(taskCard.validationPlan.length).toBeGreaterThan(0)
      expect(taskCard.stopConditions.length).toBeGreaterThan(0)
    })
    expect(acep!.topLevelPrompt).toContain('.pbe/codex-execution-pack')
  })

  it('exports ACEP markdown, manifest JSON, virtual file list, and bundle preview text', async () => {
    const provider = new MockLlmProvider()
    let project = completeRpdAndStartWpd(createConfirmedLeafProject())

    project = await generateLeafWorkDesigns(project, provider)
    project = await synthesizeParentWorkDesigns(project, provider)
    project = await generateImplementationRoadmap(project, provider)
    project = completeWpdAndStartVd(project)
    project = await generateLeafVerificationDesigns(project, provider)
    project = await synthesizeParentVerificationDesigns(project, provider)
    project = await generateAcceptancePlan(project, provider)
    project = await completeVdAndGenerateAcep(project, provider)

    const acep = ensureProjectBlueprint(project).acep!
    const markdown = writeMarkdownBundle(acep)
    const manifestJson = writeManifestJson(acep.manifest)
    const fileList = writeVirtualFileList(acep)
    const bundlePreview = writeBundlePreview(acep)
    const readmeContent = getAceFileContent(acep, '00-readme.md')

    expect(markdown).toContain('Autonomous Codex Execution Pack')
    expect(JSON.parse(manifestJson).tasks).toHaveLength(2)
    expect(fileList).toContain('execution-manifest.json')
    expect(bundlePreview).toContain('## Files')
    expect(bundlePreview).toContain('07-task-cards/task-001.md')
    expect(readmeContent).toContain('Autonomous Codex Execution Pack')
  })

  it('creates shared node context for plugin engines', () => {
    const project = createConfirmedLeafProject()
    const context = createNodeContext(project, 'node_inbound')

    expect(context?.node.title).toBe('Inbound stock')
    expect(context?.parent?.id).toBe(project.rootNodeId)
    expect(context?.children).toHaveLength(0)
    expect(context?.facts).toEqual([])
  })
})

function createConfirmedLeafProject(): Project {
  let project = createProjectWithRoot('Build inventory management software')
  const root = project.nodes[project.rootNodeId!]
  const timestamp = '2026-06-09T00:00:00.000Z'
  const children: ProgramNode[] = [
    {
      id: 'node_inbound',
      parentId: root.id,
      title: 'Inbound stock',
      description: 'Record incoming stock and update inventory quantity.',
      depth: 1,
      status: 'confirmed_leaf',
      children: [],
      summary: 'Operators record inbound stock and see quantity increase.',
      interviewSessionIds: [],
      aiHints: { inferredComplexity: 'medium' },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'node_outbound',
      parentId: root.id,
      title: 'Outbound stock',
      description: 'Record outgoing stock and prevent negative inventory.',
      depth: 1,
      status: 'confirmed_leaf',
      children: [],
      summary: 'Operators record outbound stock and cannot create negative stock.',
      interviewSessionIds: [],
      aiHints: { inferredComplexity: 'high' },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  project = {
    ...project,
    nodes: {
      ...project.nodes,
      [root.id]: {
        ...root,
        status: 'ready_to_decompose',
      },
    },
  }

  return addChildNodes(project, root.id, children)
}
