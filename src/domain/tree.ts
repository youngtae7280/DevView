import type {
  AiHints,
  ExtractedFact,
  GeneratedArtifacts,
  InterviewMessage,
  InterviewSession,
  InterviewTurnDecision,
  NodeStatus,
  ProgramEdge,
  ProgramNode,
  Project,
  ProjectWarning,
} from './types'

export function createId(prefix: string) {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)

  return `${prefix}_${random}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function createEmptyProject(): Project {
  const timestamp = nowIso()

  return {
    id: createId('project'),
    title: 'Untitled Program Design',
    rootNodeId: null,
    nodes: {},
    edges: [],
    interviewSessions: {},
    artifacts: null,
    pbe: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 2,
  }
}

export function summarizeTitle(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  const withoutRequestEnding = trimmed
    .replace(/만들어줘\.?$/i, '')
    .replace(/please build\.?$/i, '')
    .trim()

  if (!withoutRequestEnding) {
    return 'New Program'
  }

  return withoutRequestEnding.length > 40
    ? `${withoutRequestEnding.slice(0, 39)}...`
    : withoutRequestEnding
}

export function createRootNode(prompt: string): ProgramNode {
  const timestamp = nowIso()

  return {
    id: createId('node'),
    parentId: null,
    title: summarizeTitle(prompt),
    description: prompt.trim(),
    depth: 0,
    status: 'needs_interview',
    children: [],
    summary: prompt.trim(),
    userIntent: prompt.trim(),
    interviewSessionIds: [],
    aiHints: {
      suggestedNextAction: 'interview',
      inferredComplexity: 'medium',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createProjectWithRoot(prompt: string): Project {
  const rootNode = createRootNode(prompt)
  const timestamp = nowIso()

  return {
    id: createId('project'),
    title: rootNode.title,
    rootNodeId: rootNode.id,
    nodes: {
      [rootNode.id]: rootNode,
    },
    edges: [],
    interviewSessions: {},
    artifacts: null,
    pbe: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 2,
  }
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    updatedAt: nowIso(),
  }
}

export function touchNode(node: ProgramNode): ProgramNode {
  return {
    ...node,
    updatedAt: nowIso(),
  }
}

export function getNode(project: Project, nodeId: string | null) {
  return nodeId ? project.nodes[nodeId] ?? null : null
}

export function getChildren(project: Project, nodeId: string) {
  const node = project.nodes[nodeId]

  if (!node) {
    return []
  }

  return node.children
    .map((childId) => project.nodes[childId])
    .filter((child): child is ProgramNode => Boolean(child))
}

export function getRootToLeafNodes(project: Project) {
  if (!project.rootNodeId) {
    return []
  }

  const ordered: ProgramNode[] = []
  const visit = (nodeId: string) => {
    const node = project.nodes[nodeId]

    if (!node) {
      return
    }

    ordered.push(node)
    node.children.forEach(visit)
  }

  visit(project.rootNodeId)
  return ordered
}

export function getLeafNodes(project: Project) {
  return getRootToLeafNodes(project).filter((node) => node.children.length === 0)
}

export function getLatestSession(project: Project, node: ProgramNode | null) {
  if (!node || node.interviewSessionIds.length === 0) {
    return null
  }

  const latestId = node.interviewSessionIds[node.interviewSessionIds.length - 1]
  return project.interviewSessions[latestId] ?? null
}

export function addChildNodes(
  project: Project,
  parentId: string,
  children: ProgramNode[],
): Project {
  const parent = project.nodes[parentId]

  if (!parent || children.length === 0) {
    return project
  }

  const childIds = children.map((child) => child.id)
  const childRecords = Object.fromEntries(
    children.map((child) => [child.id, child]),
  )
  const edges: ProgramEdge[] = children.map((child) => ({
    id: createId('edge'),
    source: parentId,
    target: child.id,
    label: `depth ${child.depth}`,
  }))

  return touchProject({
    ...project,
    artifacts: null,
    nodes: {
      ...project.nodes,
      [parentId]: touchNode({
        ...parent,
        children: [...parent.children, ...childIds],
        status: 'expanded',
        aiHints: {
          ...parent.aiHints,
          suggestedNextAction: undefined,
        },
      }),
      ...childRecords,
    },
    edges: [...project.edges, ...edges],
  })
}

export function replaceNode(
  project: Project,
  nodeId: string,
  updater: (node: ProgramNode) => ProgramNode,
) {
  const node = project.nodes[nodeId]

  if (!node) {
    return project
  }

  return touchProject({
    ...project,
    artifacts: null,
    nodes: {
      ...project.nodes,
      [nodeId]: touchNode(updater(node)),
    },
  })
}

export function setNodeStatus(
  project: Project,
  nodeId: string,
  status: NodeStatus,
) {
  return replaceNode(project, nodeId, (node) => ({
    ...node,
    status,
  }))
}

export function updateNodeText(
  project: Project,
  nodeId: string,
  title: string,
  description: string,
) {
  return replaceNode(project, nodeId, (node) => ({
    ...node,
    title,
    description,
  }))
}

export function startInterviewSession(
  project: Project,
  nodeId: string,
  question: string,
): Project {
  const node = project.nodes[nodeId]

  if (!node) {
    return project
  }

  const timestamp = nowIso()
  const message: InterviewMessage = {
    id: createId('message'),
    role: 'ai',
    content: question,
    createdAt: timestamp,
  }
  const session: InterviewSession = {
    id: createId('session'),
    nodeId,
    status: 'active',
    messages: [message],
    extractedFacts: [],
    unresolvedQuestions: [question],
    currentDecision: 'ask_next_question',
    startedAt: timestamp,
    updatedAt: timestamp,
  }

  return touchProject({
    ...project,
    artifacts: null,
    interviewSessions: {
      ...project.interviewSessions,
      [session.id]: session,
    },
    nodes: {
      ...project.nodes,
      [nodeId]: touchNode({
        ...node,
        status: 'interviewing',
        interviewSessionIds: [...node.interviewSessionIds, session.id],
        aiHints: {
          ...node.aiHints,
          suggestedNextAction: undefined,
        },
      }),
    },
  })
}

export type InterviewTurnUpdate = {
  answer: string
  decision: InterviewTurnDecision
  extractedFacts: ExtractedFact[]
  nextQuestion?: string
  nodeSummary?: string
  suggestedNextAction?: AiHints['suggestedNextAction']
  caution?: string
}

export function submitInterviewAnswer(
  project: Project,
  sessionId: string,
  update: InterviewTurnUpdate,
): Project {
  const session = project.interviewSessions[sessionId]
  const node = session ? project.nodes[session.nodeId] : null

  if (!session || !node) {
    return project
  }

  const timestamp = nowIso()
  const userMessage: InterviewMessage = {
    id: createId('message'),
    role: 'user',
    content: update.answer,
    createdAt: timestamp,
  }
  const newFacts = update.extractedFacts.map((fact) => ({
    ...fact,
    sourceMessageId: userMessage.id,
  }))
  const nextMessages = [...session.messages, userMessage]
  const unresolvedQuestions = session.unresolvedQuestions.slice(1)

  if (
    (update.decision === 'ask_next_question' ||
      update.decision === 'needs_clarification') &&
    update.nextQuestion
  ) {
    nextMessages.push({
      id: createId('message'),
      role: 'ai',
      content: update.nextQuestion,
      createdAt: timestamp,
    })
    unresolvedQuestions.push(update.nextQuestion)
  }

  const sessionStatus =
    update.decision === 'ready_to_decompose'
      ? 'ready_to_decompose'
      : update.decision === 'suggest_confirm_leaf'
        ? 'completed'
        : update.decision === 'blocked'
          ? 'blocked'
          : 'active'

  const nodeStatus =
    update.decision === 'ready_to_decompose'
      ? 'ready_to_decompose'
      : update.decision === 'blocked'
        ? 'interviewing'
        : node.status

  return touchProject({
    ...project,
    artifacts: null,
    interviewSessions: {
      ...project.interviewSessions,
      [sessionId]: {
        ...session,
        status: sessionStatus,
        messages: nextMessages,
        extractedFacts: [...session.extractedFacts, ...newFacts],
        unresolvedQuestions,
        currentDecision: update.decision,
        updatedAt: timestamp,
      },
    },
    nodes: {
      ...project.nodes,
      [node.id]: touchNode({
        ...node,
        status: nodeStatus,
        summary: update.nodeSummary ?? node.summary,
        aiHints: {
          ...node.aiHints,
          suggestedNextAction: update.suggestedNextAction,
          caution: update.caution ?? node.aiHints?.caution,
        },
      }),
    },
  })
}

export function confirmLeaf(project: Project, nodeId: string) {
  const node = project.nodes[nodeId]

  if (!node) {
    return project
  }

  const interviewSessions = { ...project.interviewSessions }
  node.interviewSessionIds.forEach((sessionId) => {
    const session = interviewSessions[sessionId]
    if (session && session.status === 'active') {
      interviewSessions[sessionId] = {
        ...session,
        status: 'completed',
        currentDecision: 'suggest_confirm_leaf',
        updatedAt: nowIso(),
      }
    }
  })

  const latestSession = getLatestSession(project, node)
  const summary =
    node.summary ??
    latestSession?.extractedFacts.map((fact) => fact.text).join(' ') ??
    node.description

  return touchProject({
    ...project,
    artifacts: null,
    interviewSessions,
    nodes: {
      ...project.nodes,
      [nodeId]: touchNode({
        ...node,
        status: 'confirmed_leaf',
        summary,
        aiHints: {
          ...node.aiHints,
          suggestedNextAction: undefined,
        },
      }),
    },
  })
}

export function setGeneratedArtifacts(
  project: Project,
  artifacts: GeneratedArtifacts,
) {
  return touchProject({
    ...project,
    artifacts,
  })
}

export function getTreeSummary(project: Project) {
  const nodes = getRootToLeafNodes(project)

  if (nodes.length === 0) {
    return 'No nodes have been created yet.'
  }

  return nodes
    .map((node) => {
      const prefix = '  '.repeat(node.depth)
      const latestSession = getLatestSession(project, node)
      const facts =
        latestSession && latestSession.extractedFacts.length > 0
          ? ` Facts: ${latestSession.extractedFacts.map((fact) => fact.text).join('; ')}`
          : ''
      const summary = node.summary ? ` Summary: ${node.summary}` : ''

      return `${prefix}- ${node.title} [${node.status}] ${node.description}${summary}${facts}`
    })
    .join('\n')
}

export function getProjectWarnings(project: Project): ProjectWarning[] {
  const warnings = getRootToLeafNodes(project).flatMap((node) => {
    const nodeWarnings: ProjectWarning[] = []

    if (node.status === 'interviewing') {
      nodeWarnings.push({
        nodeId: node.id,
        message: `${node.title} still has an active interview.`,
        severity: 'warning',
      })
    }

    if (node.status === 'ready_to_decompose') {
      nodeWarnings.push({
        nodeId: node.id,
        message: `${node.title} is ready to decompose but has not been expanded or confirmed.`,
        severity: 'warning',
      })
    }

    return nodeWarnings
  })

  const root = project.rootNodeId ? project.nodes[project.rootNodeId] : null
  if (root && root.status !== 'expanded' && root.status !== 'confirmed_leaf') {
    warnings.push({
      nodeId: root.id,
      message: 'Root is not expanded or confirmed.',
      severity: 'warning',
    })
  }

  return warnings
}

export function validateTree(project: Project) {
  const errors: string[] = []

  if (project.rootNodeId && !project.nodes[project.rootNodeId]) {
    errors.push('Root node id does not exist in nodes.')
  }

  Object.values(project.nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = project.nodes[childId]

      if (!child) {
        errors.push(`${node.title} references missing child ${childId}.`)
      } else if (child.parentId !== node.id) {
        errors.push(`${child.title} has a parent mismatch.`)
      }
    })

    node.interviewSessionIds.forEach((sessionId) => {
      const session = project.interviewSessions[sessionId]
      if (!session) {
        errors.push(`${node.title} references missing interview session ${sessionId}.`)
      } else if (session.nodeId !== node.id) {
        errors.push(`${node.title} has an interview session node mismatch.`)
      }
    })
  })

  project.edges.forEach((edge) => {
    if (!project.nodes[edge.source] || !project.nodes[edge.target]) {
      errors.push(`Edge ${edge.id} references a missing node.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function migrateLegacyNodeStatus(status: unknown): NodeStatus {
  switch (status) {
    case 'raw':
    case 'needs_interview':
    case 'blocked':
      return 'needs_interview'
    case 'interviewing':
      return 'interviewing'
    case 'can_decompose':
      return 'ready_to_decompose'
    case 'expanded':
      return 'expanded'
    case 'work_unit':
    case 'collapsed_with_assumption':
    case 'deferred':
    case 'out_of_scope':
    case 'confirmed_leaf':
      return 'confirmed_leaf'
    default:
      return 'needs_interview'
  }
}

export function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const raw = value as Record<string, unknown>
  const rawNodes = raw.nodes as Record<string, Record<string, unknown>> | undefined
  const timestamp = nowIso()

  if (!rawNodes || typeof raw.title !== 'string') {
    return null
  }

  const nodes = Object.fromEntries(
    Object.entries(rawNodes).map(([id, rawNode]) => {
      const legacyPriority = rawNode.priority
      const legacyRisk = rawNode.riskLevel
      const legacyAssumptions = Array.isArray(rawNode.assumptions)
        ? rawNode.assumptions.length
        : 0
      const caution =
        legacyPriority || legacyRisk || legacyAssumptions
          ? 'Legacy priority/risk/assumption fields were migrated into hidden AI hints.'
          : undefined

      const node: ProgramNode = {
        id,
        parentId:
          typeof rawNode.parentId === 'string' ? rawNode.parentId : null,
        title: typeof rawNode.title === 'string' ? rawNode.title : 'Untitled node',
        description:
          typeof rawNode.description === 'string' ? rawNode.description : '',
        depth: typeof rawNode.depth === 'number' ? rawNode.depth : 0,
        status: migrateLegacyNodeStatus(rawNode.status),
        children: Array.isArray(rawNode.children)
          ? rawNode.children.filter((item): item is string => typeof item === 'string')
          : [],
        summary:
          typeof rawNode.summary === 'string'
            ? rawNode.summary
            : typeof rawNode.description === 'string'
              ? rawNode.description
              : undefined,
        userNote:
          typeof rawNode.userNote === 'string' ? rawNode.userNote : undefined,
        interviewSessionIds: Array.isArray(rawNode.interviewSessionIds)
          ? rawNode.interviewSessionIds.filter(
              (item): item is string => typeof item === 'string',
            )
          : [],
        aiHints: {
          ...(rawNode.aiHints && typeof rawNode.aiHints === 'object'
            ? (rawNode.aiHints as AiHints)
            : {}),
          caution,
        },
        userIntent:
          typeof rawNode.userIntent === 'string' ? rawNode.userIntent : undefined,
        createdAt:
          typeof rawNode.createdAt === 'string' ? rawNode.createdAt : timestamp,
        updatedAt:
          typeof rawNode.updatedAt === 'string' ? rawNode.updatedAt : timestamp,
      }

      return [id, node]
    }),
  )

  const rawSessions = raw.interviewSessions as
    | Record<string, InterviewSession>
    | undefined

  return {
    id: typeof raw.id === 'string' ? raw.id : createId('project'),
    title: raw.title,
    rootNodeId:
      typeof raw.rootNodeId === 'string' ? raw.rootNodeId : null,
    nodes,
    edges: Array.isArray(raw.edges) ? (raw.edges as ProgramEdge[]) : [],
    interviewSessions: rawSessions && typeof rawSessions === 'object' ? rawSessions : {},
    artifacts:
      raw.artifacts && typeof raw.artifacts === 'object'
        ? (raw.artifacts as GeneratedArtifacts)
        : null,
    pbe:
      raw.pbe && typeof raw.pbe === 'object'
        ? (raw.pbe as Project['pbe'])
        : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : timestamp,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : timestamp,
    schemaVersion: 2,
  }
}
