import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { readJsonSafe, relativePath, writeJsonAtomic, writeTextAtomic } from './fs.js'

type JsonRecord = Record<string, unknown>

export const EXTENSION_READINESS_ROLE = 'devview-extension-readiness-report'
export const PROJECT_PROFILE_ROLE = 'devview-project-profile'
export const PROJECT_PROFILE_STATUS = 'devview-project-profile-configured'
export const EXTENSION_MANIFEST_ROLE = 'devview-extension-manifest'
export const EXTENSION_MANIFEST_STATUS = 'devview-extension-manifest-declared'

const allowedExtensionKinds = [
  'analyzer',
  'view-tree-extractor',
  'context-pack',
  'evidence-adapter',
  'policy',
  'skill-workflow',
] as const

const capabilityByKind: Record<string, string> = {
  analyzer: 'analyzer-extension',
  'view-tree-extractor': 'view-tree-extractor-extension',
  'context-pack': 'context-pack-extension',
  'evidence-adapter': 'evidence-adapter',
  policy: 'policy-extension',
  'skill-workflow': 'skill-workflow-extension',
}

const allowedPermissions = new Set([
  'read-project-profile',
  'read-maintainability-graph',
  'read-view-tree',
  'read-context-pack',
  'read-evidence',
  'read-policy',
  'write-report-output',
])

const unsafeAuthorityFields = [
  'runtimeEvidenceSatisfied',
  'evidenceAccepted',
  'equivalenceProven',
  'scopeEnforced',
  'ciEnforcementEnabled',
  'graphSourceMutated',
  'graphDeltaApplied',
  'approvalAutomationEnabled',
  'userAcceptanceAutomated',
  'providerInvoked',
  'networkCallMade',
  'shellCommandExecuted',
  'extensionCodeExecuted',
]

export interface ExtensionReadinessOptions {
  projectProfile?: string
  extensionsDir?: string
  output?: string
  markdown?: string
}

export interface ExtensionReadinessReport {
  schemaVersion: 1
  artifactRole: typeof EXTENSION_READINESS_ROLE
  status: 'devview-extension-readiness-ready' | 'devview-extension-readiness-blocked'
  extensionReadinessStatus:
    | 'ready-extension-manifests-validated'
    | 'ready-no-extension-manifests-discovered'
    | 'blocked-project-profile-missing'
    | 'blocked-project-profile-invalid'
    | 'blocked-invalid-extension-manifest'
    | 'blocked-unsafe-authority-flag'
    | 'blocked-output-path-unsafe'
  readinessScope: 'project-specific-extension-system-foundation-report-only'
  sourceProjectProfile: string
  sourceExtensionsDir: string
  projectProfilePresent: boolean
  projectProfileStatus: string | null
  projectProfileId: string | null
  projectStack: string[]
  projectDomain: string | null
  discoveredManifestCount: number
  validManifestCount: number
  invalidManifestCount: number
  manifests: ExtensionManifestSummary[]
  capabilities: Record<string, string[]>
  requiredPermissions: string[]
  findings: ExtensionReadinessFinding[]
  extensionExecutionAllowed: false
  extensionsExecuted: false
  providerInvoked: false
  networkCallMade: false
  shellCommandsExecuted: false
  filesMutated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  approvalAutomationEnabled: false
  userAcceptanceAutomated: false
  nonEnforcing: true
  writtenOutputPath?: string
  writtenMarkdownPath?: string
}

export interface ExtensionManifestSummary {
  path: string
  extensionId: string | null
  extensionKind: string | null
  status: 'valid' | 'invalid'
  capabilities: string[]
  permissions: string[]
  executionDisabled: true
  findings: ExtensionReadinessFinding[]
}

export interface ExtensionReadinessFinding {
  severity: 'info' | 'warning' | 'error'
  code: string
  path?: string
  field?: string
  message: string
}

export async function reportExtensionReadiness(
  root: string,
  options: ExtensionReadinessOptions = {},
): Promise<ExtensionReadinessReport> {
  const projectProfilePath = resolveRepoPath(root, options.projectProfile || '.devview/project-profile.json')
  const extensionsDir = resolveRepoPath(root, options.extensionsDir || '.devview/extensions')
  const profileRelativePath = relativePath(root, projectProfilePath)
  const extensionsRelativeDir = relativePath(root, extensionsDir)

  const findings: ExtensionReadinessFinding[] = []
  const profile = await loadProjectProfile(projectProfilePath, profileRelativePath, findings)
  const manifests = await loadExtensionManifests(extensionsDir, extensionsRelativeDir)
  const allFindings = [...findings, ...manifests.flatMap((entry) => entry.findings)]
  const hasUnsafeAuthority = allFindings.some((entry) => entry.code === 'EXTENSION_UNSAFE_AUTHORITY_FLAG')
  const invalidManifestCount = manifests.filter((entry) => entry.status === 'invalid').length

  const readinessStatus = chooseReadinessStatus({
    profile,
    profilePresent: existsSync(projectProfilePath),
    invalidManifestCount,
    hasUnsafeAuthority,
  })
  const blocked = readinessStatus.startsWith('blocked-')

  const report: ExtensionReadinessReport = {
    schemaVersion: 1,
    artifactRole: EXTENSION_READINESS_ROLE,
    status: blocked ? 'devview-extension-readiness-blocked' : 'devview-extension-readiness-ready',
    extensionReadinessStatus: readinessStatus,
    readinessScope: 'project-specific-extension-system-foundation-report-only',
    sourceProjectProfile: profileRelativePath,
    sourceExtensionsDir: extensionsRelativeDir,
    projectProfilePresent: existsSync(projectProfilePath),
    projectProfileStatus: stringValue(profile?.status) || null,
    projectProfileId: stringValue(profile?.projectProfileId) || null,
    projectStack: stringArray(profile?.stack),
    projectDomain: stringValue(profile?.domain) || null,
    discoveredManifestCount: manifests.length,
    validManifestCount: manifests.filter((entry) => entry.status === 'valid').length,
    invalidManifestCount,
    manifests,
    capabilities: summarizeCapabilities(manifests.filter((entry) => entry.status === 'valid')),
    requiredPermissions: uniqueSorted(manifests.flatMap((entry) => entry.permissions)),
    findings: allFindings,
    extensionExecutionAllowed: false,
    extensionsExecuted: false,
    providerInvoked: false,
    networkCallMade: false,
    shellCommandsExecuted: false,
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    approvalAutomationEnabled: false,
    userAcceptanceAutomated: false,
    nonEnforcing: true,
  }

  await assertExtensionReadinessOutputAuthority(root, {
    projectProfilePath,
    extensionsDir,
    manifests,
    output: options.output,
    markdown: options.markdown,
  })

  if (options.output) {
    const outputPath = resolveRepoPath(root, options.output)
    report.writtenOutputPath = relativePath(root, outputPath)
    await writeJsonAtomic(outputPath, report)
  }
  if (options.markdown) {
    const markdownPath = resolveRepoPath(root, options.markdown)
    report.writtenMarkdownPath = relativePath(root, markdownPath)
    await writeTextAtomic(markdownPath, renderExtensionReadinessMarkdown(report))
  }

  return report
}

async function loadProjectProfile(
  projectProfilePath: string,
  relativeProfilePath: string,
  findings: ExtensionReadinessFinding[],
): Promise<JsonRecord | null> {
  const parsed = await readJsonSafe<JsonRecord>(projectProfilePath)
  if (!parsed.ok) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_PROJECT_PROFILE_MISSING',
      path: relativeProfilePath,
      message: 'Project Profile is missing. Create .devview/project-profile.json before declaring extensions.',
    })
    return null
  }
  const profile = asRecord(parsed.value)
  if (!profile) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_PROJECT_PROFILE_INVALID',
      path: relativeProfilePath,
      message: 'Project Profile must be a JSON object.',
    })
    return null
  }
  if (profile.artifactRole !== PROJECT_PROFILE_ROLE || profile.status !== PROJECT_PROFILE_STATUS) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_PROJECT_PROFILE_INVALID',
      path: relativeProfilePath,
      message: `Project Profile must use artifactRole ${PROJECT_PROFILE_ROLE} and status ${PROJECT_PROFILE_STATUS}.`,
    })
  }
  for (const field of collectUnsafeAuthorityFields(profile)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_UNSAFE_AUTHORITY_FLAG',
      path: relativeProfilePath,
      field,
      message: `Project Profile must not assert authority flag ${field}.`,
    })
  }
  return profile
}

async function loadExtensionManifests(
  extensionsDir: string,
  relativeExtensionsDir: string,
): Promise<ExtensionManifestSummary[]> {
  if (!existsSync(extensionsDir)) {
    return []
  }
  const entries = await readdir(extensionsDir)
  const summaries: ExtensionManifestSummary[] = []
  for (const entry of entries.sort()) {
    const absolutePath = path.join(extensionsDir, entry)
    const entryStat = await stat(absolutePath)
    if (!entryStat.isFile() || !entry.endsWith('.json')) {
      continue
    }
    summaries.push(await loadExtensionManifest(absolutePath, `${relativeExtensionsDir}/${entry}`))
  }
  return summaries
}

async function loadExtensionManifest(
  absolutePath: string,
  relativeManifestPath: string,
): Promise<ExtensionManifestSummary> {
  const findings: ExtensionReadinessFinding[] = []
  const parsed = await readJsonSafe<JsonRecord>(absolutePath)
  const manifest = parsed.ok ? asRecord(parsed.value) : null
  if (!parsed.ok || !manifest) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_MANIFEST_INVALID_JSON',
      path: relativeManifestPath,
      message: parsed.ok ? 'Extension manifest must be a JSON object.' : parsed.error,
    })
    return invalidManifest(relativeManifestPath, findings)
  }

  const extensionId = stringValue(manifest.extensionId) || null
  const extensionKind = stringValue(manifest.extensionKind) || null
  if (manifest.artifactRole !== EXTENSION_MANIFEST_ROLE || manifest.status !== EXTENSION_MANIFEST_STATUS) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_MANIFEST_ROLE_INVALID',
      path: relativeManifestPath,
      message: `Extension manifest must use artifactRole ${EXTENSION_MANIFEST_ROLE} and status ${EXTENSION_MANIFEST_STATUS}.`,
    })
  }
  if (!extensionId) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_MANIFEST_ID_MISSING',
      path: relativeManifestPath,
      field: 'extensionId',
      message: 'Extension manifest requires extensionId.',
    })
  }
  if (!extensionKind || !allowedExtensionKinds.includes(extensionKind as (typeof allowedExtensionKinds)[number])) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_MANIFEST_KIND_UNSUPPORTED',
      path: relativeManifestPath,
      field: 'extensionKind',
      message: `Extension manifest extensionKind must be one of: ${allowedExtensionKinds.join(', ')}.`,
    })
  }

  const capabilities = normalizeCapabilities(manifest, extensionKind)
  const permissions = stringArray(manifest.requiredPermissions)
  for (const permission of permissions) {
    if (!allowedPermissions.has(permission)) {
      findings.push({
        severity: 'error',
        code: 'EXTENSION_PERMISSION_UNSUPPORTED',
        path: relativeManifestPath,
        field: 'requiredPermissions',
        message: `Extension permission is not supported in report-only readiness: ${permission}.`,
      })
    }
  }
  if (hasExecutableDeclaration(manifest)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_EXECUTION_DECLARATION_UNSUPPORTED',
      path: relativeManifestPath,
      message:
        'Extension execution entrypoints, commands, scripts, or modules are not supported in this foundation slice.',
    })
  }
  for (const field of collectUnsafeAuthorityFields(manifest)) {
    findings.push({
      severity: 'error',
      code: 'EXTENSION_UNSAFE_AUTHORITY_FLAG',
      path: relativeManifestPath,
      field,
      message: `Extension manifest must not assert authority flag ${field}.`,
    })
  }

  return {
    path: relativeManifestPath,
    extensionId,
    extensionKind,
    status: findings.some((entry) => entry.severity === 'error') ? 'invalid' : 'valid',
    capabilities,
    permissions,
    executionDisabled: true,
    findings,
  }
}

function invalidManifest(pathValue: string, findings: ExtensionReadinessFinding[]): ExtensionManifestSummary {
  return {
    path: pathValue,
    extensionId: null,
    extensionKind: null,
    status: 'invalid',
    capabilities: [],
    permissions: [],
    executionDisabled: true,
    findings,
  }
}

function chooseReadinessStatus(input: {
  profile: JsonRecord | null
  profilePresent: boolean
  invalidManifestCount: number
  hasUnsafeAuthority: boolean
}): ExtensionReadinessReport['extensionReadinessStatus'] {
  if (!input.profilePresent) {
    return 'blocked-project-profile-missing'
  }
  if (
    !input.profile ||
    input.profile.artifactRole !== PROJECT_PROFILE_ROLE ||
    input.profile.status !== PROJECT_PROFILE_STATUS
  ) {
    return 'blocked-project-profile-invalid'
  }
  if (input.hasUnsafeAuthority) {
    return 'blocked-unsafe-authority-flag'
  }
  if (input.invalidManifestCount > 0) {
    return 'blocked-invalid-extension-manifest'
  }
  return 'ready-extension-manifests-validated'
}

function normalizeCapabilities(manifest: JsonRecord, extensionKind: string | null): string[] {
  const declared = stringArray(manifest.capabilities)
  const derived = extensionKind ? capabilityByKind[extensionKind] : undefined
  return uniqueSorted([...declared, ...(derived ? [derived] : [])])
}

function summarizeCapabilities(manifests: ExtensionManifestSummary[]): Record<string, string[]> {
  return {
    analyzerExtensions: extensionIdsForCapability(manifests, 'analyzer-extension'),
    viewTreeExtractorExtensions: extensionIdsForCapability(manifests, 'view-tree-extractor-extension'),
    contextPackExtensions: extensionIdsForCapability(manifests, 'context-pack-extension'),
    evidenceAdapters: extensionIdsForCapability(manifests, 'evidence-adapter'),
    policyExtensions: extensionIdsForCapability(manifests, 'policy-extension'),
    skillWorkflowExtensions: extensionIdsForCapability(manifests, 'skill-workflow-extension'),
  }
}

function extensionIdsForCapability(manifests: ExtensionManifestSummary[], capability: string): string[] {
  return manifests
    .filter((entry) => entry.extensionId && entry.capabilities.includes(capability))
    .map((entry) => String(entry.extensionId))
    .sort()
}

async function assertExtensionReadinessOutputAuthority(
  root: string,
  input: {
    projectProfilePath: string
    extensionsDir: string
    manifests: ExtensionManifestSummary[]
    output?: string
    markdown?: string
  },
): Promise<void> {
  const outputPath = input.output ? resolveRepoPath(root, input.output) : undefined
  const markdownPath = input.markdown ? resolveRepoPath(root, input.markdown) : undefined
  if (outputPath && markdownPath && pathKey(outputPath) === pathKey(markdownPath)) {
    throw new Error('Extension readiness output is unsafe: --output and --markdown must be different paths.')
  }

  const protectedPaths = new Map<string, string>()
  protectedPaths.set(pathKey(input.projectProfilePath), 'the source Project Profile')
  for (const manifest of input.manifests) {
    protectedPaths.set(pathKey(resolveRepoPath(root, manifest.path)), 'a source Extension Manifest')
  }

  for (const [label, requested, resolved] of [
    ['JSON output', input.output, outputPath],
    ['Markdown output', input.markdown, markdownPath],
  ] as const) {
    if (!requested || !resolved) {
      continue
    }
    const protectedReason = protectedPaths.get(pathKey(resolved))
    if (protectedReason) {
      throw new Error(`Extension readiness ${label} path is unsafe: ${requested} would overwrite ${protectedReason}.`)
    }
    if (isProtectedControlPath(root, resolved)) {
      throw new Error(`Extension readiness ${label} path is unsafe: ${requested} is inside a protected control path.`)
    }
    const existingAuthority = await classifyExistingSourceAuthority(resolved)
    if (existingAuthority) {
      throw new Error(
        `Extension readiness ${label} path is unsafe: ${requested} already contains ${existingAuthority}. Choose a dedicated extension readiness output path.`,
      )
    }
  }
}

function renderExtensionReadinessMarkdown(report: ExtensionReadinessReport): string {
  return [
    '# DevView Extension Readiness',
    '',
    `- status: ${report.status}`,
    `- readiness: ${report.extensionReadinessStatus}`,
    `- projectProfile: ${report.sourceProjectProfile}`,
    `- extensionsDir: ${report.sourceExtensionsDir}`,
    `- discoveredManifests: ${report.discoveredManifestCount}`,
    `- validManifests: ${report.validManifestCount}`,
    `- invalidManifests: ${report.invalidManifestCount}`,
    `- extensionExecutionAllowed: ${report.extensionExecutionAllowed}`,
    `- extensionsExecuted: ${report.extensionsExecuted}`,
    `- providerInvoked: ${report.providerInvoked}`,
    `- networkCallMade: ${report.networkCallMade}`,
    '',
    '## Capabilities',
    '',
    ...Object.entries(report.capabilities).map(
      ([key, values]) => `- ${key}: ${values.length ? values.join(', ') : 'none'}`,
    ),
    '',
    '## Findings',
    '',
    ...(report.findings.length
      ? report.findings.map((entry) => `- [${entry.severity}] ${entry.code}: ${entry.message}`)
      : ['- none']),
  ].join('\n')
}

async function classifyExistingSourceAuthority(filePath: string): Promise<string | null> {
  const parsed = await readJsonSafe<JsonRecord>(filePath)
  if (!parsed.ok) {
    return null
  }
  const record = asRecord(parsed.value)
  if (!record) {
    return null
  }
  const artifactRole = stringValue(record.artifactRole)
  if (!artifactRole || artifactRole === EXTENSION_READINESS_ROLE) {
    return null
  }
  if (
    artifactRole.includes('graph-source') ||
    artifactRole.includes('read-model') ||
    artifactRole.includes('evidence') ||
    artifactRole.includes('policy') ||
    artifactRole.includes('proposal') ||
    artifactRole.includes('decision') ||
    artifactRole === PROJECT_PROFILE_ROLE ||
    artifactRole === EXTENSION_MANIFEST_ROLE
  ) {
    return `source artifactRole "${artifactRole}"`
  }
  if (asRecord(record.sourceRecords)) {
    return 'graph-source-shaped sourceRecords'
  }
  if (Array.isArray(record.nodes) || Array.isArray(record.edges)) {
    return 'read-model-shaped nodes/edges'
  }
  return null
}

function collectUnsafeAuthorityFields(value: unknown, pathParts: string[] = [], seen = new Set<unknown>()): string[] {
  if (typeof value !== 'object' || value === null) {
    return []
  }
  if (seen.has(value)) {
    return []
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectUnsafeAuthorityFields(entry, [...pathParts, String(index)], seen))
  }
  const fields: string[] = []
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    const nextPath = [...pathParts, key]
    if (unsafeAuthorityFields.includes(key) && entry === true) {
      fields.push(nextPath.join('.'))
    }
    fields.push(...collectUnsafeAuthorityFields(entry, nextPath, seen))
  }
  return fields
}

function hasExecutableDeclaration(manifest: JsonRecord): boolean {
  const directKeys = ['entrypoint', 'command', 'script', 'module', 'executablePath']
  if (directKeys.some((key) => manifest[key] !== undefined && manifest[key] !== null && manifest[key] !== false)) {
    return true
  }
  const execution = asRecord(manifest.execution)
  if (!execution) {
    return false
  }
  return directKeys.some((key) => execution[key] !== undefined && execution[key] !== null && execution[key] !== false)
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function resolveRepoPath(root: string, filePath: string): string {
  return path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath)
}

function isProtectedControlPath(root: string, filePath: string): boolean {
  const relative = relativePath(root, filePath)
  const firstSegment = relative.split('/')[0]
  return ['.devview', '.codex', '.git', '.github'].includes(firstSegment)
}

function pathKey(filePath: string): string {
  return path.resolve(filePath).toLowerCase()
}
