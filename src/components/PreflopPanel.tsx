import { useMemo, useState } from 'react'
import {
  equityToColor,
  equityToTextColor,
  formatEquityPct,
  getCell,
  kindLabel,
  PREFLOP_MATRIX,
  PREFLOP_RANKS,
} from '../domain/preflop'

export function PreflopPanel() {
  const [selected, setSelected] = useState({ row: 0, col: 0 })
  const cell = getCell(selected.row, selected.col)

  const legend = useMemo(
    () => [0.08, 0.16, 0.24, 0.32, 0.4, 0.5],
    [],
  )

  return (
    <div
      className="ref-panel preflop-panel"
      role="tabpanel"
      id="panel-preflop"
      aria-labelledby="tab-preflop"
    >
      <header className="ref-hero">
        <h2>起手牌胜率</h2>
        <p className="ref-lead">
          示意：<strong>6 人桌</strong>，其余 5 人随机手牌，
          <strong>翻前全下到河</strong>的近似 equity（平分按 chop，不含抽水），
          仅供朋友局参考，不是实时胜率，也不是建议你该不该玩。
        </p>
      </header>

      <section className="ref-card" aria-label="图例">
        <div className="preflop-legend">
          <span className="preflop-legend-label">弱</span>
          <div className="preflop-legend-bar" aria-hidden="true">
            {legend.map((e) => (
              <span key={e} style={{ background: equityToColor(e) }} />
            ))}
          </div>
          <span className="preflop-legend-label">强</span>
        </div>
        <p className="ref-note">
          颜色越暖，参考 equity 越高。上三角同花 (s)，下三角不同花
          (o)，对角线对子。数据：
          {PREFLOP_MATRIX.meta.source} · v{PREFLOP_MATRIX.meta.version} ·
          trials={PREFLOP_MATRIX.meta.trials}
        </p>
      </section>

      <section className="ref-card preflop-matrix-wrap" aria-label="起手牌矩阵">
        <div className="preflop-matrix-scroll">
          <div
            className="preflop-matrix"
            role="grid"
            aria-label="13乘13起手牌胜率矩阵"
          >
            <div className="preflop-corner" aria-hidden="true" />
            {PREFLOP_RANKS.map((r) => (
              <div key={`col-${r}`} className="preflop-axis" aria-hidden="true">
                {r}
              </div>
            ))}
            {PREFLOP_RANKS.map((rowLabel, row) => (
              <div key={`r-${rowLabel}`} className="preflop-matrix-row">
                <div className="preflop-axis" aria-hidden="true">
                  {rowLabel}
                </div>
                {PREFLOP_RANKS.map((_colLabel, col) => {
                  const c = getCell(row, col)
                  const active =
                    selected.row === row && selected.col === col
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      role="gridcell"
                      className={`preflop-cell${active ? ' is-selected' : ''}${
                        c.kind === 'pair' ? ' is-pair' : ''
                      }`}
                      style={{
                        background: equityToColor(c.equity),
                        color: equityToTextColor(c.equity),
                      }}
                      aria-label={`${c.code}，${kindLabel(c.kind)}，${formatEquityPct(c.equity)}，档位 ${c.tier}`}
                      aria-selected={active}
                      onClick={() => setSelected({ row, col })}
                    >
                      {c.code}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="ref-card preflop-detail"
        aria-label="选中手牌详情"
        aria-live="polite"
      >
        <h3>详情 · {cell.code}</h3>
        <div className="preflop-detail-grid">
          <div>
            <span className="label">类型</span>
            <strong>{kindLabel(cell.kind)}</strong>
          </div>
          <div>
            <span className="label">参考胜率</span>
            <strong>{formatEquityPct(cell.equity)}</strong>
          </div>
          <div>
            <span className="label">档位</span>
            <strong className={`tier-pill tier-${cell.tier}`}>{cell.tier}</strong>
          </div>
        </div>
        <p className="ref-note">
          档位 S→D 按全表 equity 分位划分；颜色由 equity
          连续映射，与档位标签独立。
        </p>
      </section>

      <p className="ref-footer preflop-legal">
        不构成赌博建议；请遵守当地法律法规。
      </p>
    </div>
  )
}
