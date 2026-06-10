import { normalizeProject } from '../domain/tree'
import type { Project } from '../domain/types'

const STORAGE_KEY = 'recursive-program-designer:project'

export function saveProjectToStorage(project: Project) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function loadProjectFromStorage(): Project | null {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return normalizeProject(JSON.parse(raw))
  } catch {
    return null
  }
}

export function parseProjectJson(raw: string): Project | null {
  try {
    return normalizeProject(JSON.parse(raw))
  } catch {
    return null
  }
}
