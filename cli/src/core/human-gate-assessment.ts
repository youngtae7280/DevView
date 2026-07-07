export const humanGateTransitions = [
  'product-tree',
  'product-to-work',
  'work-scope',
  'work-to-test',
  'test-to-evidence',
  'execution-pack-preflight',
  'review-revision',
  'product-patch',
  'acceptance',
] as const

export const humanGateProfiles = ['lite', 'full', 'bypass'] as const

export type HumanGateTransition = (typeof humanGateTransitions)[number]
export type HumanGateProfile = (typeof humanGateProfiles)[number]
export type HumanGateAmbiguityLevel = 'low' | 'medium' | 'high' | 'very-high'

export interface HumanGateDimensions {
  intent: number
  scope: number
  testability: number
  implementationSpecificity: number
  evidenceFit: number
  riskReversibility: number
}

export interface HumanGateAssessmentInput {
  text: string
  transition?: string
  profile?: string
}

export interface HumanGateAssessment {
  transition: HumanGateTransition
  profile: HumanGateProfile
  inputText: string
  clarity: {
    score: number
    level: HumanGateAmbiguityLevel
    dimensions: HumanGateDimensions
  }
  hardTriggers: string[]
  requiresHumanGate: boolean
  reasons: string[]
  recommendedQuestion: string | null
  readOnly: true
}

const actionTerms = [
  'add',
  'show',
  'display',
  'save',
  'load',
  'validate',
  'fix',
  'implement',
  'remove',
  'update',
  '추가',
  '표시',
  '보여',
  '저장',
  '불러오기',
  '검증',
  '수정',
  '구현',
  '삭제',
  '변경',
]

const subjectiveTerms = [
  '좋게',
  '깔끔하게',
  '자연스럽게',
  '편하게',
  '알아서',
  '적당히',
  '예쁘게',
  '만족스럽게',
  'ux 좋게',
  'nice',
  'clean',
  'better',
  'natural',
  'convenient',
  'appropriate',
  'somehow',
  'beautiful',
  'better ux',
]

const broadScopeTerms = ['repo 전체', '전체적으로', '전반적으로', ' 다 ', 'everything', 'whole repo', 'overall']

const explicitTargetTerms = [
  'screen',
  'module',
  'component',
  'command',
  'cli',
  'button',
  'combobox',
  'card',
  'form',
  'dialog',
  'modal',
  'page',
  '화면',
  '모듈',
  '컴포넌트',
  '명령',
  '버튼',
  '콤보박스',
  '카드',
  '폼',
  '페이지',
]

const conditionTerms = [
  'when',
  'if',
  'while',
  'given',
  'must',
  'shall',
  'required',
  'pass',
  'fail',
  'returns',
  'should be visible',
  '표시되어야',
  '저장되어야',
  '에러가 없어야',
  '통과',
  '실패',
]

const observableTerms = ['shows', 'displayed', 'saved', 'validated', 'visible', '표시', '보여', '저장', '검증']

const implementationTerms = [
  'combobox',
  'combo box',
  'button list',
  'button',
  'card',
  'localstorage',
  'file',
  'db',
  'database',
  'api',
  'schema',
  'cli command',
  'existing pattern',
  'dropdown',
  'checkbox',
  'radio',
  'table',
  '콤보박스',
  '버튼',
  '카드',
  '로컬스토리지',
  '파일',
  '데이터베이스',
  '스키마',
  '기존 패턴',
  '드롭다운',
  '체크박스',
  '라디오',
]

const uiChoiceTerms = [
  'ui',
  'screen',
  'display',
  'show',
  'choice',
  'choices',
  'selection',
  'input',
  'form',
  'layout',
  'list',
  '화면',
  '표시',
  '보여',
  '선택지',
  '선택',
  '입력',
  '폼',
  '레이아웃',
  '목록',
]

const multipleOptionTerms = [
  'choice',
  'choices',
  'selection',
  'list',
  'input',
  'save',
  'storage',
  'notification',
  '선택지',
  '선택',
  '목록',
  '입력',
  '저장',
  '알림',
]

const evidenceTerms = [
  'test',
  'screenshot',
  'log',
  'manual check',
  'manual review',
  'npm test',
  'validate',
  'evidence',
  '테스트',
  '스크린샷',
  '로그',
  '수동 확인',
  '수동검토',
  '증거',
]

const restrictedTerms = [
  'agents.md',
  'package.json',
  '.github',
  'ci',
  'schema',
  'template',
  'auth',
  'security',
  'permission',
  'payment',
  'migration',
  'destructive',
  'delete',
  'database',
  '인증',
  '보안',
  '권한',
  '결제',
  '마이그레이션',
  '삭제',
  '데이터베이스',
  '스키마',
  '패키지',
]

const lowRiskTerms = [
  'docs-only',
  'docs/',
  'readme',
  'single file',
  'single-file',
  'wording',
  'copy change',
  'typo',
  'documentation',
  '문서',
  '오타',
  '한 줄',
]

const repeatedRejectionTerms = [
  'repeated rejection',
  'rejection',
  'reject',
  'still wrong',
  'again',
  '별로',
  '마음에 안',
  '반복',
  '다시 고쳐',
]

const questionHighRiskTerms = [
  'auth',
  'authentication',
  'authorization',
  'security',
  'permission',
  'login',
  'session',
  'token',
  'payment',
  'migration',
  'database migration',
  '\uC778\uC99D',
  '\uB85C\uADF8\uC778',
  '\uBCF4\uC548',
  '\uAD8C\uD55C',
  '\uC138\uC158',
  '\uD1A0\uD070',
  '\uACB0\uC81C',
  '\uB9C8\uC774\uADF8\uB808\uC774\uC158',
]

const questionStorageTerms = [
  'save',
  'storage',
  'persist',
  'persistence',
  'autosave',
  'load',
  'localstorage',
  'file',
  'database',
  'db',
  'api',
  '\uC800\uC7A5',
  '\uC790\uB3D9 \uC800\uC7A5',
  '\uBD88\uB7EC\uC624\uAE30',
  '\uC601\uC18D',
  '\uD30C\uC77C',
  '\uB370\uC774\uD130\uBCA0\uC774\uC2A4',
  '\uC11C\uBC84',
]

const questionStorageImplementationTerms = [
  'localstorage',
  'file',
  'database',
  'db',
  'api',
  '\uD30C\uC77C',
  '\uB370\uC774\uD130\uBCA0\uC774\uC2A4',
  '\uC11C\uBC84',
]

export function isHumanGateTransition(value: string): value is HumanGateTransition {
  return humanGateTransitions.includes(value as HumanGateTransition)
}

export function isHumanGateProfile(value: string): value is HumanGateProfile {
  return humanGateProfiles.includes(value as HumanGateProfile)
}

export function assessHumanGateClarity(input: HumanGateAssessmentInput): HumanGateAssessment {
  const requestedTransition = input.transition || ''
  const requestedProfile = input.profile || ''
  const transition: HumanGateTransition = isHumanGateTransition(requestedTransition)
    ? requestedTransition
    : 'product-to-work'
  const profile: HumanGateProfile = isHumanGateProfile(requestedProfile) ? requestedProfile : 'lite'
  const inputText = input.text.trim()
  const normalized = normalize(inputText)
  const signals = collectSignals(inputText, normalized)
  const dimensions = scoreDimensions(signals, profile)
  const score = Number((sumDimensions(dimensions) / 12).toFixed(2))
  const hardTriggers = collectHardTriggers(signals, transition, profile)
  const requiresHumanGate = transition === 'acceptance' || hardTriggers.length > 0 || score < 0.6
  const reasons = buildReasons(signals, hardTriggers, score, transition, profile)

  return {
    transition,
    profile,
    inputText,
    clarity: {
      score,
      level: ambiguityLevel(score),
      dimensions,
    },
    hardTriggers,
    requiresHumanGate,
    reasons,
    recommendedQuestion: requiresHumanGate
      ? buildRecommendedQuestion(signals, hardTriggers, transition, profile, inputText)
      : null,
    readOnly: true,
  }
}

interface HumanGateSignals {
  text: string
  normalized: string
  hasKorean: boolean
  hasAction: boolean
  hasSubjectiveQuality: boolean
  hasBroadScope: boolean
  hasExplicitTarget: boolean
  hasNumber: boolean
  hasCondition: boolean
  hasObservableResult: boolean
  hasImplementationMethod: boolean
  hasUiChoiceSurface: boolean
  hasMultipleImplementationOptions: boolean
  hasEvidenceMethod: boolean
  hasRestrictedFileChange: boolean
  hasHighRiskArea: boolean
  hasLowRiskSignal: boolean
  hasManualOnlyEvidence: boolean
  hasRepeatedRejection: boolean
  hasProductMeaningChange: boolean
  fileReferenceCount: number
}

function collectSignals(text: string, normalized: string): HumanGateSignals {
  const padded = ` ${normalized} `
  return {
    text,
    normalized,
    hasKorean: /[가-힣]/.test(text),
    hasAction: hasAny(normalized, actionTerms),
    hasSubjectiveQuality: hasAny(normalized, subjectiveTerms),
    hasBroadScope: hasAny(padded, broadScopeTerms),
    hasExplicitTarget: hasFileReference(normalized) || hasAny(normalized, explicitTargetTerms),
    hasNumber: /\d/.test(text),
    hasCondition: hasAny(normalized, conditionTerms),
    hasObservableResult: hasAny(normalized, observableTerms),
    hasImplementationMethod: hasAny(normalized, implementationTerms),
    hasUiChoiceSurface: hasAny(normalized, uiChoiceTerms),
    hasMultipleImplementationOptions: hasAny(normalized, multipleOptionTerms),
    hasEvidenceMethod: hasAny(normalized, evidenceTerms),
    hasRestrictedFileChange: hasAny(normalized, ['agents.md', 'package.json', '.github', 'ci', 'schema', 'template']),
    hasHighRiskArea: hasAny(normalized, restrictedTerms),
    hasLowRiskSignal: hasAny(normalized, lowRiskTerms),
    hasManualOnlyEvidence: hasAny(normalized, ['manual-only', 'manual only', '수동만', '수동으로만']),
    hasRepeatedRejection: hasAny(normalized, repeatedRejectionTerms),
    hasProductMeaningChange: hasAny(normalized, [
      'product meaning',
      'meaning change',
      'acceptance criteria change',
      'ac change',
      'scope change',
      'product patch',
      '제품 의미',
      '의미 변경',
      '정책 변경',
      '기준 변경',
    ]),
    fileReferenceCount: countFileReferences(normalized),
  }
}

function scoreDimensions(signals: HumanGateSignals, profile: HumanGateProfile): HumanGateDimensions {
  return {
    intent: scoreIntent(signals),
    scope: scoreScope(signals, profile),
    testability: scoreTestability(signals),
    implementationSpecificity: scoreImplementationSpecificity(signals),
    evidenceFit: scoreEvidenceFit(signals),
    riskReversibility: scoreRiskReversibility(signals),
  }
}

function scoreIntent(signals: HumanGateSignals): number {
  if (!signals.text) {
    return 0
  }
  if (signals.hasSubjectiveQuality && !signals.hasAction) {
    return 0
  }
  return signals.hasAction ? 2 : 1
}

function scoreScope(signals: HumanGateSignals, profile: HumanGateProfile): number {
  if (signals.hasBroadScope || (profile === 'lite' && signals.fileReferenceCount > 3)) {
    return 0
  }
  return signals.hasExplicitTarget ? 2 : 1
}

function scoreTestability(signals: HumanGateSignals): number {
  if (signals.hasSubjectiveQuality && !signals.hasCondition && !signals.hasNumber) {
    return 0
  }
  if (signals.hasNumber || signals.hasCondition) {
    return 2
  }
  return signals.hasObservableResult ? 1 : 0
}

function scoreImplementationSpecificity(signals: HumanGateSignals): number {
  if (signals.hasImplementationMethod) {
    return 2
  }
  if (signals.hasUiChoiceSurface || signals.hasMultipleImplementationOptions) {
    return 0
  }
  return 1
}

function scoreEvidenceFit(signals: HumanGateSignals): number {
  if (signals.hasEvidenceMethod) {
    return 2
  }
  if (signals.hasSubjectiveQuality && signals.hasUiChoiceSurface) {
    return 0
  }
  return 1
}

function scoreRiskReversibility(signals: HumanGateSignals): number {
  if (signals.hasHighRiskArea) {
    return 0
  }
  if (signals.hasLowRiskSignal) {
    return 2
  }
  return 1
}

function collectHardTriggers(
  signals: HumanGateSignals,
  transition: HumanGateTransition,
  profile: HumanGateProfile,
): string[] {
  const triggers: string[] = []

  if (transition === 'acceptance') {
    triggers.push('final-acceptance')
  }
  if (transition === 'product-patch' || signals.hasProductMeaningChange) {
    triggers.push('product-patch')
  }
  if (signals.hasProductMeaningChange) {
    triggers.push('product-meaning-change')
  }
  if (signals.hasUiChoiceSurface && !signals.hasImplementationMethod) {
    triggers.push('user-facing-ui-choice')
  }
  if (signals.hasMultipleImplementationOptions && !signals.hasImplementationMethod) {
    triggers.push('multiple-implementation-options')
  }
  if (profile === 'lite' && (signals.hasBroadScope || signals.fileReferenceCount > 3)) {
    triggers.push('expected-files-cap-exceeded')
  }
  if (signals.hasRestrictedFileChange) {
    triggers.push('restricted-file-change')
  }
  if (signals.hasManualOnlyEvidence) {
    triggers.push('manual-only-evidence')
  }
  if (signals.hasSubjectiveQuality) {
    triggers.push('subjective-quality')
  }
  if (signals.hasHighRiskArea) {
    triggers.push('high-risk-area')
  }
  if (signals.hasRepeatedRejection) {
    triggers.push('repeated-rejection')
  }

  return unique(triggers)
}

function buildReasons(
  signals: HumanGateSignals,
  hardTriggers: string[],
  score: number,
  transition: HumanGateTransition,
  profile: HumanGateProfile,
): string[] {
  const reasons: string[] = []

  if (signals.hasUiChoiceSurface && !signals.hasImplementationMethod) {
    reasons.push('The product intent is understandable, but the user-facing control or display pattern is unspecified.')
  }
  if (signals.hasMultipleImplementationOptions && !signals.hasImplementationMethod) {
    reasons.push('Multiple valid implementations may satisfy the request.')
  }
  if (signals.hasSubjectiveQuality) {
    reasons.push('The request contains subjective quality language that needs an observable criterion.')
  }
  if (signals.hasRestrictedFileChange || signals.hasHighRiskArea) {
    reasons.push('The request touches restricted or high-risk areas that should not be finalized by assumption.')
  }
  if (profile === 'lite' && hardTriggers.includes('expected-files-cap-exceeded')) {
    reasons.push('The request appears to exceed the compact workload cap.')
  }
  if (signals.hasProductMeaningChange || transition === 'product-patch') {
    reasons.push('Product meaning or acceptance basis may change and needs explicit confirmation.')
  }
  if (transition === 'acceptance') {
    reasons.push('Final acceptance must come from the user.')
  }
  if (hardTriggers.length > 0) {
    reasons.push('A hard trigger requires a Human Gate regardless of clarity score.')
  } else if (score < 0.6) {
    reasons.push('The clarity score is below the Human Gate threshold.')
  } else {
    reasons.push('No hard trigger was detected and the clarity score is sufficient for advisory proceed.')
  }

  return unique(reasons)
}

function buildRecommendedQuestion(
  signals: HumanGateSignals,
  hardTriggers: string[],
  transition: HumanGateTransition,
  profile: HumanGateProfile,
  inputText: string,
): string {
  if (transition === 'acceptance' || hardTriggers.includes('final-acceptance')) {
    return signals.hasKorean
      ? '증거가 검토 준비 상태입니다. 이 결과를 승인하시겠습니까, 아니면 수정이 필요합니까?'
      : 'Evidence is ready for review. Do you accept this result, or should it be revised?'
  }
  if (
    hardTriggers.includes('high-risk-area') ||
    hardTriggers.includes('restricted-file-change') ||
    hasAny(signals.normalized, questionHighRiskTerms)
  ) {
    return signals.hasKorean
      ? '\uC774 \uC791\uC5C5\uC740 \uC778\uC99D/\uBCF4\uC548/\uAD8C\uD55C \uB4F1 \uACE0\uC704\uD5D8 \uC601\uC5ED\uC5D0 \uD574\uB2F9\uD569\uB2C8\uB2E4. \uD3EC\uD568\uD560 \uC815\uD655\uD55C \uBC94\uC704, \uC218\uC815 \uD30C\uC77C, \uAC80\uC99D \uAE30\uC900\uC740 \uC5B4\uB514\uAE4C\uC9C0\uC778\uAC00\uC694?'
      : 'This touches a high-risk area. What exact scope, affected files, and verification criteria should be included?'
  }
  if (hasStorageQuestionDomain(signals)) {
    return signals.hasKorean
      ? '\uC800\uC7A5 \uC704\uCE58\uC640 \uBC29\uC2DD\uC774 \uBA85\uC2DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. localStorage, \uD30C\uC77C, DB/API, \uB610\uB294 \uB2E4\uB978 \uC800\uC7A5 \uBC29\uC2DD \uC911 \uBB34\uC5C7\uC744 \uC0AC\uC6A9\uD560\uAE4C\uC694?'
      : 'Storage behavior is unspecified. Should this use localStorage, a file, DB/API persistence, or another storage method?'
  }
  if (hardTriggers.includes('restricted-file-change') || hardTriggers.includes('expected-files-cap-exceeded')) {
    return signals.hasKorean
      ? '이 작업은 Lite 범위를 넘거나 제한 파일을 건드릴 수 있습니다. 이 slice를 Full로 전환할까요?'
      : 'This appears to exceed the Lite scope or touches restricted files. Should DevView escalate this slice to Full?'
  }
  if (hardTriggers.includes('subjective-quality')) {
    return signals.hasKorean
      ? '품질 기준이 모호합니다. 여백, 정렬, 색상, 정보량, 문구 중 어떤 기준을 우선할까요?'
      : 'The quality target is subjective. Which concrete criterion should be prioritized: spacing, alignment, color, density, or wording?'
  }
  if (hardTriggers.includes('product-meaning-change') || hardTriggers.includes('product-patch')) {
    return signals.hasKorean
      ? '제품 의미나 acceptance 기준이 바뀌는 요청인가요? 바뀐다면 어떤 Product 기준을 새 기준으로 확정할까요?'
      : 'Does this change product meaning or acceptance criteria? If yes, what product rule should become the new confirmed basis?'
  }
  if (
    hardTriggers.includes('user-facing-ui-choice') ||
    hardTriggers.includes('multiple-implementation-options') ||
    (transition === 'product-to-work' && signals.hasUiChoiceSurface)
  ) {
    return signals.hasKorean
      ? '선택지 표시 방식이 명시되지 않았습니다. 버튼 리스트, Combobox, 카드형 중 어떤 방식으로 진행할까요?'
      : 'Selection UI is unspecified. Should it be a button list, Combobox, card list, or another control?'
  }
  if (!inputText.trim()) {
    return 'What product decision, implementation choice, or verification result should DevView assess?'
  }
  if (profile === 'bypass') {
    return 'Should this remain bypass work, or should DevView escalate to Lite/Full for traceability?'
  }
  return signals.hasKorean
    ? '이 가정을 확정해도 될까요, 아니면 범위나 검증 기준을 더 좁혀야 할까요?'
    : 'Can this assumption be confirmed, or should the scope or verification criterion be narrowed first?'
}

function hasStorageQuestionDomain(signals: HumanGateSignals): boolean {
  return (
    hasAny(signals.normalized, questionStorageTerms) && !hasAny(signals.normalized, questionStorageImplementationTerms)
  )
}

function ambiguityLevel(score: number): HumanGateAmbiguityLevel {
  if (score >= 0.8) {
    return 'low'
  }
  if (score >= 0.6) {
    return 'medium'
  }
  if (score >= 0.4) {
    return 'high'
  }
  return 'very-high'
}

function sumDimensions(dimensions: HumanGateDimensions): number {
  return Object.values(dimensions).reduce((sum, value) => sum + value, 0)
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle.toLowerCase()))
}

function hasFileReference(value: string): boolean {
  return /(?:^|\s)(?:[\w.-]+\/[\w./-]+|[\w.-]+\.(?:md|json|ts|tsx|js|jsx|css|scss|html|yml|yaml|cs|cpp|h|hpp))(?:\s|$)/i.test(
    value,
  )
}

function countFileReferences(value: string): number {
  return (
    value.match(
      /(?:^|\s)(?:[\w.-]+\/[\w./-]+|[\w.-]+\.(?:md|json|ts|tsx|js|jsx|css|scss|html|yml|yaml|cs|cpp|h|hpp))(?:\s|$)/gi,
    ) || []
  ).length
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}
