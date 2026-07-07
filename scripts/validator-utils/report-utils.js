export function createIssue({ validator, file, code, message, suggestedFix }) {
  return {
    validator,
    file,
    code,
    message,
    suggestedFix,
  }
}

export function formatValidationReport(results) {
  const lines = ['[DevView Validate]', '']

  for (const result of results) {
    const prefix = result.issues.length === 0 ? '✓' : '✗'
    lines.push(`${prefix} ${result.name}`)

    for (const issue of result.issues) {
      lines.push(`  - Validator: ${issue.validator}`)
      lines.push(`    File: ${issue.file}`)
      lines.push(`    Code: ${issue.code}`)
      lines.push(`    Message: ${issue.message}`)
      lines.push(`    Suggested fix: ${issue.suggestedFix}`)
    }
  }

  lines.push('')
  lines.push(`Result: ${results.every((result) => result.issues.length === 0) ? 'PASS' : 'FAIL'}`)

  return lines.join('\n')
}
