import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'
import {
  hasCodexControlDirectory,
  hasDevViewControlDirectory,
  hasHiddenControlDirectorySegment,
} from './path-safety.js'

type JsonRecord = Record<string, unknown>

const POLICY_ROLE = 'devview-rbac-policy'
const POLICY_STATUS = 'devview-rbac-policy-configured'
const REPORT_ROLE = 'devview-rbac-policy-validation-report'
const PASSED_STATUS = 'devview-rbac-policy-validation-passed'
const BLOCKED_STATUS = 'devview-rbac-policy-validation-blocked'
const RBAC_READINESS_ROLE = 'devview-rbac-readiness-report'
const RBAC_READINESS_STATUS = 'devview-rbac-readiness-reported'
const SIGNING_READINESS_ROLE = 'devview-signing-readiness-report'
const SIGNING_READINESS_STATUS = 'devview-signing-readiness-reported'

const actorTypes = ['human', 'automation', 'service', 'extension-author'] as const
const knownRoles = [
  'reporter',
  'evidence-reviewer',
  'runtime-authority-recorder',
  'scope-ci-recorder',
  'graph-update-operator',
  'benchmark-governor',
  'provider-network-policy-maintainer',
  'extension-author',
  'auditor',
] as const
const knownPermissions = [
  'report.create',
  'enterprise.readiness.report',
  'evidence.decision.record',
  'evidence.accept.record',
  'runtime.satisfaction.record',
  'equivalence.proof.record',
  'scope-ci.enforcement.record',
  'graph.boundary.record',
  'graph.apply-plan.record',
  'graph.apply.authorize',
  'graph.apply.execute',
  'benchmark.golden.review',
  'benchmark.suite.lock',
  'benchmark.governance.verify',
  'provider-network.policy.record',
  'extension.manifest.publish',
  'audit.verify',
] as const
const futureOnlyPermissions = [
  'external-ci.activation.approve',
  'provider-network.policy.allow',
  'extension.execution.approve',
  'signed-record-chain.verify',
] as const
const builtInRolePermissions = new Map<string, string[]>([
  ['reporter', ['report.create', 'enterprise.readiness.report']],
  ['evidence-reviewer', ['evidence.decision.record', 'evidence.accept.record']],
  ['runtime-authority-recorder', ['runtime.satisfaction.record', 'equivalence.proof.record']],
  ['scope-ci-recorder', ['scope-ci.enforcement.record']],
  [
    'graph-update-operator',
    ['graph.boundary.record', 'graph.apply-plan.record', 'graph.apply.authorize', 'graph.apply.execute'],
  ],
  ['benchmark-governor', ['benchmark.golden.review', 'benchmark.suite.lock', 'benchmark.governance.verify']],
  ['provider-network-policy-maintainer', ['provider-network.policy.record']],
  ['extension-author', ['extension.manifest.publish']],
  ['auditor', ['audit.verify']],
])

const unsafeAuthorityFields = [
  'enterpriseGateActivated',
  'providerInvoked',
  'networkCallMade',
  'apiCallMade',
  'shellCommandExecuted',
  'shellCommandsExecuted',
  'extensionExecutionAllowed',
  'extensionsExecuted',
  'extensionCodeExecuted',
  'graphifyExecuted',
  'graphifyLiveRun',
  'nativeBenchmarkExecuted',
  'benchmarkExecuted',
  'candidateExecuted',
  'filesMutated',
  'graphSourceMutated',
  'graphDeltaApplied',
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'hooksActivated',
  'branchProtectionChanged',
  'branchProtectionMutated',
  'requiredChecksConfigured',
  'requiredChecksMutated',
  'externalCiMutated',
  'diffRejectionEnabled',
  'diffRejectionActivated',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
]

const signingAuthorityFields = [
  'cryptographicSignaturePresent',
  'cryptographicSignatureVerified',
  'cryptographicSigningImplemented',
  'signedRecordEnvelopePresent',
  'keyGenerated',
  'privateKeyStored',
  'keyManagementImplemented',
  'keyRegistryPresent',
  'trustRootPresent',
  'keyRegistryCreated',
  'trustRootCreated',
  'signaturePolicyPresent',
  'signaturePolicyEnforced',
  'rbacEnforced',
  'permissionVerified',
  'rbacPermissionVerified',
]

const keyMaterialFields = [
  'privateKey',
  'privateKeyPem',
  'privateKeyMaterial',
  'keyMaterial',
  'secretKey',
  'keySecret',
  'signature',
  'signatureValue',
  'signaturePath',
]

const allowlistFields = [
  'providerAllowlist',
  'networkAllowlist',
  'apiAllowlist',
  'allowedProviders',
  'allowedNetworkHosts',
  'allowedApiEndpoints',
  'providerGrants',
  'networkGrants',
  'apiGrants',
]

const automationRiskPermissions = [
  'graph.apply.execute',
  'graph.apply.authorize',
  'benchmark.golden.review',
  'provider-network.policy.allow',
  'extension.execution.approve',
  'approval.automate',
  'user.acceptance.automate',
]

const extensionAuthorRiskPermissions = [
  'extension.execution.approve',
  'provider-network.policy.allow',
  'graph.apply.execute',
  'graph.apply.authorize',
  'approval.automate',
  'user.acceptance.automate',
]

export interface RbacPolicyValidationOptions {
  policy?: string
  rbacReadiness?: string
  signingReadiness?: string
  output?: string
  markdown?: string
}

export interface RbacPolicyFinding {
  severity: 'blocker' | 'gap' | 'advisory' | 'satisfied'
  code: string
  message: string
  path?: string
  field?: string
}

interface LoadedSource {
  requestedPath: string
  resolvedPath: string
  relativePath: string
  sourceKind: 'policy' | 'rbac-readiness' | 'signing-readiness'
  record: JsonRecord | null
  readError: string | null
}

interface PolicyAnalysis {
  actors: JsonRecord[]
  roleAssignments: JsonRecord[]
  permissionGrants: JsonRecord[]
  actorIds: string[]
  duplicateActorIds: string[]
  actorsById: Map<string, JsonRecord>
  unknownActorTypes: string[]
  unknownActorRefs: string[]
  unknownRoles: string[]
  unknownPermissions: string[]
  duplicateAssignments: string[]
  unsafeUnknownPermissions: string[]
  automationOvergrants: string[]
  extensionAuthorOvergrants: string[]
  providerNetworkGrantCount: number
  approvalPermissionCount: number
  graphApplyPermissionCount: number
  artifactRoleCount: number
  knownArtifactRoleCoverageCount: number
  unknownArtifactRoles: string[]
}

export interface RbacPolicyValidationReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof PASSED_STATUS | typeof BLOCKED_STATUS
  validationScope: 'rbac-policy-validation-report-only'
  sourceFactsOnly: true
  reportOnly: true
  rbacPolicyValidationStatus: 'passed' | 'partial-readiness' | 'blocked'
  sourcePolicy: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    policyScope: string | null
    defaultAuthorityPolicy: string | null
  }
  sourceRbacReadiness: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    actorModelPresent: boolean | null
    rolePermissionMatrixPresent: boolean | null
    artifactPermissionMappingPresent: boolean | null
  }
  sourceSigningReadiness: {
    supplied: boolean
    path: string | null
    artifactRole: string | null
    status: string | null
    signingReadinessStatus: string | null
    keyGovernanceStatus: string | null
    signaturePolicyStatus: string | null
    rbacPrerequisiteActorModelPresent: boolean | null
    rbacPrerequisitePermissionMatrixPresent: boolean | null
  }
  actorSummary: {
    actorCount: number
    actorCountByType: Record<string, number>
    duplicateActorIds: string[]
    unknownActorTypeCount: number
    unknownActorTypes: string[]
  }
  roleAssignmentSummary: {
    assignmentCount: number
    unknownActorReferences: string[]
    unknownRoles: string[]
    duplicateAssignmentCount: number
    duplicateAssignments: string[]
  }
  permissionGrantSummary: {
    grantCount: number
    unknownRoles: string[]
    unknownPermissions: string[]
    unsafeUnknownPermissions: string[]
    providerNetworkPermissionCount: number
    approvalPermissionCount: number
    graphApplyPermissionCount: number
  }
  artifactPermissionCoverageSummary: {
    configuredArtifactRoleCount: number
    knownArtifactRoleCoverageCount: number
    unknownArtifactRoles: string[]
  }
  defaultDenyStatus: {
    defaultAuthorityPolicy: string | null
    defaultDenyConfigured: boolean
  }
  automationRestrictionStatus: {
    automationActorCount: number
    automationRestrictionDeclared: boolean
    forbiddenAutomationPermissionCount: number
    automationOvergrantCount: number
    automationOvergrants: string[]
  }
  extensionAuthorRestrictionStatus: {
    extensionAuthorActorCount: number
    extensionAuthorRestrictionDeclared: boolean
    forbiddenExtensionAuthorPermissionCount: number
    extensionAuthorOvergrantCount: number
    extensionAuthorOvergrants: string[]
  }
  noEnforcementPerformed: true
  policyFindings: RbacPolicyFinding[]
  downstreamActionPlan: string[]
  rbacEnforced: false
  permissionVerified: false
  rbacPermissionVerified: false
  cryptographicSignaturePresent: false
  cryptographicSignatureVerified: false
  cryptographicSigningImplemented: false
  keyGenerated: false
  privateKeyStored: false
  keyManagementImplemented: false
  keyRegistryCreated: false
  trustRootCreated: false
  enterpriseGateActivated: false
  providerInvoked: false
  networkCallMade: false
  apiCallMade: false
  shellCommandsExecuted: false
  extensionExecutionAllowed: false
  extensionsExecuted: false
  benchmarkExecuted: false
  candidateExecuted: false
  graphifyExecuted: false
  nativeBenchmarkExecuted: false
  filesMutated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  hooksActivated: false
  branchProtectionChanged: false
  branchProtectionMutated: false
  requiredChecksConfigured: false
  requiredChecksMutated: false
  externalCiMutated: false
  diffRejectionEnabled: false
  diffRejectionActivated: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export class RbacPolicyValidationError extends Error {
  readonly report: RbacPolicyValidationReport

  constructor(report: RbacPolicyValidationReport) {
    super('RBAC policy validation is blocked.')
    this.report = report
  }
}

export async function validateRbacPolicy(
  root: string,
  options: RbacPolicyValidationOptions,
): Promise<RbacPolicyValidationReport> {
  validateRequiredOptions(options)
  const sourcePaths = [options.policy, options.rbacReadiness, options.signingReadiness].filter(
    (entry): entry is string => Boolean(entry),
  )
  await assertOutputAuthority(
    root,
    sourcePaths.map((entry) => resolveRepoPath(root, entry)),
    options,
  )

  const policy = options.policy ? await loadSource(root, options.policy, 'policy') : null
  const rbacReadiness = options.rbacReadiness ? await loadSource(root, options.rbacReadiness, 'rbac-readiness') : null
  const signingReadiness = options.signingReadiness
    ? await loadSource(root, options.signingReadiness, 'signing-readiness')
    : null

  const blockingFindings = validateSources(policy, rbacReadiness, signingReadiness)
  if (blockingFindings.length > 0) {
    throw new RbacPolicyValidationError(buildReport(policy, rbacReadiness, signingReadiness, blockingFindings, true))
  }

  const report = buildReport(
    policy,
    rbacReadiness,
    signingReadiness,
    buildFindings(policy, rbacReadiness, signingReadiness),
  )
  const outputPath = resolveRepoPath(root, options.output ?? '')
  report.writtenOutputPath = relativePath(root, outputPath)
  await writeJsonAtomic(outputPath, report)
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    report.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeTextAtomic(markdownPath, renderMarkdown(report))
    await writeJsonAtomic(outputPath, report)
  }
  return report
}

function buildReport(
  policy: LoadedSource | null,
  rbacReadiness: LoadedSource | null,
  signingReadiness: LoadedSource | null,
  findings: RbacPolicyFinding[],
  blocked = false,
): RbacPolicyValidationReport {
  const policyRecord = policy?.record ?? null
  const rbacRecord = rbacReadiness?.record ?? null
  const signingRecord = signingReadiness?.record ?? null
  const analysis = analyzePolicy(policyRecord)
  const keyGovernance = asRecord(signingRecord?.keyGovernanceReadiness)
  const signaturePolicy = asRecord(signingRecord?.signaturePolicyReadiness)
  const rbacPrerequisite = asRecord(signingRecord?.rbacPrerequisiteSummary)

  return {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: blocked ? BLOCKED_STATUS : PASSED_STATUS,
    validationScope: 'rbac-policy-validation-report-only',
    sourceFactsOnly: true,
    reportOnly: true,
    rbacPolicyValidationStatus: blocked ? 'blocked' : hasReadinessGaps(findings) ? 'partial-readiness' : 'passed',
    sourcePolicy: {
      supplied: Boolean(policy),
      path: policy?.relativePath ?? null,
      artifactRole: stringValue(policyRecord?.artifactRole),
      status: stringValue(policyRecord?.status),
      policyScope: stringValue(policyRecord?.policyScope),
      defaultAuthorityPolicy: stringValue(policyRecord?.defaultAuthorityPolicy),
    },
    sourceRbacReadiness: {
      supplied: Boolean(rbacReadiness),
      path: rbacReadiness?.relativePath ?? null,
      artifactRole: stringValue(rbacRecord?.artifactRole),
      status: stringValue(rbacRecord?.status),
      actorModelPresent: arrayLength(rbacRecord?.actorModelSummary) !== null,
      rolePermissionMatrixPresent: arrayLength(rbacRecord?.rolePermissionMatrix) !== null,
      artifactPermissionMappingPresent: arrayLength(rbacRecord?.artifactPermissionMapping) !== null,
    },
    sourceSigningReadiness: {
      supplied: Boolean(signingReadiness),
      path: signingReadiness?.relativePath ?? null,
      artifactRole: stringValue(signingRecord?.artifactRole),
      status: stringValue(signingRecord?.status),
      signingReadinessStatus: stringValue(signingRecord?.signingReadinessStatus),
      keyGovernanceStatus: stringValue(keyGovernance?.status),
      signaturePolicyStatus: stringValue(signaturePolicy?.status),
      rbacPrerequisiteActorModelPresent: booleanOrNull(rbacPrerequisite?.actorModelPresent),
      rbacPrerequisitePermissionMatrixPresent: booleanOrNull(rbacPrerequisite?.permissionMatrixPresent),
    },
    actorSummary: {
      actorCount: analysis.actors.length,
      actorCountByType: actorCountByType(analysis.actors),
      duplicateActorIds: analysis.duplicateActorIds,
      unknownActorTypeCount: analysis.unknownActorTypes.length,
      unknownActorTypes: analysis.unknownActorTypes,
    },
    roleAssignmentSummary: {
      assignmentCount: analysis.roleAssignments.length,
      unknownActorReferences: analysis.unknownActorRefs,
      unknownRoles: analysis.unknownRoles,
      duplicateAssignmentCount: analysis.duplicateAssignments.length,
      duplicateAssignments: analysis.duplicateAssignments,
    },
    permissionGrantSummary: {
      grantCount: analysis.permissionGrants.length,
      unknownRoles: analysis.unknownRoles,
      unknownPermissions: analysis.unknownPermissions,
      unsafeUnknownPermissions: analysis.unsafeUnknownPermissions,
      providerNetworkPermissionCount: analysis.providerNetworkGrantCount,
      approvalPermissionCount: analysis.approvalPermissionCount,
      graphApplyPermissionCount: analysis.graphApplyPermissionCount,
    },
    artifactPermissionCoverageSummary: {
      configuredArtifactRoleCount: analysis.artifactRoleCount,
      knownArtifactRoleCoverageCount: analysis.knownArtifactRoleCoverageCount,
      unknownArtifactRoles: analysis.unknownArtifactRoles,
    },
    defaultDenyStatus: {
      defaultAuthorityPolicy: stringValue(policyRecord?.defaultAuthorityPolicy),
      defaultDenyConfigured: policyRecord?.defaultAuthorityPolicy === 'deny',
    },
    automationRestrictionStatus: {
      automationActorCount: analysis.actors.filter((actor) => actor.actorType === 'automation').length,
      automationRestrictionDeclared: Boolean(
        policyRecord?.automationRestrictions || policyRecord?.forbiddenAutomationPermissions,
      ),
      forbiddenAutomationPermissionCount: arrayLength(policyRecord?.forbiddenAutomationPermissions) ?? 0,
      automationOvergrantCount: analysis.automationOvergrants.length,
      automationOvergrants: analysis.automationOvergrants,
    },
    extensionAuthorRestrictionStatus: {
      extensionAuthorActorCount: analysis.actors.filter((actor) => actor.actorType === 'extension-author').length,
      extensionAuthorRestrictionDeclared: Boolean(policyRecord?.extensionAuthorRestrictions),
      forbiddenExtensionAuthorPermissionCount:
        arrayLength(asRecord(policyRecord?.extensionAuthorRestrictions)?.forbiddenPermissions) ?? 0,
      extensionAuthorOvergrantCount: analysis.extensionAuthorOvergrants.length,
      extensionAuthorOvergrants: analysis.extensionAuthorOvergrants,
    },
    noEnforcementPerformed: true,
    policyFindings: findings,
    downstreamActionPlan: downstreamActionPlan(findings),
    rbacEnforced: false,
    permissionVerified: false,
    rbacPermissionVerified: false,
    cryptographicSignaturePresent: false,
    cryptographicSignatureVerified: false,
    cryptographicSigningImplemented: false,
    keyGenerated: false,
    privateKeyStored: false,
    keyManagementImplemented: false,
    keyRegistryCreated: false,
    trustRootCreated: false,
    enterpriseGateActivated: false,
    providerInvoked: false,
    networkCallMade: false,
    apiCallMade: false,
    shellCommandsExecuted: false,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    benchmarkExecuted: false,
    candidateExecuted: false,
    graphifyExecuted: false,
    nativeBenchmarkExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hooksActivated: false,
    branchProtectionChanged: false,
    branchProtectionMutated: false,
    requiredChecksConfigured: false,
    requiredChecksMutated: false,
    externalCiMutated: false,
    diffRejectionEnabled: false,
    diffRejectionActivated: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
  }
}

function validateSources(
  policy: LoadedSource | null,
  rbacReadiness: LoadedSource | null,
  signingReadiness: LoadedSource | null,
): RbacPolicyFinding[] {
  const findings: RbacPolicyFinding[] = []
  for (const source of [policy, rbacReadiness, signingReadiness].filter((entry): entry is LoadedSource =>
    Boolean(entry),
  )) {
    if (source.readError) {
      findings.push(blockingFinding('RBAC_POLICY_VALIDATION_SOURCE_READ_FAILED', source.readError, source.relativePath))
      continue
    }
    const record = source.record ?? {}
    if (source.sourceKind === 'policy') {
      validatePolicySource(source, record, findings)
    } else if (source.sourceKind === 'rbac-readiness') {
      validateRbacReadinessSource(source, record, findings)
    } else {
      validateSigningReadinessSource(source, record, findings)
    }
    for (const hit of collectTrueFieldHits(record, unsafeAuthorityFields)) {
      findings.push(
        blockingFinding(
          'RBAC_POLICY_VALIDATION_UNSAFE_SOURCE_AUTHORITY_FLAG',
          `${source.relativePath} contains unsafe RBAC policy validation source flag ${hit.field}: true.`,
          source.relativePath,
          hit.field,
        ),
      )
    }
    for (const hit of collectTrueFieldHits(record, signingAuthorityFields)) {
      findings.push(
        blockingFinding(
          'RBAC_POLICY_VALIDATION_SIGNING_OR_RBAC_CLAIM_UNSUPPORTED',
          `${source.relativePath} claims signing/key/RBAC field ${hit.field}: true.`,
          source.relativePath,
          hit.field,
        ),
      )
    }
  }
  return findings
}

function validatePolicySource(source: LoadedSource, record: JsonRecord, findings: RbacPolicyFinding[]): void {
  if (record.artifactRole !== POLICY_ROLE || record.status !== POLICY_STATUS) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_POLICY_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${POLICY_ROLE} with configured status.`,
        source.relativePath,
      ),
    )
  }
  if (record.defaultAuthorityPolicy !== 'deny') {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_DEFAULT_AUTHORITY_NOT_DENY',
        'RBAC policy must set defaultAuthorityPolicy to deny.',
        source.relativePath,
        'defaultAuthorityPolicy',
      ),
    )
  }
  for (const field of allowlistFields) {
    if (arrayLength(record[field]) && arrayLength(record[field])! > 0) {
      findings.push(
        blockingFinding(
          'RBAC_POLICY_VALIDATION_PROVIDER_NETWORK_GRANT_UNSUPPORTED',
          `${field} must stay empty until signed enterprise allow policy exists.`,
          source.relativePath,
          field,
        ),
      )
    }
  }
  for (const hit of collectNonEmptyFieldHits(record, keyMaterialFields)) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_KEY_MATERIAL_UNSUPPORTED',
        `${source.relativePath} contains key/signature material field ${hit.field}; RBAC policy v1 must not carry secrets or signatures.`,
        source.relativePath,
        hit.field,
      ),
    )
  }
  const analysis = analyzePolicy(record)
  for (const permission of analysis.unsafeUnknownPermissions) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_UNSAFE_UNKNOWN_PERMISSION',
        `Unknown permission ${permission} implies execution, provider/network, approval, or user-acceptance authority.`,
        source.relativePath,
        'permissionGrants.permission',
      ),
    )
  }
  for (const overgrant of analysis.automationOvergrants) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_AUTOMATION_OVERGRANT',
        `Automation actor has unsafe non-future-only grant: ${overgrant}.`,
        source.relativePath,
        'roleAssignments',
      ),
    )
  }
  for (const overgrant of analysis.extensionAuthorOvergrants) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_EXTENSION_AUTHOR_OVERGRANT',
        `Extension-author actor has unsafe non-future-only grant: ${overgrant}.`,
        source.relativePath,
        'roleAssignments',
      ),
    )
  }
}

function validateRbacReadinessSource(source: LoadedSource, record: JsonRecord, findings: RbacPolicyFinding[]): void {
  if (record.artifactRole !== RBAC_READINESS_ROLE || record.status !== RBAC_READINESS_STATUS) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_RBAC_READINESS_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${RBAC_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
}

function validateSigningReadinessSource(source: LoadedSource, record: JsonRecord, findings: RbacPolicyFinding[]): void {
  if (record.artifactRole !== SIGNING_READINESS_ROLE || record.status !== SIGNING_READINESS_STATUS) {
    findings.push(
      blockingFinding(
        'RBAC_POLICY_VALIDATION_SIGNING_READINESS_SOURCE_ROLE_STATUS_INVALID',
        `${source.relativePath} must be ${SIGNING_READINESS_ROLE} with reported status.`,
        source.relativePath,
      ),
    )
  }
}

function buildFindings(
  policy: LoadedSource | null,
  rbacReadiness: LoadedSource | null,
  signingReadiness: LoadedSource | null,
): RbacPolicyFinding[] {
  const policyRecord = policy?.record ?? null
  const analysis = analyzePolicy(policyRecord)
  const findings: RbacPolicyFinding[] = [
    {
      severity: 'satisfied',
      code: 'RBAC_POLICY_VALIDATION_DEFAULT_DENY_RECORDED',
      message: 'RBAC policy default authority is deny.',
      path: policy?.relativePath,
    },
    {
      severity: 'satisfied',
      code: 'RBAC_POLICY_VALIDATION_REPORT_ONLY',
      message: 'RBAC policy validation is report-only and performs no enforcement.',
    },
  ]
  if (rbacReadiness) {
    findings.push({
      severity: 'satisfied',
      code: 'RBAC_POLICY_VALIDATION_RBAC_READINESS_LINKED',
      message: 'RBAC readiness source was linked as a source fact.',
      path: rbacReadiness.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RBAC_POLICY_VALIDATION_RBAC_READINESS_NOT_SUPPLIED',
      message: 'RBAC readiness source was not supplied; built-in role/permission vocabulary was used.',
    })
  }
  if (signingReadiness) {
    findings.push({
      severity: 'satisfied',
      code: 'RBAC_POLICY_VALIDATION_SIGNING_READINESS_LINKED',
      message: 'Signing readiness source was linked as a source fact.',
      path: signingReadiness.relativePath,
    })
  } else {
    findings.push({
      severity: 'advisory',
      code: 'RBAC_POLICY_VALIDATION_SIGNING_READINESS_NOT_SUPPLIED',
      message: 'Signing readiness source was not supplied; signing/key governance remains an external prerequisite.',
    })
  }
  for (const actorType of analysis.unknownActorTypes) {
    findings.push({
      severity: 'gap',
      code: 'RBAC_POLICY_VALIDATION_UNKNOWN_ACTOR_TYPE',
      message: `Unknown actor type ${actorType} should be added to RBAC readiness before enforcement.`,
      path: policy?.relativePath,
      field: 'actors.actorType',
    })
  }
  for (const actorId of analysis.unknownActorRefs) {
    findings.push({
      severity: 'gap',
      code: 'RBAC_POLICY_VALIDATION_UNKNOWN_ACTOR_REFERENCE',
      message: `Role assignment references unknown actor ${actorId}.`,
      path: policy?.relativePath,
      field: 'roleAssignments.actorId',
    })
  }
  for (const role of analysis.unknownRoles) {
    findings.push({
      severity: 'gap',
      code: 'RBAC_POLICY_VALIDATION_UNKNOWN_ROLE',
      message: `Unknown role ${role} should be added to RBAC readiness before enforcement.`,
      path: policy?.relativePath,
      field: 'role',
    })
  }
  for (const permission of analysis.unknownPermissions.filter(
    (entry) => !analysis.unsafeUnknownPermissions.includes(entry),
  )) {
    findings.push({
      severity: 'gap',
      code: 'RBAC_POLICY_VALIDATION_UNKNOWN_PERMISSION',
      message: `Unknown permission ${permission} should be reviewed before enforcement.`,
      path: policy?.relativePath,
      field: 'permissionGrants.permission',
    })
  }
  for (const actorId of analysis.duplicateActorIds) {
    findings.push({
      severity: 'gap',
      code: 'RBAC_POLICY_VALIDATION_DUPLICATE_ACTOR_ID',
      message: `Duplicate actor id ${actorId} should be resolved before enforcement.`,
      path: policy?.relativePath,
      field: 'actors.actorId',
    })
  }
  return findings
}

function analyzePolicy(record: JsonRecord | null): PolicyAnalysis {
  const actors = recordArray(record?.actors)
  const roleAssignments = recordArray(record?.roleAssignments)
  const permissionGrants = recordArray(record?.permissionGrants)
  const actorIds = actors.map((actor) => stringValue(actor.actorId)).filter((entry): entry is string => Boolean(entry))
  const duplicateActorIds = duplicates(actorIds)
  const actorsById = new Map<string, JsonRecord>()
  for (const actor of actors) {
    const actorId = stringValue(actor.actorId)
    if (actorId && !actorsById.has(actorId)) actorsById.set(actorId, actor)
  }
  const knownRoleSet = new Set<string>(knownRoles)
  const knownPermissionSet = new Set<string>([...knownPermissions, ...futureOnlyPermissions])
  const actorIdSet = new Set(actorIds)
  const unknownActorTypes = uniqueStrings(
    actors
      .map((actor) => stringValue(actor.actorType))
      .filter(
        (entry): entry is string =>
          typeof entry === 'string' && !actorTypes.includes(entry as (typeof actorTypes)[number]),
      ),
  )
  const unknownActorRefs = uniqueStrings(
    roleAssignments
      .map((assignment) => stringValue(assignment.actorId))
      .filter((entry): entry is string => typeof entry === 'string' && !actorIdSet.has(entry)),
  )
  const unknownAssignmentRoles = roleAssignments
    .map((assignment) => stringValue(assignment.role))
    .filter((entry): entry is string => typeof entry === 'string' && !knownRoleSet.has(entry))
  const unknownGrantRoles = permissionGrants
    .map((grant) => stringValue(grant.role))
    .filter((entry): entry is string => typeof entry === 'string' && !knownRoleSet.has(entry))
  const unknownRoles = uniqueStrings([...unknownAssignmentRoles, ...unknownGrantRoles])
  const permissions = permissionGrants
    .map((grant) => stringValue(grant.permission))
    .filter((entry): entry is string => Boolean(entry))
  const unknownPermissions = uniqueStrings(permissions.filter((permission) => !knownPermissionSet.has(permission)))
  const unsafeUnknownPermissions = unknownPermissions.filter(isUnsafePermission)
  const duplicateAssignments = duplicates(
    roleAssignments
      .map((assignment) => `${stringValue(assignment.actorId) ?? ''}::${stringValue(assignment.role) ?? ''}`)
      .filter((entry) => entry !== '::'),
  )
  const providerNetworkGrantCount = permissions.filter(isProviderNetworkPermission).length
  const approvalPermissionCount = permissions.filter(isApprovalPermission).length
  const graphApplyPermissionCount = permissions.filter((permission) => permission === 'graph.apply.execute').length
  const policyRolePermissions = policyRolePermissionMap(permissionGrants)
  const automationOvergrants = actorOvergrants(
    roleAssignments,
    actorsById,
    policyRolePermissions,
    'automation',
    automationRiskPermissions,
  )
  const extensionAuthorOvergrants = actorOvergrants(
    roleAssignments,
    actorsById,
    policyRolePermissions,
    'extension-author',
    extensionAuthorRiskPermissions,
  )
  const artifactRoles = uniqueStrings(permissionGrants.flatMap((grant) => stringArray(grant.artifactRoles)))
  const knownArtifactRoles = new Set([
    'devview-evidence-decision-record',
    'devview-accepted-evidence-record',
    'devview-runtime-evidence-satisfaction-record',
    'devview-equivalence-proof-record',
    'devview-scope-ci-enforcement-record',
    'devview-guarded-graph-update-boundary-record',
    'devview-guarded-graph-update-apply-plan',
    'devview-guarded-graph-update-apply-report',
    'devview-extension-profile-catalog',
    'devview-benchmark-golden-answer',
    'devview-benchmark-suite-lock-manifest',
    'devview-provider-network-default-deny-policy-report',
    'devview-enterprise-readiness-report',
  ])
  const unknownArtifactRoles = artifactRoles.filter((role) => !knownArtifactRoles.has(role))
  return {
    actors,
    roleAssignments,
    permissionGrants,
    actorIds,
    duplicateActorIds,
    actorsById,
    unknownActorTypes,
    unknownActorRefs,
    unknownRoles,
    unknownPermissions,
    duplicateAssignments,
    unsafeUnknownPermissions,
    automationOvergrants,
    extensionAuthorOvergrants,
    providerNetworkGrantCount,
    approvalPermissionCount,
    graphApplyPermissionCount,
    artifactRoleCount: artifactRoles.length,
    knownArtifactRoleCoverageCount: artifactRoles.length - unknownArtifactRoles.length,
    unknownArtifactRoles,
  }
}

function actorOvergrants(
  assignments: JsonRecord[],
  actorsById: Map<string, JsonRecord>,
  policyRolePermissions: Map<string, JsonRecord[]>,
  actorType: string,
  riskyPermissions: string[],
): string[] {
  const overgrants: string[] = []
  for (const assignment of assignments) {
    const actorId = stringValue(assignment.actorId)
    const role = stringValue(assignment.role)
    if (!actorId || !role || assignment.futureOnly === true) continue
    const actor = actorsById.get(actorId)
    if (actor?.actorType !== actorType) continue
    const permissions = [
      ...(builtInRolePermissions.get(role) ?? []),
      ...(policyRolePermissions.get(role) ?? [])
        .map((grant) => stringValue(grant.permission))
        .filter((entry): entry is string => Boolean(entry)),
    ]
    for (const permission of permissions) {
      const grant = (policyRolePermissions.get(role) ?? []).find((entry) => entry.permission === permission)
      if (grant?.futureOnly === true) continue
      if (riskyPermissions.includes(permission) || isUnsafePermission(permission)) {
        overgrants.push(`${actorId}:${role}:${permission}`)
      }
    }
  }
  return uniqueStrings(overgrants)
}

function policyRolePermissionMap(grants: JsonRecord[]): Map<string, JsonRecord[]> {
  const byRole = new Map<string, JsonRecord[]>()
  for (const grant of grants) {
    const role = stringValue(grant.role)
    if (!role) continue
    byRole.set(role, [...(byRole.get(role) ?? []), grant])
  }
  return byRole
}

async function loadSource(
  root: string,
  requestedPath: string,
  sourceKind: LoadedSource['sourceKind'],
): Promise<LoadedSource> {
  const resolvedPath = resolveRepoPath(root, requestedPath)
  const relative = relativePath(root, resolvedPath)
  try {
    const text = await readFile(resolvedPath, 'utf8')
    try {
      const parsed = JSON.parse(text.replace(/^\uFEFF/, '')) as unknown
      return {
        requestedPath,
        resolvedPath,
        relativePath: relative,
        sourceKind,
        record: isJsonRecord(parsed) ? parsed : null,
        readError: isJsonRecord(parsed) ? null : 'JSON content is not an object.',
      }
    } catch (error) {
      return {
        requestedPath,
        resolvedPath,
        relativePath: relative,
        sourceKind,
        record: null,
        readError: error instanceof Error ? error.message : String(error),
      }
    }
  } catch (error) {
    return {
      requestedPath,
      resolvedPath,
      relativePath: relative,
      sourceKind,
      record: null,
      readError: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateRequiredOptions(options: RbacPolicyValidationOptions): void {
  if (!options.policy) throw new Error('security validate-rbac-policy requires --policy <json>.')
  if (!options.output) throw new Error('security validate-rbac-policy requires --output <json>.')
}

async function assertOutputAuthority(
  root: string,
  sourcePaths: string[],
  options: RbacPolicyValidationOptions,
): Promise<void> {
  const outputPath = options.output ? resolveRepoPath(root, options.output) : null
  const markdownPath = options.markdown ? resolveRepoPath(root, options.markdown) : null
  if (!outputPath) throw new Error('security validate-rbac-policy requires --output <json>.')
  const sourceSet = new Set(sourcePaths.map((entry) => path.resolve(entry)))
  if (markdownPath && path.resolve(outputPath) === path.resolve(markdownPath)) {
    throw new Error('RBAC policy validation JSON output and Markdown output must be different paths.')
  }
  for (const target of [outputPath, ...(markdownPath ? [markdownPath] : [])]) {
    const relativeTarget = relativePath(root, target)
    if (sourceSet.has(path.resolve(target))) {
      throw new Error(`RBAC policy validation output would overwrite a source input: ${relativeTarget}.`)
    }
    if (
      hasDevViewControlDirectory(target) ||
      hasCodexControlDirectory(target) ||
      hasHiddenControlDirectorySegment(target)
    ) {
      throw new Error(`RBAC policy validation output is inside a protected control path: ${relativeTarget}.`)
    }
    if (isSourceAuthorityShapedPath(relativeTarget)) {
      throw new Error(
        `RBAC policy validation output would overwrite a source-authority-shaped path: ${relativeTarget}.`,
      )
    }
  }
}

function renderMarkdown(report: RbacPolicyValidationReport): string {
  return [
    '# DevView RBAC Policy Validation',
    '',
    `- status: ${report.status}`,
    `- rbacPolicyValidationStatus: ${report.rbacPolicyValidationStatus}`,
    `- defaultAuthorityPolicy: ${report.defaultDenyStatus.defaultAuthorityPolicy}`,
    `- actorCount: ${report.actorSummary.actorCount}`,
    `- roleAssignments: ${report.roleAssignmentSummary.assignmentCount}`,
    `- permissionGrants: ${report.permissionGrantSummary.grantCount}`,
    `- automationOvergrants: ${report.automationRestrictionStatus.automationOvergrantCount}`,
    `- extensionAuthorOvergrants: ${report.extensionAuthorRestrictionStatus.extensionAuthorOvergrantCount}`,
    '',
    '## Findings',
    ...report.policyFindings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`),
    '',
    '## Downstream Actions',
    ...report.downstreamActionPlan.map((entry) => `- ${entry}`),
    '',
    '## Report-Only Safety',
    '- rbacEnforced: false',
    '- permissionVerified: false',
    '- cryptographicSignaturePresent: false',
    '- cryptographicSignatureVerified: false',
    '- keyGenerated: false',
    '- privateKeyStored: false',
    '- providerInvoked: false',
    '- networkCallMade: false',
    '- graphSourceMutated: false',
    '- enterpriseGateActivated: false',
    '',
  ].join('\n')
}

function downstreamActionPlan(findings: RbacPolicyFinding[]): string[] {
  const actions = new Set<string>()
  if (findings.some((entry) => entry.severity === 'blocker')) {
    actions.add(
      'Fix unsafe RBAC policy role/status, default-deny, key material, provider/network, or overgrant blockers.',
    )
  }
  actions.add(
    'Keep RBAC enforcement disabled until signed policy, actor identity provider, and record envelopes exist.',
  )
  actions.add('Use this report as a source fact for signing/enterprise readiness in a later visibility slice.')
  actions.add('Add signed policy/key registry validation before any permission enforcement command changes.')
  return [...actions]
}

function hasReadinessGaps(findings: RbacPolicyFinding[]): boolean {
  return findings.some((entry) => entry.severity === 'gap' || entry.severity === 'advisory')
}

function actorCountByType(actors: JsonRecord[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const actor of actors) {
    const actorType = stringValue(actor.actorType) ?? 'unknown'
    counts[actorType] = (counts[actorType] ?? 0) + 1
  }
  return counts
}

function isProviderNetworkPermission(permission: string): boolean {
  const normalized = permission.toLowerCase()
  return normalized.includes('provider') || normalized.includes('network') || normalized.includes('api')
}

function isApprovalPermission(permission: string): boolean {
  const normalized = permission.toLowerCase()
  return normalized.includes('approval') || normalized.includes('acceptance') || normalized.includes('approve')
}

function isUnsafePermission(permission: string): boolean {
  const normalized = permission.toLowerCase()
  return (
    normalized.includes('provider') ||
    normalized.includes('network') ||
    normalized.includes('api') ||
    normalized.includes('shell') ||
    normalized.includes('execute') ||
    normalized.includes('execution') ||
    normalized.includes('approval') ||
    normalized.includes('acceptance') ||
    normalized.includes('ci.activate') ||
    normalized.includes('branch-protection')
  )
}

function blockingFinding(code: string, message: string, pathValue?: string, field?: string): RbacPolicyFinding {
  return { severity: 'blocker', code, message, path: pathValue, field }
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.resolve(root, filePath)
}

function isSourceAuthorityShapedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  return (
    normalized.includes('/graph-source') ||
    normalized.includes('/source-authority') ||
    normalized.includes('/read-model') ||
    normalized.includes('/project-memory') ||
    normalized.endsWith('maintainability-graph.json')
  )
}

function collectTrueFieldHits(
  value: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectTrueFieldHits(entry, fieldNames, [...pathParts, String(index)], seen))
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && entry === true) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectTrueFieldHits(entry, fieldNames, nextPath, seen))
  }
  return hits
}

function collectNonEmptyFieldHits(
  value: unknown,
  fieldNames: string[],
  pathParts: string[] = [],
  seen = new Set<unknown>(),
): Array<{ field: string }> {
  if (typeof value !== 'object' || value === null || seen.has(value)) return []
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectNonEmptyFieldHits(entry, fieldNames, [...pathParts, String(index)], seen),
    )
  }
  const record = value as JsonRecord
  const hits: Array<{ field: string }> = []
  for (const [key, entry] of Object.entries(record)) {
    const nextPath = [...pathParts, key]
    if (fieldNames.includes(key) && hasValue(entry)) {
      hits.push({ field: nextPath.join('.') })
    }
    hits.push(...collectNonEmptyFieldHits(entry, fieldNames, nextPath, seen))
  }
  return hits
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as JsonRecord).length > 0
  return true
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isJsonRecord) : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function arrayLength(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function asRecord(value: unknown): JsonRecord | null {
  return isJsonRecord(value) ? value : null
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated]
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}
