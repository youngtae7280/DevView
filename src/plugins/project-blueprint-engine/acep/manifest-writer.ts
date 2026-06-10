import type { ExecutionManifest } from './acep-types'

export function writeManifestJson(manifest: ExecutionManifest) {
  return JSON.stringify(manifest, null, 2)
}
