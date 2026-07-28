import { toPng } from 'html-to-image'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AppTabs, type AppTabId } from './components/AppTabs'
import { ConfirmDialog } from './components/ConfirmDialog'
import { IntegerField } from './components/IntegerField'
import { RanksPanel } from './components/RanksPanel'
import { ShareCard } from './components/ShareCard'
import { TermsPanel } from './components/TermsPanel'
import {
  displayName,
  formatSigned,
  normalizeUnitPerHand,
  playerResult,
  sortModeLabel,
  validateMessage,
} from './domain/score'
import { useScoreStore } from './hooks/useScoreStore'
import './App.css'

type ConfirmKind =
  | { type: 'delete'; id: string; name: string }
  | { type: 'clearPlayers' }
  | { type: 'clearScores' }
  | null

export default function App() {
  const {
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
    toggleSortMode,
    clearFocusPlayerId,
  } = useScoreStore()

  const [unitDraft, setUnitDraft] = useState(String(state.unitPerHand))
  const [confirm, setConfirm] = useState<ConfirmKind>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [validateBanner, setValidateBanner] = useState<{
    ok: boolean
    text: string
  } | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareAt, setShareAt] = useState(() => new Date())
  const [shareDataUrl, setShareDataUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  /** true = 添加/校验/更多；false = 全部按钮单行展示（永不换行） */
  const [compactBar, setCompactBar] = useState(true)
  const [activeTab, setActiveTab] = useState<AppTabId>('score')

  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const shareRef = useRef<HTMLDivElement>(null)
  const bottomMainRef = useRef<HTMLDivElement>(null)
  const bottomProbeRef = useRef<HTMLDivElement>(null)
  const moreWrapRef = useRef<HTMLDivElement>(null)
  const refScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUnitDraft(String(state.unitPerHand))
  }, [state.unitPerHand])

  useEffect(() => {
    if (!focusPlayerId) return
    const el = nameRefs.current[focusPlayerId]
    if (el) {
      el.focus()
      el.select()
    }
    clearFocusPlayerId()
  }, [focusPlayerId, sortedPlayers, clearFocusPlayerId])

  // 人员/买入/剩余变化后，旧校验结果失效，避免误导
  useEffect(() => {
    setValidateBanner(null)
  }, [state.players])

  // 「更多」菜单：点击外侧关闭
  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const root = moreWrapRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [moreOpen])

  // 底栏：单行不换行；放不下全部按钮时切换为「更多」方案
  useLayoutEffect(() => {
    const main = bottomMainRef.current
    const probe = bottomProbeRef.current
    if (!main || !probe) return

    const measure = () => {
      const available = main.clientWidth
      // jsdom 等环境可能量不到宽度，用窗口宽度兜底
      if (available <= 0) {
        setCompactBar(window.innerWidth < 720)
        return
      }
      const needed = probe.scrollWidth
      setCompactBar(needed > available + 1)
    }

    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    return () => ro.disconnect()
  }, [state.sortMode])

  useEffect(() => {
    if (!compactBar) setMoreOpen(false)
  }, [compactBar])

  // 进入牌力/术语时内容滚到顶部
  useEffect(() => {
    if (activeTab === 'score') return
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0)
    }
    const node = refScrollRef.current
    if (node && typeof node.scrollTo === 'function') {
      node.scrollTo(0, 0)
    } else if (node) {
      node.scrollTop = 0
    }
  }, [activeTab])

  const closeShareModal = () => {
    setShareOpen(false)
    setShareDataUrl(null)
    setShareError(null)
    setSharing(false)
  }

  const selectTab = (id: AppTabId) => {
    if (id === activeTab) return
    // 离开/切换时收起记分侧浮层，避免叠在牌力/术语页上
    if (activeTab === 'score') {
      const el = document.activeElement
      if (el instanceof HTMLElement) el.blur()
      setMoreOpen(false)
      setConfirm(null)
    }
    if (shareOpen || sharing) {
      closeShareModal()
    }
    setActiveTab(id)
  }

  const onValidate = () => {
    setValidateBanner(validateMessage(summary.checksum))
  }

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'delete') removePlayer(confirm.id)
    if (confirm.type === 'clearPlayers') clearPlayers()
    if (confirm.type === 'clearScores') resetScores()
    setConfirm(null)
    setMoreOpen(false)
  }

  const openShare = async () => {
    setMoreOpen(false)
    setShareError(null)
    setShareDataUrl(null)
    setShareAt(new Date())
    setShareOpen(true)
    setSharing(true)
    // wait for ShareCard to paint
    requestAnimationFrame(async () => {
      try {
        await new Promise((r) => setTimeout(r, 50))
        const node = shareRef.current
        if (!node) throw new Error('no node')
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#0f1419',
        })
        setShareDataUrl(dataUrl)
      } catch {
        setShareError('生成图片失败，请重试。')
      } finally {
        setSharing(false)
      }
    })
  }

  const shareOrDownload = async () => {
    if (!shareDataUrl) return
    try {
      const res = await fetch(shareDataUrl)
      const blob = await res.blob()
      const file = new File([blob], `texas-score-${Date.now()}.png`, {
        type: 'image/png',
      })
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: '德州记分',
        })
        return
      }
    } catch {
      // fall through to download
    }
    const a = document.createElement('a')
    a.href = shareDataUrl
    a.download = `texas-score-${Date.now()}.png`
    a.click()
  }

  const checksumClass =
    summary.checksum === 0 ? 'ok' : summary.checksum > 0 ? 'warn' : 'bad'

  const isScoreTab = activeTab === 'score'

  return (
    <div className={`app ${isScoreTab ? 'is-score-tab' : 'is-ref-tab'}`}>
      <AppTabs active={activeTab} onChange={selectTab} />

      {isScoreTab && (
        <div
          className="score-panel"
          role="tabpanel"
          id="panel-score"
          aria-labelledby="tab-score"
        >
          <section className="score-toolbar" aria-label="一手与汇总">
            <label className="unit-field">
              <span>一手</span>
              <input
                type="text"
                inputMode="numeric"
                aria-label="一手对应筹码数量"
                value={unitDraft}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '' || /^\d+$/.test(v)) setUnitDraft(v)
                }}
                onBlur={() => {
                  const n = normalizeUnitPerHand(unitDraft, state.unitPerHand)
                  setUnitDraft(String(n))
                  setUnitPerHand(n)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
              />
            </label>
            <div className="toolbar-metrics">
              <div className="metric">
                <span className="label">人数</span>
                <strong>{summary.count}</strong>
              </div>
              <div className="metric">
                <span className="label">总筹码</span>
                <strong>{summary.totalChips}</strong>
              </div>
              <div className="metric">
                <span className="label">结果</span>
                <strong className={checksumClass}>
                  {formatSigned(summary.checksum)}
                </strong>
              </div>
            </div>
          </section>

          {persistError && (
            <div className="banner warn">
              本地保存失败，请检查浏览器存储权限。
            </div>
          )}
          {validateBanner && (
            <div
              className={`banner ${validateBanner.ok ? 'ok' : 'warn'}`}
              role="status"
            >
              <span>{validateBanner.text}</span>
              <button
                type="button"
                className="banner-close"
                onClick={() => setValidateBanner(null)}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
          )}

          <main className="list">
            {sortedPlayers.length === 0 ? (
              <div className="empty">暂无人员，点击「添加」开始记分</div>
            ) : (
              <div
                className="player-table"
                role="table"
                aria-label="人员记分列表"
              >
                <div className="player-row player-row-head" role="row">
                  <div role="columnheader" className="col-name">
                    姓名
                  </div>
                  <div role="columnheader" className="col-buyin">
                    买入
                  </div>
                  <div role="columnheader" className="col-remain">
                    剩余
                  </div>
                  <div role="columnheader" className="col-result">
                    结果
                  </div>
                  <div role="columnheader" className="col-action">
                    <span className="sr-only">操作</span>
                  </div>
                </div>
                {sortedPlayers.map((p) => {
                  const result = playerResult(p)
                  return (
                    <div key={p.id} className="player-row" role="row">
                      <div role="cell" className="col-name">
                        <input
                          ref={(el) => {
                            nameRefs.current[p.id] = el
                          }}
                          className="name-input"
                          type="text"
                          placeholder="未命名"
                          aria-label="姓名"
                          value={p.name}
                          onChange={(e) =>
                            patchPlayer(p.id, { name: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              ;(e.target as HTMLInputElement).blur()
                            }
                          }}
                        />
                      </div>
                      <div role="cell" className="col-buyin">
                        <div className="stepper">
                          <button
                            type="button"
                            aria-label="减少买入"
                            onClick={() => stepBuyIn(p.id, -1)}
                          >
                            −
                          </button>
                          <IntegerField
                            value={p.buyIn}
                            ariaLabel="买入"
                            onCommit={(n) => patchPlayer(p.id, { buyIn: n })}
                          />
                          <button
                            type="button"
                            aria-label="增加买入"
                            onClick={() => stepBuyIn(p.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div role="cell" className="col-remain">
                        <IntegerField
                          className="remain-input"
                          value={p.remain}
                          ariaLabel="剩余"
                          onCommit={(n) => patchPlayer(p.id, { remain: n })}
                        />
                      </div>
                      <div role="cell" className="col-result">
                        <div
                          className={`result ${result >= 0 ? 'ok' : 'bad'}`}
                          aria-label="结果"
                        >
                          {formatSigned(result)}
                        </div>
                      </div>
                      <div role="cell" className="col-action">
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label={`删除${displayName(p.name)}`}
                          onClick={() =>
                            setConfirm({
                              type: 'delete',
                              id: p.id,
                              name: displayName(p.name),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>

          <footer className="bottom-bar">
            <div
              ref={bottomMainRef}
              className={`bottom-main ${compactBar ? 'is-compact' : 'is-expanded'}`}
            >
              <button type="button" className="btn primary" onClick={addPlayer}>
                添加
              </button>
              <button type="button" className="btn ghost" onClick={onValidate}>
                校验
              </button>
              {!compactBar && (
                <>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={toggleSortMode}
                  >
                    排序·{sortModeLabel(state.sortMode)}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={openShare}
                  >
                    分享
                  </button>
                  <button
                    type="button"
                    className="btn ghost danger-text"
                    onClick={() => setConfirm({ type: 'clearPlayers' })}
                  >
                    清空人员
                  </button>
                  <button
                    type="button"
                    className="btn ghost danger-text"
                    onClick={() => setConfirm({ type: 'clearScores' })}
                  >
                    清空记分
                  </button>
                </>
              )}
              {compactBar && (
                <div className="more-wrap" ref={moreWrapRef}>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-expanded={moreOpen}
                  >
                    更多
                  </button>
                  {moreOpen && (
                    <div className="more-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={toggleSortMode}
                      >
                        排序·{sortModeLabel(state.sortMode)}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          void openShare()
                        }}
                      >
                        分享
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger-text"
                        onClick={() => setConfirm({ type: 'clearPlayers' })}
                      >
                        清空人员
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="danger-text"
                        onClick={() => setConfirm({ type: 'clearScores' })}
                      >
                        清空记分
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div
              ref={bottomProbeRef}
              className="bottom-probe"
              aria-hidden="true"
            >
              <button type="button" className="btn primary" tabIndex={-1}>
                添加
              </button>
              <button type="button" className="btn ghost" tabIndex={-1}>
                校验
              </button>
              <button type="button" className="btn ghost" tabIndex={-1}>
                排序·{sortModeLabel(state.sortMode)}
              </button>
              <button type="button" className="btn ghost" tabIndex={-1}>
                分享
              </button>
              <button type="button" className="btn ghost" tabIndex={-1}>
                清空人员
              </button>
              <button type="button" className="btn ghost" tabIndex={-1}>
                清空记分
              </button>
            </div>
            <p className="hint">数据仅保存在本机浏览器</p>
          </footer>
        </div>
      )}

      {activeTab === 'ranks' && (
        <div className="ref-scroll" ref={refScrollRef}>
          <RanksPanel />
        </div>
      )}
      {activeTab === 'terms' && (
        <div className="ref-scroll" ref={refScrollRef}>
          <TermsPanel />
        </div>
      )}

      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="删除人员"
        message={`确定删除「${confirm?.type === 'delete' ? confirm.name : ''}」？此操作不可恢复。`}
        confirmLabel="确定删除"
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === 'clearPlayers'}
        title="清空人员"
        message="确定清空全部人员？此操作不可恢复。"
        confirmLabel="确定清空"
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirm?.type === 'clearScores'}
        title="清空记分"
        message="确定清空全部记分？将保留人员，买入与剩余均重置为一手（结果归 0）。此操作不可恢复。"
        confirmLabel="确定清空"
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
      />

      {shareOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-card share-modal"
            role="dialog"
            aria-modal="true"
            aria-label="分享结果"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>分享结果</h2>
            {sharing && <p>正在生成图片…</p>}
            {shareError && <p className="bad-text">{shareError}</p>}
            {shareDataUrl && (
              <img
                className="share-preview"
                src={shareDataUrl}
                alt="记分结果预览"
              />
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={closeShareModal}
              >
                关闭
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!shareDataUrl}
                onClick={() => void shareOrDownload()}
              >
                保存/分享
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="share-offscreen" aria-hidden="true">
        <ShareCard
          ref={shareRef}
          players={sortedPlayers}
          unitPerHand={state.unitPerHand}
          generatedAt={shareAt}
        />
      </div>
    </div>
  )
}
