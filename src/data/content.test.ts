import { describe, expect, it } from 'vitest'
import { GLOSSARY_GROUPS } from './glossary'
import { HAND_RANKS } from './handRanks'

describe('hand ranks data', () => {
  it('has 10 ranks in descending order 1..10', () => {
    expect(HAND_RANKS).toHaveLength(10)
    expect(HAND_RANKS.map((r) => r.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  it('each rank has example and Chinese name', () => {
    for (const r of HAND_RANKS) {
      expect(r.nameZh.length).toBeGreaterThan(0)
      expect(r.example.length).toBeGreaterThan(0)
      expect(r.note.length).toBeGreaterThan(0)
    }
  })
})

describe('glossary data', () => {
  it('has three required groups', () => {
    expect(GLOSSARY_GROUPS.map((g) => g.id)).toEqual([
      'actions',
      'position',
      'dealing',
    ])
  })

  it('does not include standalone odd term 共同牌位置感', () => {
    const all = GLOSSARY_GROUPS.flatMap((g) => g.entries.map((e) => e.term))
    expect(all.some((t) => t.includes('共同牌位置感'))).toBe(false)
  })

  it('covers bury-cards etiquette and side pot is explanatory only', () => {
    const all = GLOSSARY_GROUPS.flatMap((g) => g.entries)
    const bury = all.find((e) => e.term.includes('埋牌'))
    expect(bury?.body).toMatch(/赢了也可以埋牌/)
    const side = all.find((e) => e.term.includes('边池'))
    expect(side?.body).toMatch(/仅.*解释|不负责计算/)
  })
})
