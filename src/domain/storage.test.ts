import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultState, createPlayer } from './score'
import { loadState, saveState } from './storage'
import { STORAGE_KEY } from './types'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default when empty', () => {
    const state = loadState()
    expect(state.unitPerHand).toBe(2000)
    expect(state.players).toEqual([])
  })

  it('round-trips valid state', () => {
    const state = createDefaultState()
    state.players = [createPlayer(2000, 0, 'p1')]
    state.players[0].name = '张三'
    state.unitPerHand = 3000
    expect(saveState(state)).toBe(true)
    const loaded = loadState()
    expect(loaded.unitPerHand).toBe(3000)
    expect(loaded.players).toHaveLength(1)
    expect(loaded.players[0].name).toBe('张三')
    expect(loaded.players[0].buyIn).toBe(2000)
  })

  it('falls back on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadState().players).toEqual([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9 }))
    expect(loadState().unitPerHand).toBe(2000)
  })
})
