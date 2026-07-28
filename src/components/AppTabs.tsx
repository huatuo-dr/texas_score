export type AppTabId = 'score' | 'ranks' | 'terms' | 'preflop'

const TABS: { id: AppTabId; label: string }[] = [
  { id: 'score', label: '记分' },
  { id: 'ranks', label: '牌力' },
  { id: 'terms', label: '术语' },
  { id: 'preflop', label: '胜率' },
]

interface Props {
  active: AppTabId
  onChange: (id: AppTabId) => void
}

export function AppTabs({ active, onChange }: Props) {
  return (
    <div className="app-tabs" role="tablist" aria-label="功能分区">
      {TABS.map((tab) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`app-tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
