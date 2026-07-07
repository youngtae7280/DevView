import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('DevView release surface checker', () => {
  it('keeps package dry-run contents limited to the public release surface', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/check-devview-release-surface.js', '--pack-dry-run', '--json'],
      {
        encoding: 'utf8',
      },
    )
    const report = JSON.parse(output) as {
      status: string
      forbiddenFindingCount: number
      packageFiles: string[]
      graphSourceMutated: boolean
      runtimeEvidenceSatisfied: boolean
      evidenceAccepted: boolean
      equivalenceProven: boolean
      scopeEnforced: boolean
      ciEnforcementEnabled: boolean
      providerInvoked: boolean
      networkCallMade: boolean
    }

    expect(report.status).toBe('devview-release-surface-validation-passed')
    expect(report.forbiddenFindingCount).toBe(0)
    expect(report.packageFiles).toContain('.codex-plugin/plugin.json')
    expect(report.packageFiles).toContain('skills/devview-start/SKILL.md')
    expect(report.packageFiles.some((entry) => entry.startsWith('docs/internal-legacy/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('docs/archive/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('examples/internal-legacy/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('outputs/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('work/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('cli/src/__tests__/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('scripts/__tests__/'))).toBe(false)
    expect(report.packageFiles.some((entry) => entry.startsWith('.github/'))).toBe(false)
    expect(report.graphSourceMutated).toBe(false)
    expect(report.runtimeEvidenceSatisfied).toBe(false)
    expect(report.evidenceAccepted).toBe(false)
    expect(report.equivalenceProven).toBe(false)
    expect(report.scopeEnforced).toBe(false)
    expect(report.ciEnforcementEnabled).toBe(false)
    expect(report.providerInvoked).toBe(false)
    expect(report.networkCallMade).toBe(false)
  }, 20000)
})
