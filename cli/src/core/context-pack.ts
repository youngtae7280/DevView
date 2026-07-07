import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { recommendContext, type ContextProfileOption, type ContextRecommendation } from './context-recommendation.js'
import type { HumanGateTransition } from './human-gate-assessment.js'
import type { ContextStageOption } from './types.js'

export const DEFAULT_CONTEXT_PACK_MAX_CHARS = 12000

export interface ContextPackInput {
  pluginRoot: string
  brief?: string
  stage?: ContextStageOption
  profile?: ContextProfileOption
  maxChars?: number
}

export interface ContextPackIncludedFile {
  path: string
  included: boolean
  truncated: boolean
  chars: number
  content: string
}

export interface ContextPack {
  recommendation: ContextRecommendation
  includedFiles: ContextPackIncludedFile[]
  suggestedGateAssessment: SuggestedGateAssessment
  bundle: string
  warnings: string[]
  readOnly: true
}

export interface SuggestedGateAssessment {
  enabled: boolean
  transition?: HumanGateTransition
  profile?: ContextProfileOption
  command?: string
  reason: string
}

export function createContextPack(input: ContextPackInput): ContextPack {
  const maxChars = input.maxChars || DEFAULT_CONTEXT_PACK_MAX_CHARS
  const recommendation = recommendContext({
    brief: input.brief,
    stage: input.stage,
    profile: input.profile,
  })
  const suggestedGateAssessment = buildSuggestedGateAssessment(recommendation, input.brief?.trim(), input.profile)
  const warnings: string[] = []
  const includedFiles = recommendation.readFirst.map((relativePath) =>
    readContextFile(input.pluginRoot, relativePath, warnings),
  )

  let bundle = formatContextPackMarkdown(recommendation, includedFiles, suggestedGateAssessment, warnings)
  if (bundle.length > maxChars) {
    warnings.push(`Context pack exceeded --max-chars ${maxChars}; bundle was truncated.`)
    bundle = truncateText(
      formatContextPackMarkdown(recommendation, includedFiles, suggestedGateAssessment, warnings),
      maxChars,
    )
  }

  return {
    recommendation,
    includedFiles,
    suggestedGateAssessment,
    bundle,
    warnings,
    readOnly: true,
  }
}

function readContextFile(pluginRoot: string, relativePath: string, warnings: string[]): ContextPackIncludedFile {
  const absolutePath = resolve(pluginRoot, relativePath)
  if (!existsSync(absolutePath)) {
    warnings.push(`Recommended readFirst file was not found: ${relativePath}`)
    return {
      path: relativePath,
      included: false,
      truncated: false,
      chars: 0,
      content: '',
    }
  }

  const content = readFileSync(absolutePath, 'utf8')
  return {
    path: relativePath,
    included: true,
    truncated: false,
    chars: content.length,
    content,
  }
}

function formatContextPackMarkdown(
  recommendation: ContextRecommendation,
  includedFiles: ContextPackIncludedFile[],
  suggestedGateAssessment: SuggestedGateAssessment,
  warnings: string[],
): string {
  return [
    '# DevView Context Pack',
    '',
    '## Recommendation Summary',
    '',
    `- detectedStage: ${recommendation.detectedStage}`,
    `- profile: ${recommendation.profile || 'not specified'}`,
    '- skills:',
    ...formatList(recommendation.skills, '  '),
    '',
    '## Suggested Human Gate Assessment',
    '',
    ...formatSuggestedGateAssessment(suggestedGateAssessment),
    '',
    '## Operating Rules',
    '',
    '- Read this context pack first.',
    '- Do not read broad docs by default.',
    '- Read `readOnlyIfNeeded` files only when the task requires that detail.',
    '- For compact work, keep scope bounded and avoid long reports.',
    '',
    '## Included Context',
    '',
    ...formatIncludedContext(includedFiles),
    '',
    '## Read Only If Needed',
    '',
    ...formatList(recommendation.readOnlyIfNeeded),
    '',
    '## Do Not Read By Default',
    '',
    ...formatList(recommendation.doNotReadByDefault),
    '',
    '## Warnings',
    '',
    ...formatList(warnings.length > 0 ? warnings : ['none']),
  ].join('\n')
}

export function buildSuggestedGateAssessment(
  recommendation: ContextRecommendation,
  brief: string | undefined,
  requestedProfile?: ContextProfileOption,
): SuggestedGateAssessment {
  const transition = mapDetectedStageToGateTransition(recommendation.detectedStage)
  const profile = requestedProfile || recommendation.profile || 'lite'

  if (!brief) {
    return {
      enabled: false,
      transition,
      profile,
      reason: 'No brief/text was provided for gate assessment.',
    }
  }

  return {
    enabled: true,
    transition,
    profile,
    command: `devview gate assess --text "${escapeGateAssessText(brief)}" --transition ${transition} --profile ${profile}`,
    reason: 'Run this before allowing AI assumptions to become implementation decisions.',
  }
}

export function mapDetectedStageToGateTransition(stage: ContextRecommendation['detectedStage']): HumanGateTransition {
  const transitionByStage: Record<ContextRecommendation['detectedStage'], HumanGateTransition> = {
    start: 'product-tree',
    'product-intake': 'product-tree',
    documentation: 'work-scope',
    'work-planning': 'product-to-work',
    'verification-design': 'work-to-test',
    execution: 'acep-preflight',
    review: 'review-revision',
    revision: 'review-revision',
    'product-patch': 'product-patch',
    parallel: 'work-scope',
  }

  return transitionByStage[stage] || 'product-to-work'
}

function escapeGateAssessText(value: string): string {
  return value.replace(/(["\\])/g, '\\$1')
}

function formatSuggestedGateAssessment(suggestedGateAssessment: SuggestedGateAssessment): string[] {
  if (!suggestedGateAssessment.enabled) {
    return ['No gate assessment command was suggested because no brief/text was provided.']
  }

  return [
    'Before turning the request into implementation work, run:',
    '',
    '```bash',
    suggestedGateAssessment.command || '',
    '```',
    '',
    'Reason:',
    '',
    `- ${suggestedGateAssessment.reason}`,
  ]
}

function formatIncludedContext(includedFiles: ContextPackIncludedFile[]): string[] {
  if (includedFiles.length === 0) {
    return ['- none']
  }

  return includedFiles.flatMap((entry) => [
    `### ${entry.path}`,
    '',
    entry.included ? entry.content.trimEnd() : '_Not included: file was not found._',
    '',
  ])
}

function formatList(values: string[], indent = ''): string[] {
  return values.length > 0 ? values.map((value) => `${indent}- ${value}`) : [`${indent}- none`]
}

function truncateText(value: string, maxChars: number): string {
  const suffix = '\n\n[Context pack truncated by --max-chars]\n'
  if (maxChars <= suffix.length) {
    return value.slice(0, Math.max(0, maxChars))
  }
  return `${value.slice(0, maxChars - suffix.length)}${suffix}`
}
