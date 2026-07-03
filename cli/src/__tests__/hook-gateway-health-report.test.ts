import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runPbeCli } from '../app'
import { generateHookGatewayHealthReport } from '../core/hook-gateway-health-report'
import { ExitCode } from '../core/types'
import { cleanupWorkspaces, createWorkspace, writeJson } from './fixtures/workspace'

const pluginRoot = resolve(process.cwd())

afterEach(() => {
  cleanupWorkspaces()
})

describe('Hook Gateway health report core', () => {
  it('reports a Hook Gateway health boundary without enabling hooks or enforcement', () => {
    const result = generateHookGatewayHealthReport(validBoundary(), 'boundary.json')

    expect(result.status).toBe('devview-hook-gateway-health-report-generated')
    expect(result.healthCheckImplemented).toBe(true)
    expect(result.healthCheckCommandImplemented).toBe(true)
    expect(result.hookScriptsImplemented).toBe(false)
    expect(result.strictModeEnabled).toBe(false)
    expect(result.actualBlockingHookBehaviorImplemented).toBe(false)
    expect(result.guidedEnforcementEnabled).toBe(false)
    expect(result.ciEnforcementEnabled).toBe(false)
    expect(result.graphSourceMutated).toBe(false)
    expect(result.graphDeltaApplied).toBe(false)
    expect(result.approvalStatus).toBe('not-approved')
    expect(result.runtimeEvidenceSatisfied).toBe(false)
    expect(result.equivalenceProven).toBe(false)
    expect(result.scopeEnforced).toBe(false)
    expect(result.nonEnforcing).toBe(true)
    expect(result.runtimeBudgetEnforced).toBe(false)
    expect(result.frontendArtifactAvailabilitySummary.total).toBe(2)
  })

  it('blocks a boundary with the wrong artifact role or status', () => {
    const result = generateHookGatewayHealthReport({
      ...validBoundary(),
      artifactRole: 'wrong-role',
      status: 'wrong-status',
    })

    expect(result.status).toBe('devview-hook-gateway-health-report-blocked')
    expect(result.validationFindings.map((finding) => finding.field)).toEqual(
      expect.arrayContaining(['artifactRole', 'status']),
    )
    expect(result.hookScriptsImplemented).toBe(false)
    expect(result.actualBlockingHookBehaviorImplemented).toBe(false)
  })
})

describe('Hook Gateway health report CLI', () => {
  it('writes only explicit report output without mutating the boundary', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')
    const outputPath = join('.tmp', 'hook-gateway-health.json')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-hook-gateway-health',
        '--boundary',
        'boundary.json',
        '--output',
        outputPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stdout)
    const written = JSON.parse(readFileSync(join(workspace, outputPath), 'utf8'))

    expect(result.exitCode).toBe(ExitCode.Success)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('graph read-model report-hook-gateway-health')
    expect(payload.outputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(payload.hookScriptsImplemented).toBe(false)
    expect(payload.actualBlockingHookBehaviorImplemented).toBe(false)
    expect(written.artifactRole).toBe('devview-hook-gateway-health-report')
    expect(written.writtenOutputPath).toBe(outputPath.replaceAll('\\', '/'))
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
  })

  it('blocks output that would overwrite the source boundary before writing', async () => {
    const workspace = createWorkspace()
    writeJson(join(workspace, 'boundary.json'), validBoundary())
    const boundaryBefore = readFileSync(join(workspace, 'boundary.json'), 'utf8')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-hook-gateway-health',
        '--boundary',
        'boundary.json',
        '--output',
        'boundary.json',
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('would overwrite the source Hook Gateway health boundary')
    expect(readFileSync(join(workspace, 'boundary.json'), 'utf8')).toBe(boundaryBefore)
  })

  it('blocks output that would overwrite a linked frontend artifact', async () => {
    const workspace = createWorkspace()
    const boundary = validBoundary()
    writeJson(join(workspace, 'boundary.json'), boundary)
    writeJson(
      join(
        workspace,
        'examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json',
      ),
      {
        artifactRole: 'request-ir-candidate-schema-preview',
        status: 'original',
      },
    )
    const linkedPath =
      'examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json'
    const linkedBefore = readFileSync(join(workspace, linkedPath), 'utf8')

    const result = await runPbeCli(
      [
        'graph',
        'read-model',
        'report-hook-gateway-health',
        '--boundary',
        'boundary.json',
        '--output',
        linkedPath,
        '--json',
      ],
      { cwd: workspace, pluginRoot },
    )
    const payload = JSON.parse(result.stderr)

    expect(result.exitCode).toBe(ExitCode.ValidationFailed)
    expect(payload.ok).toBe(false)
    expect(payload.issues[0].message).toContain('linked Hook Gateway health boundary artifact')
    expect(readFileSync(join(workspace, linkedPath), 'utf8')).toBe(linkedBefore)
    expect(existsSync(join(workspace, '.tmp', 'hook-gateway-health.json'))).toBe(false)
  })
})

function validBoundary(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    artifactRole: 'devview-hook-gateway-health-boundary-preview',
    status: 'devview-hook-gateway-health-boundary-previewed',
    healthCheckImplemented: false,
    healthCheckCommandImplemented: false,
    hookScriptsImplemented: false,
    hookScriptsInstalled: false,
    hookGatewayConfigured: 'not-checked-preview-only',
    hookGatewayTrusted: 'not-checked-preview-only',
    hookGatewayActive: 'not-checked-preview-only',
    actualBlockingHookBehaviorImplemented: false,
    actualInstallOrTrustMutationImplemented: false,
    strictModeEnabled: false,
    ciEnforcementEnabled: false,
    graphApplyEnabled: false,
    approvalAutomationEnabled: false,
    graphSourceMutated: false,
    graphDeltaApplied: false,
    approvalStatus: 'not-approved',
    humanDecisionRecorded: false,
    equivalenceProven: false,
    runtimeEvidenceSatisfied: false,
    scopeEnforced: false,
    sourceHookGatewayBoundaryArtifact:
      'examples/valid/todo-app-pbe-run/generated/devview-codex-hook-gateway-boundary.runtime-evidence-only.preview.json',
    healthCheckModeMatrix: [
      { mode: 'off', availability: 'available', mayBlock: false, strictMode: false },
      { mode: 'guided', availability: 'future-candidate', mayBlock: true, strictMode: false },
    ],
    futureHealthCheckReadinessItems: [
      {
        item: 'hook-scripts-installed',
        currentStatus: 'false-preview-only',
        futureCheck: 'Detect hook scripts without installing them.',
        mustNotDo: 'install scripts',
      },
    ],
    frontendArtifactAvailability: [
      {
        name: 'AI Request Analyzer boundary',
        status: 'available-boundary-preview',
        path: 'examples/valid/todo-app-pbe-run/generated/ai-request-analyzer-boundary.add-todo-runtime-evidence-only.preview.json',
      },
      {
        name: 'Request IR Candidate schema',
        status: 'available-boundary-preview',
        path: 'examples/valid/todo-app-pbe-run/generated/request-ir-candidate-schema.runtime-evidence-only.preview.json',
      },
    ],
  }
}
