import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { recommendContext, type ContextProfileOption, type ContextRecommendation } from './context-recommendation.js'
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
  bundle: string
  warnings: string[]
  readOnly: true
}

export function createContextPack(input: ContextPackInput): ContextPack {
  const maxChars = input.maxChars || DEFAULT_CONTEXT_PACK_MAX_CHARS
  const recommendation = recommendContext({
    brief: input.brief,
    stage: input.stage,
    profile: input.profile,
  })
  const warnings: string[] = []
  const includedFiles = recommendation.readFirst.map((relativePath) =>
    readContextFile(input.pluginRoot, relativePath, warnings),
  )

  let bundle = formatContextPackMarkdown(recommendation, includedFiles, warnings)
  if (bundle.length > maxChars) {
    warnings.push(`Context pack exceeded --max-chars ${maxChars}; bundle was truncated.`)
    bundle = truncateText(formatContextPackMarkdown(recommendation, includedFiles, warnings), maxChars)
  }

  return {
    recommendation,
    includedFiles,
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
  warnings: string[],
): string {
  return [
    '# PBE Context Pack',
    '',
    '## Recommendation Summary',
    '',
    `- detectedStage: ${recommendation.detectedStage}`,
    `- profile: ${recommendation.profile || 'not specified'}`,
    '- skills:',
    ...formatList(recommendation.skills, '  '),
    '',
    '## Operating Rules',
    '',
    '- Read this context pack first.',
    '- Do not read broad docs by default.',
    '- Read `readOnlyIfNeeded` files only when the task requires that detail.',
    '- For Lite work, keep scope compact and avoid long reports.',
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
