import { HAND_RANKS } from '../data/handRanks'

export function RanksPanel() {
  return (
    <div
      className="ref-panel"
      role="tabpanel"
      id="panel-ranks"
      aria-labelledby="tab-ranks"
    >
      <header className="ref-hero">
        <h2>牌力大小</h2>
        <p className="ref-lead">
          以下为德州扑克<strong>摊牌</strong>时，标准<strong>五张牌型</strong>
          由强到弱的顺序（每人用手牌 + 公共牌凑成的<strong>最佳五张</strong>
          ）。本表用于比牌型强弱，非起手牌推荐。
        </p>
      </header>

      <section className="ref-card highlight" aria-label="点数大小">
        <h3>点数大小</h3>
        <p className="mono-line">
          A &gt; K &gt; Q &gt; J &gt; 10 &gt; 9 &gt; 8 &gt; 7 &gt; 6 &gt; 5 &gt; 4
          &gt; 3 &gt; 2
        </p>
        <ul className="ref-bullets">
          <li>
            <strong>K、Q、J、10、9</strong> 属于高点侧；
            <strong>5、4、3、2</strong> 属于低点。单独比高牌时，
            <strong>A 最大</strong>。
          </li>
          <li>
            人头与十点：<code>K &gt; Q &gt; J &gt; 10 &gt; 9</code>
            ，均高于 8 及以下；成顺时按是否连续判断。
          </li>
          <li>
            <strong>A 的双重身份：</strong>
            多数情况 A 最大；仅在 <strong>A-2-3-4-5（轮子）</strong> 中 A
            当作 1。A 不能两边用——不存在 Q-K-A-2-3 这种顺子。
          </li>
          <li>
            单牌比较：A 大于 K/Q/J/10/9。顺子先比顶端（如 10-J-Q-K-A 顶为
            A，大于 9-10-J-Q-K 顶为 K）。
          </li>
        </ul>
        <p className="ref-callout">
          标准规则下<strong>花色无大小</strong>；同牌型比点数与踢脚，
          <strong>不比花色</strong>。
        </p>
      </section>

      <section className="ref-card" aria-label="特殊顺子">
        <h3>两种关键顺子</h3>
        <div className="straight-grid">
          <div className="straight-item">
            <div className="straight-label">最大顺 · Broadway</div>
            <div className="straight-ex">10 · J · Q · K · A</div>
            <p>A 作最大；顺子中最大。</p>
          </div>
          <div className="straight-item">
            <div className="straight-label">最小顺 · 轮子 Wheel</div>
            <div className="straight-ex">A · 2 · 3 · 4 · 5</div>
            <p>
              A 作 1。比两个顺子时：A-2-3-4-5 视为 <strong>5-high</strong>{' '}
              顺，小于 6-high 顺（2-3-4-5-6）。
            </p>
          </div>
        </div>
        <p className="ref-note">
          对照：10-J-Q-K-A ＞ 9-10-J-Q-K ＞ … ＞ A-2-3-4-5（都是顺子时）。
        </p>
      </section>

      <section className="ref-card" aria-label="牌型列表">
        <h3>牌型从大到小</h3>
        <ol className="rank-list">
          {HAND_RANKS.map((item) => (
            <li
              key={item.rank}
              className={item.rank <= 3 ? 'rank-item is-top' : 'rank-item'}
            >
              <div className="rank-badge" aria-hidden="true">
                {item.rank}
              </div>
              <div className="rank-body">
                <div className="rank-title">
                  <strong>{item.nameZh}</strong>
                  <span className="rank-en">{item.nameEn}</span>
                </div>
                <div className="rank-example">{item.example}</div>
                <div className="rank-note">{item.note}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ref-card muted" aria-label="比大小提示">
        <h3>比大小短提示</h3>
        <ul className="ref-bullets">
          <li>同牌型先比主牌点数，再比踢脚；</li>
          <li>同花比点不比花色；</li>
          <li>
            顺子比最高张；A-2-3-4-5 的「高」按 5 计（5-high），小于
            2-3-4-5-6。
          </li>
        </ul>
        <p className="ref-footer">
          仅供朋友局参考；场地另有约定时以现场规则为准。
        </p>
      </section>
    </div>
  )
}
