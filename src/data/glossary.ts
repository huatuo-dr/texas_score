export interface GlossaryEntry {
  term: string
  body: string
}

export interface GlossaryGroup {
  id: string
  title: string
  entries: GlossaryEntry[]
}

export const GLOSSARY_GROUPS: GlossaryGroup[] = [
  {
    id: 'actions',
    title: '操作相关',
    entries: [
      { term: '跟注 Call', body: '投入与当前需跟金额相同的筹码，不加注。' },
      { term: '加注 Raise', body: '在跟注基础上提高下注额。' },
      { term: '再加注 Re-raise', body: '在已有加注后再提高。' },
      {
        term: '过牌 Check',
        body: '当前无人下注时，选择不下注并保留行动权。',
      },
      { term: '弃牌 Fold', body: '放弃本手牌，不再争夺底池。' },
      { term: '全下 All-in', body: '把剩余筹码一次性押上。' },
      {
        term: '盲注 Blind',
        body: '发牌前强制投入的注（小盲/大盲），推动底池。',
      },
      {
        term: '前注 Ante',
        body: '部分规则下每人都先投一点的强制注；朋友局不一定有。',
      },
      { term: '底池 Pot', body: '当前桌面上累积的、供赢家拿走的筹码。' },
      {
        term: '边池 Side pot',
        body: '有人全下后形成的额外池。本工具仅作名词解释，不负责计算边池。',
      },
      {
        term: '摊牌 Showdown',
        body: '最后一轮下注结束，未弃牌者比牌。',
      },
      {
        term: '亮牌 / 埋牌',
        body: '摊牌时出示手牌，或选择不展示。赢了也可以埋牌（朋友局常见礼仪：不强求亮给别人看）。',
      },
    ],
  },
  {
    id: 'position',
    title: '位置相关',
    entries: [
      {
        term: '庄位 Button / BTN',
        body: '经销按钮所在位；盲注圈后通常最后行动，位置较优。',
      },
      { term: '小盲 SB', body: '庄位左手位，强制下小盲。' },
      { term: '大盲 BB', body: '小盲左手位，强制下大盲。' },
      {
        term: '枪口 UTG',
        body: '大盲左手，翻前较早行动，位置偏早。',
      },
      {
        term: '中间位 MP',
        body: '枪口与后位之间的笼统叫法。',
      },
      {
        term: '关煞 / 劫位（Cutoff / CO）',
        body: '庄位右手；后位，可较多偷盲。中文常称关煞/劫位，英文 Cutoff。',
      },
      {
        term: '前位 / 后位（位置优势）',
        body: '前位行动早、信息少；后位行动晚、信息多。位置只影响「谁先说话」，不改变公共牌本身。',
      },
    ],
  },
  {
    id: 'dealing',
    title: '发牌与街道',
    entries: [
      {
        term: '底牌 / 手牌 Hole cards',
        body: '每人私有的两张牌（标准德州）。',
      },
      {
        term: '公共牌 Community cards',
        body: '桌面共用、所有人可用来组成五张牌的牌。',
      },
      {
        term: '翻前 Preflop',
        body: '发公共牌之前，只有手牌的阶段。',
      },
      {
        term: '翻牌 Flop',
        body: '一次发出的三张公共牌；进入翻牌圈下注。',
      },
      { term: '转牌 Turn', body: '第四张公共牌。' },
      {
        term: '河牌 River',
        body: '第五张公共牌，最后一轮下注。',
      },
      {
        term: '烧牌 Burn',
        body: '发公共牌前弃掉最上面一张（防标记）；朋友局或可简化。',
      },
      {
        term: '成牌 / 听牌',
        body: '已成型的牌力，或再来一张才可能成型（如听同花）。',
      },
      {
        term: '公共牌面 Texture',
        body: '公共牌是否连张、是否双色等观感，影响吓人程度（科普级理解即可）。',
      },
      {
        term: '发牌顺序',
        body: '通常自小盲起按顺时针发手牌；庄位按钮每手移动。',
      },
    ],
  },
]
