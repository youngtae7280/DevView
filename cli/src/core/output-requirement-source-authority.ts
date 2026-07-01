export interface ResolvedOutputRequirement {
  id: string
  sourceId: string
  sourceType: string
  obligationType: string
  requiredReportTarget: string
  requirement: string
  derivationStatus: 'derived-output-requirement-ready'
  derivationReason: string
}

export interface UnresolvedOutputRequirementSource {
  id: string
  sourceId: string
  obligationType: string
  requiredReportTarget: string
  derivationStatus: 'derived-output-requirement-unresolved'
  reason: string
}

export interface OutputRequirementResolution {
  outputRequirements: string[]
  derivedOutputRequirements: ResolvedOutputRequirement[]
  unresolvedSources: UnresolvedOutputRequirementSource[]
}

export function resolveOutputRequirementsFromSourceAuthority(sources: unknown[]): OutputRequirementResolution {
  const derivedOutputRequirements: ResolvedOutputRequirement[] = []
  const unresolvedSources: UnresolvedOutputRequirementSource[] = []

  for (const source of sources.map(asRecord)) {
    const id = stringValue(source.derivedOutputRequirementId)
    const sourceId = stringValue(source.sourceId)
    const obligationType = stringValue(source.obligationType)
    const requiredReportTarget = stringValue(source.requiredReportTarget)
    const requirement = deriveRequirementText(source)

    if (!requirement) {
      unresolvedSources.push({
        id,
        sourceId,
        obligationType,
        requiredReportTarget,
        derivationStatus: 'derived-output-requirement-unresolved',
        reason: `unsupported-output-obligation-type:${obligationType || 'missing'}`,
      })
      continue
    }

    derivedOutputRequirements.push({
      id,
      sourceId,
      sourceType: stringValue(source.sourceType),
      obligationType,
      requiredReportTarget,
      requirement,
      derivationStatus: 'derived-output-requirement-ready',
      derivationReason: 'derived-from-outputRequirementSources-not-hand-written-contract',
    })
  }

  return {
    outputRequirements: Array.from(new Set(derivedOutputRequirements.map((entry) => entry.requirement))),
    derivedOutputRequirements,
    unresolvedSources,
  }
}

function deriveRequirementText(source: Record<string, unknown>): string | undefined {
  switch (stringValue(source.obligationType)) {
    case 'changed-files-report':
      return 'Report changed files from actual git diff only.'
    case 'git-diff-summary':
      return 'Report git diff summary from actual git diff only.'
    case 'command-output-evidence-status':
    case 'validation-result-summary':
      return 'Report check and evidence status from command output only.'
    case 'non-execution-boundary-statement':
      return 'Do not treat this dry-run contract as user acceptance or branch protection.'
    default:
      return undefined
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}
