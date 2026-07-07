import type { ContextStageOption } from './types.js'

export type ContextProfileOption = 'full' | 'lite' | 'bypass'
type CanonicalContextStageOption = Exclude<ContextStageOption, 'docs' | 'rpd' | 'wpd' | 'vd'>

export interface ContextRecommendationInput {
  brief?: string
  stage?: ContextStageOption
  profile?: ContextProfileOption
}

export interface ContextRecommendation {
  detectedStage: CanonicalContextStageOption
  profile?: ContextProfileOption
  skills: string[]
  readFirst: string[]
  readOnlyIfNeeded: string[]
  doNotReadByDefault: string[]
  reasons: string[]
  notes: string[]
}

interface StageContextDefinition {
  skills: string[]
  readFirst: string[]
  readOnlyIfNeeded: string[]
}

const stageContexts: Record<CanonicalContextStageOption, StageContextDefinition> = {
  start: {
    skills: ['devview-start'],
    readFirst: ['agent-context/start.md'],
    readOnlyIfNeeded: ['README.md', 'docs/cli-reference.md', 'docs/lite-mode-policy.md'],
  },
  'product-intake': {
    skills: ['devview-product-intake'],
    readFirst: ['agent-context/rpd.md'],
    readOnlyIfNeeded: ['docs/rpd-interview-mode.md', 'docs/ambiguity-taxonomy.md'],
  },
  'work-planning': {
    skills: ['devview-work-planning'],
    readFirst: ['agent-context/wpd.md'],
    readOnlyIfNeeded: ['docs/parallel-safety.md'],
  },
  'verification-design': {
    skills: ['devview-verification-design'],
    readFirst: ['agent-context/vd.md', 'agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/vd-quality-rubric.md', 'docs/evidence-quality-rubric.md'],
  },
  execution: {
    skills: ['devview-run-execution-pack'],
    readFirst: ['agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/evidence-quality-rubric.md', 'docs/lite-mode-policy.md'],
  },
  review: {
    skills: ['devview-review-result'],
    readFirst: ['agent-context/review.md', 'agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/review-failure-recovery.md', 'docs/evidence-quality-rubric.md'],
  },
  revision: {
    skills: ['devview-run-revision'],
    readFirst: ['agent-context/revision.md', 'agent-context/review.md'],
    readOnlyIfNeeded: ['docs/review-failure-recovery.md', 'docs/product-patch-proposals.md'],
  },
  'product-patch': {
    skills: ['devview-review-result', 'devview-run-revision'],
    readFirst: ['agent-context/product-patch.md'],
    readOnlyIfNeeded: ['docs/product-patch-proposals.md', 'docs/migration-policy.md'],
  },
  parallel: {
    skills: ['devview-work-planning', 'devview-run-execution-pack'],
    readFirst: ['agent-context/parallel.md'],
    readOnlyIfNeeded: ['docs/parallel-safety.md', 'docs/troubleshooting.md'],
  },
  documentation: {
    skills: ['devview-run-execution-pack'],
    readFirst: ['agent-context/lite.md', 'agent-context/evidence.md'],
    readOnlyIfNeeded: [
      'docs/lite-mode-policy.md',
      'docs/evidence-quality-rubric.md',
      'docs/troubleshooting.md',
      'docs/install.md',
    ],
  },
}

const fullDocs = [
  'README.md',
  'docs/cli-reference.md',
  'docs/lite-mode-policy.md',
  'docs/rpd-interview-mode.md',
  'docs/ambiguity-taxonomy.md',
  'docs/parallel-safety.md',
  'docs/vd-quality-rubric.md',
  'docs/evidence-quality-rubric.md',
  'docs/review-failure-recovery.md',
  'docs/product-patch-proposals.md',
  'docs/migration-policy.md',
  'docs/troubleshooting.md',
  'docs/install.md',
  'docs/complexity-governance.md',
]

const notes = [
  'Read readFirst before broad docs scanning.',
  'Load full docs only when the context card says they are needed.',
  'This command is read-only and does not modify DevView state.',
]

export const contextStages = [...Object.keys(stageContexts), 'docs', 'rpd', 'wpd', 'vd'] as ContextStageOption[]

export function isContextStage(value: string): value is ContextStageOption {
  return contextStages.includes(value as ContextStageOption)
}

export function recommendContext(input: ContextRecommendationInput): ContextRecommendation {
  const profile = input.profile
  const stageResult = input.stage
    ? {
        stage: normalizeContextStage(input.stage),
        reason: `--stage ${input.stage} was provided and takes precedence over brief heuristics`,
      }
    : detectStage(input.brief)
  const definition = stageContexts[stageResult.stage]

  if (profile === 'bypass') {
    return {
      detectedStage: stageResult.stage,
      profile,
      skills: [],
      readFirst: ['agent-context/start.md'],
      readOnlyIfNeeded: [],
      doNotReadByDefault: fullDocs,
      reasons: [stageResult.reason, 'bypass profile requested; keep context minimal'],
      notes: [
        ...notes,
        'bypass means DevView tracking is not active.',
        'Use DevView tracking if traceability is needed.',
      ],
    }
  }

  const readFirst = [...definition.readFirst]
  const readOnlyIfNeeded = [...definition.readOnlyIfNeeded]
  const reasons = [stageResult.reason, stageReason(stageResult.stage)]

  if (profile === 'lite') {
    readFirst.push('agent-context/lite.md')
    readOnlyIfNeeded.push('docs/lite-mode-policy.md')
    reasons.push('compact workflow depth adds guard guidance')
  } else if (profile === 'full') {
    reasons.push('full planning depth requested')
  }

  return {
    detectedStage: stageResult.stage,
    profile,
    skills: unique(definition.skills),
    readFirst: unique(readFirst),
    readOnlyIfNeeded: unique(readOnlyIfNeeded),
    doNotReadByDefault: fullDocs.filter((doc) => !readOnlyIfNeeded.includes(doc)),
    reasons,
    notes,
  }
}

function normalizeContextStage(stage: ContextStageOption): CanonicalContextStageOption {
  if (stage === 'docs') {
    return 'documentation'
  }
  if (stage === 'rpd') {
    return 'product-intake'
  }
  if (stage === 'wpd') {
    return 'work-planning'
  }
  if (stage === 'vd') {
    return 'verification-design'
  }
  return stage
}

function detectStage(brief: string | undefined): { stage: CanonicalContextStageOption; reason: string } {
  const text = normalize(brief || '')

  if (hasDocumentationSignal(text)) {
    return { stage: 'documentation', reason: 'brief appears to ask for documentation maintenance' }
  }
  if (hasAny(text, ['parallel', 'conflict', 'clean-dist', 'clean dist', 'dependency risk', 'shared file'])) {
    return { stage: 'parallel', reason: 'brief appears to ask about parallel or dependency risk' }
  }
  if (hasAny(text, ['product patch', 'acceptance criteria', 'acceptance basis', 'product meaning'])) {
    return { stage: 'product-patch', reason: 'brief appears to change product meaning or acceptance basis' }
  }
  if (hasAny(text, ['review', 'reject', 'rejection', 'feedback', 'request changes'])) {
    return { stage: 'review', reason: 'brief appears to ask about review or rejection handling' }
  }
  if (hasAny(text, ['revision', 'revise', 'rework', 'change request', 'fix feedback'])) {
    return { stage: 'revision', reason: 'brief appears to ask for bounded revision work' }
  }
  if (hasAny(text, ['verification design', 'test tree', 'pass criteria', 'test design'])) {
    return { stage: 'verification-design', reason: 'brief appears to ask for verification design' }
  }
  if (hasAny(text, ['evidence', 'command output', 'screenshot', 'runtime result', 'validation output'])) {
    return { stage: 'execution', reason: 'brief appears to ask about execution evidence' }
  }
  if (hasAny(text, ['expectedfiles', 'expected files', 'file scope', 'work plan', 'implementation plan', 'scope'])) {
    return { stage: 'work-planning', reason: 'brief appears to ask for work planning' }
  }
  if (hasAny(text, ['requirement', 'requirements', 'ambiguity', 'product tree', 'product intent', 'user intent'])) {
    return { stage: 'product-intake', reason: 'brief appears to ask about requirements or ambiguity' }
  }
  if (hasAny(text, ['start', 'initialize', 'init', 'devview manage', 'devview start'])) {
    return { stage: 'start', reason: 'brief appears to ask for DevView start or management' }
  }

  return { stage: 'start', reason: 'no strong stage signal detected' }
}

function stageReason(stage: CanonicalContextStageOption): string {
  const reasons: Record<CanonicalContextStageOption, string> = {
    start: 'Start work should use initialization and profile guidance first',
    'product-intake': 'Product Intake work requires Product Tree and ambiguity guidance',
    'work-planning': 'Work Planning requires Work planning and file scope guidance',
    'verification-design': 'Verification Design requires Test/Evidence guidance',
    execution: 'Execution work requires Evidence guidance',
    review: 'Review work requires rejection and evidence guidance',
    revision: 'Revision work requires Change/Impact bounded-scope guidance',
    'product-patch': 'Product Patch work requires Product meaning change control',
    parallel: 'Parallel work requires dependency and shared-resource safety guidance',
    documentation: 'Documentation work should use compact guard and evidence guidance without broad docs scanning',
  }
  return reasons[stage]
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle.toLowerCase()))
}

function hasDocumentationSignal(value: string): boolean {
  return hasAny(value, [
    'docs/',
    'readme',
    'documentation',
    'troubleshooting',
    'install',
    'usage',
    'how to use',
    'guide',
    'reference',
    'npm.cmd',
    'npm.ps1',
    'powershell',
    'execution policy',
    'windows npm',
    'cli reference',
    'known limits',
    'docs index',
  ])
}
function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}
