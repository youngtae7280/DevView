import { existsSync } from 'node:fs'
import { artifactPath, defaultArtifacts } from '../core/project.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'
import {
  arrayObjects,
  getNestedBoolean,
  getNestedValue,
  hasSelectedVisualWork,
  isObject,
  missingIssue,
  readJsonIfExists,
  stringValue,
  validateVisualAudit,
  validateVisualEvidence,
  visualSourceOf,
  type JsonObject,
} from './shared.js'

export async function validateVisualDesign(
  root: string,
  options: { requireEvidence?: boolean; requireInventory?: boolean; requireAudit?: boolean } = {},
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const requireInventory = options.requireInventory !== false
  const product = await readJsonIfExists(root, 'productTree')
  const work = await readJsonIfExists(root, 'workTree')
  const test = await readJsonIfExists(root, 'testTree')
  const evidence = await readJsonIfExists(root, 'evidenceTree')
  const visualReference = await readJsonIfExists(root, 'visualReference')
  const designTokens = await readJsonIfExists(root, 'designTokens')
  const componentStyleContract = await readJsonIfExists(root, 'componentStyleContract')
  const uiSurfaceInventory = await readJsonIfExists(root, 'uiSurfaceInventory')
  const componentStyleInventory = await readJsonIfExists(root, 'componentStyleInventory')
  const visualVerificationProfile = await readJsonIfExists(root, 'visualVerificationProfile')
  const devviewState = await readJsonIfExists(root, 'devviewState')

  if (!hasSelectedVisualWork(product, work, test, visualReference)) {
    return issues
  }

  if (!visualReference) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'VISUAL_REFERENCE_MISSING',
        defaultArtifacts.visualReference,
        'Selected visual UI work requires visual-reference.json.',
      ),
    )
    return issues
  }

  const primarySource = visualSourceOf(visualReference)
  if (primarySource === 'not_required') {
    issues.push(
      issue({
        validator: 'VisualDesign',
        code: 'VISUAL_SOURCE_NOT_SELECTED',
        severity: 'error',
        file: defaultArtifacts.visualReference,
        message: 'Visual work is selected, but visual-reference.json still says primarySource is not_required.',
        suggestedFix: 'Run Visual Reference Intake and choose a source, default theme, or explicit waiver.',
      }),
    )
    return issues
  }

  if (primarySource === 'visual_quality_waived') {
    if (
      getNestedBoolean(visualReference, ['waiver', 'isWaived']) !== true ||
      getNestedBoolean(visualReference, ['waiver', 'riskAcceptedByUser']) !== true
    ) {
      issues.push(
        issue({
          validator: 'VisualDesign',
          code: 'VISUAL_WAIVER_NOT_USER_ACCEPTED',
          severity: 'error',
          file: defaultArtifacts.visualReference,
          message: 'Visual quality is waived, but waiver metadata does not show user-accepted risk.',
          suggestedFix:
            'Record waiver.isWaived=true, waiver.riskAcceptedByUser=true, reason, and scope from the user decision.',
        }),
      )
    }
    return issues
  }

  if (!existsSync(artifactPath(root, 'uiThemeSpec'))) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'UI_THEME_SPEC_MISSING',
        defaultArtifacts.uiThemeSpec,
        'Selected visual UI work requires ui-theme-spec.md.',
      ),
    )
  }
  if (!designTokens) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'DESIGN_TOKENS_MISSING',
        defaultArtifacts.designTokens,
        'Selected visual UI work requires design-tokens.json.',
      ),
    )
  } else {
    for (const group of ['colors', 'spacing', 'radius', 'typography', 'border', 'shadow', 'motion']) {
      if (
        !isObject(getNestedValue(designTokens, ['tokens', group])) ||
        Object.keys(getNestedValue(designTokens, ['tokens', group]) as JsonObject).length === 0
      ) {
        issues.push(
          issue({
            validator: 'VisualDesign',
            code: 'DESIGN_TOKEN_GROUP_MISSING',
            severity: 'error',
            file: defaultArtifacts.designTokens,
            nodeId: group,
            message: `Design token group ${group} is missing or empty.`,
            suggestedFix:
              'Materialize the Visual Design Contract into concrete colors, spacing, radius, typography, border, shadow, and motion tokens.',
          }),
        )
      }
    }
  }
  if (!componentStyleContract) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'COMPONENT_STYLE_CONTRACT_MISSING',
        defaultArtifacts.componentStyleContract,
        'Selected visual UI work requires component-style-contract.json.',
      ),
    )
  } else {
    const componentNames = new Set(
      arrayObjects(componentStyleContract.components).map((entry) => stringValue(entry.componentName)),
    )
    for (const requiredComponent of ['Button', 'Panel']) {
      if (!componentNames.has(requiredComponent)) {
        issues.push(
          issue({
            validator: 'VisualDesign',
            code: 'BASE_COMPONENT_CONTRACT_MISSING',
            severity: 'error',
            file: defaultArtifacts.componentStyleContract,
            nodeId: requiredComponent,
            message: `Component Style Contract lacks required base component: ${requiredComponent}.`,
            suggestedFix: 'Add the base component contract or record why it is not applicable to this UI slice.',
          }),
        )
      }
    }
  }
  if (requireInventory && !uiSurfaceInventory) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'UI_SURFACE_INVENTORY_MISSING',
        defaultArtifacts.uiSurfaceInventory,
        'Selected visual UI work requires ui-surface-inventory.json before Verification Design, Execution Pack, or review.',
      ),
    )
  }
  if (requireInventory && !componentStyleInventory) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'COMPONENT_STYLE_INVENTORY_MISSING',
        defaultArtifacts.componentStyleInventory,
        'Selected visual UI work requires component-style-inventory.json before Verification Design, Execution Pack, or review.',
      ),
    )
  }
  if (requireInventory && !visualVerificationProfile) {
    issues.push(
      missingIssue(
        'VisualDesign',
        'VISUAL_VERIFICATION_PROFILE_MISSING',
        defaultArtifacts.visualVerificationProfile,
        'Selected visual UI work requires visual-verification-profile.json before Verification Design, Execution Pack, or review.',
      ),
    )
  }

  for (const component of arrayObjects(componentStyleInventory?.components)) {
    const componentName = stringValue(component.componentName)
    if (
      stringValue(component.visualChangeScope) === 'shared' &&
      !stringValue(component.requiredContractRef) &&
      !stringValue(component.exceptionReason)
    ) {
      issues.push(
        issue({
          validator: 'VisualDesign',
          code: 'SHARED_COMPONENT_CONTRACT_MISSING',
          severity: 'error',
          file: defaultArtifacts.componentStyleInventory,
          nodeId: componentName,
          message: `Shared visual component ${componentName} lacks a Component Style Contract reference or exception.`,
          suggestedFix: 'Link requiredContractRef or record a local exception before implementation.',
        }),
      )
    }
    if (
      stringValue(component.visualChangeScope) === 'shared' &&
      component.usesDesignTokens === false &&
      !stringValue(component.exceptionReason)
    ) {
      issues.push(
        issue({
          validator: 'VisualDesign',
          code: 'SHARED_COMPONENT_NOT_TOKENIZED',
          severity: 'error',
          file: defaultArtifacts.componentStyleInventory,
          nodeId: componentName,
          message: `Shared visual component ${componentName} is not token-backed.`,
          suggestedFix: 'Use design tokens for shared component styling or record an approved exception.',
        }),
      )
    }
  }

  if (options.requireEvidence) {
    issues.push(...validateVisualEvidence(root, uiSurfaceInventory, evidence))
  }
  if (options.requireAudit !== false) {
    issues.push(...validateVisualAudit(root, devviewState, options.requireEvidence === true))
  }

  return issues
}
