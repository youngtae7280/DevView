import { defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  arrayObjects,
  getNestedString,
  hasUserConfirmationEvidence,
  nodesOf,
  readJsonIfExists,
  stringValue,
} from './shared.js'

export async function validateAcceptedActors(root: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const product = await readJsonIfExists(root, 'productTree')
  const acceptance = await readJsonIfExists(root, 'acceptanceTree')
  const state = await readJsonIfExists(root, 'pbeState')

  for (const node of nodesOf(product)) {
    const status = stringValue(node.status)
    if (['accepted', 'accepted_done'].includes(status) && !hasUserConfirmationEvidence(node)) {
      issues.push(
        issue({
          validator: 'Acceptance',
          code: 'ASSISTANT_ACCEPTED_STATUS',
          severity: 'error',
          file: defaultArtifacts.productTree,
          nodeId: stringValue(node.id),
          message: `Product node ${String(node.id)} is ${status} without explicit user approval metadata.`,
          suggestedFix: 'Codex may submit for review, but only user approval may set accepted state.',
        }),
      )
    }
  }

  for (const branch of arrayObjects(acceptance?.branches)) {
    if (branch.status === 'accepted_done' && getNestedString(branch, ['decisionSource', 'actor']) !== 'user') {
      issues.push(
        issue({
          validator: 'Acceptance',
          code: 'ASSISTANT_ACCEPTED_STATUS',
          severity: 'error',
          file: defaultArtifacts.acceptanceTree,
          nodeId: stringValue(branch.productNodeId),
          message: `Acceptance branch ${String(branch.productNodeId)} is accepted_done without user decisionSource.`,
          suggestedFix: 'Record explicit user approval before marking a branch accepted.',
        }),
      )
    }
  }

  const deliveryStatus = stringValue(state?.deliveryStatus)
  if (
    deliveryStatus === 'accepted' &&
    (getNestedString(state, ['acceptance', 'setBy']) !== 'user' ||
      getNestedString(state, ['acceptance', 'acceptanceSource']) !== 'explicit_user_reply' ||
      !getNestedString(state, ['acceptance', 'acceptedAt']))
  ) {
    issues.push(
      issue({
        validator: 'Acceptance',
        code: 'ASSISTANT_ACCEPTED_STATUS',
        severity: 'error',
        file: defaultArtifacts.pbeState,
        message: 'pbe-state deliveryStatus is accepted without explicit user acceptance metadata.',
        suggestedFix: 'Use submitted_for_review until the user explicitly accepts the result.',
      }),
    )
  }

  return issues
}
