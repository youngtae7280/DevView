import { createIssue } from '../validator-utils/report-utils.js'
import { readOptionalJson } from '../validator-utils/json-utils.js'

const validator = 'WorkGraph'

export function runWorkgraphValidator({ root }) {
  const issues = []
  const { data: workGraph, issue } = readOptionalJson(root, '.devview/blueprint/work-graph.json', validator)
  if (issue) {
    issues.push(issue)
  }
  if (!workGraph) {
    return issues
  }

  if (!Array.isArray(workGraph.nodes)) {
    issues.push(
      createIssue({
        validator,
        file: '.devview/blueprint/work-graph.json',
        code: 'WORKGRAPH_NODES_INVALID',
        message: 'workGraph.nodes must be an array.',
        suggestedFix: 'Regenerate Work Planning Graph with nodes[].',
      }),
    )
    return issues
  }

  for (const node of workGraph.nodes) {
    const nodeId = node.id || '<missing id>'
    if (['selected', 'foundation'].includes(node.scopeClass) && !Array.isArray(node.relatedRequirementNodeIds)) {
      issues.push(
        createIssue({
          validator,
          file: '.devview/blueprint/work-graph.json',
          code: 'WORKGRAPH_TRACEABILITY_MISSING',
          message: `${nodeId} is selected/foundation but lacks relatedRequirementNodeIds.`,
          suggestedFix: 'Link selected and foundation WorkGraph nodes back to Product Intake nodes.',
        }),
      )
    }

    if (node.parallelSafe === true && (!Array.isArray(node.expectedFiles) || node.expectedFiles.length === 0)) {
      issues.push(
        createIssue({
          validator,
          file: '.devview/blueprint/work-graph.json',
          code: 'PARALLEL_SAFE_WITH_UNKNOWN_FILES',
          message: `${nodeId} is parallel-safe but expectedFiles is empty.`,
          suggestedFix: 'Declare expectedFiles or mark the node as not parallel-safe.',
        }),
      )
    }
  }

  for (const group of workGraph.parallelGroups || []) {
    const touchedFiles = new Map()
    for (const nodeId of group.nodeIds || []) {
      const node = workGraph.nodes.find((candidate) => candidate.id === nodeId)
      for (const file of node?.expectedFiles || []) {
        if (touchedFiles.has(file)) {
          issues.push(
            createIssue({
              validator,
              file: '.devview/blueprint/work-graph.json',
              code: 'PARALLEL_SAME_FILE_CONFLICT',
              message: `${group.id || '<group>'} includes ${nodeId} and ${touchedFiles.get(file)} touching ${file}.`,
              suggestedFix: 'Move same-file work into one sequential task or add an integration-safe plan.',
            }),
          )
        }
        touchedFiles.set(file, nodeId)
      }
    }
  }

  return issues
}
