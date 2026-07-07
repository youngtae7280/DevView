import { existsSync, readFileSync } from 'node:fs'
import { artifactPath, artifactRelativePath, defaultArtifacts, stateArtifactPath } from '../core/project.js'
import { readJsonSafe } from '../core/fs.js'
import { normalizePbeState } from '../core/state-machine.js'
import type { ValidationIssue } from '../core/types.js'
import { issue } from '../core/types.js'

export type JsonObject = Record<string, unknown>

export const terminalRpdStatuses = new Set(['confirmed', 'deferred', 'out_of_scope'])
export const executableScopes = new Set(['selected', 'foundation'])
export const nonExecutableTypes = new Set(['non_goal', 'risk', 'assumption', 'decision'])
export const legacyVisualAuditPath = '.pbe/evidence/review-reports/visual-audit.md'
export const abstractQualityTerms = [
  '깔끔하게',
  '보기 좋게',
  '빠르게',
  '안정적으로',
  '사용하기 쉽게',
  '직관적으로',
  '현대적으로',
  '효율적으로',
  '유연하게',
  '확장 가능하게',
  '문제 없게',
  '좋게',
  '더 좋게',
  '간단하게',
  '편하게',
  '부드럽게',
  'clean',
  'nice',
  'modern',
  'intuitive',
  'fast',
  'stable',
  'easy',
  'easy to use',
  'efficient',
  'flexible',
  'scalable',
  'problem-free',
  'good',
  'better',
  'simple',
  'smooth',
  'comfortable',
  'user-friendly',
]

export async function readJsonIfExists(
  root: string,
  key: Parameters<typeof artifactPath>[1],
): Promise<JsonObject | null> {
  const filePath = key === 'pbeState' || key === 'devviewState' ? stateArtifactPath(root) : artifactPath(root, key)
  if (!existsSync(filePath)) {
    return null
  }
  const parsed = await readJsonSafe<JsonObject>(filePath)
  return parsed.ok ? parsed.value : null
}

export function missingIssue(validator: string, code: string, file: string, message: string): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    message,
    suggestedFix: 'Generate or restore the missing DevView artifact before entering this stage.',
  })
}

export function scopeLeakIssue(
  validator: string,
  code: string,
  file: string,
  nodeId: string,
  productId: string,
): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    nodeId,
    message: `Deferred/out_of_scope Product node ${productId} appears in active scope ${nodeId}.`,
    suggestedFix:
      'Remove inactive Product scope from active Work/Test/ACEP scope or explicitly reopen it through a Change Node and human gate.',
  })
}

export function missingLinkIssue(
  validator: string,
  code: string,
  file: string,
  nodeId: string,
  targetLabel: string,
  targetId: string,
): ValidationIssue {
  return issue({
    validator,
    code,
    severity: 'error',
    file,
    nodeId,
    message: `${nodeId} references missing ${targetLabel}: ${targetId}.`,
    suggestedFix: `Create the referenced ${targetLabel} node or remove the stale link.`,
  })
}

export function validateWorkDependencyGraph(work: JsonObject | null): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodes = nodesOf(work)
  const entries: Array<[string, JsonObject]> = []
  for (const node of nodes) {
    const id = stringValue(node.id)
    if (id) {
      entries.push([id, node])
    }
  }
  const nodeMap = new Map<string, JsonObject>(entries)
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const pathStack: string[] = []

  function visit(id: string): void {
    if (visited.has(id) || !nodeMap.has(id)) {
      return
    }
    if (visiting.has(id)) {
      const cycleStart = pathStack.indexOf(id)
      const cycle = [...pathStack.slice(cycleStart), id].join(' -> ')
      issues.push(
        issue({
          validator: 'WPD',
          code: 'DEPENDENCY_CYCLE',
          severity: 'error',
          file: defaultArtifacts.workTree,
          nodeId: id,
          message: `Work dependency graph contains a cycle: ${cycle}.`,
          suggestedFix: 'Break the dependency cycle before planning or executing work.',
        }),
      )
      return
    }
    visiting.add(id)
    pathStack.push(id)
    const node = nodeMap.get(id)
    for (const dependencyId of arrayStrings(node?.dependencies)) {
      visit(dependencyId)
    }
    pathStack.pop()
    visiting.delete(id)
    visited.add(id)
  }

  for (const id of nodeMap.keys()) {
    visit(id)
  }
  return issues
}

export function hasSelectedVisualWork(
  product: JsonObject | null,
  work: JsonObject | null,
  test: JsonObject | null,
  visualReference: JsonObject | null,
): boolean {
  if (visualReference?.visualWorkRequired === true) {
    return true
  }
  const productHasVisualWork = nodesOf(product).some((node) => {
    if (!['selected', 'foundation'].includes(stringValue(node.scopeClass))) {
      return false
    }
    return (
      (stringValue(node.type) === 'ui_surface' && getNestedBoolean(node, ['ux', 'visualAffected']) === true) ||
      (stringValue(node.type) === 'ui_state' && getNestedBoolean(node, ['ux', 'visualAffected']) === true) ||
      getNestedBoolean(node, ['ux', 'visualWorkRequired']) === true ||
      getNestedBoolean(node, ['visualImpact']) === true
    )
  })
  const workHasVisualWork = nodesOf(work).some((node) => {
    if (!['selected', 'foundation'].includes(stringValue(node.scopeClass))) {
      return false
    }
    const impact = stringValue(node.uiImpact)
    return (
      ['visual', 'appearance', 'direct_visual'].includes(impact) ||
      getNestedBoolean(node, ['visualImpact']) === true ||
      getNestedBoolean(node, ['ui', 'visualWorkRequired']) === true
    )
  })
  const testHasVisualWork = nodesOf(test).some((node) => {
    if (stringValue(node.id) === stringValue(test?.rootNodeId)) {
      return false
    }
    return (
      stringValue(node.type) === 'visual_regression_test' ||
      arrayStrings(node.evidenceRequired).some((entry) => entry.toLowerCase().includes('visual contract'))
    )
  })
  return productHasVisualWork || workHasVisualWork || testHasVisualWork
}

export function validateVisualEvidence(
  root: string,
  uiSurfaceInventory: JsonObject | null,
  evidence: JsonObject | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const evidenceNodes = arrayObjects(evidence?.evidence)
  for (const surface of [
    ...arrayObjects(uiSurfaceInventory?.surfaces),
    ...arrayObjects(uiSurfaceInventory?.childSurfaces),
  ]) {
    const surfaceId = stringValue(surface.surfaceId)
    for (const screenshot of arrayObjects(surface.requiredScreenshots)) {
      if (
        screenshot.required !== true ||
        stringValue(screenshot.deferredReason) ||
        stringValue(screenshot.blockedReason)
      ) {
        continue
      }
      const expectedPath = normalizeEvidencePath(stringValue(screenshot.path))
      const linkedEvidence = evidenceNodes.filter((entry) => {
        const entryPath = normalizeEvidencePath(stringValue(entry.path))
        return (
          (entryPath && expectedPath && entryPath === expectedPath) ||
          stringValue(entry.id) === stringValue(screenshot.evidenceNodeId)
        )
      })
      const staleEvidence = linkedEvidence.some((entry) =>
        ['stale', 'stale_evidence'].includes(stringValue(entry.status)),
      )
      const currentEvidence = linkedEvidence.some((entry) =>
        ['attached', 'replaced', 'current'].includes(stringValue(entry.status)),
      )
      if (staleEvidence) {
        issues.push(
          issue({
            validator: 'VisualDesign',
            code: 'STALE_VISUAL_EVIDENCE',
            severity: 'error',
            file: defaultArtifacts.evidenceTree,
            nodeId: surfaceId,
            message: `Visual evidence for surface ${surfaceId} state ${String(screenshot.state)} is stale.`,
            suggestedFix: 'Capture fresh screenshot/manual visual evidence after the latest UI change.',
          }),
        )
      }
      if (!currentEvidence) {
        issues.push(
          issue({
            validator: 'VisualDesign',
            code: 'VISUAL_SCREENSHOT_EVIDENCE_MISSING',
            severity: 'error',
            file: defaultArtifacts.uiSurfaceInventory,
            nodeId: surfaceId,
            message: `Required visual evidence is missing for surface ${surfaceId} state ${String(screenshot.state)}.`,
            suggestedFix:
              'Attach screenshot/manual evidence and link it in Evidence Tree, or defer/block the state explicitly.',
          }),
        )
      } else if (expectedPath && !existsSync(resolveEvidencePath(root, expectedPath))) {
        issues.push(
          issue({
            validator: 'VisualDesign',
            code: 'VISUAL_SCREENSHOT_FILE_MISSING',
            severity: 'error',
            file: defaultArtifacts.evidenceTree,
            nodeId: surfaceId,
            message: `Visual evidence file is missing: ${expectedPath}.`,
            suggestedFix: 'Create the screenshot file or update the evidence path.',
          }),
        )
      }
    }
  }
  return issues
}

export function validateVisualAudit(
  root: string,
  pbeState: JsonObject | null,
  requirePassingResult: boolean,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const audit = readVisualAudit(root)
  const auditRequired = requirePassingResult || visualAuditRequiredByState(pbeState)

  if (!audit) {
    if (auditRequired) {
      issues.push(
        missingIssue(
          'VisualDesign',
          'VISUAL_AUDIT_MISSING',
          defaultArtifacts.visualAudit,
          'Review Result for selected visual UI work requires visual-audit.md.',
        ),
      )
    }
    return issues
  }

  const requiredHeadings = [
    '# Visual Implementation Audit',
    '## Scope',
    '## Visual Contract Artifacts',
    '## Screenshot Evidence',
    '## State Coverage',
    '## Component Contract Compliance',
    '## Deviations',
    '## Blocking Issues',
    '## Result',
  ]
  for (const heading of requiredHeadings) {
    if (!audit.content.includes(heading)) {
      issues.push(
        issue({
          validator: 'VisualDesign',
          code: 'VISUAL_AUDIT_HEADING_MISSING',
          severity: 'error',
          file: audit.relativePath,
          nodeId: heading,
          message: `visual-audit.md is missing required heading: ${heading}.`,
          suggestedFix:
            'Regenerate visual-audit.md from templates/visual-audit-template.md and complete every section.',
        }),
      )
    }
  }

  if (/\[\s\]/.test(audit.content)) {
    issues.push(
      issue({
        validator: 'VisualDesign',
        code: 'VISUAL_AUDIT_UNCHECKED_EVIDENCE',
        severity: 'error',
        file: audit.relativePath,
        message: 'visual-audit.md still contains unchecked evidence items.',
        suggestedFix: 'Complete or explicitly defer/block each required screenshot and visual state evidence item.',
      }),
    )
  }

  const blockingSection = markdownSection(audit.content, '## Blocking Issues')
  if (blockingSectionHasUnresolvedItems(blockingSection)) {
    issues.push(
      issue({
        validator: 'VisualDesign',
        code: 'VISUAL_AUDIT_BLOCKING_ISSUES',
        severity: 'error',
        file: audit.relativePath,
        message: 'visual-audit.md contains unresolved blocking visual issues.',
        suggestedFix:
          'Resolve, revise, defer, mark out-of-scope, or record a user-accepted visual waiver before Review Result can close.',
      }),
    )
  }

  const resultSection = markdownSection(audit.content, '## Result')
  if (requirePassingResult && !/\b(pass|passed|accepted|waived)\b/i.test(resultSection)) {
    issues.push(
      issue({
        validator: 'VisualDesign',
        code: 'VISUAL_AUDIT_RESULT_NOT_PASSING',
        severity: 'error',
        file: audit.relativePath,
        message: 'visual-audit.md does not record a passing, accepted, or waived result.',
        suggestedFix: 'Run Visual Implementation Audit and record a pass/accepted waiver result before Review Result.',
      }),
    )
  }

  return issues
}

export function readVisualAudit(root: string): { relativePath: string; content: string } | null {
  for (const relativePath of [
    artifactRelativePath(root, 'visualAudit'),
    defaultArtifacts.visualAudit,
    legacyVisualAuditPath,
  ]) {
    const filePath = `${root}/${relativePath}`.replaceAll('\\', '/')
    if (existsSync(filePath)) {
      return {
        relativePath,
        content: readFileSync(filePath, 'utf8'),
      }
    }
  }
  return null
}

export function visualAuditRequiredByState(pbeState: JsonObject | null): boolean {
  const state = normalizePbeState(getNestedString(pbeState, ['autoflow', 'state']))
  if (state && ['ACEP_RUN_DONE', 'VISUAL_AUDIT_DONE', 'WAITING_REVIEW_RESULT', 'DONE'].includes(state)) {
    return true
  }
  return ['submitted_for_review', 'revision_verified', 'accepted'].includes(stringValue(pbeState?.deliveryStatus))
}

export function markdownSection(content: string, heading: string): string {
  const start = content.indexOf(heading)
  if (start < 0) {
    return ''
  }
  const afterHeading = content.slice(start + heading.length)
  const nextHeading = afterHeading.search(/\n##\s+/)
  return nextHeading >= 0 ? afterHeading.slice(0, nextHeading) : afterHeading
}

export function blockingSectionHasUnresolvedItems(section: string): boolean {
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^[-*]\s*(none|n\/a|not applicable)$/i.test(line))
    .filter((line) => !/\b(resolved|waived|accepted waiver|deferred|out_of_scope)\b/i.test(line))
  return lines.length > 0
}

export function visualSourceOf(visualReference: JsonObject): string {
  const primarySource = stringValue(visualReference.primarySource)
  if (primarySource) {
    return primarySource
  }
  const sourceType = stringValue(visualReference.sourceType)
  if (sourceType) {
    return sourceType
  }
  return stringValue(arrayObjects(visualReference.sources)[0]?.sourceType)
}

export function validateAcceptanceCriterion(productNode: JsonObject, criterion: JsonObject): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const criterionId = stringValue(criterion.id)
  const productId = stringValue(productNode.id)
  const status = stringValue(criterion.status)
  const statement = stringValue(criterion.statement)
  const evidenceEntries = acceptanceCriterionEvidenceEntries(criterion)
  const verificationMethod = acceptanceCriterionVerificationMethod(criterion)
  const hasStatementTrigger = /\b(when|if|while|where)\b/i.test(statement)
  const hasCondition = Boolean(
    firstString(
      criterion.condition,
      criterion.trigger,
      criterion.event,
      criterion.state,
      getNestedValue(criterion, ['ears', 'condition']),
      getNestedValue(criterion, ['verification', 'condition']),
    ) || hasStatementTrigger,
  )
  const hasBehavior = Boolean(
    firstString(
      criterion.shall,
      criterion.expectedBehavior,
      criterion.systemResponse,
      criterion.behavior,
      getNestedValue(criterion, ['ears', 'shall']),
      getNestedValue(criterion, ['verification', 'expectedBehavior']),
    ) || /\bshall\b/i.test(statement),
  )
  const hasObservableResult = Boolean(
    firstString(
      criterion.observableResult,
      criterion.expectedResult,
      criterion.expectedOutcome,
      criterion.result,
      getNestedValue(criterion, ['verification', 'observableResult']),
      getNestedValue(criterion, ['verification', 'expectedResult']),
    ),
  )
  const hasEvidence = evidenceEntries.length > 0
  const hasVerification = Boolean(verificationMethod)
  const uiRelated = isUiRelatedAcceptanceCriterion(productNode, criterion)
  const hasUiEvidence = hasScreenshotOrManualEvidence([...evidenceEntries, verificationMethod])

  if (!criterionId) {
    issues.push(
      criteriaIssue(
        'AC_ID_MISSING',
        criterionId,
        productId,
        'Acceptance criterion is missing id.',
        'Assign a stable AC-* id.',
      ),
    )
  }
  if (status === 'confirmed' && !hasCondition) {
    issues.push(
      criteriaIssue(
        'AC_CONDITION_MISSING',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} lacks condition/trigger.`,
        'Add WHEN/IF/WHILE/WHERE condition or explicit trigger.',
      ),
    )
  }
  if (status === 'confirmed' && !hasBehavior) {
    issues.push(
      criteriaIssue(
        'AC_BEHAVIOR_MISSING',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} lacks expected observable behavior.`,
        'Add systemResponse, shall, or expectedBehavior.',
      ),
    )
  }
  if (status === 'confirmed' && !hasObservableResult) {
    issues.push(
      criteriaIssue(
        'AC_OBSERVABLE_RESULT_MISSING',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} lacks observable result.`,
        'Add observableResult or expectedResult describing the pass/fail visible outcome.',
      ),
    )
  }
  if (status === 'confirmed' && !hasVerification) {
    issues.push(
      criteriaIssue(
        'AC_VERIFICATION_METHOD_MISSING',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} lacks verification method.`,
        'Add verificationMethod or verification.method metadata.',
      ),
    )
  }
  if (status === 'confirmed' && !hasEvidence) {
    issues.push(
      criteriaIssue(
        'AC_EVIDENCE_REQUIREMENT_MISSING',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} lacks required evidence metadata.`,
        'Add requiredEvidence or verification.evidenceTypes.',
      ),
    )
  }
  if (status === 'confirmed' && uiRelated && !hasUiEvidence) {
    issues.push(
      criteriaIssue(
        'AC_UI_EVIDENCE_REQUIREMENT_MISSING',
        criterionId,
        productId,
        `UI acceptance criterion ${criterionId} lacks screenshot/manual evidence requirement.`,
        'Add manual_screenshot, screenshot, manual_check, or equivalent UI evidence to requiredEvidence.',
      ),
    )
  }

  const abstractTerms = collectTextAbstractTerms(criterionText(criterion))
  if (abstractTerms.length > 0) {
    issues.push(
      criteriaIssue(
        'AC_ABSTRACT_TERM',
        criterionId,
        productId,
        `Acceptance criterion ${criterionId} contains abstract term(s): ${abstractTerms.join(', ')}.`,
        'Replace subjective language with observable pass/fail criteria.',
      ),
    )
  }

  return issues
}

export function acceptanceCriterionEvidenceEntries(criterion: JsonObject): string[] {
  return [
    ...stringsFromStringOrArray(criterion.requiredEvidence),
    ...stringsFromStringOrArray(criterion.evidenceRequired),
    ...stringsFromStringOrArray(getNestedValue(criterion, ['verification', 'requiredEvidence'])),
    ...stringsFromStringOrArray(getNestedValue(criterion, ['verification', 'evidenceRequired'])),
    ...stringsFromStringOrArray(getNestedValue(criterion, ['verification', 'evidenceTypes'])),
  ]
}

export function acceptanceCriterionVerificationMethod(criterion: JsonObject): string {
  return firstString(
    criterion.verificationMethod,
    criterion.method,
    getNestedValue(criterion, ['verification', 'method']),
    getNestedValue(criterion, ['verification', 'verificationMethod']),
    getNestedValue(criterion, ['verification', 'type']),
  )
}

export function isUiRelatedAcceptanceCriterion(productNode: JsonObject, criterion: JsonObject): boolean {
  const productType = stringValue(productNode.type)
  const criterionType = stringValue(criterion.type)
  const text = [productType, criterionType, stringValue(productNode.title), criterionText(criterion)]
    .join(' ')
    .toLowerCase()
  return (
    productType.startsWith('ui_') ||
    getNestedBoolean(productNode, ['visualImpact']) === true ||
    getNestedBoolean(productNode, ['ux', 'visualAffected']) === true ||
    getNestedBoolean(productNode, ['ux', 'visualWorkRequired']) === true ||
    getNestedBoolean(criterion, ['ui', 'required']) === true ||
    /\b(ui|ux|screen|visual|button|dialog|modal|panel|layout|state)\b/.test(text)
  )
}

export function hasScreenshotOrManualEvidence(entries: string[]): boolean {
  const haystack = entries.join(' ').toLowerCase()
  return (
    haystack.includes('screenshot') ||
    haystack.includes('manual') ||
    haystack.includes('visual') ||
    haystack.includes('ui_evidence')
  )
}

export function criteriaIssue(
  code: string,
  criterionId: string,
  productId: string,
  message: string,
  suggestedFix: string,
): ValidationIssue {
  return issue({
    validator: 'AcceptanceCriteria',
    code,
    severity: 'error',
    file: defaultArtifacts.productTree,
    nodeId: criterionId || productId,
    message,
    suggestedFix,
  })
}

export function findRootNode(product: JsonObject): JsonObject | null {
  const rootNodeId = stringValue(product.rootNodeId)
  return nodesOf(product).find((node) => stringValue(node.id) === rootNodeId) || null
}

export function collectAcceptanceCriteriaIds(product: JsonObject | null): Set<string> {
  return new Set(
    nodesOf(product)
      .flatMap((node) => acceptanceCriteriaOf(node))
      .map((criterion) => stringValue(criterion.id))
      .filter(Boolean),
  )
}

export function collectInactiveProductIds(product: JsonObject | null): Set<string> {
  return new Set(
    nodesOf(product)
      .filter(
        (node) =>
          ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.scopeClass)) ||
          ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.status)),
      )
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )
}

export function collectInactiveWorkIds(work: JsonObject | null): Set<string> {
  return new Set(
    nodesOf(work)
      .filter(
        (node) =>
          ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.scopeClass)) ||
          ['deferred', 'out_of_scope', 'blocked'].includes(stringValue(node.status)),
      )
      .map((node) => stringValue(node.id))
      .filter(Boolean),
  )
}

export function nodesOf(tree: JsonObject | null): JsonObject[] {
  return arrayObjects(tree?.nodes)
}

export function acceptanceCriteriaOf(node: JsonObject): JsonObject[] {
  return arrayObjects(node.acceptanceCriteria)
}

export function childrenOf(node: JsonObject): string[] {
  return arrayStrings(node.children)
}

export function isExecutableProductNode(node: JsonObject): boolean {
  const scope = stringValue(node.scopeClass)
  const type = stringValue(node.type)
  const status = stringValue(node.status)
  return (
    executableScopes.has(scope) &&
    !nonExecutableTypes.has(type) &&
    !['deferred', 'out_of_scope', 'blocked'].includes(status)
  )
}

export function hasUserConfirmationEvidence(node: JsonObject): boolean {
  return (
    stringValue(node.confirmedBy) === 'user' ||
    Boolean(node.userConfirmedAt) ||
    getNestedString(node, ['source', 'actor']) === 'user' ||
    getNestedString(node, ['source', 'type']) === 'user_interview' ||
    getNestedString(node, ['decisionSource', 'actor']) === 'user'
  )
}

export function collectUnresolvedAbstractTerms(node: JsonObject): string[] {
  if (getNestedString(node, ['ambiguityResolution', 'status']) === 'resolved') {
    return []
  }
  const explicitTerms = [
    ...arrayStrings(getNestedValue(node, ['ambiguity', 'terms'])),
    ...arrayStrings(getNestedValue(node, ['ambiguity', 'abstractTerms'])),
  ]
  const textTerms = collectTextAbstractTerms(
    [stringValue(node.title), stringValue(node.why), ...arrayStrings(node.acceptance)].join(' '),
  )
  return [...new Set([...explicitTerms, ...textTerms])]
}

export function collectTextAbstractTerms(text: string): string[] {
  const haystack = text.toLowerCase()
  return abstractQualityTerms.filter((term) => haystack.includes(term.toLowerCase()))
}

export function criterionText(criterion: JsonObject): string {
  return [
    criterion.statement,
    criterion.condition,
    criterion.trigger,
    criterion.systemResponse,
    criterion.shall,
    criterion.expectedBehavior,
    criterion.observableResult,
    criterion.expectedResult,
    criterion.expectedOutcome,
    criterion.result,
    ...acceptanceCriterionEvidenceEntries(criterion),
    acceptanceCriterionVerificationMethod(criterion),
  ]
    .map(stringValue)
    .join(' ')
}

export function resolveEvidencePath(root: string, evidencePath: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(evidencePath) || evidencePath.startsWith('/')) {
    return evidencePath
  }
  return `${root}/${evidencePath}`.replaceAll('\\', '/')
}

export function normalizeEvidencePath(evidencePath: string): string {
  return evidencePath.replaceAll('\\', '/')
}

export function getNestedString(value: unknown, keys: string[]): string {
  return stringValue(getNestedValue(value, keys))
}

export function getNestedBoolean(value: unknown, keys: string[]): boolean | null {
  const nested = getNestedValue(value, keys)
  return typeof nested === 'boolean' ? nested : null
}

export function getNestedValue(value: unknown, keys: string[]): unknown {
  let cursor = value
  for (const key of keys) {
    if (!isObject(cursor)) {
      return undefined
    }
    cursor = cursor[key]
  }
  return cursor
}

export function arrayObjects(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isObject)
}

export function arrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(stringValue).filter(Boolean)
}

export function stringsFromStringOrArray(value: unknown): string[] {
  const scalar = stringValue(value)
  return scalar ? [scalar] : arrayStrings(value)
}

export function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function firstString(...values: unknown[]): string {
  return values.map(stringValue).find(Boolean) || ''
}

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
