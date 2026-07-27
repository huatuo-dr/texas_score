import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clearScores,
  createPlayer,
  cycleSortMode,
  nextOrder,
  resultChecksum,
  sortPlayers,
  totalBuyIn,
} from '../domain/score'
import { loadState, saveState } from '../domain/storage'
import type { AppState, Player, SortMode } from '../domain/types'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useScoreStore() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [focusPlayerId, setFocusPlayerId] = useState<string | null>(null)
  const [persistError, setPersistError] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 始终指向最新 state，供卸载 flush 使用（不依赖 setState） */
  const stateRef = useRef(state)
  stateRef.current = state

  const persist = useCallback((next: AppState) => {
    stateRef.current = next
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      const ok = saveState(next)
      setPersistError(!ok)
    }, 150)
  }, [])

  const flushPersist = useCallback((next: AppState) => {
    stateRef.current = next
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const ok = saveState(next)
    setPersistError(!ok)
  }, [])

  const update = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = updater(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  useEffect(() => {
    const flush = () => {
      flushPersist(stateRef.current)
    }
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
      // 卸载时若防抖未落地，立即写入最新 state，避免丢最后一次改动
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
        saveState(stateRef.current)
      }
    }
  }, [flushPersist])

  const sortedPlayers = useMemo(
    () => sortPlayers(state.players, state.sortMode),
    [state.players, state.sortMode],
  )

  const summary = useMemo(
    () => ({
      count: state.players.length,
      totalChips: totalBuyIn(state.players),
      checksum: resultChecksum(state.players),
    }),
    [state.players],
  )

  const setUnitPerHand = useCallback(
    (unit: number) => {
      update((prev) => ({ ...prev, unitPerHand: unit }))
    },
    [update],
  )

  const addPlayer = useCallback(() => {
    const id = newId()
    update((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        createPlayer(prev.unitPerHand, nextOrder(prev.players), id),
      ],
    }))
    setFocusPlayerId(id)
  }, [update])

  const removePlayer = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
      }))
    },
    [update],
  )

  const clearPlayers = useCallback(() => {
    update((prev) => ({ ...prev, players: [] }))
  }, [update])

  const resetScores = useCallback(() => {
    update((prev) => ({
      ...prev,
      players: clearScores(prev.players, prev.unitPerHand),
    }))
  }, [update])

  const patchPlayer = useCallback(
    (id: string, patch: Partial<Pick<Player, 'name' | 'buyIn' | 'remain'>>) => {
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      }))
    },
    [update],
  )

  const stepBuyIn = useCallback(
    (id: string, direction: 1 | -1) => {
      update((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === id
            ? { ...p, buyIn: p.buyIn + direction * prev.unitPerHand }
            : p,
        ),
      }))
    },
    [update],
  )

  const setSortMode = useCallback(
    (mode: SortMode) => {
      update((prev) => ({ ...prev, sortMode: mode }))
    },
    [update],
  )

  const toggleSortMode = useCallback(() => {
    update((prev) => ({ ...prev, sortMode: cycleSortMode(prev.sortMode) }))
  }, [update])

  const clearFocusPlayerId = useCallback(() => setFocusPlayerId(null), [])

  return {
    state,
    sortedPlayers,
    summary,
    focusPlayerId,
    persistError,
    setUnitPerHand,
    addPlayer,
    removePlayer,
    clearPlayers,
    resetScores,
    patchPlayer,
    stepBuyIn,
    setSortMode,
    toggleSortMode,
    clearFocusPlayerId,
  }
}
