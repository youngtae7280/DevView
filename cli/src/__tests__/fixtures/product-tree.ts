import { join } from 'node:path'
import { writeJson } from './workspace'

export function writeMinimalPbe(
  workspace: string,
  options: {
    productTitle: string
    ambiguityResolved: boolean
    includeAcceptanceCriteria: boolean
    rootUserConfirmed: boolean
    acceptedByAssistant?: boolean
  },
): void {
  const productStatus = options.acceptedByAssistant ? 'accepted' : 'confirmed'
  writeJson(join(workspace, '.devview', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'goal',
        title: options.productTitle,
        status: productStatus,
        parent: null,
        children: [],
        source: options.rootUserConfirmed
          ? { actor: options.acceptedByAssistant ? 'assistant' : 'user', type: 'user_interview' }
          : {},
        why: '',
        scopeClass: 'selected',
        acceptance: [],
        acceptanceCriteria: options.includeAcceptanceCriteria
          ? [
              {
                id: 'AC-PT-ROOT-1',
                format: 'EARS',
                type: 'event_driven',
                condition: 'The status changes',
                system: 'THE SYSTEM',
                shall: 'SHALL show the updated status text',
                systemResponse: 'The system shows the updated status text',
                observableResult: 'The updated status text is visible to the user.',
                verificationMethod: 'test_log',
                requiredEvidence: ['test_log'],
                statement: 'WHEN the status changes, THE SYSTEM SHALL show the updated status text.',
                status: 'confirmed',
                source: {
                  type: 'user_interview',
                  sourceNodeId: 'PT-ROOT',
                },
                verification: {
                  required: true,
                  suggestedTestNodeIds: [],
                  evidenceTypes: ['test_log'],
                },
              },
            ]
          : [],
        ambiguity: {
          status: options.ambiguityResolved ? 'clear' : 'partial',
          type: options.ambiguityResolved ? 'none' : 'abstract_quality',
          terms: options.ambiguityResolved ? [] : ['源붾�??�쾶'],
          missing: options.ambiguityResolved ? [] : ['completion_criteria'],
        },
        ambiguityResolution: {
          status: options.ambiguityResolved ? 'resolved' : 'pending',
          resolvedTerms: options.ambiguityResolved ? ['status text is observable'] : [],
        },
        derivedTo: [],
        evidence: [],
      },
    ],
  })
  writeRequirementCompat(workspace, options.productTitle)
  writeDecisionQueue(workspace)
  writeJson(join(workspace, '.devview', 'control', 'acceptance-tree.json'), {
    version: '0.2.0-tree-control',
    branches: options.acceptedByAssistant
      ? [
          {
            productNodeId: 'PT-ROOT',
            status: 'accepted_done',
            decisionSource: {
              actor: 'assistant',
            },
            evidenceNodeIds: [],
          },
        ]
      : [],
  })
  writeJson(join(workspace, '.devview', 'blueprint', 'devview-state.json'), {
    version: '0.2.0-alpha',
    autoflow: {
      enabled: true,
      profile: 'full',
      state: 'INIT',
      completedSteps: ['start'],
      currentGate: null,
      nextStep: 'rpd',
      lastUserAction: options.acceptedByAssistant ? { actor: 'assistant' } : { actor: 'user' },
      stateHistory: [],
    },
    artifacts: {
      productTree: '.devview/tree/product-tree.json',
      decisionQueue: '.devview/control/decision-queue.json',
      acceptanceTree: '.devview/control/acceptance-tree.json',
      requirementTree: '.devview/blueprint/requirement-tree.json',
    },
    deliveryStatus: options.acceptedByAssistant ? 'accepted' : 'waiting_root_confirmation',
  })
}

export function writeExecutableProduct(
  workspace: string,
  options: { scopeClass?: string; status?: string; visualImpact?: boolean; productUpdatedAt?: string } = {},
): void {
  writeJson(join(workspace, '.devview', 'tree', 'product-tree.json'), {
    version: '0.2.0-tree-control',
    rootNodeId: 'PT-ROOT',
    nodes: [
      {
        id: 'PT-ROOT',
        type: 'non_goal',
        title: 'Root goal',
        status: 'confirmed',
        parent: null,
        children: ['PT-1'],
        source: { actor: 'user', type: 'user_interview' },
        scopeClass: 'selected',
        acceptanceCriteria: [],
        acceptanceNotRequiredReason: 'Root groups child capability acceptance criteria.',
        ambiguity: { status: 'clear', type: 'none', missing: [] },
        ambiguityResolution: { status: 'resolved', resolvedTerms: [] },
      },
      {
        id: 'PT-1',
        type: 'capability',
        title: 'Show connected status',
        status: options.status || 'confirmed',
        updatedAt: options.productUpdatedAt,
        parent: 'PT-ROOT',
        children: [],
        source: { actor: 'user', type: 'user_interview' },
        scopeClass: options.scopeClass || 'selected',
        visualImpact: options.visualImpact === true,
        ux: options.visualImpact === true ? { visualAffected: true, visualWorkRequired: true } : {},
        acceptanceCriteria: [
          {
            id: 'AC-PT-1-1',
            format: 'EARS',
            type: 'event_driven',
            condition: 'The connection status changes',
            system: 'THE SYSTEM',
            shall: 'SHALL show the updated status',
            systemResponse: 'The system shows the updated status',
            observableResult: 'The updated connection status is visible to the user.',
            verificationMethod: options.visualImpact === true ? 'manual_screenshot' : 'test_log',
            requiredEvidence: options.visualImpact === true ? ['manual_screenshot'] : ['test_output'],
            statement: 'WHEN the connection status changes, THE SYSTEM SHALL show the updated status.',
            status: 'confirmed',
            source: { type: 'user_interview', sourceNodeId: 'PT-1' },
            verification: {
              required: true,
              method: options.visualImpact === true ? 'manual_screenshot' : 'test_log',
              evidenceTypes: options.visualImpact === true ? ['manual_screenshot'] : ['test_output'],
            },
          },
        ],
        ambiguity: { status: 'clear', type: 'none', missing: [] },
        ambiguityResolution: { status: 'resolved', resolvedTerms: [] },
      },
    ],
  })
}

export function writeRequirementCompat(workspace: string, title = 'Root goal'): void {
  writeJson(join(workspace, '.devview', 'blueprint', 'requirement-tree.json'), {
    schemaVersion: 1,
    rootNodeId: 'req-root',
    traversal: 'breadth_first',
    nodes: [
      {
        id: 'req-root',
        parentId: null,
        title,
        summary: title,
        status: 'confirmed',
        depth: 0,
        children: [],
        facts: [],
        openQuestions: [],
        decisions: [],
        scope: [],
        nonScope: [],
      },
    ],
  })
}

export function writeDecisionQueue(workspace: string): void {
  writeJson(join(workspace, '.devview', 'control', 'decision-queue.json'), {
    version: '0.2.0-tree-control',
    decisions: [],
  })
}
