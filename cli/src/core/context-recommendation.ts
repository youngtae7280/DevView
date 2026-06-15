import type { ContextStageOption } from './types.js'

export type ContextProfileOption = 'full' | 'lite' | 'bypass'
type CanonicalContextStageOption = Exclude<ContextStageOption, 'docs'>

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
    skills: ['pbe-start'],
    readFirst: ['agent-context/start.md'],
    readOnlyIfNeeded: ['README.md', 'docs/cli-reference.md', 'docs/lite-mode-policy.md'],
  },
  rpd: {
    skills: ['pbe-rpd'],
    readFirst: ['agent-context/rpd.md'],
    readOnlyIfNeeded: ['docs/rpd-interview-mode.md', 'docs/ambiguity-taxonomy.md'],
  },
  wpd: {
    skills: ['pbe-wpd'],
    readFirst: ['agent-context/wpd.md'],
    readOnlyIfNeeded: ['docs/parallel-safety.md'],
  },
  vd: {
    skills: ['pbe-vd'],
    readFirst: ['agent-context/vd.md', 'agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/vd-quality-rubric.md', 'docs/evidence-quality-rubric.md'],
  },
  execution: {
    skills: ['pbe-run-acep'],
    readFirst: ['agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/evidence-quality-rubric.md', 'docs/lite-mode-policy.md'],
  },
  review: {
    skills: ['pbe-review-result'],
    readFirst: ['agent-context/review.md', 'agent-context/evidence.md'],
    readOnlyIfNeeded: ['docs/review-failure-recovery.md', 'docs/evidence-quality-rubric.md'],
  },
  revision: {
    skills: ['pbe-run-revision'],
    readFirst: ['agent-context/revision.md', 'agent-context/review.md'],
    readOnlyIfNeeded: ['docs/review-failure-recovery.md', 'docs/product-patch-proposals.md'],
  },
  'product-patch': {
    skills: ['pbe-review-result', 'pbe-run-revision'],
    readFirst: ['agent-context/product-patch.md'],
    readOnlyIfNeeded: ['docs/product-patch-proposals.md', 'docs/migration-policy.md'],
  },
  parallel: {
    skills: ['pbe-wpd', 'pbe-run-acep'],
    readFirst: ['agent-context/parallel.md'],
    readOnlyIfNeeded: ['docs/parallel-safety.md', 'docs/troubleshooting.md'],
  },
  documentation: {
    skills: ['pbe-run-acep'],
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
  'This command is read-only and does not modify PBE state.',
]

export const contextStages = [...Object.keys(stageContexts), 'docs'] as ContextStageOption[]

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
        'bypass means PBE tracking is not active.',
        'Escalate to lite or full if traceability is needed.',
      ],
    }
  }

  const readFirst = [...definition.readFirst]
  const readOnlyIfNeeded = [...definition.readOnlyIfNeeded]
  const reasons = [stageResult.reason, stageReason(stageResult.stage)]

  if (profile === 'lite') {
    readFirst.push('agent-context/lite.md')
    readOnlyIfNeeded.push('docs/lite-mode-policy.md')
    reasons.push('lite profile adds Lite guard guidance')
  } else if (profile === 'full') {
    reasons.push('full profile requested')
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
  return stage === 'docs' ? 'documentation' : stage
}

function detectStage(brief: string | undefined): { stage: CanonicalContextStageOption; reason: string } {
  const text = normalize(brief || '')

  if (hasDocumentationSignal(text)) {
    return { stage: 'documentation', reason: 'brief appears to ask for documentation maintenance' }
  }
  if (hasAny(text, ['병렬', '동시에', 'parallel', 'conflict', 'clean-dist', 'clean dist'])) {
    return { stage: 'parallel', reason: 'brief appears to ask about parallel or dependency risk' }
  }
  if (hasAny(text, ['제품 의미', '정책 변경', 'ac 변경', 'acceptance criteria 변경', 'product patch', '검색 대상'])) {
    return { stage: 'product-patch', reason: 'brief appears to change product meaning or acceptance basis' }
  }
  if (hasAny(text, ['리뷰', '마음에 안', '별로', '방향이 틀림', 'reject', 'rejection'])) {
    return { stage: 'review', reason: 'brief appears to ask about review or rejection handling' }
  }
  if (hasAny(text, ['수정', 'revision', '다시 고쳐', '반영해', '고쳐'])) {
    return { stage: 'revision', reason: 'brief appears to ask for bounded revision work' }
  }
  if (hasAny(text, ['검증', '테스트 설계', 'vd', 'test tree', 'pass criteria', '테스트'])) {
    return { stage: 'vd', reason: 'brief appears to ask for verification design' }
  }
  if (hasAny(text, ['evidence', '증거', '실행 결과', 'command output', 'screenshot', '스크린샷'])) {
    return { stage: 'execution', reason: 'brief appears to ask about execution evidence' }
  }
  if (hasAny(text, ['작업 쪼개기', '파일 범위', 'expectedfiles', '구현 계획', 'scope', '작업 계획'])) {
    return { stage: 'wpd', reason: 'brief appears to ask for work planning' }
  }
  if (hasAny(text, ['요구사항', '모호', 'product tree', '정리', '뭘 만들지', '무엇을 만들지'])) {
    return { stage: 'rpd', reason: 'brief appears to ask about requirements or ambiguity' }
  }
  if (hasAny(text, ['start', '시작', 'pbe로 관리', 'pbe 관리'])) {
    return { stage: 'start', reason: 'brief appears to ask for PBE start or management' }
  }

  return { stage: 'start', reason: 'no strong stage signal detected' }
}

function stageReason(stage: CanonicalContextStageOption): string {
  const reasons: Record<CanonicalContextStageOption, string> = {
    start: 'Start work should use initialization and profile guidance first',
    rpd: 'RPD work requires Product Tree and ambiguity guidance',
    wpd: 'WPD work requires Work planning and file scope guidance',
    vd: 'VD work requires Test/Evidence guidance',
    execution: 'Execution work requires Evidence guidance',
    review: 'Review work requires rejection and evidence guidance',
    revision: 'Revision work requires Change/Impact bounded-scope guidance',
    'product-patch': 'Product Patch work requires Product meaning change control',
    parallel: 'Parallel work requires dependency and shared-resource safety guidance',
    documentation: 'Documentation work should use Lite guard and evidence guidance without broad docs scanning',
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
    '문서',
    'documentation',
    'troubleshooting',
    'install',
    '설치',
    '사용법',
    'guide',
    'reference',
    'npm.cmd',
    'npm.ps1',
    'powershell',
    'execution policy',
    'windows에서 npm',
    'cli reference',
    'known limits',
    'readme 링크',
    'docs index',
  ])
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}
