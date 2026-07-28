import type { PreflopCell, PreflopTier } from '../data/preflopMatrix'
import { PREFLOP_MATRIX, PREFLOP_RANKS } from '../data/preflopMatrix'

export function formatEquityPct(equity: number): string {
  const pct = Math.round(equity * 1000) / 10
  return `约 ${pct.toFixed(1)}%`
}

/** Map equity in (0,1) to CSS color (cool weak → warm strong). */
export function equityToColor(equity: number): string {
  const min = 0.05
  const max = 0.55
  const t = Math.min(1, Math.max(0, (equity - min) / (max - min)))
  // hue 210 (blue) → 10 (red-orange)
  const hue = 210 - t * 200
  const sat = 55 + t * 25
  const light = 22 + t * 28
  return `hsl(${hue} ${sat}% ${light}%)`
}

export function equityToTextColor(equity: number): string {
  const min = 0.05
  const max = 0.55
  const t = Math.min(1, Math.max(0, (equity - min) / (max - min)))
  return t > 0.45 ? '#0b1018' : '#e7ecf3'
}

export function tierLabel(tier: PreflopTier): string {
  return tier
}

export function getCell(row: number, col: number): PreflopCell {
  return PREFLOP_MATRIX.cells[row][col]
}

export function findCellByCode(code: string): {
  row: number
  col: number
  cell: PreflopCell
} | null {
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const cell = PREFLOP_MATRIX.cells[r][c]
      if (cell.code === code) return { row: r, col: c, cell }
    }
  }
  return null
}

export function kindLabel(kind: PreflopCell['kind']): string {
  if (kind === 'pair') return '对子'
  if (kind === 'suited') return '同花 (s)'
  return '不同花 (o)'
}

export { PREFLOP_MATRIX, PREFLOP_RANKS }
