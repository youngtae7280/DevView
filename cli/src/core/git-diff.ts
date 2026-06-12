import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface GitChangedFile {
  path: string
  status: string
}

export async function readGitChangedFiles(
  root: string,
): Promise<{ ok: true; files: GitChangedFile[] } | { ok: false; error: string }> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
      {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10,
      },
    )
    return { ok: true, files: parsePorcelainStatus(stdout) }
  } catch (error) {
    const maybeError = error as { message?: string; stderr?: string | Buffer }
    const stderr = Buffer.isBuffer(maybeError.stderr)
      ? maybeError.stderr.toString('utf8')
      : maybeError.stderr
        ? String(maybeError.stderr)
        : ''
    return { ok: false, error: stderr.trim() || maybeError.message || String(error) }
  }
}

function parsePorcelainStatus(output: string): GitChangedFile[] {
  const entries = output.split('\0').filter(Boolean)
  const files: GitChangedFile[] = []
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const status = entry.slice(0, 2)
    const filePath = normalizeGitPath(entry.slice(3))
    if (filePath) {
      files.push({ path: filePath, status })
    }
    if (status.includes('R') || status.includes('C')) {
      const secondaryPath = normalizeGitPath(entries[index + 1] || '')
      if (secondaryPath) {
        files.push({ path: secondaryPath, status })
      }
      index += 1
    }
  }
  return uniqueFiles(files)
}

function uniqueFiles(files: GitChangedFile[]): GitChangedFile[] {
  const seen = new Set<string>()
  const unique: GitChangedFile[] = []
  for (const file of files) {
    const key = `${file.status}:${file.path}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(file)
    }
  }
  return unique
}

export function normalizeGitPath(filePath: string): string {
  return filePath.replaceAll('\\', '/').replace(/^\/+/, '')
}
