import type { AutonomousCodexExecutionPack } from './acep-types'
import { writeFileIndex } from './acep-templates'

export function writeVirtualFileList(pack: AutonomousCodexExecutionPack) {
  return writeFileIndex(pack)
}

export function writeFolderPreview(pack: AutonomousCodexExecutionPack) {
  return [
    '.pbe/',
    '  codex-execution-pack/',
    ...pack.files.map((file) => `    ${file.path}`),
  ].join('\n')
}

export function writeBundlePreview(pack: AutonomousCodexExecutionPack) {
  return [
    '# ACEP Bundle Preview',
    '',
    'Virtual root: `.pbe/codex-execution-pack/`',
    '',
    '## File Tree',
    '```text',
    writeFolderPreview(pack),
    '```',
    '',
    '## Files',
    ...pack.files.map((file) =>
      [
        `### ${file.path}`,
        '',
        `Kind: ${file.kind}`,
        '',
        file.kind === 'json' ? '```json' : '```markdown',
        file.content,
        '```',
      ].join('\n'),
    ),
  ].join('\n')
}

export function getAceFileContent(
  pack: AutonomousCodexExecutionPack,
  filePath: string,
) {
  return pack.files.find((file) => file.path === filePath)?.content ?? ''
}
