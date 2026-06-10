import type {
  AutonomousCodexExecutionPack,
  CodexTaskCard,
} from '../acep/acep-types'
import type { VerificationDesign } from '../vd/vd-types'
import type { WorkDesign } from '../wpd/wpd-types'

export function validateWorkDesign(design: WorkDesign) {
  requiredText(design.goal, 'WorkDesign.goal')
  requiredArray(design.scope, 'WorkDesign.scope')
  requiredArray(design.nonScope, 'WorkDesign.nonScope')
  requiredArray(design.acceptanceCriteria, 'WorkDesign.acceptanceCriteria')
  requiredArray(design.stopConditions, 'WorkDesign.stopConditions')

  return design
}

export function validateVerificationDesign(design: VerificationDesign) {
  requiredText(design.verificationGoal, 'VerificationDesign.verificationGoal')
  requiredArray(design.testIdeas, 'VerificationDesign.testIdeas')

  if (design.validationCommands.length === 0 && design.manualChecks.length === 0) {
    throw new Error(
      'VerificationDesign requires validationCommands or manualChecks.',
    )
  }

  return design
}

export function validateTaskCard(card: CodexTaskCard) {
  requiredText(card.goal, 'CodexTaskCard.goal')
  requiredArray(card.scope, 'CodexTaskCard.scope')
  requiredArray(card.nonScope, 'CodexTaskCard.nonScope')
  requiredArray(card.acceptanceCriteria, 'CodexTaskCard.acceptanceCriteria')
  requiredArray(card.validationPlan, 'CodexTaskCard.validationPlan')
  requiredArray(card.stopConditions, 'CodexTaskCard.stopConditions')

  return card
}

export function validateAcePack(pack: AutonomousCodexExecutionPack) {
  const filePaths = new Set(pack.files.map((file) => file.path))

  if (!Array.isArray(pack.manifest.requiredValidation)) {
    throw new Error('ExecutionManifest.requiredValidation must be an array.')
  }

  pack.taskCards.forEach(validateTaskCard)

  pack.manifest.tasks.forEach((task) => {
    if (!filePaths.has(task.file)) {
      throw new Error(`ExecutionManifest task file is missing: ${task.file}`)
    }
  })

  if (!filePaths.has('execution-manifest.json')) {
    throw new Error('ACEP must include execution-manifest.json.')
  }

  return pack
}

function requiredText(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty.`)
  }
}

function requiredArray(value: string[], label: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must contain at least one item.`)
  }
}
