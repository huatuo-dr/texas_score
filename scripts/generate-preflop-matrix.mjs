/**
 * 生成 6 人桌翻前 all-in 到河的近似 equity 矩阵（13×13）。
 * 口径见 docs/03-起手牌胜率热力图方案.html §2.2.1
 *
 * 用法：node scripts/generate-preflop-matrix.mjs
 * 环境变量：TRIALS=12000（默认）
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'src/data/preflopMatrix.ts')

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
// internal rank index: 0=2 ... 12=A
const TRIALS = Number(process.env.TRIALS || 12000)
const PLAYERS = 6
const OPPONENTS = PLAYERS - 1

// --- PRNG (mulberry32) for reproducibility ---
function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(0x74657861) // 'texa'

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function fullDeck() {
  const d = []
  for (let r = 0; r < 13; r++) {
    for (let s = 0; s < 4; s++) d.push((r << 2) | s)
  }
  return d
}

function cardRank(c) {
  return c >> 2
}
function cardSuit(c) {
  return c & 3
}

/** Best 5-card category score from up to 7 cards. Higher is better. */
function evaluate7(cards) {
  const n = cards.length
  let best = -1
  // C(n,5)
  for (let a = 0; a < n - 4; a++) {
    for (let b = a + 1; b < n - 3; b++) {
      for (let c = b + 1; c < n - 2; c++) {
        for (let d = c + 1; d < n - 1; d++) {
          for (let e = d + 1; e < n; e++) {
            const s = evaluate5([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ])
            if (s > best) best = s
          }
        }
      }
    }
  }
  return best
}

function evaluate5(cards) {
  const ranks = cards.map(cardRank).sort((x, y) => y - x)
  const suits = cards.map(cardSuit)
  const isFlush = suits.every((s) => s === suits[0])

  // rank counts
  const cnt = new Array(13).fill(0)
  for (const r of ranks) cnt[r]++

  const byCount = []
  for (let r = 12; r >= 0; r--) {
    if (cnt[r]) byCount.push({ r, c: cnt[r] })
  }
  byCount.sort((a, b) => b.c - a.c || b.r - a.r)

  // straight (A high or wheel)
  let isStraight = false
  let straightHigh = 0
  const uniq = []
  for (let r = 12; r >= 0; r--) if (cnt[r]) uniq.push(r)
  // wheel: A,5,4,3,2
  const wheel =
    cnt[12] && cnt[3] && cnt[2] && cnt[1] && cnt[0] && uniq.length === 5
  if (wheel) {
    isStraight = true
    straightHigh = 3 // 5-high
  } else if (uniq.length === 5 && uniq[0] - uniq[4] === 4) {
    isStraight = true
    straightHigh = uniq[0]
  } else {
    // also handle 5 unique not sorted gap - already only 5 cards
  }

  // with only 5 cards, straight is consecutive unique ranks
  if (!isStraight && uniq.length === 5) {
    const sorted = [...uniq].sort((a, b) => b - a)
    if (sorted[0] - sorted[4] === 4) {
      isStraight = true
      straightHigh = sorted[0]
    }
  }

  const kick = (...rs) => {
    let v = 0
    for (const r of rs) v = (v << 4) | r
    return v
  }

  if (isFlush && isStraight) {
    return (8 << 20) | straightHigh // SF (royal is max high A=12)
  }
  if (byCount[0].c === 4) {
    return (7 << 20) | kick(byCount[0].r, byCount[1].r)
  }
  if (byCount[0].c === 3 && byCount[1].c === 2) {
    return (6 << 20) | kick(byCount[0].r, byCount[1].r)
  }
  if (isFlush) {
    return (
      (5 << 20) |
      kick(ranks[0], ranks[1], ranks[2], ranks[3], ranks[4])
    )
  }
  if (isStraight) {
    return (4 << 20) | straightHigh
  }
  if (byCount[0].c === 3) {
    return (
      (3 << 20) | kick(byCount[0].r, byCount[1].r, byCount[2].r)
    )
  }
  if (byCount[0].c === 2 && byCount[1].c === 2) {
    const hi = Math.max(byCount[0].r, byCount[1].r)
    const lo = Math.min(byCount[0].r, byCount[1].r)
    return (2 << 20) | kick(hi, lo, byCount[2].r)
  }
  if (byCount[0].c === 2) {
    return (
      (1 << 20) |
      kick(byCount[0].r, byCount[1].r, byCount[2].r, byCount[3].r)
    )
  }
  return (
    (0 << 20) |
    kick(ranks[0], ranks[1], ranks[2], ranks[3], ranks[4])
  )
}

/** Deal two hole cards matching kind for display ranks ri, rj (0=2..12=A). */
function dealHeroHoles(deck, ri, rj, kind) {
  // deck is full; we pick matching cards then remove from remaining
  const cards = [...deck]
  shuffle(cards)

  if (kind === 'pair') {
    const found = []
    for (const c of cards) {
      if (cardRank(c) === ri) found.push(c)
      if (found.length === 2) break
    }
    return found
  }

  if (kind === 'suited') {
    for (let s = 0; s < 4; s++) {
      let a = -1
      let b = -1
      for (const c of cards) {
        if (cardSuit(c) === s && cardRank(c) === ri) a = c
        if (cardSuit(c) === s && cardRank(c) === rj) b = c
      }
      if (a >= 0 && b >= 0) return [a, b]
    }
  }

  // offsuit
  for (const c1 of cards) {
    if (cardRank(c1) !== ri) continue
    for (const c2 of cards) {
      if (c2 === c1) continue
      if (cardRank(c2) === rj && cardSuit(c2) !== cardSuit(c1)) {
        return [c1, c2]
      }
    }
  }
  return null
}

function removeCards(deck, holes) {
  const set = new Set(holes)
  return deck.filter((c) => !set.has(c))
}

function codeOf(row, col, kind) {
  // matrix row/col use same as RANKS index 0=A ... 12=2
  const r0 = RANKS[row]
  const r1 = RANKS[col]
  if (kind === 'pair') return `${r0}${r0}`
  // order high first in code: smaller index in RANKS = higher card
  const order = Object.fromEntries(RANKS.map((ch, i) => [ch, i]))
  const [a, b] = order[r0] <= order[r1] ? [r0, r1] : [r1, r0]
  return kind === 'suited' ? `${a}${b}s` : `${a}${b}o`
}

/** matrix index 0=A .. 12=2 → internal rank 12=A .. 0=2 */
function matrixToInternal(i) {
  return 12 - i
}

function simulateEquity(row, col, kind) {
  const ri = matrixToInternal(row)
  const rj = matrixToInternal(col)
  let shareSum = 0

  for (let t = 0; t < TRIALS; t++) {
    const deck0 = fullDeck()
    const hero = dealHeroHoles(deck0, ri, rj, kind)
    if (!hero || hero.length !== 2) {
      // should not happen
      continue
    }
    let remain = removeCards(deck0, hero)
    shuffle(remain)

    const holes = [hero]
    let ok = true
    let idx = 0
    for (let p = 0; p < OPPONENTS; p++) {
      if (idx + 2 > remain.length) {
        ok = false
        break
      }
      holes.push([remain[idx], remain[idx + 1]])
      idx += 2
    }
    if (!ok) continue
    const board = remain.slice(idx, idx + 5)
    if (board.length < 5) continue

    const scores = holes.map((h) => evaluate7([...h, ...board]))
    const best = Math.max(...scores)
    const winners = scores.filter((s) => s === best).length
    if (scores[0] === best) {
      shareSum += 1 / winners
    }
  }

  return shareSum / TRIALS
}

function assignTiers(flat) {
  // flat: { code, equity, ... }[]
  const sorted = [...flat].sort((a, b) => {
    if (b.equity !== a.equity) return b.equity - a.equity
    return a.code.localeCompare(b.code)
  })
  const n = sorted.length
  const nS = Math.max(1, Math.round(n * 0.05))
  const nA = Math.max(1, Math.round(n * 0.1))
  const nB = Math.max(1, Math.round(n * 0.2))
  const nC = Math.max(1, Math.round(n * 0.3))

  const tierOf = new Map()
  sorted.forEach((item, i) => {
    let tier = 'D'
    if (i < nS) tier = 'S'
    else if (i < nS + nA) tier = 'A'
    else if (i < nS + nA + nB) tier = 'B'
    else if (i < nS + nA + nB + nC) tier = 'C'
    tierOf.set(item.code, tier)
  })

  const breaks = {
    method: 'percentile_desc',
    S: `top ~5% (n=${nS})`,
    A: `next ~10% (n=${nA})`,
    B: `next ~20% (n=${nB})`,
    C: `next ~30% (n=${nC})`,
    D: 'remainder',
  }
  return { tierOf, breaks }
}

function main() {
  console.log(`Generating preflop matrix trials=${TRIALS} players=${PLAYERS}...`)
  const cells = []
  const flat = []

  for (let row = 0; row < 13; row++) {
    const line = []
    for (let col = 0; col < 13; col++) {
      let kind
      if (row === col) kind = 'pair'
      else if (row < col) kind = 'suited'
      else kind = 'offsuit'

      const code = codeOf(row, col, kind)
      process.stdout.write(`\r${code.padEnd(4)} (${row},${col})   `)
      const equity = simulateEquity(
        row,
        col,
        kind === 'pair' ? 'pair' : kind === 'suited' ? 'suited' : 'offsuit',
      )
      // clamp
      const e = Math.min(0.999, Math.max(0.001, equity))
      const cell = { code, kind, equity: e, tier: 'D' }
      line.push(cell)
      flat.push(cell)
    }
    cells.push(line)
  }
  process.stdout.write('\n')

  const { tierOf, breaks } = assignTiers(flat)
  for (const row of cells) {
    for (const cell of row) {
      cell.tier = tierOf.get(cell.code) || 'D'
      // round equity for stable file
      cell.equity = Math.round(cell.equity * 10000) / 10000
    }
  }

  const meta = {
    players: 6,
    opponents: 5,
    model: 'random_uniform_hole_cards',
    equityDefinition: 'preflop_allin_to_river_chop_no_rake',
    source: 'scripts/generate-preflop-matrix.mjs',
    version: '1',
    trials: TRIALS,
    seed: '0x74657861',
    tierBreaks: breaks,
    disclaimer: '近似参考，非实时胜率',
  }

  const file = `/* eslint-disable */
// AUTO-GENERATED by scripts/generate-preflop-matrix.mjs — do not edit by hand.
// 口径：6 人、其余 5 随机手、翻前 all-in 到河、chop、无 rake。trials=${TRIALS}

export type PreflopKind = 'pair' | 'suited' | 'offsuit'
export type PreflopTier = 'S' | 'A' | 'B' | 'C' | 'D'

export interface PreflopCell {
  code: string
  kind: PreflopKind
  equity: number
  tier: PreflopTier
}

export interface PreflopMatrix {
  ranks: string[]
  meta: {
    players: number
    opponents: number
    model: string
    equityDefinition: string
    source: string
    version: string
    trials: number
    seed: string
    tierBreaks: Record<string, string>
    disclaimer: string
  }
  cells: PreflopCell[][]
}

export const PREFLOP_RANKS = ${JSON.stringify(RANKS)} as const

export const PREFLOP_MATRIX: PreflopMatrix = ${JSON.stringify(
    { ranks: RANKS, meta, cells },
    null,
    2,
  )}
`

  writeFileSync(OUT, file, 'utf8')
  console.log('Wrote', OUT)

  // quick stats
  const aa = cells[0][0]
  const kko = cells[1][1]
  console.log('AA', aa.equity, aa.tier, 'KK', kko.equity, kko.tier)
}

main()
