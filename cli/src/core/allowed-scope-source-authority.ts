export interface ResolvedAllowedScope {
  id: string
  scopeKind: string
  paths: string[]
  derivedFrom: string[]
}

export interface DerivedAllowedScope {
  id: string
  sourceScopeCandidateId: string
  scopeKind: string
  paths: string[]
  sourceDerivedFrom: string[]
  contractDerivedFrom: string[]
  derivedFrom: string[]
  confidence: string
  derivationStatus: 'derived-allowed-scope-ready'
  derivationReason: string
}

export interface UnresolvedAllowedScopeSource {
  id: string
  scopeKind: string
  derivationStatus: 'derived-allowed-scope-unresolved'
  reason: string
}

export interface AllowedScopeSourceAuthorityResolution {
  allowedScope: ResolvedAllowedScope[]
  derivedAllowedScope: DerivedAllowedScope[]
  unresolvedSources: UnresolvedAllowedScopeSource[]
}

const allowedScopeKinds = ['code', 'test', 'docs', 'evidence', 'workflow', 'product', 'graph']
const allowedScopeConfidence = ['graph-backed-candidate', 'policy-backed-candidate', 'human-seeded-candidate']

export function resolveAllowedScopeFromSourceAuthority(sources: unknown[]): AllowedScopeSourceAuthorityResolution {
  const derivedAllowedScope: DerivedAllowedScope[] = []
  const unresolvedSources: UnresolvedAllowedScopeSource[] = []

  for (const source of sources.map(asRecord)) {
    const id = stringValue(source.id)
    const scopeKind = stringValue(source.scopeKind)
    const paths = stringArrayValue(source.paths)
    const sourceDerivedFrom = stringArrayValue(source.derivedFrom)
    const contractDerivedFrom = stringArrayValue(source.contractDerivedFrom)
    const derivedFrom = contractDerivedFrom.length > 0 ? contractDerivedFrom : sourceDerivedFrom
    const confidence = stringValue(source.confidence)
    const reason = unresolvedReason({ id, scopeKind, paths, sourceDerivedFrom, derivedFrom, confidence })

    if (reason) {
      unresolvedSources.push({
        id,
        scopeKind,
        derivationStatus: 'derived-allowed-scope-unresolved',
        reason,
      })
      continue
    }

    derivedAllowedScope.push({
      id,
      sourceScopeCandidateId: id,
      scopeKind,
      paths,
      sourceDerivedFrom,
      contractDerivedFrom,
      derivedFrom,
      confidence,
      derivationStatus: 'derived-allowed-scope-ready',
      derivationReason: 'derived-from-targetScopeCandidates-not-hand-written-contract',
    })
  }

  return {
    allowedScope: uniqueAllowedScope(
      derivedAllowedScope.map((entry) => ({
        id: entry.id,
        scopeKind: entry.scopeKind,
        paths: entry.paths,
        derivedFrom: entry.derivedFrom,
      })),
    ),
    derivedAllowedScope,
    unresolvedSources,
  }
}

function unresolvedReason(input: {
  id: string
  scopeKind: string
  paths: string[]
  sourceDerivedFrom: string[]
  derivedFrom: string[]
  confidence: string
}): string | undefined {
  if (
    !input.id ||
    !input.scopeKind ||
    input.paths.length === 0 ||
    input.sourceDerivedFrom.length === 0 ||
    input.derivedFrom.length === 0 ||
    !input.confidence
  ) {
    return 'allowed-scope-source-missing-required-fields'
  }
  if (!allowedScopeKinds.includes(input.scopeKind)) {
    return `unsupported-allowed-scope-kind:${input.scopeKind}`
  }
  if (!allowedScopeConfidence.includes(input.confidence)) {
    return `unsupported-allowed-scope-confidence:${input.confidence}`
  }
  return undefined
}

function uniqueAllowedScope(allowedScope: ResolvedAllowedScope[]): ResolvedAllowedScope[] {
  const seen = new Set<string>()
  const unique: ResolvedAllowedScope[] = []
  for (const scope of allowedScope) {
    if (seen.has(scope.id)) continue
    seen.add(scope.id)
    unique.push(scope)
  }
  return unique
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : []
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}
