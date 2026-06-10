import { createPbeId, nowIso } from '../shared/ids'
import { getNodeTitle } from '../shared/tree-context'
import type {
  AcceptancePlan,
  GenerateAcceptancePlanInput,
  GenerateLeafVerificationDesignInput,
  SynthesizeParentVerificationDesignInput,
  VerificationDesign,
  VerificationDesigner,
} from './vd-types'

export class MockVerificationDesigner implements VerificationDesigner {
  async generateLeafVerificationDesign(
    input: GenerateLeafVerificationDesignInput,
  ): Promise<VerificationDesign> {
    const timestamp = nowIso()

    return {
      id: createPbeId('verify'),
      nodeId: input.node.id,
      type: 'leaf',
      status: 'ready_for_parent_synthesis',
      verificationGoal: `Verify "${input.node.title}" after implementation.`,
      testIdeas: [
        `Exercise the primary behavior described by ${input.node.title}.`,
        'Check the smallest visible result or state transition.',
      ],
      validationCommands: [
        'Codex must inspect package scripts and choose the closest available focused test command.',
      ],
      evidenceRequired: [
        'Validation command output or a note explaining why it was unavailable.',
        'Short summary of files changed for this requirement.',
      ],
      regressionRisks: [
        'Sibling requirement behavior may change unintentionally.',
        'Existing public API or UI behavior may shift outside scope.',
      ],
      manualChecks: [
        'Review the implemented behavior against the task card acceptance criteria.',
      ],
      parentIntegrationChecks: [
        'Confirm this leaf can be composed with sibling leaf work.',
      ],
      acceptanceCriteria: input.workDesign.acceptanceCriteria,
      failureRecoveryNotes: [
        'Read the failure log and fix failures related to this task.',
        'If the same failure repeats three times, stop and report it.',
      ],
      summary: `Leaf verification design for ${input.node.title}.`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }

  async synthesizeParentVerificationDesign(
    input: SynthesizeParentVerificationDesignInput,
  ): Promise<VerificationDesign> {
    const timestamp = nowIso()
    const type = input.node.parentId ? 'parent' : 'root'

    return {
      id: createPbeId('verify'),
      nodeId: input.node.id,
      type,
      status: 'synthesized',
      verificationGoal: `Verify integrated behavior for "${input.node.title}".`,
      testIdeas: unique(input.childDesigns.flatMap((design) => design.testIdeas)),
      validationCommands: unique(
        input.childDesigns.flatMap((design) => design.validationCommands),
      ),
      evidenceRequired: unique(
        input.childDesigns.flatMap((design) => design.evidenceRequired),
      ),
      regressionRisks: unique(
        input.childDesigns.flatMap((design) => design.regressionRisks),
      ),
      manualChecks: [
        `Review integrated behavior for ${getNodeTitle(input.project, input.node.id)}.`,
        ...unique(input.childDesigns.flatMap((design) => design.manualChecks)),
      ],
      parentIntegrationChecks: unique(
        input.childDesigns.flatMap((design) => design.parentIntegrationChecks),
      ),
      acceptanceCriteria:
        input.workDesign?.acceptanceCriteria ??
        unique(input.childDesigns.flatMap((design) => design.acceptanceCriteria)),
      failureRecoveryNotes: unique(
        input.childDesigns.flatMap((design) => design.failureRecoveryNotes),
      ),
      summary: `Synthesized ${type} verification design from ${input.childDesigns.length} child design(s).`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  }

  async generateAcceptancePlan(
    input: GenerateAcceptancePlanInput,
  ): Promise<AcceptancePlan> {
    const designs = Object.values(input.verificationDesigns)
    const commands = unique(designs.flatMap((design) => design.validationCommands))

    return {
      id: createPbeId('acceptance'),
      rootAcceptanceCriteria: [
        'Every ACEP task card is completed.',
        'All task acceptance criteria are satisfied.',
        'Required validation passes or unavailable validation is documented.',
        'Final report is written from the ACEP template.',
      ],
      integrationTestAreas: unique(
        designs.flatMap((design) => design.parentIntegrationChecks),
      ),
      regressionRiskAreas: unique(designs.flatMap((design) => design.regressionRisks)),
      requiredEvidence: unique(designs.flatMap((design) => design.evidenceRequired)),
      suggestedValidationCommands:
        commands.length > 0
          ? commands
          : [
              'Codex must inspect package scripts and choose the closest available command.',
            ],
      manualReviewChecklist: unique(designs.flatMap((design) => design.manualChecks)),
      releaseReadinessChecks: [
        'Build or typecheck passes when available.',
        'Focused tests for touched behavior pass when available.',
        'Known issues are not stop conditions.',
      ],
      summary: `Acceptance plan for ${input.rootNode.title}.`,
    }
  }
}

function unique(items: string[]) {
  return [...new Set(items.filter((item) => item.trim()))]
}
