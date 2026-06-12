import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export async function readTextSafe(
  filePath: string,
): Promise<{ ok: true; value: string } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await readFile(filePath, 'utf8') }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function readJsonSafe<T = unknown>(
  filePath: string,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  const text = await readTextSafe(filePath)
  if (!text.ok) {
    return text
  }
  try {
    return { ok: true, value: JSON.parse(text.value) as T }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

export async function writeTextAtomic(filePath: string, value: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempPath, value, 'utf8')
  await rename(tempPath, filePath)
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

export function resolveRoot(root: string): string {
  return path.resolve(root)
}

export function relativePath(root: string, filePath: string): string {
  return path.relative(root, filePath).replaceAll(path.sep, '/')
}

export function findPluginRoot(startUrl: string): string {
  let cursor = path.dirname(fileURLToPath(startUrl))
  while (true) {
    const packagePath = path.join(cursor, 'package.json')
    const templatesPath = path.join(cursor, 'templates')
    const scriptsPath = path.join(cursor, 'scripts')
    if (existsSync(packagePath) && existsSync(templatesPath) && existsSync(scriptsPath)) {
      return cursor
    }
    const parent = path.dirname(cursor)
    if (parent === cursor) {
      throw new Error('Could not locate plugin root from CLI runtime path.')
    }
    cursor = parent
  }
}
