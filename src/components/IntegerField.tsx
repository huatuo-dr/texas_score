import { useEffect, useState } from 'react'
import {
  acceptIntegerDraft,
  normalizeIntegerOnBlur,
} from '../domain/score'

interface Props {
  value: number
  onCommit: (n: number) => void
  className?: string
  ariaLabel: string
  id?: string
}

export function IntegerField({
  value,
  onCommit,
  className,
  ariaLabel,
  id,
}: Props) {
  const [draft, setDraft] = useState(String(value))
  const [focused, setFocused] = useState(false)

  // 失焦时始终跟 props
  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])

  // 聚焦时：仅当 draft 已是完整整数且与外部 value 不一致时同步（如 ± 步进）
  // 编辑中的空串 / "-" 中间态不覆盖，避免打断输入
  useEffect(() => {
    if (!focused) return
    setDraft((current) => {
      if (!/^-?\d+$/.test(current)) return current
      const parsed = Number.parseInt(current, 10)
      if (parsed !== value) return String(value)
      return current
    })
  }, [value, focused])

  return (
    <input
      id={id}
      className={className}
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const next = acceptIntegerDraft(e.target.value, draft)
        setDraft(next)
        if (/^-?\d+$/.test(next)) {
          onCommit(Number.parseInt(next, 10))
        }
      }}
      onBlur={() => {
        setFocused(false)
        const n = normalizeIntegerOnBlur(draft)
        setDraft(String(n))
        onCommit(n)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}
