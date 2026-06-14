export type PbeExecutionProfile = 'bypass' | 'lite' | 'full'
export type RecommendationConfidence = 'high' | 'medium' | 'low'

export interface ProfileRecommendationInput {
  brief: string
  files?: string[]
}

export interface ProfileRecommendation {
  recommendedProfile: PbeExecutionProfile
  confidence: RecommendationConfidence
  reasons: string[]
  escalationTriggers: string[]
  suggestedInitCommand: string
  notes: string[]
}

const escalationTriggers = [
  'product meaning change',
  'UI/UX visual design work',
  'DB/schema/auth/permission/API/hardware/concurrency',
  'broad expected files',
  'repeated review rejection',
]

const notes = [
  'This is a recommendation only. It does not initialize PBE.',
  'If uncertain, choose full.',
  'The heuristic is deterministic and conservative; it is not full semantic product analysis.',
]

const fullFilePatterns = [
  /^cli\/src\//,
  /^scripts\//,
  /^schemas\//,
  /^templates\//,
  /^\.github\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^examples\/valid\//,
  /^examples\/invalid\//,
  /^skills\//,
]

const liteFilePatterns = [/^docs\//, /^README\.md$/, /^examples\/adoption\//, /^examples\/dogfooding\//]

const noChangeBriefPatterns = [
  /what\s+is/,
  /explain/,
  /describe/,
  /analy[sz]e/,
  /no\s+file\s+change/,
  /do\s+not\s+(edit|change|modify)/,
  /read-?only/,
  /뭐야/,
  /무슨\s*뜻/,
  /설명/,
  /알려줘/,
  /분석/,
  /파일\s*수정.*하지\s*마/,
  /수정하지\s*마/,
  /변경하지\s*마/,
]

const explicitNoChangeBriefPatterns = [
  /no\s+file\s+change/,
  /do\s+not\s+(edit|change|modify)/,
  /파일\s*수정.*하지\s*마/,
  /수정하지\s*마/,
  /변경하지\s*마/,
]

const changeBriefPatterns = [
  /add/,
  /change/,
  /update/,
  /fix/,
  /implement/,
  /create/,
  /write/,
  /edit/,
  /추가/,
  /수정/,
  /변경/,
  /고쳐/,
  /만들/,
  /작성/,
]

const liteBriefPatterns = [
  /docs?\//,
  /readme/,
  /documentation/,
  /troubleshooting/,
  /install/,
  /reference/,
  /copy/,
  /typo/,
  /wording/,
  /문서/,
  /설명\s*추가/,
  /링크\s*문구/,
  /주의\s*문구/,
]

const fullBriefPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /new feature|feature|기능\s*추가|새\s*기능/, reason: 'new feature signal detected' },
  { pattern: /unclear|vague|모호|범위.*불명확/, reason: 'unclear scope signal detected' },
  {
    pattern: /product meaning|acceptance criteria|AC\b|제품\s*의미/,
    reason: 'product meaning or AC change signal detected',
  },
  { pattern: /ui\/ux|visual|redesign|design|깔끔|관리자\s*페이지/, reason: 'UI/UX or visual design signal detected' },
  { pattern: /db|database|schema|migration|데이터베이스|스키마/, reason: 'DB/schema change signal detected' },
  { pattern: /auth|permission|security|권한|인증|보안/, reason: 'auth/permission/security signal detected' },
  {
    pattern: /api|hardware|concurrency|parallel|external|외부|하드웨어|동시성|병렬/,
    reason: 'API/hardware/concurrency signal detected',
  },
  {
    pattern: /cli|command|validator|state machine|상태\s*머신|검증기/,
    reason: 'CLI/validator/state machine signal detected',
  },
  {
    pattern: /package script|package\.json|ci|workflow|github actions/,
    reason: 'package script or CI signal detected',
  },
  {
    pattern: /product patch|반복.*reject|repeated.*rejection/,
    reason: 'Product Patch or repeated rejection signal detected',
  },
]

export function recommendProfile(input: ProfileRecommendationInput): ProfileRecommendation {
  const brief = input.brief.trim()
  const files = normalizeFiles(input.files || [])
  const normalizedBrief = brief.toLowerCase()
  const fullFileReasons = collectFullFileReasons(files)
  const fullBriefReasons = fullBriefPatterns
    .filter((entry) => entry.pattern.test(normalizedBrief))
    .map((entry) => entry.reason)

  if (fullFileReasons.length > 0 || fullBriefReasons.length > 0) {
    return buildRecommendation('full', 'high', unique([...fullFileReasons, ...fullBriefReasons]), brief)
  }

  const noChange = noChangeBriefPatterns.some((pattern) => pattern.test(normalizedBrief))
  const explicitNoChange = explicitNoChangeBriefPatterns.some((pattern) => pattern.test(normalizedBrief))
  const changeExpected = changeBriefPatterns.some((pattern) => pattern.test(normalizedBrief))
  if (noChange && files.length === 0 && (!changeExpected || explicitNoChange)) {
    return buildRecommendation(
      'bypass',
      'high',
      ['question/explanation request detected', 'no expected file changes detected'],
      brief,
    )
  }

  const liteFiles = files.length > 0 && files.every((file) => matchesAny(file, liteFilePatterns))
  const liteBrief = liteBriefPatterns.some((pattern) => pattern.test(normalizedBrief))
  const boundedFiles = files.length > 0 && files.length <= 3
  if (liteFiles || liteBrief) {
    const reasons = [
      liteFiles || liteBrief ? 'docs-only or low-risk documentation change' : '',
      boundedFiles ? 'bounded expected files' : '',
      'no product meaning change detected',
      'no UI/UX, DB/schema/auth/permission, API, hardware, or concurrency signal detected',
    ].filter(Boolean)
    return buildRecommendation(
      'lite',
      liteFiles || boundedFiles || /docs?\//.test(normalizedBrief) ? 'high' : 'medium',
      reasons,
      brief,
    )
  }

  return buildRecommendation(
    'full',
    'low',
    ['uncertain scope or risk; conservative default is full', 'no safe bypass or lite heuristic matched'],
    brief,
  )
}

function buildRecommendation(
  profile: PbeExecutionProfile,
  confidence: RecommendationConfidence,
  reasons: string[],
  brief: string,
): ProfileRecommendation {
  return {
    recommendedProfile: profile,
    confidence,
    reasons: unique(reasons),
    escalationTriggers,
    suggestedInitCommand: `pbe init --profile ${profile} --brief ${quoteBriefForCommand(brief)}`,
    notes,
  }
}

function collectFullFileReasons(files: string[]): string[] {
  const reasons: string[] = []
  for (const file of files) {
    if (matchesAny(file, fullFilePatterns)) {
      reasons.push(`high-risk file path: ${file}`)
    }
  }
  return reasons
}

function normalizeFiles(files: string[]): string[] {
  return files.map((file) => file.replaceAll('\\', '/').replace(/^\.\//, '').trim()).filter(Boolean)
}

function matchesAny(file: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(file))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function quoteBriefForCommand(brief: string): string {
  return `"${brief.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
