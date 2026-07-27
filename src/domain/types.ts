export type SortMode = 'manual' | 'result_desc' | 'result_asc'

export interface Player {
  id: string
  name: string
  buyIn: number
  remain: number
  order: number
}

export interface AppState {
  version: 1
  unitPerHand: number
  sortMode: SortMode
  players: Player[]
  updatedAt: string
}

export const STORAGE_KEY = 'texas_score_v1'
export const DEFAULT_UNIT_PER_HAND = 2000
export const STATE_VERSION = 1 as const
