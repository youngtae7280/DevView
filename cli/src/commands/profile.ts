import { recommendProfile } from '../core/profile-recommendation.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function profileRecommendCommand(context: CommandContext): Promise<CommandResult> {
  const brief = context.options.brief?.trim()
  if (!brief) {
    return {
      ok: false,
      command: 'profile recommend',
      exitCode: ExitCode.InvalidArguments,
      message: 'Missing required option: --brief',
      issues: [
        issue({
          validator: 'CLI',
          code: 'PROFILE_BRIEF_REQUIRED',
          severity: 'error',
          message: 'Missing required option: --brief',
          suggestedFix: 'Run `devview profile recommend --brief "..."` with a short task description.',
        }),
      ],
    }
  }

  const recommendation = recommendProfile({
    brief,
    files: context.options.files || [],
  })

  return {
    ok: true,
    command: 'profile recommend',
    exitCode: ExitCode.Success,
    message: formatProfileRecommendation(recommendation),
    issues: [],
    data: { ...recommendation },
  }
}

type ProfileRecommendation = ReturnType<typeof recommendProfile>

function formatProfileRecommendation(recommendation: ProfileRecommendation): string {
  return [
    `Recommended workflow depth: ${recommendation.workflowDepth}`,
    `Compatibility profile value: ${recommendation.recommendedProfile}`,
    `Confidence: ${recommendation.confidence}`,
    '',
    'Reasons:',
    ...recommendation.reasons.map((reason) => `- ${reason}`),
    '',
    'Escalation triggers:',
    ...recommendation.escalationTriggers.map((trigger) => `- ${trigger}`),
    '',
    'Suggested init command:',
    recommendation.suggestedInitCommand,
    '',
    'Notes:',
    ...recommendation.notes.map((note) => `- ${note}`),
  ].join('\n')
}
