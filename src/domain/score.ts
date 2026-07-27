import {
  DEFAULT_UNIT_PER_HAND,
  type AppState,
  type Player,
  type SortMode,
  STATE_VERSION,
} from './types'

export function playerResult(player: Pick<Player, 'buyIn' | 'remain'>): number {
  return player.remain - player.buyIn
}

export function totalBuyIn(players: Player[]): number {
  return players.reduce((sum, p) => sum + p.buyIn, 0)
}

export function resultChecksum(players: Player[]): number {
  return players.reduce((sum, p) => sum + playerResult(p), 0)
}

export function createPlayer(
  unitPerHand: number,
  order: number,
  id: string,
): Player {
  return {
    id,
    name: '',
    buyIn: unitPerHand,
    remain: unitPerHand,
    order,
  }
}

export function nextOrder(players: Player[]): number {
  if (players.length === 0) return 0
  return Math.max(...players.map((p) => p.order)) + 1
}

export function sortPlayers(players: Player[], mode: SortMode): Player[] {
  const copy = [...players]
  if (mode === 'manual') {
    return copy.sort((a, b) => a.order - b.order)
  }
  if (mode === 'result_desc') {
    return copy.sort((a, b) => {
      const diff = playerResult(b) - playerResult(a)
      return diff !== 0 ? diff : a.order - b.order
    })
  }
  return copy.sort((a, b) => {
    const diff = playerResult(a) - playerResult(b)
    return diff !== 0 ? diff : a.order - b.order
  })
}

export function clearScores(players: Player[], unitPerHand: number): Player[] {
  return players.map((p) => ({
    ...p,
    buyIn: unitPerHand,
    remain: unitPerHand,
  }))
}

export function formatSigned(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

export function displayName(name: string, index?: number): string {
  const trimmed = name.trim()
  if (trimmed) return trimmed
  if (index !== undefined) return `玩家 ${index + 1}`
  return '未命名'
}

export function validateMessage(checksum: number): {
  ok: boolean
  text: string
} {
  if (checksum === 0) {
    return { ok: true, text: '校验通过，所有结果合计为 0。' }
  }
  if (checksum > 0) {
    return {
      ok: false,
      text: `账不平，结果合计为 ${checksum}。剩余合计比买入多（多出来的筹码）。`,
    }
  }
  return {
    ok: false,
    text: `账不平，结果合计为 ${checksum}。剩余合计比买入少（少了的筹码）。`,
  }
}

export function cycleSortMode(mode: SortMode): SortMode {
  if (mode === 'manual') return 'result_desc'
  if (mode === 'result_desc') return 'result_asc'
  return 'manual'
}

export function sortModeLabel(mode: SortMode): string {
  if (mode === 'manual') return '原始顺序'
  if (mode === 'result_desc') return '结果↓'
  return '结果↑'
}

/**
 * Keep only drafts that are empty, lone "-", or a full integer string.
 * Rejects decimals and non-numeric junk (returns previous draft).
 */
export function acceptIntegerDraft(raw: string, previous: string): string {
  if (raw === '' || raw === '-') return raw
  if (/^-?\d+$/.test(raw)) return raw
  return previous
}

/** Blur normalize: empty / "-" / invalid → 0; else parseInt */
export function normalizeIntegerOnBlur(draft: string): number {
  if (draft === '' || draft === '-' || !/^-?\d+$/.test(draft)) return 0
  const n = Number.parseInt(draft, 10)
  return Number.isFinite(n) ? n : 0
}

/** unitPerHand must be integer ≥ 1 */
export function normalizeUnitPerHand(draft: string, fallback: number): number {
  if (!/^\d+$/.test(draft)) return fallback
  const n = Number.parseInt(draft, 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return n
}

export function createDefaultState(): AppState {
  return {
    version: STATE_VERSION,
    unitPerHand: DEFAULT_UNIT_PER_HAND,
    sortMode: 'manual',
    players: [],
    updatedAt: new Date().toISOString(),
  }
}

export function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.version !== 1) return false
  if (typeof v.unitPerHand !== 'number' || !Number.isInteger(v.unitPerHand) || v.unitPerHand < 1) {
    return false
  }
  if (v.sortMode !== 'manual' && v.sortMode !== 'result_desc' && v.sortMode !== 'result_asc') {
    return false
  }
  if (!Array.isArray(v.players)) return false
  for (const p of v.players) {
    if (!p || typeof p !== 'object') return false
    const player = p as Record<string, unknown>
    if (typeof player.id !== 'string') return false
    if (typeof player.name !== 'string') return false
    if (typeof player.buyIn !== 'number' || !Number.isInteger(player.buyIn)) return false
    if (typeof player.remain !== 'number' || !Number.isInteger(player.remain)) return false
    if (typeof player.order !== 'number' || !Number.isInteger(player.order)) return false
  }
  return true
}
