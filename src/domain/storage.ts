import { createDefaultState, isValidState } from './score'
import { STORAGE_KEY, type AppState } from './types'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidState(parsed)) return createDefaultState()
    return {
      ...parsed,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return createDefaultState()
  }
}

export function saveState(state: AppState): boolean {
  try {
    const payload: AppState = {
      ...state,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}
