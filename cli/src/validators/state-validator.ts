import { canonicalStateArtifactRelativePath, stateArtifactPath } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import { stateMachineIssues, stateRequiresActor } from '../core/state-machine.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import { getNestedString } from './shared.js'

export async function validateState(root: string): Promise<ValidationIssue[]> {
  const statePath = stateArtifactPath(root)
  const parsed = await readJsonSafe<Record<string, unknown>>(statePath)
  if (!parsed.ok) {
    return [
      issue({
        validator: 'State',
        code: 'PBE_STATE_INVALID_JSON',
        severity: 'error',
        file: canonicalStateArtifactRelativePath(root),
        message: parsed.error,
        suggestedFix: 'Fix .devview/blueprint/devview-state.json before running DevView validation.',
      }),
    ]
  }

  const stateFile = canonicalStateArtifactRelativePath(root)
  const issues = stateMachineIssues(parsed.value)
  issues.push(...acceptedStateActorIssues(parsed.value, stateFile))
  return issues
}

function acceptedStateActorIssues(state: Record<string, unknown>, stateFile: string): ValidationIssue[] {
  const autoflowState = getNestedString(state, ['autoflow', 'state'])
  if (!stateRequiresActor(autoflowState)) {
    return []
  }
  if (
    getNestedString(state, ['acceptance', 'setBy']) === 'user' &&
    getNestedString(state, ['acceptance', 'acceptanceSource']) === 'explicit_user_reply' &&
    getNestedString(state, ['acceptance', 'acceptedAt'])
  ) {
    return []
  }
  return [
    issue({
      validator: 'State',
      code: 'STATE_ACTOR_REQUIRED',
      severity: 'error',
      file: stateFile,
      message: 'Accepted DevView state requires explicit user acceptance metadata.',
      suggestedFix:
        'Keep deliveryStatus submitted_for_review until the user explicitly accepts, then record acceptance.setBy = "user".',
    }),
  ]
}
