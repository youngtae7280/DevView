import { describe, expect, it } from 'vitest'
import {
  addChildNodes,
  confirmLeaf,
  createProjectWithRoot,
  createRootNode,
  getLatestSession,
  getProjectWarnings,
  migrateLegacyNodeStatus,
  normalizeProject,
  startInterviewSession,
  submitInterviewAnswer,
  validateTree,
} from '../tree'
import { nextStatusForAction } from '../stateMachine'
import { MockLlmProvider } from '../../providers/llm/mockProvider'

describe('core model', () => {
  it('creates a root node that starts in the interview-needed state', () => {
    const node = createRootNode('사내 재고 관리 프로그램 만들어줘')

    expect(node.depth).toBe(0)
    expect(node.status).toBe('needs_interview')
    expect(node.description).toContain('재고')
    expect(node.interviewSessionIds).toHaveLength(0)
  })

  it('starts a one-question interview session', async () => {
    const provider = new MockLlmProvider()
    let project = createProjectWithRoot('사내 재고 관리 프로그램 만들어줘')
    const root = project.nodes[project.rootNodeId!]
    const question = await provider.generateInitialQuestion({ project, node: root })

    project = startInterviewSession(project, root.id, question.question)

    const session = getLatestSession(project, project.nodes[root.id])
    expect(project.nodes[root.id].status).toBe('interviewing')
    expect(session?.messages).toHaveLength(1)
    expect(session?.messages[0].role).toBe('ai')
  })

  it('turns a sufficiently specific answer into ready_to_decompose', async () => {
    const provider = new MockLlmProvider()
    let project = createProjectWithRoot('사내 재고 관리 프로그램 만들어줘')
    const root = project.nodes[project.rootNodeId!]
    const question = await provider.generateInitialQuestion({ project, node: root })

    project = startInterviewSession(project, root.id, question.question)

    const session = getLatestSession(project, project.nodes[root.id])!
    const answer =
      '관리자가 입고 화면에서 품목과 수량을 입력하고 저장하면 재고 수량이 증가한 결과를 확인해야 합니다.'
    const analysis = await provider.analyzeInterviewTurn({
      project,
      node: project.nodes[root.id],
      session: {
        ...session,
        messages: [
          ...session.messages,
          {
            id: 'preview',
            role: 'user',
            content: answer,
            createdAt: '2026-06-09T00:00:00.000Z',
          },
        ],
      },
    })

    project = submitInterviewAnswer(project, session.id, {
      answer,
      ...analysis,
    })

    expect(project.nodes[root.id].status).toBe('ready_to_decompose')
    expect(getLatestSession(project, project.nodes[root.id])?.extractedFacts).toHaveLength(1)
  })

  it('keeps asking one next question when the answer is vague', async () => {
    const provider = new MockLlmProvider()
    let project = createProjectWithRoot('보고서 프로그램 만들어줘')
    const root = project.nodes[project.rootNodeId!]
    const question = await provider.generateInitialQuestion({ project, node: root })

    project = startInterviewSession(project, root.id, question.question)

    const session = getLatestSession(project, project.nodes[root.id])!
    const analysis = await provider.analyzeInterviewTurn({
      project,
      node: project.nodes[root.id],
      session: {
        ...session,
        messages: [
          ...session.messages,
          {
            id: 'preview',
            role: 'user',
            content: '잘 모르겠어',
            createdAt: '2026-06-09T00:00:00.000Z',
          },
        ],
      },
    })

    project = submitInterviewAnswer(project, session.id, {
      answer: '잘 모르겠어',
      ...analysis,
    })

    const nextSession = getLatestSession(project, project.nodes[root.id])
    expect(project.nodes[root.id].status).toBe('interviewing')
    expect(nextSession?.messages.filter((message) => message.role === 'ai')).toHaveLength(2)
  })

  it('decomposes only after a node is ready and children start as needs_interview', async () => {
    const provider = new MockLlmProvider()
    let project = createProjectWithRoot('사내 재고 관리 프로그램 만들어줘')
    const root = project.nodes[project.rootNodeId!]

    project = {
      ...project,
      nodes: {
        ...project.nodes,
        [root.id]: {
          ...root,
          status: 'ready_to_decompose',
          summary: '관리자가 재고 상황을 확인하고 입출고 결과를 볼 수 있어야 한다.',
        },
      },
    }

    const output = await provider.decomposeNode({
      project,
      node: project.nodes[root.id],
    })
    project = addChildNodes(project, root.id, output.children)

    expect(output.children.length).toBeGreaterThan(2)
    expect(project.nodes[root.id].status).toBe('expanded')
    expect(output.children.every((child) => child.status === 'needs_interview')).toBe(true)
    expect(validateTree(project).valid).toBe(true)
  })

  it('confirms a node as a final requirement leaf', () => {
    let project = createProjectWithRoot('보고서 프로그램 만들어줘')
    const rootId = project.rootNodeId!

    project = confirmLeaf(project, rootId)

    expect(project.nodes[rootId].status).toBe('confirmed_leaf')
  })

  it('documents the simplified state transitions', () => {
    expect(nextStatusForAction('start_interview')).toBe('interviewing')
    expect(nextStatusForAction('submit_answer')).toBe('ready_to_decompose')
    expect(nextStatusForAction('decompose')).toBe('expanded')
    expect(nextStatusForAction('confirm_leaf')).toBe('confirmed_leaf')
  })

  it('migrates legacy statuses into the five-state model', () => {
    expect(migrateLegacyNodeStatus('raw')).toBe('needs_interview')
    expect(migrateLegacyNodeStatus('can_decompose')).toBe('ready_to_decompose')
    expect(migrateLegacyNodeStatus('work_unit')).toBe('confirmed_leaf')
    expect(migrateLegacyNodeStatus('out_of_scope')).toBe('confirmed_leaf')
  })

  it('generates artifacts with new status warnings', async () => {
    const provider = new MockLlmProvider()
    const project = createProjectWithRoot('사내 재고 관리 프로그램 만들어줘')
    const warnings = getProjectWarnings(project)
    const artifacts = await provider.generateArtifacts({ project })

    expect(warnings.length).toBeGreaterThan(0)
    expect(artifacts.artifacts.productCharter).toContain('Product Charter')
    expect(artifacts.artifacts.workUnitList).toContain('Confirmed Requirement Leaves')
  })

  it('normalizes old saved project JSON', () => {
    const normalized = normalizeProject({
      id: 'project_1',
      title: 'Legacy',
      rootNodeId: 'node_1',
      nodes: {
        node_1: {
          id: 'node_1',
          parentId: null,
          title: 'Legacy root',
          description: 'Old shape',
          depth: 0,
          status: 'work_unit',
          priority: 'critical',
          riskLevel: 'high',
          children: [],
          createdAt: '2026-06-09T00:00:00.000Z',
          updatedAt: '2026-06-09T00:00:00.000Z',
        },
      },
      edges: [],
      artifacts: null,
      createdAt: '2026-06-09T00:00:00.000Z',
      updatedAt: '2026-06-09T00:00:00.000Z',
    })

    expect(normalized?.nodes.node_1.status).toBe('confirmed_leaf')
    expect(normalized?.nodes.node_1.aiHints?.caution).toContain('Legacy')
  })
})
