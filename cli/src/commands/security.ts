import {
  EnterpriseReadinessReportValidationError,
  reportEnterpriseReadiness,
} from '../core/enterprise-readiness-report.js'
import {
  ProviderNetworkPolicyReportValidationError,
  reportProviderNetworkPolicy,
} from '../core/provider-network-policy-report.js'
import {
  PackageProvenanceInputsRecordValidationError,
  recordPackageProvenanceInputs,
} from '../core/package-provenance-inputs-record.js'
import {
  PackageArtifactDigestRecordValidationError,
  recordPackageArtifactDigest,
} from '../core/package-artifact-digest-record.js'
import {
  ProvenanceAttestationValidationError,
  validateProvenanceAttestation,
} from '../core/provenance-attestation-validation.js'
import {
  ProvenanceVerificationReadinessReportValidationError,
  reportProvenanceVerificationReadiness,
} from '../core/provenance-verification-readiness-report.js'
import {
  CiBranchGovernanceReadinessReportValidationError,
  reportCiBranchGovernanceReadiness,
} from '../core/ci-branch-governance-readiness-report.js'
import { CiBranchActivationPlanValidationError, planCiBranchActivation } from '../core/ci-branch-activation-plan.js'
import {
  CiBranchActivationAuthorityReadinessReportValidationError,
  reportCiBranchActivationAuthorityReadiness,
} from '../core/ci-branch-activation-authority-readiness-report.js'
import { CiBranchPolicyValidationError, validateCiBranchPolicy } from '../core/ci-branch-policy-validation.js'
import { RbacPolicyValidationError, validateRbacPolicy } from '../core/rbac-policy-validation.js'
import { RbacReadinessReportValidationError, reportRbacReadiness } from '../core/rbac-readiness-report.js'
import { RecordEnvelopePreviewValidationError, previewRecordEnvelope } from '../core/record-envelope-preview.js'
import {
  RecordEnvelopeVerificationValidationError,
  verifyRecordEnvelope,
} from '../core/record-envelope-verification.js'
import {
  ReleaseProvenanceReadinessReportValidationError,
  reportReleaseProvenanceReadiness,
} from '../core/release-provenance-readiness-report.js'
import { SbomArtifactValidationError, validateSbomArtifact } from '../core/sbom-artifact-validation.js'
import { SigningReadinessReportValidationError, reportSigningReadiness } from '../core/signing-readiness-report.js'
import type { CommandResult } from '../core/types.js'
import { ExitCode, issue } from '../core/types.js'
import type { CommandContext } from './shared.js'

export async function securityReportEnterpriseReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportEnterpriseReadiness(context.options.root, {
      benchmarkGovernanceVerification: context.options.benchmarkGovernanceVerification,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      recordEnvelopePreview: context.options.recordEnvelopePreview,
      recordEnvelopeVerification: context.options.recordEnvelopeVerification,
      signingReadiness: context.options.signingReadiness,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      releaseProvenanceReadiness: context.options.releaseProvenanceReadiness,
      sbomValidation: context.options.sbomValidation,
      packageProvenanceInputs: context.options.packageProvenanceInputs,
      packageArtifactDigest: context.options.packageArtifactDigest,
      provenanceAttestationValidation: context.options.provenanceAttestationValidation,
      provenanceVerificationReadiness: context.options.provenanceVerificationReadiness,
      ciBranchGovernanceReadiness: context.options.ciBranchGovernanceReadiness,
      ciBranchPolicyValidation: context.options.ciBranchPolicyValidation,
      ciBranchActivationPlan: context.options.ciBranchActivationPlan,
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

export async function securityReportReleaseProvenanceCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportReleaseProvenanceReadiness(context.options.root, {
      enterpriseReadiness: context.options.enterpriseReadiness,
      signingReadiness: context.options.signingReadiness,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-release-provenance',
      exitCode: ExitCode.Success,
      message: 'Release provenance and SBOM readiness reported without signing, publishing, or SBOM generation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof ReleaseProvenanceReadinessReportValidationError) {
      const report = error.report
      const blockers = report.releaseProvenanceFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-release-provenance',
        exitCode: ExitCode.ValidationFailed,
        message: 'Release provenance readiness reporting is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'ReleaseProvenanceReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only source facts with no package signing, SBOM, provenance, RBAC, provider/network, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-release-provenance',
      exitCode: ExitCode.ValidationFailed,
      message: 'Release provenance readiness reporting could not run.',
      issues: [
        issue({
          validator: 'ReleaseProvenanceReadiness',
          code: 'RELEASE_PROVENANCE_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write release provenance readiness outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityValidateSbomArtifactCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await validateSbomArtifact(context.options.root, {
      sbom: context.options.sbom,
      releaseProvenanceReadiness: context.options.releaseProvenanceReadiness,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      packageJson: context.options.packageJson,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security validate-sbom-artifact',
      exitCode: ExitCode.Success,
      message: 'Preexisting SBOM artifact validated as a report-only source fact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof SbomArtifactValidationError) {
      const report = error.report
      const blockers = report.validationFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security validate-sbom-artifact',
        exitCode: ExitCode.ValidationFailed,
        message: 'SBOM artifact validation is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'SbomArtifactValidation',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a wrapped static SBOM source fact with matching package identity, exact source roles/statuses, and no signing, provenance, provider/network, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security validate-sbom-artifact',
      exitCode: ExitCode.ValidationFailed,
      message: 'SBOM artifact validation could not run.',
      issues: [
        issue({
          validator: 'SbomArtifactValidation',
          code: 'SBOM_VALIDATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --sbom and --output and write SBOM validation outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityRecordPackageProvenanceInputsCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await recordPackageProvenanceInputs(context.options.root, {
      packageJson: context.options.packageJson,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      releaseProvenanceReadiness: context.options.releaseProvenanceReadiness,
      sbomValidation: context.options.sbomValidation,
      sourceRef: context.options.sourceRef,
      buildCommand: context.options.buildCommand,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security record-package-provenance-inputs',
      exitCode: ExitCode.Success,
      message: 'Package provenance inputs recorded as deterministic report-only source facts.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof PackageProvenanceInputsRecordValidationError) {
      const report = error.report
      const blockers = report.packageProvenanceFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security record-package-provenance-inputs',
        exitCode: ExitCode.ValidationFailed,
        message: 'Package provenance inputs recording is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'PackageProvenanceInputs',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide package/release/SBOM source facts with exact role/status, matching package identity, and no package signing, SBOM generation, provenance, provider/network, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security record-package-provenance-inputs',
      exitCode: ExitCode.ValidationFailed,
      message: 'Package provenance inputs recording could not run.',
      issues: [
        issue({
          validator: 'PackageProvenanceInputs',
          code: 'PACKAGE_PROVENANCE_INPUTS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write package provenance input outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityRecordPackageArtifactDigestCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await recordPackageArtifactDigest(context.options.root, {
      packageArtifact: context.options.packageArtifact,
      expectedSha256: context.options.expectedSha256,
      packageProvenanceInputs: context.options.packageProvenanceInputs,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security record-package-artifact-digest',
      exitCode: ExitCode.Success,
      message: 'Package artifact digest recorded from a preexisting artifact without packing, signing, or attesting.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof PackageArtifactDigestRecordValidationError) {
      const report = error.report
      const blockers = report.packageDigestRecordFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security record-package-artifact-digest',
        exitCode: ExitCode.ValidationFailed,
        message: 'Package artifact digest recording is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'PackageArtifactDigest',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a preexisting package artifact and exact report-only source facts with no package generation, signing, SBOM, provenance, provider/network, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security record-package-artifact-digest',
      exitCode: ExitCode.ValidationFailed,
      message: 'Package artifact digest recording could not run.',
      issues: [
        issue({
          validator: 'PackageArtifactDigest',
          code: 'PACKAGE_ARTIFACT_DIGEST_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --package-artifact and --output and write package artifact digest outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityValidateProvenanceAttestationCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await validateProvenanceAttestation(context.options.root, {
      attestation: context.options.attestation,
      packageProvenanceInputs: context.options.packageProvenanceInputs,
      packageArtifactDigest: context.options.packageArtifactDigest,
      releaseProvenanceReadiness: context.options.releaseProvenanceReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security validate-provenance-attestation',
      exitCode: ExitCode.Success,
      message: 'Preexisting provenance attestation artifact validated as a report-only source fact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof ProvenanceAttestationValidationError) {
      const report = error.report
      const blockers = report.validationFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security validate-provenance-attestation',
        exitCode: ExitCode.ValidationFailed,
        message: 'Provenance attestation validation is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'ProvenanceAttestationValidation',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a wrapped static provenance attestation source fact with matching package digest/source inputs and no signing, provider/network, RBAC, CI, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security validate-provenance-attestation',
      exitCode: ExitCode.ValidationFailed,
      message: 'Provenance attestation validation could not run.',
      issues: [
        issue({
          validator: 'ProvenanceAttestationValidation',
          code: 'PROVENANCE_ATTESTATION_VALIDATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --attestation and --output and write provenance attestation validation outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityReportProvenanceVerificationReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  try {
    const report = await reportProvenanceVerificationReadiness(context.options.root, {
      provenanceAttestationValidation: context.options.provenanceAttestationValidation,
      signingReadiness: context.options.signingReadiness,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      recordEnvelopeVerification: context.options.recordEnvelopeVerification,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-provenance-verification-readiness',
      exitCode: ExitCode.Success,
      message:
        'Provenance verification readiness reported without SLSA/in-toto verification, signing, keys, RBAC enforcement, or CI activation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof ProvenanceVerificationReadinessReportValidationError) {
      const report = error.report
      const blockers = report.provenanceVerificationFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-provenance-verification-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'Provenance verification readiness reporting is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'ProvenanceVerificationReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only provenance, signing, RBAC, envelope, and provider/network source facts with no signing, verification, key, RBAC, provider/network, CI, or lifecycle authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-provenance-verification-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Provenance verification readiness reporting could not run.',
      issues: [
        issue({
          validator: 'ProvenanceVerificationReadiness',
          code: 'PROVENANCE_VERIFICATION_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --provenance-attestation-validation and --output and write provenance verification readiness outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityReportCiBranchGovernanceReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  try {
    const report = await reportCiBranchGovernanceReadiness(context.options.root, {
      scopeCiEnforcementReadiness: context.options.scopeCiEnforcementReadiness,
      scopeCiEnforcementRecord: context.options.scopeCiEnforcementRecord,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      signingReadiness: context.options.signingReadiness,
      provenanceVerificationReadiness: context.options.provenanceVerificationReadiness,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      workflow: context.options.workflow,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-ci-branch-governance-readiness',
      exitCode: ExitCode.Success,
      message:
        'CI/branch governance readiness reported without workflow execution, provider calls, branch mutation, hooks, or enterprise gate activation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof CiBranchGovernanceReadinessReportValidationError) {
      const report = error.report
      const blockers = report.governanceFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-ci-branch-governance-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'CI/branch governance readiness reporting is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'CiBranchGovernanceReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only CI, RBAC, signing, provenance, release-surface, workflow, and provider/network source facts with external CI, branch, hook, provider, signing, and RBAC authority flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-ci-branch-governance-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'CI/branch governance readiness reporting could not run.',
      issues: [
        issue({
          validator: 'CiBranchGovernanceReadiness',
          code: 'CI_BRANCH_GOVERNANCE_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write CI/branch governance readiness outputs outside workflow/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityValidateCiBranchPolicyCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await validateCiBranchPolicy(context.options.root, {
      policy: context.options.policy,
      ciBranchGovernanceReadiness: context.options.ciBranchGovernanceReadiness,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      signingReadiness: context.options.signingReadiness,
      provenanceVerificationReadiness: context.options.provenanceVerificationReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security validate-ci-branch-policy',
      exitCode: ExitCode.Success,
      message:
        'CI/branch policy validated as a report-only source fact without required-check, branch, hook, provider, or enterprise mutation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof CiBranchPolicyValidationError) {
      const report = error.report
      const blockers = report.policyFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security validate-ci-branch-policy',
        exitCode: ExitCode.ValidationFailed,
        message: 'CI/branch policy validation is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'CiBranchPolicyValidation',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a declarative default-deny CI/branch policy with no external CI, branch, hook, provider, RBAC, signing, key, provenance, or enterprise authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security validate-ci-branch-policy',
      exitCode: ExitCode.ValidationFailed,
      message: 'CI/branch policy validation could not run.',
      issues: [
        issue({
          validator: 'CiBranchPolicyValidation',
          code: 'CI_BRANCH_POLICY_VALIDATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --policy and --output and write CI/branch policy validation outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityPlanCiBranchActivationCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await planCiBranchActivation(context.options.root, {
      ciBranchPolicyValidation: context.options.ciBranchPolicyValidation,
      ciBranchGovernanceReadiness: context.options.ciBranchGovernanceReadiness,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      signingReadiness: context.options.signingReadiness,
      provenanceVerificationReadiness: context.options.provenanceVerificationReadiness,
      recordEnvelopeVerification: context.options.recordEnvelopeVerification,
      releaseSurfaceValidation: context.options.releaseSurfaceValidation,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security plan-ci-branch-activation',
      exitCode: ExitCode.Success,
      message:
        'CI/branch activation plan recorded as a non-authoritative report-only sequence without CI provider calls, branch mutation, hooks, or enterprise gate activation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof CiBranchActivationPlanValidationError) {
      const report = error.report
      const blockers = report.planFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security plan-ci-branch-activation',
        exitCode: ExitCode.ValidationFailed,
        message: 'CI/branch activation planning is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'CiBranchActivationPlan',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only CI/branch source facts with required-check, branch, hook, provider, RBAC, signing, key, provenance, and enterprise authority flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security plan-ci-branch-activation',
      exitCode: ExitCode.ValidationFailed,
      message: 'CI/branch activation planning could not run.',
      issues: [
        issue({
          validator: 'CiBranchActivationPlan',
          code: 'CI_BRANCH_ACTIVATION_PLAN_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --ci-branch-policy-validation and --output and write activation plan outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityReportCiBranchActivationAuthorityReadinessCommand(
  context: CommandContext,
): Promise<CommandResult> {
  try {
    const report = await reportCiBranchActivationAuthorityReadiness(context.options.root, {
      ciBranchActivationPlan: context.options.ciBranchActivationPlan,
      ciBranchPolicyValidation: context.options.ciBranchPolicyValidation,
      ciBranchGovernanceReadiness: context.options.ciBranchGovernanceReadiness,
      providerNetworkPolicyReport: context.options.providerNetworkPolicyReport,
      rbacPolicyValidation: context.options.rbacPolicyValidation,
      signingReadiness: context.options.signingReadiness,
      recordEnvelopeVerification: context.options.recordEnvelopeVerification,
      provenanceVerificationReadiness: context.options.provenanceVerificationReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-ci-branch-activation-authority-readiness',
      exitCode: ExitCode.Success,
      message:
        'CI/branch activation authority readiness reported without signing, RBAC enforcement, provider calls, branch mutation, hooks, or enterprise gate activation.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof CiBranchActivationAuthorityReadinessReportValidationError) {
      const report = error.report
      const blockers = report.authorityFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-ci-branch-activation-authority-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'CI/branch activation authority readiness reporting is blocked before any output write.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'CiBranchActivationAuthorityReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only source facts with signed policy, provider grants, RBAC enforcement, required-check, branch, hook, provider, signing, key, provenance, and enterprise authority claims false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-ci-branch-activation-authority-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'CI/branch activation authority readiness reporting could not run.',
      issues: [
        issue({
          validator: 'CiBranchActivationAuthorityReadiness',
          code: 'CI_BRANCH_ACTIVATION_AUTHORITY_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --ci-branch-activation-plan and --output and write outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityValidateRbacPolicyCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await validateRbacPolicy(context.options.root, {
      policy: context.options.policy,
      rbacReadiness: context.options.rbacReadiness,
      signingReadiness: context.options.signingReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security validate-rbac-policy',
      exitCode: ExitCode.Success,
      message: 'RBAC role assignment policy validated as a report-only readiness artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof RbacPolicyValidationError) {
      const report = error.report
      const blockers = report.policyFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security validate-rbac-policy',
        exitCode: ExitCode.ValidationFailed,
        message: 'RBAC policy validation is blocked before any RBAC enforcement or signing.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'RbacPolicyValidation',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide a declarative default-deny RBAC policy with known actors, roles, and permissions, no key material, and no execution/provider/network/approval authority claims.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security validate-rbac-policy',
      exitCode: ExitCode.ValidationFailed,
      message: 'RBAC policy validation could not run.',
      issues: [
        issue({
          validator: 'RbacPolicyValidation',
          code: 'RBAC_POLICY_VALIDATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --policy and --output and write RBAC policy validation outputs outside source/control artifacts and source inputs.',
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

export async function securityVerifyRecordEnvelopeCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await verifyRecordEnvelope(context.options.root, {
      recordEnvelopePreview: context.options.recordEnvelopePreview,
      payload: context.options.payload,
      sourceArtifacts: context.options.sourceArtifacts,
      previousEnvelope: context.options.previousEnvelope,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security verify-record-envelope',
      exitCode: ExitCode.Success,
      message: 'Record envelope preview verified as a deterministic report-only artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof RecordEnvelopeVerificationValidationError) {
      const report = error.report
      const blockers = report.verificationFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security verify-record-envelope',
        exitCode: ExitCode.ValidationFailed,
        message: 'Record envelope verification is blocked before any signing, RBAC enforcement, or source mutation.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'RecordEnvelopeVerification',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide the explicit payload, source artifacts, and previous envelope files that match the unsigned preview digests.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security verify-record-envelope',
      exitCode: ExitCode.ValidationFailed,
      message: 'Record envelope verification could not run.',
      issues: [
        issue({
          validator: 'RecordEnvelopeVerification',
          code: 'RECORD_ENVELOPE_VERIFICATION_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --record-envelope-preview, --payload, and --output outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}

export async function securityReportSigningReadinessCommand(context: CommandContext): Promise<CommandResult> {
  try {
    const report = await reportSigningReadiness(context.options.root, {
      rbacReadiness: context.options.rbacReadiness,
      recordEnvelopePreview: context.options.recordEnvelopePreview,
      recordEnvelopeVerification: context.options.recordEnvelopeVerification,
      enterpriseReadiness: context.options.enterpriseReadiness,
      output: context.options.output,
      markdown: context.options.markdown,
    })

    return {
      ok: true,
      command: 'security report-signing-readiness',
      exitCode: ExitCode.Success,
      message: 'Signing and key governance readiness recorded as a report-only artifact.',
      issues: [],
      data: { ...report },
    }
  } catch (error) {
    if (error instanceof SigningReadinessReportValidationError) {
      const report = error.report
      const blockers = report.signingReadinessFindings.filter((finding) => finding.severity === 'blocker')
      return {
        ok: false,
        command: 'security report-signing-readiness',
        exitCode: ExitCode.ValidationFailed,
        message: 'Signing readiness reporting is blocked before any signing, key management, or RBAC enforcement.',
        issues: blockers.map((finding) =>
          issue({
            validator: 'SigningReadiness',
            code: finding.code,
            severity: 'error',
            message: finding.message,
            file: finding.path,
            reason: finding.field ? `Field: ${finding.field}` : undefined,
            suggestedFix:
              'Provide exact report-only RBAC, envelope preview, envelope verification, and enterprise readiness sources with signing, key, RBAC, provider, graph, CI, hook, and approval authority flags false.',
          }),
        ),
        data: { ...report },
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      command: 'security report-signing-readiness',
      exitCode: ExitCode.ValidationFailed,
      message: 'Signing readiness reporting could not run.',
      issues: [
        issue({
          validator: 'SigningReadiness',
          code: 'SIGNING_READINESS_FAILED',
          severity: 'error',
          message,
          suggestedFix:
            'Provide --output and write signing readiness outputs outside source/control artifacts and source inputs.',
        }),
      ],
    }
  }
}
