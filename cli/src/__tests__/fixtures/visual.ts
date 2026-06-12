import { join } from 'node:path'
import { writeJson, writeText } from './workspace'

export function writeVisualContractArtifacts(
  workspace: string,
  options: { requiredScreenshot?: boolean; contractOnly?: boolean } = {},
): void {
  writeJson(join(workspace, '.pbe', 'blueprint', 'visual-reference.json'), {
    schemaVersion: '1.0.0',
    artifactType: 'visual_reference',
    status: 'confirmed',
    visualWorkRequired: true,
    primarySource: 'default_pbe_clean_theme',
    sources: [
      {
        sourceId: 'VISUAL-SOURCE-1',
        sourceType: 'default_pbe_clean_theme',
        description: 'Default PBE Clean Theme',
        providedBy: 'codex',
        scope: 'selected_slice',
      },
    ],
    intendedScope: {
      scopeType: 'selected_slice',
      includedSurfaces: ['surface-1'],
      excludedSurfaces: [],
      notes: '',
    },
    mustPreserve: ['existing behavior'],
    nonGoals: ['unrelated redesign'],
    waiver: {
      isWaived: false,
      riskAcceptedByUser: false,
      reason: null,
      scope: null,
    },
  })
  writeText(join(workspace, '.pbe', 'blueprint', 'ui-theme-spec.md'), '# UI Theme Spec\n')
  writeJson(join(workspace, '.pbe', 'blueprint', 'design-tokens.json'), {
    schemaVersion: '1.0.0',
    artifactType: 'design_tokens',
    status: 'confirmed',
    sourceRef: '.pbe/blueprint/visual-reference.json',
    tokens: {
      colors: { primary: { value: '#3B82F6' } },
      spacing: { sm: { value: '8px' } },
      radius: { control: { value: '8px' } },
      typography: { body: { fontSize: '14px', lineHeight: '20px' } },
      border: { subtle: { value: '1px solid #D0D5DD' } },
      shadow: { panel: { value: '0 1px 2px rgba(16, 24, 40, 0.06)' } },
      motion: { fast: { value: '120ms ease' } },
    },
    openQuestions: [],
    exceptions: [],
  })
  writeJson(join(workspace, '.pbe', 'blueprint', 'component-style-contract.json'), {
    schemaVersion: '1.0.0',
    artifactType: 'component_style_contract',
    status: 'confirmed',
    sourceRef: '.pbe/blueprint/design-tokens.json',
    components: [
      {
        componentName: 'Button',
        visualRole: 'Actions',
        requiredTokens: ['colors.primary', 'radius.control'],
        allowedVariants: ['primary'],
        requiredStates: ['default', 'focus'],
        forbiddenChanges: ['one-off colors'],
        evidenceRequired: ['default'],
      },
      {
        componentName: 'Panel',
        visualRole: 'Container',
        requiredTokens: ['colors.panelBackground', 'radius.panel'],
        allowedVariants: ['default'],
        requiredStates: ['default'],
        forbiddenChanges: ['unapproved shadows'],
        evidenceRequired: ['default'],
      },
    ],
    localExceptions: [],
    openQuestions: [],
  })
  if (options.contractOnly) {
    return
  }
  writeJson(join(workspace, '.pbe', 'control', 'ui-surface-inventory.json'), {
    schemaVersion: '1.0.0',
    artifactType: 'ui_surface_inventory',
    status: 'confirmed',
    surfaces: options.requiredScreenshot
      ? [
          {
            surfaceId: 'surface-1',
            name: 'Status surface',
            surfaceType: 'panel',
            owningFiles: ['src/status.ts'],
            styleFiles: [],
            reusableComponentsUsed: ['Button', 'Panel'],
            statesRequired: ['default'],
            requiredScreenshots: [
              {
                state: 'default',
                path: '.pbe/evidence/screenshots/surface-1-default.png',
                required: true,
              },
            ],
            relatedProductNodes: ['PT-1'],
            relatedWorkNodes: ['WT-1'],
            relatedTestNodes: ['TT-1'],
            deferredOrOutOfScopeVisualItems: [],
            riskNotes: [],
          },
        ]
      : [],
    childSurfaces: [],
    missingInventoryItems: [],
  })
  writeJson(join(workspace, '.pbe', 'control', 'component-style-inventory.json'), {
    schemaVersion: '1.0.0',
    artifactType: 'component_style_inventory',
    status: 'confirmed',
    components: [],
    globalStyleFiles: [],
    tokenIntegrationFiles: [],
    risks: [],
  })
  writeJson(join(workspace, '.pbe', 'control', 'visual-verification-profile.json'), {
    version: '0.2.1-parity-completeness',
    schemaVersion: '1.0.0',
    artifactType: 'visual_verification_profile',
    status: 'confirmed',
    visualContractRef: '.pbe/blueprint/ui-theme-spec.md',
    designTokensRef: '.pbe/blueprint/design-tokens.json',
    componentContractRef: '.pbe/blueprint/component-style-contract.json',
    surfaceInventoryRef: '.pbe/control/ui-surface-inventory.json',
    contractChecks: [],
    blockingIssues: [],
    waivers: [],
    profiles: [],
  })
}

export function writePassingVisualAudit(workspace: string): void {
  writeText(
    join(workspace, '.pbe', 'evidence', 'visual-audit.md'),
    [
      '# Visual Implementation Audit',
      '',
      '## Scope',
      '## Visual Contract Artifacts',
      '## Screenshot Evidence',
      '## State Coverage',
      '## Component Contract Compliance',
      '## Deviations',
      '## Blocking Issues',
      '- None',
      '',
      '## Result',
      '- Status: pass',
      '',
    ].join('\n'),
  )
}
