import { describe, expect, it } from 'vitest'
import {
  acceptIntegerDraft,
  clearScores,
  createDefaultState,
  createPlayer,
  cycleSortMode,
  nextOrder,
  normalizeIntegerOnBlur,
  normalizeUnitPerHand,
  playerResult,
  resultChecksum,
  sortPlayers,
  totalBuyIn,
  validateMessage,
} from './score'

describe('playerResult', () => {
  it('computes remain - buyIn including negatives', () => {
    expect(playerResult({ buyIn: 2000, remain: 2500 })).toBe(500)
    expect(playerResult({ buyIn: 2000, remain: 1500 })).toBe(-500)
    expect(playerResult({ buyIn: -100, remain: -50 })).toBe(50)
  })
})

describe('createPlayer', () => {
  it('defaults buyIn and remain to unitPerHand so result is 0', () => {
    const p = createPlayer(2000, 0, 'id1')
    expect(p.buyIn).toBe(2000)
    expect(p.remain).toBe(2000)
    expect(playerResult(p)).toBe(0)
    expect(p.name).toBe('')
  })
})

describe('checksum and totals', () => {
  it('sums results and buy-ins', () => {
    const players = [
      createPlayer(2000, 0, 'a'),
      createPlayer(2000, 1, 'b'),
    ]
    players[0].remain = 2500
    players[1].remain = 1500
    expect(resultChecksum(players)).toBe(0)
    expect(totalBuyIn(players)).toBe(4000)
  })

  it('detects surplus and deficit', () => {
    const players = [createPlayer(2000, 0, 'a')]
    players[0].remain = 2100
    expect(resultChecksum(players)).toBe(100)
    expect(validateMessage(100).ok).toBe(false)
    expect(validateMessage(100).text).toContain('多出来的筹码')
    expect(validateMessage(-50).text).toContain('少了的筹码')
    expect(validateMessage(0).ok).toBe(true)
  })
})

describe('sortPlayers', () => {
  it('sorts by order in manual mode', () => {
    const a = createPlayer(100, 2, 'a')
    const b = createPlayer(100, 0, 'b')
    const c = createPlayer(100, 1, 'c')
    expect(sortPlayers([a, b, c], 'manual').map((p) => p.id)).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('sorts by result desc/asc with stable order ties', () => {
    const a = { ...createPlayer(100, 0, 'a'), remain: 150 }
    const b = { ...createPlayer(100, 1, 'b'), remain: 50 }
    const c = { ...createPlayer(100, 2, 'c'), remain: 150 }
    expect(sortPlayers([a, b, c], 'result_desc').map((p) => p.id)).toEqual([
      'a',
      'c',
      'b',
    ])
    expect(sortPlayers([a, b, c], 'result_asc').map((p) => p.id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })

  it('append-at-end order is preserved when sorting display', () => {
    const players = [createPlayer(2000, 0, 'a'), createPlayer(2000, 1, 'b')]
    players[0].remain = 3000
    const added = createPlayer(2000, nextOrder(players), 'c')
    const all = [...players, added]
    expect(all[all.length - 1].id).toBe('c')
    const view = sortPlayers(all, 'result_desc')
    expect(view.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('clearScores', () => {
  it('resets buyIn and remain to current unit without removing players', () => {
    const players = [
      { ...createPlayer(2000, 0, 'a'), name: '张三', buyIn: 4000, remain: 1000 },
    ]
    const cleared = clearScores(players, 3000)
    expect(cleared).toHaveLength(1)
    expect(cleared[0].name).toBe('张三')
    expect(cleared[0].buyIn).toBe(3000)
    expect(cleared[0].remain).toBe(3000)
    expect(playerResult(cleared[0])).toBe(0)
  })
})

describe('integer draft handling', () => {
  it('accepts integer drafts and rejects junk', () => {
    expect(acceptIntegerDraft('', '1')).toBe('')
    expect(acceptIntegerDraft('-', '1')).toBe('-')
    expect(acceptIntegerDraft('-12', '1')).toBe('-12')
    expect(acceptIntegerDraft('1.5', '1')).toBe('1')
    expect(acceptIntegerDraft('abc', '3')).toBe('3')
    expect(acceptIntegerDraft('3%!', '0')).toBe('0')
  })

  it('normalizes blur to 0 for empty or invalid', () => {
    expect(normalizeIntegerOnBlur('')).toBe(0)
    expect(normalizeIntegerOnBlur('-')).toBe(0)
    expect(normalizeIntegerOnBlur('42')).toBe(42)
    expect(normalizeIntegerOnBlur('-7')).toBe(-7)
  })

  it('normalizes unit per hand to positive integer', () => {
    expect(normalizeUnitPerHand('2000', 100)).toBe(2000)
    expect(normalizeUnitPerHand('0', 100)).toBe(100)
    expect(normalizeUnitPerHand('-1', 100)).toBe(100)
    expect(normalizeUnitPerHand('1.5', 100)).toBe(100)
    expect(normalizeUnitPerHand('', 100)).toBe(100)
  })
})

describe('defaults', () => {
  it('default unit is 2000', () => {
    expect(createDefaultState().unitPerHand).toBe(2000)
    expect(createDefaultState().players).toEqual([])
  })

  it('cycles sort modes', () => {
    expect(cycleSortMode('manual')).toBe('result_desc')
    expect(cycleSortMode('result_desc')).toBe('result_asc')
    expect(cycleSortMode('result_asc')).toBe('manual')
  })
})
