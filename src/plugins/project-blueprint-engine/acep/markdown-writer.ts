import type { AutonomousCodexExecutionPack } from './acep-types'

export function writeMarkdownBundle(pack: AutonomousCodexExecutionPack) {
  return pack.files
    .filter((file) => file.kind === 'markdown')
    .map((file) => [`<!-- ${file.path} -->`, file.content].join('\n\n'))
    .join('\n\n---\n\n')
}
