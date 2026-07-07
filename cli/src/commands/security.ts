import {
  EnterpriseReadinessReportValidationError,
  reportEnterpriseReadiness,
} from '../core/enterprise-readiness-report.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function securityReportEnterpriseReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportEnterpriseReadiness(context.options.root, {
      benchmarkGovernanceVerification: context.options.benchmarkGovernanceVerification,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-enterprise-readiness',
      exitCode: ExitCode.Success,
      message: 'Enterprise readiness aggregated as a report-only hardening assessment.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof EnterpriseReadinessReportValidationError) {
      const report = error.report
      const blockers = report.enterpriseReadinessFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-enterprise-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'Enterprise readiness reporting is blocked before any enterprise gate activation.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'EnterpriseReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only source artifacts with unsafe execution, provider, graph, CI, hook, and approval flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-enterprise-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Enterprise readiness reporting could not run.',
      issues: [
        issue({
          validator: 'EnterpriseReadiness',
          code: 'ENTERPRISE_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write enterprise readiness outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}
