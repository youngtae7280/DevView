import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const REPORT_ROLE = 'devview-legacy-artifact-audit-report'
const REPORT_STATUS = 'devview-legacy-artifact-audit-reported'

const LEGACY_PATTERNS = [
  { id: 'project-blueprint-engine', pattern: /Project Blueprint Engine/g },
  { id: 'pbe-uppercase', pattern: /\bPBE\b/g },
  { id: 'pbe-lowercase', pattern: /\bpbe\b/g },
  { id: 'pbe-artifact-root', pattern: /\.pbe\b/g },
  { id: 'legacy-rpd', pattern: /\bRPD\b/g },
  { id: 'legacy-wpd', pattern: /\bWPD\b/g },
  { id: 'legacy-vd', pattern: /\bVD\b/g },
  { id: 'legacy-acep', pattern: /\bACEP\b/g },
]

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.tmp', 'coverage'])
const TEXT_EXTENSIONS = new Set([
  '',
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.md',
  '.mjs',
  '.ps1',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
])

export type LegacyArtifactClassification =
  | 'canonical-devview'
  | 'needs-devview-rename'
  | 'migration-fixture-only'
  | 'delete-candidate'
  | 'internal-hidden-compatibility'

export interface LegacyArtifactFinding {
  path: string
  line: number
  column: number
  matchedText: string
  patternId: string
  classification: LegacyArtifactClassification
  rationale: string
}

export interface LegacyArtifactAuditReport {
  schemaVersion: 1
  artifactRole: typeof REPORT_ROLE
  status: typeof REPORT_STATUS
  productIdentity: 'DevView'
  reportScope: 'legacy-terminology-and-artifact-audit-dry-run'
  scannedRoot: string
  scannedFileCount: number
  findingCount: number
  findingsByClassification: Record<LegacyArtifactClassification, number>
  findings: LegacyArtifactFinding[]
  publicSurfacePolicy: string
  cleanupMode: 'dry-run-no-file-mutation'
  filesMutated: false
  graphSourceMutated: false
  graphDeltaApplied: false
  runtimeEvidenceSatisfied: false
  evidenceAccepted: false
  equivalenceProven: false
  scopeEnforced: false
  ciEnforcementEnabled: false
  hookScriptsInstalled: false
  codexExecutionTriggered: false
  providerInvoked: false
  networkCallMade: false
  next: string
  writtenOutputPath?: string
}

export interface LegacyArtifactAuditOptions {
  output?: string
}

export function reportLegacyArtifacts(
  root: string,
  options: LegacyArtifactAuditOptions = {},
): LegacyArtifactAuditReport {
  const absoluteRoot = resolve(root)
  const textFiles = listTextFiles(absoluteRoot)
  const findings = textFiles.flatMap((file) => scanFile(absoluteRoot, file))
  const report: LegacyArtifactAuditReport = {
    schemaVersion: 1,
    artifactRole: REPORT_ROLE,
    status: REPORT_STATUS,
    productIdentity: 'DevView',
    reportScope: 'legacy-terminology-and-artifact-audit-dry-run',
    scannedRoot: absoluteRoot,
    scannedFileCount: textFiles.length,
    findingCount: findings.length,
    findingsByClassification: summarizeFindings(findings),
    findings,
    publicSurfacePolicy:
      'Public docs and examples should use DevView terminology. Legacy tree-native names are migration inputs or internal-hidden compatibility until retired.',
    cleanupMode: 'dry-run-no-file-mutation',
    filesMutated: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    runtimeEvidenceSatisfied: false,
    evidenceAccepted: false,
    equivalenceProven: false,
    scopeEnforced: false,
    ciEnforcementEnabled: false,
    hookScriptsInstalled: false,
    codexExecutionTriggered: false,
    providerInvoked: false,
    networkCallMade: false,
    next: 'Review findings, move or rewrite public-facing legacy references first, then plan a separate cleanup slice for migration fixtures.',
  }

  if (options.output) {
    const outputPath = resolve(absoluteRoot, options.output)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, `${JSON.stringify({ ...report, writtenOutputPath: options.output }, null, 2)}\n`, 'utf8')
    return { ...report, writtenOutputPath: options.output }
  }

  return report
}

function listTextFiles(root: string): string[] {
  const files: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        visit(join(dir, entry.name))
        continue
      }
      if (!entry.isFile()) continue
      const file = join(dir, entry.name)
      if (isTextFile(file)) {
        files.push(file)
      }
    }
  }
  visit(root)
  return files.sort()
}

function isTextFile(file: string): boolean {
  const name = file.toLowerCase()
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot) : ''
  if (!TEXT_EXTENSIONS.has(ext)) return false
  try {
    return statSync(file).size <= 2_000_000
  } catch {
    return false
  }
}

function scanFile(root: string, file: string): LegacyArtifactFinding[] {
  const relativeFile = normalize(relative(root, file))
  const text = readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  const findings: LegacyArtifactFinding[] = []

  for (const [lineIndex, line] of lines.entries()) {
    for (const legacyPattern of LEGACY_PATTERNS) {
      legacyPattern.pattern.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = legacyPattern.pattern.exec(line)) !== null) {
        const classification = classifyPath(relativeFile)
        findings.push({
          path: relativeFile,
          line: lineIndex + 1,
          column: match.index + 1,
          matchedText: match[0],
          patternId: legacyPattern.id,
          classification,
          rationale: rationaleFor(classification),
        })
      }
    }
  }

  return findings
}

function classifyPath(relativeFile: string): LegacyArtifactClassification {
  if (
    relativeFile === 'README.md' ||
    relativeFile === 'package.json' ||
    relativeFile === 'package-lock.json' ||
    relativeFile === 'docs/index.md' ||
    relativeFile === 'docs/cli-reference.md' ||
    relativeFile === 'docs/install.md' ||
    relativeFile === 'docs/concept/README.md' ||
    relativeFile === 'docs/concept/devview-terminology.md'
  ) {
    return 'needs-devview-rename'
  }

  if (
    relativeFile.startsWith('cli/src/') ||
    relativeFile.startsWith('scripts/') ||
    relativeFile.startsWith('skills/') ||
    relativeFile.startsWith('templates/') ||
    relativeFile.startsWith('schemas/')
  ) {
    return 'internal-hidden-compatibility'
  }

  if (relativeFile.startsWith('examples/') || relativeFile.includes('/generated/') || relativeFile.includes('/.pbe/')) {
    return 'migration-fixture-only'
  }

  if (relativeFile.startsWith('docs/internal-legacy/') || relativeFile.startsWith('docs/archive/')) {
    return 'internal-hidden-compatibility'
  }

  if (relativeFile.startsWith('docs/')) {
    return 'delete-candidate'
  }

  return 'needs-devview-rename'
}

function rationaleFor(classification: LegacyArtifactClassification): string {
  switch (classification) {
    case 'canonical-devview':
      return 'Canonical DevView terminology; no cleanup needed.'
    case 'needs-devview-rename':
      return 'Public or package-facing surface should be renamed to DevView terminology.'
    case 'migration-fixture-only':
      return 'Legacy reference is inside a fixture or migration input and should remain until a dedicated migration slice retires it.'
    case 'delete-candidate':
      return 'Historical docs should be removed from public navigation or migrated into DevView terminology.'
    case 'internal-hidden-compatibility':
      return 'Internal compatibility surface may remain hidden while migration tooling depends on it.'
  }
}

function summarizeFindings(findings: LegacyArtifactFinding[]): Record<LegacyArtifactClassification, number> {
  const summary: Record<LegacyArtifactClassification, number> = {
    'canonical-devview': 0,
    'needs-devview-rename': 0,
    'migration-fixture-only': 0,
    'delete-candidate': 0,
    'internal-hidden-compatibility': 0,
  }
  for (const finding of findings) {
    summary[finding.classification] += 1
  }
  return summary
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/')
}
