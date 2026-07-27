import { forwardRef } from 'react'
import {
  displayName,
  formatSigned,
  playerResult,
  resultChecksum,
  totalBuyIn,
} from '../domain/score'
import type { Player } from '../domain/types'

interface Props {
  players: Player[]
  unitPerHand: number
  generatedAt: Date
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(
  function ShareCard({ players, unitPerHand, generatedAt }, ref) {
    const checksum = resultChecksum(players)
    const total = totalBuyIn(players)
    const timeText = generatedAt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    return (
      <div ref={ref} className="share-card">
        <div className="share-card-title">德州记分</div>
        <div className="share-card-time">{timeText}</div>
        <div className="share-card-meta">
          <span>一手 {unitPerHand}</span>
          <span>人数 {players.length}</span>
          <span>总筹码 {total}</span>
          <span className={checksum === 0 ? 'ok' : 'bad'}>
            合计 {formatSigned(checksum)}
            {checksum === 0 ? ' · 账平' : ' · 不平'}
          </span>
        </div>
        <table className="share-card-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>买入</th>
              <th>剩余</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const r = playerResult(p)
              return (
                <tr key={p.id}>
                  <td>{displayName(p.name, i)}</td>
                  <td>{p.buyIn}</td>
                  <td>{p.remain}</td>
                  <td className={r >= 0 ? 'ok' : 'bad'}>{formatSigned(r)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="share-card-footer">仅供朋友局记账参考</div>
      </div>
    )
  },
)
