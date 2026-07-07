import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('DevView legacy tree validator', () => {
  it('passes when only schemas and templates are present', () => {
    const workspace = createTreeValidatorWorkspace()

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(0)
    expect(result.output).toContain('No DevView tree artifacts found')
  })

  it('accepts a minimal linked Product and Work tree', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(0)
    expect(result.output).toContain('Validated 2 DevView tree artifact')
  })

  it('rejects Work nodes that do not derive from known Product nodes', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-MISSING')

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('references missing product source')
  })

  it('rejects submitted cycles that include work without test coverage', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeCycleTree(workspace, {
      status: 'submitted_for_review',
      includedWorkNodeIds: ['WT-1'],
      includedTestNodeIds: [],
    })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('has no included Test Tree nodes')
    expect(result.output).toContain('included work WT-1 lacks included Test Tree coverage')
  })

  it('rejects submitted cycles whose included tests lack attached evidence', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed')
    writeCycleTree(workspace, {
      status: 'submitted_for_review',
      includedWorkNodeIds: ['WT-1'],
      includedTestNodeIds: ['TT-1'],
    })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('included test TT-1 lacks attached Evidence Tree evidence')
  })

  it('rejects accepted branches that use stale evidence', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'test_output',
        status: 'stale_evidence',
        provesNodeIds: ['PT-1'],
      },
    ])
    writeAcceptanceTree(workspace, 'PT-1', 'EV-1')

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('uses non-current evidence EV-1 with status stale_evidence')
  })

  it('rejects parity-reviewed surfaces without legacy inventory links', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed')
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'manual_note',
        status: 'attached',
        provesNodeIds: ['TT-1'],
      },
    ])
    writeSurfaceCompletionLedger(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('claims parity_reviewed but lacks legacyInventoryIds')
  })

  it('rejects hardware certification without certification evidence', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed')
    writeHardwareReadinessLedger(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('is hardware_certified but lacks certification evidence')
  })

  it('rejects repeated verification misses resolved without promotion', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeVerificationMissLog(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('repeated 2 times but was resolved without promotion or blocking')
  })

  it('rejects closed dialog surfaces that only prove command mapping', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'planned')
    writeCommandMappedDialogSurface(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('opens a dialog/workflow but lacks childSurfaceIds or subdialog legacyInventoryIds')
    expect(result.output).toContain('from command mapping only; workflow/dialog evidence is required')
  })

  it('rejects parity claims when required legacy event handlers are unverified', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed')
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'manual_note',
        status: 'attached',
        provesNodeIds: ['TT-1'],
      },
    ])
    writeLegacyInventoryWithUnverifiedHandler(workspace)
    writeParityReviewedSurfaceWithInventory(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('claims parity but required event handler EVT-READ is unverified')
    expect(result.output).toContain('cannot close while legacy event handler EVT-READ is unverified')
  })

  it('rejects hardware-gated closed surfaces without substitute evidence', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'planned')
    writeHardwareGatedSurfaceWithoutSubstituteEvidence(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('is hardware-gated but lacks mock/fake/UI-automation substitute evidence')
  })

  it('accepts WindowsUtility-style verification miss process-improvement logs', () => {
    const workspace = createTreeValidatorWorkspace()
    writeWindowsUtilityStyleVerificationMissLog(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(0)
  })

  it('rejects confirmed executable Product nodes without acceptance criteria', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTreeWithoutAcceptanceCriteria(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('lacks acceptanceCriteria or acceptanceNotRequiredReason')
  })

  it('rejects work derived from ambiguous Product nodes', () => {
    const workspace = createTreeValidatorWorkspace()
    writeAmbiguousProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('derives from ambiguous or partial Product node PT-1')
  })

  it('rejects acceptance criteria that lack Test Tree coverage once tests exist', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed', { verifiesAcceptanceCriteriaIds: [] })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('acceptance criteria AC-PT-1-1 lacks Test Tree coverage')
  })

  it('rejects accepted branches without a user decision source', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'test_output',
        status: 'attached',
        provesNodeIds: ['PT-1'],
      },
    ])
    writeAcceptanceTree(workspace, 'PT-1', 'EV-1', { includeDecisionSource: false })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('lacks user decisionSource')
  })

  it('rejects applied acceptance changes without Impact Tree entries', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeChangeTreeWithCriteriaDelta(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain(
      'changes product/scope/acceptance/verification meaning but lacks Impact Tree entries',
    )
  })

  it('rejects Work Tree references to missing acceptance criteria IDs', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1', { satisfiesAcceptanceCriteriaIds: ['AC-MISSING'] })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('work WT-1 references missing acceptance criteria: AC-MISSING')
  })

  it('rejects Test Tree references to missing acceptance criteria IDs', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed', { verifiesAcceptanceCriteriaIds: ['AC-MISSING'] })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('test TT-1 references missing acceptance criteria: AC-MISSING')
  })

  it('rejects Evidence Tree references to missing acceptance criteria IDs', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'test_output',
        status: 'attached',
        provesNodeIds: ['PT-1'],
        evidenceForAcceptanceCriteriaIds: ['AC-MISSING'],
      },
    ])

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('evidence EV-1 references missing acceptance criteria: AC-MISSING')
  })

  it('rejects present visual verification profiles that reference missing tree nodes', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeVisualVerificationProfile(workspace, {
      productNodeIds: ['PT-MISSING'],
    })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('visual profile VVP-INVALID references missing product node: PT-MISSING')
  })

  it('rejects Work nodes without Test Tree coverage once tests exist', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeRootOnlyTestTree(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('work WT-1 lacks Test Tree coverage')
  })

  it('rejects submitted criteria without attached criteria evidence', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeWorkTree(workspace, 'PT-1')
    writeTestTree(workspace, 'PT-1', 'WT-1', 'passed')
    writeEvidenceTree(workspace, [
      {
        id: 'EV-1',
        type: 'test_output',
        status: 'attached',
        provesNodeIds: ['TT-1'],
      },
    ])
    writeCycleTree(workspace, {
      status: 'submitted_for_review',
      includedWorkNodeIds: ['WT-1'],
      includedTestNodeIds: ['TT-1'],
    })

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain('acceptance criteria AC-PT-1-1 lacks attached Evidence Tree evidence')
  })

  it('rejects criteria changes without criteria-specific retest impact', () => {
    const workspace = createTreeValidatorWorkspace()
    writeProductTree(workspace)
    writeChangeTreeWithCriteriaDelta(workspace)
    writeImpactTreeWithoutCriteriaRetest(workspace)

    const result = runTreeValidator(workspace)

    expect(result.status).toBe(1)
    expect(result.output).toContain(
      'changes acceptance criteria AC-PT-1-1 but lacks retest/reopen/replace_evidence impact',
    )
  })
})

function createTreeValidatorWorkspace() {
  const workspace = mkdtempSync(join(tmpdir(), 'pbe-tree-validator-'))
  tempRoots.push(workspace)

  for (const entry of ['schemas', 'templates']) {
    cpSync(resolve(process.cwd(), entry), join(workspace, entry), { recursive: true })
  }

  return workspace
}

function runTreeValidator(workspace: string) {
  try {
    const output = execFileSync(
      process.execPath,
      [resolve(process.cwd(), 'scripts/validate-devview-legacy-tree-system.js')],
      {
        cwd: workspace,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    return { status: 0, output }
  } catch (error) {
    const failure = error as { status?: number; stdout?: Buffer; stderr?: Buffer }
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout?.toString() || ''}${failure.stderr?.toString() || ''}`,
    }
  }
}

function writeProductTree(workspace: string) {
  writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: 'Product root',
        status: 'accepted',
        parent: null,
        children: ['PT-1'],
      },
      {
        id: 'PT-1',
        type: 'capability',
        title: 'Example capability',
        status: 'accepted',
        parent: 'PT-ROOT',
        children: [],
        scopeClass: 'selected',
        acceptanceCriteria: [
          {
            id: 'AC-PT-1-1',
            format: 'EARS',
            type: 'ubiquitous',
            condition: 'The capability is used',
            systemResponse: 'The system provides the expected capability',
            statement: 'THE SYSTEM SHALL provide the expected capability.',
            status: 'confirmed',
            source: {
              type: 'user_interview',
              sourceNodeId: 'PT-1',
            },
            verification: {
              required: true,
              suggestedTestNodeIds: ['TT-1'],
              evidenceTypes: ['test_output'],
            },
          },
        ],
      },
    ],
  })
}

function writeProductTreeWithoutAcceptanceCriteria(workspace: string) {
  writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: 'Product root',
        status: 'accepted',
        parent: null,
        children: ['PT-1'],
      },
      {
        id: 'PT-1',
        type: 'capability',
        title: 'Example capability',
        status: 'accepted',
        parent: 'PT-ROOT',
        children: [],
        scopeClass: 'selected',
      },
    ],
  })
}

function writeAmbiguousProductTree(workspace: string) {
  writeJson(join(workspace, '.pbe', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: 'Product root',
        status: 'draft',
        parent: null,
        children: ['PT-1'],
      },
      {
        id: 'PT-1',
        type: 'capability',
        title: 'Make the screen clean',
        status: 'needs_clarification',
        parent: 'PT-ROOT',
        children: [],
        scopeClass: 'selected',
        ambiguity: {
          status: 'ambiguous',
          type: 'abstract_quality',
          terms: ['clean'],
          missing: ['completion_criteria', 'verification_method'],
        },
      },
    ],
  })
}

function writeWorkTree(
  workspace: string,
  productNodeId: string,
  options: { satisfiesAcceptanceCriteriaIds?: string[] } = {},
) {
  writeJson(join(workspace, '.pbe', 'tree', 'work-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'WT-ROOT',
    nodes: [
      {
        id: 'WT-ROOT',
        type: 'foundation_task',
        title: 'Work root',
        status: 'ready',
        derivedFromProductNodeIds: [],
        derivedFromProjectNodeIds: [],
        scopeClass: 'foundation',
      },
      {
        id: 'WT-1',
        type: 'feature_task',
        title: 'Implement capability',
        status: 'ready',
        derivedFromProductNodeIds: [productNodeId],
        derivedFromProjectNodeIds: [],
        scopeClass: 'selected',
        expectedFiles: ['src/example.ts'],
        expectedSharedFiles: [],
        forbiddenFiles: [],
        unknownFileTouchRisk: false,
        dependencies: [],
        satisfiesAcceptanceCriteriaIds: options.satisfiesAcceptanceCriteriaIds ?? ['AC-PT-1-1'],
        doneCriteria: ['Capability implemented'],
        validationHints: ['Run focused tests'],
      },
    ],
    edges: [],
  })
}

function writeRootOnlyTestTree(workspace: string) {
  writeJson(join(workspace, '.pbe', 'tree', 'test-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'TT-ROOT',
    nodes: [
      {
        id: 'TT-ROOT',
        type: 'acceptance_check',
        title: 'Test root',
        status: 'planned',
        verifiesProductNodeIds: [],
        verifiesProjectNodeIds: [],
        verifiesWorkNodeIds: [],
        verifiesAcceptanceCriteriaIds: [],
        evidenceRequired: [],
      },
    ],
  })
}

function writeTestTree(
  workspace: string,
  productNodeId: string,
  workNodeId: string,
  status: string,
  options: { verifiesAcceptanceCriteriaIds?: string[] } = {},
) {
  writeJson(join(workspace, '.pbe', 'tree', 'test-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'TT-ROOT',
    nodes: [
      {
        id: 'TT-ROOT',
        type: 'acceptance_check',
        title: 'Test root',
        status: 'planned',
        verifiesProductNodeIds: [],
        verifiesProjectNodeIds: [],
        verifiesWorkNodeIds: [],
        evidenceRequired: [],
      },
      {
        id: 'TT-1',
        type: 'unit_test',
        title: 'Verify capability',
        status,
        verifiesProductNodeIds: [productNodeId],
        verifiesProjectNodeIds: [],
        verifiesWorkNodeIds: [workNodeId],
        verifiesAcceptanceCriteriaIds: options.verifiesAcceptanceCriteriaIds ?? ['AC-PT-1-1'],
        validationCommands: ['npm test'],
        manualChecks: [],
        passCriteria: ['Capability is verified'],
        evidenceRequired: ['test output'],
      },
    ],
  })
}

function writeCycleTree(
  workspace: string,
  options: {
    status: string
    includedWorkNodeIds: string[]
    includedTestNodeIds: string[]
  },
) {
  writeJson(join(workspace, '.pbe', 'execution', 'cycle-tree.json'), {
    version: '0.2.0-tree-control',
    activeCycleId: 'CYCLE-1',
    cycles: [
      {
        id: 'CYCLE-1',
        goal: 'Implement capability',
        status: options.status,
        includedProductNodeIds: ['PT-1'],
        includedProjectNodeIds: [],
        includedWorkNodeIds: options.includedWorkNodeIds,
        includedTestNodeIds: options.includedTestNodeIds,
        explicitlyExcludedNodeIds: [],
        requiresChangeNode: [],
        requiredEvidence: ['test output'],
        closeCriteria: ['Included work and tests are complete'],
      },
    ],
  })
}

function writeEvidenceTree(
  workspace: string,
  evidence: Array<{
    id: string
    type: string
    status: string
    provesNodeIds: string[]
    evidenceForTestNodeIds?: string[]
    evidenceForAcceptanceCriteriaIds?: string[]
  }>,
) {
  writeJson(join(workspace, '.pbe', 'evidence', 'evidence-tree.json'), {
    version: '0.2.0-tree-control',
    evidence,
  })
}

function writeAcceptanceTree(
  workspace: string,
  productNodeId: string,
  evidenceNodeId: string,
  options: { includeDecisionSource?: boolean } = {},
) {
  writeJson(join(workspace, '.pbe', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: [
      {
        productNodeId,
        status: 'accepted_done',
        cycleIds: ['CYCLE-1'],
        evidenceNodeIds: [evidenceNodeId],
        userAcceptedAt: '2026-06-11T00:00:00.000Z',
        ...(options.includeDecisionSource === false
          ? {}
          : {
              decisionSource: {
                actor: 'user',
                sourceText: 'User accepted the branch.',
              },
            }),
        notes: 'User accepted the branch.',
      },
    ],
  })
}

function writeChangeTreeWithCriteriaDelta(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'change-tree.json'), {
    version: '0.2.0-tree-control',
    changes: [
      {
        id: 'CH-1',
        type: 'acceptance_change',
        status: 'applied',
        reason: 'Acceptance criteria changed.',
        affectedNodeIds: ['PT-1'],
        affectedAcceptanceCriteriaIds: ['AC-PT-1-1'],
        requiresRevisionRpd: true,
        criteriaDelta: {
          added: [],
          modified: ['AC-PT-1-1'],
          invalidated: [],
        },
      },
    ],
  })
}

function writeImpactTreeWithoutCriteriaRetest(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'impact-tree.json'), {
    version: '0.2.0-tree-control',
    impacts: [
      {
        id: 'IMP-1',
        changeId: 'CH-1',
        affectedNodeId: 'PT-1',
        affectedAcceptanceCriteriaIds: [],
        impactType: 'none',
        requiredAction: 'preserve',
        reason: 'Incorrectly treats criteria change as non-impacting.',
      },
    ],
  })
}

function writeSurfaceCompletionLedger(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'surface-completion-ledger.json'), {
    version: '0.2.1-parity-completeness',
    surfaces: [
      {
        id: 'SURFACE-1',
        title: 'Parity surface',
        scopeClass: 'selected',
        completionLayer: 'parity_reviewed',
        parityClaim: 'parity_reviewed',
        productNodeIds: ['PT-1'],
        projectNodeIds: [],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: ['EV-1'],
        legacyInventoryIds: [],
        visualProfileIds: [],
        hardwareReadinessIds: [],
        acceptanceBranchIds: [],
        items: [],
      },
    ],
  })
}

function writeCommandMappedDialogSurface(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'surface-completion-ledger.json'), {
    version: '0.2.1-parity-completeness',
    profileApplicability: ['legacy_migration', 'subdialog_parity'],
    surfaces: [
      {
        id: 'SURFACE-MEMORY-INFO-COMMAND',
        title: 'Memory Info command',
        surfaceKind: 'command',
        opensDialog: true,
        scopeClass: 'selected',
        completionLayer: 'technical_stable',
        parityClaim: 'inventory_ready',
        productNodeIds: ['PT-1'],
        projectNodeIds: [],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: [],
        legacyInventoryIds: [],
        visualProfileIds: [],
        hardwareReadinessIds: [],
        acceptanceBranchIds: [],
        childSurfaceIds: [],
        subdialogAudit: {
          required: true,
          status: 'pending_inventory',
          childSurfaceIds: [],
          legacyInventoryIds: [],
          testNodeIds: ['TT-1'],
          evidenceNodeIds: [],
        },
        items: [
          {
            id: 'ITEM-CMD-MAPPED',
            label: 'Config Memory Info command routes to a dialog',
            itemKind: 'command',
            status: 'command_mapped',
            productNodeIds: ['PT-1'],
            workNodeIds: ['WT-1'],
            testNodeIds: ['TT-1'],
            evidenceNodeIds: [],
          },
        ],
      },
    ],
  })
}

function writeLegacyInventoryWithUnverifiedHandler(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'legacy-control-inventory.json'), {
    version: '0.2.1-parity-completeness',
    inventories: [
      {
        id: 'LCI-MEMORY-INFO',
        surfaceId: 'SURFACE-MEMORY-INFO-DIALOG',
        title: 'Memory Info dialog',
        sourceKind: 'rc_dialog',
        sourcePaths: ['legacy/Config.rc'],
        dialogResourceIds: ['IDD_CONFIG_MEMORY_INFO'],
        claimStatus: 'parity_claimed',
        productNodeIds: ['PT-1'],
        projectNodeIds: [],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: ['EV-1'],
        controls: [
          {
            id: 'IDC_READ_MEMORY_INFO',
            label: 'Read Memory Info',
            controlType: 'button',
            legacyState: 'visible_enabled',
            currentStatus: 'matched',
            requiredForParity: true,
            eventHandlerIds: ['EVT-READ'],
            evidenceNodeIds: ['EV-1'],
          },
        ],
        eventHandlers: [
          {
            id: 'EVT-READ',
            legacyHandler: 'OnBnClickedReadMemoryInfo',
            triggerControlId: 'IDC_READ_MEMORY_INFO',
            expectedBehavior: 'Reads memory info and displays the result.',
            requiredForParity: true,
            currentStatus: 'unverified',
            evidenceNodeIds: [],
          },
        ],
      },
    ],
  })
}

function writeParityReviewedSurfaceWithInventory(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'surface-completion-ledger.json'), {
    version: '0.2.1-parity-completeness',
    surfaces: [
      {
        id: 'SURFACE-MEMORY-INFO-DIALOG',
        title: 'Memory Info dialog',
        surfaceKind: 'dialog',
        scopeClass: 'selected',
        completionLayer: 'parity_reviewed',
        parityClaim: 'parity_reviewed',
        productNodeIds: ['PT-1'],
        projectNodeIds: [],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: ['EV-1'],
        legacyInventoryIds: ['LCI-MEMORY-INFO'],
        visualProfileIds: [],
        hardwareReadinessIds: [],
        acceptanceBranchIds: [],
        childSurfaceIds: [],
        subdialogAudit: {
          required: true,
          status: 'verified',
          childSurfaceIds: [],
          legacyInventoryIds: ['LCI-MEMORY-INFO'],
          testNodeIds: ['TT-1'],
          evidenceNodeIds: ['EV-1'],
        },
        items: [
          {
            id: 'ITEM-DIALOG-SURFACE',
            label: 'Memory Info dialog visible controls',
            itemKind: 'dialog_surface',
            status: 'dialog_surface_complete',
            evidenceNodeIds: ['EV-1'],
          },
        ],
      },
    ],
  })
}

function writeHardwareGatedSurfaceWithoutSubstituteEvidence(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'surface-completion-ledger.json'), {
    version: '0.2.1-parity-completeness',
    surfaces: [
      {
        id: 'SURFACE-HARDWARE-DIALOG',
        title: 'Hardware-gated dialog',
        surfaceKind: 'dialog',
        scopeClass: 'selected',
        completionLayer: 'technical_stable',
        parityClaim: 'inventory_ready',
        hardwareGated: true,
        productNodeIds: ['PT-1'],
        projectNodeIds: [],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: [],
        legacyInventoryIds: [],
        visualProfileIds: [],
        hardwareReadinessIds: [],
        acceptanceBranchIds: [],
        items: [
          {
            id: 'ITEM-MANUAL-NOT-VERIFIED',
            label: 'Hardware action was not clicked',
            itemKind: 'hardware_action',
            status: 'hardware_certification_pending',
            hardwareGated: true,
            substituteEvidenceType: 'manual_not_verified',
          },
        ],
      },
    ],
  })
}

function writeHardwareReadinessLedger(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'hardware-readiness-ledger.json'), {
    version: '0.2.1-parity-completeness',
    features: [
      {
        id: 'HR-1',
        title: 'Certified hardware feature',
        state: 'hardware_certified',
        productNodeIds: ['PT-1'],
        workNodeIds: ['WT-1'],
        testNodeIds: ['TT-1'],
        evidenceNodeIds: [],
        certificationEvidenceNodeIds: [],
      },
    ],
  })
}

function writeVerificationMissLog(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'verification-miss-log.json'), {
    version: '0.2.1-parity-completeness',
    misses: [
      {
        id: 'VML-1',
        feedbackItemIds: ['FB-1'],
        affectedNodeIds: ['PT-1'],
        missType: 'visual_runtime_gap',
        occurrenceCount: 2,
        whyPreviousVerificationMissedThis: 'The previous validation did not inspect runtime coordinates.',
        promotionDecision: 'not_required',
        promotedTestNodeIds: [],
        promotedEvidenceNodeIds: [],
        promotedContractRefs: [],
        status: 'resolved',
      },
    ],
  })
}

function writeVisualVerificationProfile(
  workspace: string,
  options: {
    productNodeIds?: string[]
    projectNodeIds?: string[]
    workNodeIds?: string[]
    testNodeIds?: string[]
    evidenceNodeIds?: string[]
  } = {},
) {
  writeJson(join(workspace, '.pbe', 'control', 'visual-verification-profile.json'), {
    version: '0.2.1-parity-completeness',
    schemaVersion: '1.0.0',
    artifactType: 'visual_verification_profile',
    status: 'draft',
    contractChecks: [],
    blockingIssues: [],
    waivers: [],
    profiles: [
      {
        id: 'VVP-INVALID',
        surfaceId: 'SURFACE-INVALID',
        title: 'Invalid visual verification profile',
        applicability: 'required',
        productNodeIds: options.productNodeIds ?? [],
        projectNodeIds: options.projectNodeIds ?? [],
        workNodeIds: options.workNodeIds ?? [],
        testNodeIds: options.testNodeIds ?? [],
        evidenceNodeIds: options.evidenceNodeIds ?? [],
        checks: [],
      },
    ],
  })
}

function writeWindowsUtilityStyleVerificationMissLog(workspace: string) {
  writeJson(join(workspace, '.pbe', 'control', 'verification-miss-log.json'), {
    schemaVersion: 1,
    generatedAt: '2026-06-11T00:00:00.000Z',
    misses: [
      {
        id: 'vml-memory-info-parity-miss',
        sourceFeedbackId: 'fb-memory-info-dialog-controls-missing',
        affectedRequirementIds: ['req-memory-info'],
        affectedTaskIds: ['task-memory-info-command'],
        affectedVerificationIds: ['verify-memory-info-command'],
        type: 'legacy_subdialog_control_miss',
        summary: 'Command-level completion missed required Memory Info dialog controls.',
        whyPreviousVerificationMissedThis: [
          'Validation checked command availability but did not open the dialog.',
          'No child surface inventory existed for controls or event handlers.',
        ],
        requiredPbeImprovements: ['Promote commands that open dialogs into child surface inventory and tests.'],
        promotion: {
          status: 'proposed',
          reason: 'Subdialog controls must become explicit Work/Test nodes.',
        },
        status: 'reported_for_pbe_improvement',
      },
    ],
  })
}

function writeJson(file: string, value: unknown) {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
