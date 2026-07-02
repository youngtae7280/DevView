import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'

const tempRoots: string[] = []

export function createWorkspace(): string {
  const workspace = mkdtempSync(join(tmpdir(), 'pbe-cli-'))
  tempRoots.push(workspace)
  return workspace
}

export function cleanupWorkspaces(): void {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

export function writeJson(file: string, value: unknown): void {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function writeText(file: string, value: string): void {
  mkdirSync(resolve(file, '..'), { recursive: true })
  writeFileSync(file, value, 'utf8')
}
