import { reportExtensionReadiness } from '../core/extension-readiness.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function extensionsReportReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportExtensionReadiness(context.options.root, {
      projectProfile: context.options.projectProfile,
      extensionsDir: context.options.extensionsDir,
      output: context.options.output,
      markdown: context.options.markdown,
    })
    const blocked = report.status !== 'devview-extension-readiness-ready'
    const errorFindings = report.findings.filter((finding) => finding.severity === 'error')

    return {
      ok: !blocked,
      command: 'extensions report-readiness',
      exitCode: blocked ? ExitCode.ValidationFailed : ExitCode.Success,
      message: blocked
        ? 'Extension readiness is blocked before any extension execution.'
        : 'Extension readiness reported without executing extension code.',
      issues: blocked
        ? errorFindings.map((finding) =>
            issue({
              validator: 'ExtensionReadiness',
              code: finding.code,
              severity: finding.severity,
              message: finding.message,
              file: finding.path,
              reason: finding.field ? `Field: ${finding.field}` : undefined,
              suggestedFix:
                'Use a declarative DevView Project Profile and Extension Manifest with supported capability and permission declarations.',
            }),
          )
        : [],
      data: { ...report },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'extensions report-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Extension readiness could not run.',
      issues: [
        issue({
          validator: 'ExtensionReadiness',
          code: 'EXTENSION_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Write extension readiness output to a dedicated report path outside source/control artifacts and rerun the command.',
        }),
      ],
    }
  }
}
