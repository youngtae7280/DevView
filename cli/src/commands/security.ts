import {
  EnterpriseReadinessReportValidationError,
  reportEnterpriseReadiness,
} from '../core/enterprise-readiness-report.js'
import {
  ProviderNetworkPolicyReportValidationError,
  reportProviderNetworkPolicy,
} from '../core/provider-network-policy-report.js'
import { RbacReadinessReportValidationError, reportRbacReadiness } from '../core/rbac-readiness-report.js'
import { RecordEnvelopePreviewValidationError, previewRecordEnvelope } from '../core/record-envelope-preview.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function securityReportEnterpriseReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportEnterpriseReadiness(context.options.root, {
      benchmarkGovernanceVerification: context.options.benchmarkGovernanceVerification,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
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

export async function securityReportProviderNetworkPolicyCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportProviderNetworkPolicy(context.options.root, {
      policy: context.options.policy,
      enterpriseReadiness: context.options.enterpriseReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-provider-network-policy',
      exitCode: ExitCode.Success,
      message: 'Provider/network default-deny policy recorded as a report-only artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof ProviderNetworkPolicyReportValidationError) {
      const report = error.report
      const blockers = report.policyFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-provider-network-policy',
        exitCode: ExitCode.ValidationFailed,
        message: 'Provider/network default-deny policy reporting is blocked before any provider or network activity.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'ProviderNetworkPolicy',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a default-deny policy source with empty allowlists and report-only safety flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-provider-network-policy',
      exitCode: ExitCode.ValidationFailed,
      message: 'Provider/network default-deny policy reporting could not run.',
      issues: [
        issue({
          validator: 'ProviderNetworkPolicy',
          code: 'PROVIDER_NETWORK_POLICY_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write provider/network policy outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityReportRbacReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportRbacReadiness(context.options.root, {
      enterpriseReadiness: context.options.enterpriseReadiness,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      benchmarkGovernanceVerification: context.options.benchmarkGovernanceVerification,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-rbac-readiness',
      exitCode: ExitCode.Success,
      message: 'RBAC and actor identity readiness recorded as a report-only artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof RbacReadinessReportValidationError) {
      const report = error.report
      const blockers = report.rbacReadinessFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-rbac-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'RBAC readiness reporting is blocked before any RBAC enforcement or signing.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'RbacReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only source artifacts with unsafe provider, execution, graph, lifecycle, CI, hook, and approval flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-rbac-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'RBAC readiness reporting could not run.',
      issues: [
        issue({
          validator: 'RbacReadiness',
          code: 'RBAC_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write RBAC readiness outputs outside source/control artifacts and inputs.',
        }),
      ],
    }
  }
}

export async function securityPreviewRecordEnvelopeCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await previewRecordEnvelope(context.options.root, {
      payload: context.options.payload,
      sourceArtifacts: context.options.sourceArtifacts,
      previousEnvelope: context.options.previousEnvelope,
      requiredPermission: context.options.requiredPermission,
      actorId: context.options.actorId,
      actorType: context.options.actorType,
      actorRole: context.options.actorRole,
      authorizationRationale: context.options.authorizationRationale,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security preview-record-envelope',
      exitCode: ExitCode.Success,
      message: 'Unsigned record envelope preview recorded as a deterministic report-only artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof RecordEnvelopePreviewValidationError) {
      const report = error.report
      const blockers = report.envelopeFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security preview-record-envelope',
        exitCode: ExitCode.ValidationFailed,
        message: 'Record envelope preview is blocked before any signing, RBAC enforcement, or source mutation.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'RecordEnvelopePreview',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide JSON payload/source artifacts with exact role/status, recognized actor and permission claims, and unsafe authority flags limited to exact source-fact roles.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security preview-record-envelope',
      exitCode: ExitCode.ValidationFailed,
      message: 'Record envelope preview could not run.',
      issues: [
        issue({
          validator: 'RecordEnvelopePreview',
          code: 'RECORD_ENVELOPE_PREVIEW_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --payload, --required-permission, --actor-id, --actor-type, --actor-role, and --output outside source/control artifacts.',
        }),
      ],
    }
  }
}
