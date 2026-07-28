import { GLOSSARY_GROUPS } from '../data/glossary'

export function TermsPanel() {
  return (
    <div
      className="ref-panel"
      role="tabpanel"
      id="panel-terms"
      aria-labelledby="tab-terms"
    >
      <header className="ref-hero">
        <h2>常用术语</h2>
        <p className="ref-lead">
          朋友局高频说法速查：操作、位置、发牌与街道。解释从简，便于现场对照。
        </p>
      </header>

      {GLOSSARY_GROUPS.map((group) => (
        <section
          key={group.id}
          className="ref-card"
          aria-label={group.title}
        >
          <h3>{group.title}</h3>
          <ul className="term-list">
            {group.entries.map((entry) => (
              <li key={entry.term} className="term-item">
                <div className="term-name">{entry.term}</div>
                <p className="term-body">{entry.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
