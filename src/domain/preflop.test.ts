import { describe, expect, it } from 'vitest'
import { PREFLOP_MATRIX } from '../data/preflopMatrix'
import {
  findCellByCode,
  formatEquityPct,
  getCell,
} from './preflop'

describe('preflop matrix smoke', () => {
  it('is 13x13 with valid equities', () => {
    expect(PREFLOP_MATRIX.ranks).toHaveLength(13)
    expect(PREFLOP_MATRIX.cells).toHaveLength(13)
    for (let r = 0; r < 13; r++) {
      expect(PREFLOP_MATRIX.cells[r]).toHaveLength(13)
      for (let c = 0; c < 13; c++) {
        const cell = PREFLOP_MATRIX.cells[r][c]
        expect(Number.isFinite(cell.equity)).toBe(true)
        expect(cell.equity).toBeGreaterThan(0)
        expect(cell.equity).toBeLessThan(1)
        expect(['S', 'A', 'B', 'C', 'D']).toContain(cell.tier)
        if (r === c) expect(cell.kind).toBe('pair')
        else if (r < c) expect(cell.kind).toBe('suited')
        else expect(cell.kind).toBe('offsuit')
      }
    }
  })

  it('meta matches 6-max all-in definition', () => {
    expect(PREFLOP_MATRIX.meta.players).toBe(6)
    expect(PREFLOP_MATRIX.meta.opponents).toBe(5)
    expect(PREFLOP_MATRIX.meta.equityDefinition).toContain('preflop_allin')
    expect(PREFLOP_MATRIX.meta.source).toContain('generate-preflop-matrix')
  })

  it('AA > KK > QQ and AKs > AKo, AKs > AQs', () => {
    const aa = findCellByCode('AA')!.cell
    const kk = findCellByCode('KK')!.cell
    const qq = findCellByCode('QQ')!.cell
    const aks = findCellByCode('AKs')!.cell
    const ako = findCellByCode('AKo')!.cell
    const aqs = findCellByCode('AQs')!.cell
    expect(aa.equity).toBeGreaterThan(kk.equity)
    expect(kk.equity).toBeGreaterThan(qq.equity)
    expect(aks.equity).toBeGreaterThan(ako.equity)
    expect(aks.equity).toBeGreaterThan(aqs.equity)
  })

  it('AA is among strongest and 72o among weakest', () => {
    const flat = PREFLOP_MATRIX.cells.flat()
    const maxE = Math.max(...flat.map((c) => c.equity))
    const minE = Math.min(...flat.map((c) => c.equity))
    expect(findCellByCode('AA')!.cell.equity).toBe(maxE)
    expect(findCellByCode('72o')!.cell.equity).toBeLessThanOrEqual(
      minE + 0.02,
    )
  })

  it('formats percent with one decimal', () => {
    expect(formatEquityPct(0.342)).toBe('约 34.2%')
    expect(formatEquityPct(0.5)).toBe('约 50.0%')
  })

  it('matrix corner codes', () => {
    expect(getCell(0, 0).code).toBe('AA')
    expect(getCell(0, 1).code).toBe('AKs')
    expect(getCell(1, 0).code).toBe('AKo')
    expect(getCell(12, 12).code).toBe('22')
  })
})
