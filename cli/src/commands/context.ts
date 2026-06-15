import { isContextStage, recommendContext } from '../core/context-recommendation.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function contextRecommendCommand(context: CommandContext): Promise<CommandResult> {
  const brief = context.options.brief?.trim()
  const stage = context.options.stage

  if (stage && !isContextStage(stage)) {
    return {
      ok: false,
      command: 'context recommend',
      exitCode: ExitCode.InvalidArguments,
      message: `Unsupported context stage: ${stage}.`,
      issues: [
        issue({
          validator: 'CLI',
          code: 'CONTEXT_STAGE_UNSUPPORTED',
          severity: 'error',
          message: `Unsupported context stage: ${stage}.`,
          suggestedFix: 'Use one of: start, rpd, wpd, vd, execution, review, revision, product-patch, parallel.',
        }),
      ],
    }
  }

  if (!brief && !stage) {
    return {
      ok: false,
      command: 'context recommend',
      exitCode: ExitCode.InvalidArguments,
      message: 'Missing required option: provide --brief or --stage.',
      issues: [
        issue({
          validator: 'CLI',
          code: 'CONTEXT_INPUT_REQUIRED',
          severity: 'error',
          message: 'Missing required option: provide --brief or --stage.',
          suggestedFix: 'Run `pbe context recommend --brief "..."` or `pbe context recommend --stage <stage>`.',
        }),
      ],
    }
  }

  const recommendation = recommendContext({
    brief,
    stage,
    profile: context.options.profile,
  })

  return {
    ok: true,
    command: 'context recommend',
    exitCode: ExitCode.Success,
    message: formatContextRecommendation(recommendation),
    issues: [],
    data: { ...recommendation },
  }
}

type ContextRecommendation = ReturnType<typeof recommendContext>

function formatContextRecommendation(recommendation: ContextRecommendation): string {
  return [
    'Recommended context',
    '',
    `Detected stage: ${recommendation.detectedStage}`,
    `Profile: ${recommendation.profile || 'not specified'}`,
    '',
    'Skills:',
    ...formatList(recommendation.skills),
    '',
    'Read first:',
    ...formatList(recommendation.readFirst),
    '',
    'Read only if needed:',
    ...formatList(recommendation.readOnlyIfNeeded),
    '',
    'Do not read by default:',
    ...formatList(recommendation.doNotReadByDefault),
    '',
    'Reasons:',
    ...formatList(recommendation.reasons),
    '',
    'Notes:',
    ...formatList(recommendation.notes),
  ].join('\n')
}

function formatList(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ['- none']
}
