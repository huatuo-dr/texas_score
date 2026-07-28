import type { PreflopCell, PreflopTier } from '../data/preflopMatrix'
import { PREFLOP_MATRIX, PREFLOP_RANKS } from '../data/preflopMatrix'

/** 参考 MatchPoker 风格离散分档色：红/橙/黄/绿/白 */
export const TIER_COLORS: Record<
  PreflopTier,
  { bg: string; fg: string; label: string }
> = {
  S: { bg: '#e74c3c', fg: '#ffffff', label: 'S 顶级' },
  A: { bg: '#f39c12', fg: '#1a1a1a', label: 'A 强' },
  B: { bg: '#f1c40f', fg: '#1a1a1a', label: 'B 中上' },
  C: { bg: '#7dce6c', fg: '#1a1a1a', label: 'C 中下' },
  D: { bg: '#f5f5f5', fg: '#222222', label: 'D 偏弱' },
}

export const TIER_ORDER: PreflopTier[] = ['S', 'A', 'B', 'C', 'D']

export function formatEquityPct(equity: number): string {
  const pct = Math.round(equity * 1000) / 10
  return `约 ${pct.toFixed(1)}%`
}

/** 格子背景：按档位离散色（便于区分，非连续渐变） */
export function tierToBg(tier: PreflopTier): string {
  return TIER_COLORS[tier].bg
}

export function tierToFg(tier: PreflopTier): string {
  return TIER_COLORS[tier].fg
}

/** @deprecated 着色已改为档位离散色；保留供旧调用兼容 */
export function equityToColor(equity: number): string {
  const min = 0.05
  const max = 0.55
  const t = Math.min(1, Math.max(0, (equity - min) / (max - min)))
  if (t >= 0.75) return TIER_COLORS.S.bg
  if (t >= 0.55) return TIER_COLORS.A.bg
  if (t >= 0.35) return TIER_COLORS.B.bg
  if (t >= 0.15) return TIER_COLORS.C.bg
  return TIER_COLORS.D.bg
}

export function equityToTextColor(equity: number): string {
  const min = 0.05
  const max = 0.55
  const t = Math.min(1, Math.max(0, (equity - min) / (max - min)))
  if (t >= 0.75) return TIER_COLORS.S.fg
  if (t >= 0.55) return TIER_COLORS.A.fg
  if (t >= 0.35) return TIER_COLORS.B.fg
  if (t >= 0.15) return TIER_COLORS.C.fg
  return TIER_COLORS.D.fg
}

export function tierLabel(tier: PreflopTier): string {
  return TIER_COLORS[tier].label
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
