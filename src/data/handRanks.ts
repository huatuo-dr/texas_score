export interface HandRank {
  rank: number
  nameZh: string
  nameEn: string
  example: string
  note: string
}

/** 摊牌五张牌型，从大到小 */
export const HAND_RANKS: HandRank[] = [
  {
    rank: 1,
    nameZh: '皇家同花顺',
    nameEn: 'Royal Flush',
    example: '10♠ J♠ Q♠ K♠ A♠',
    note: '同花色的 10-J-Q-K-A',
  },
  {
    rank: 2,
    nameZh: '同花顺',
    nameEn: 'Straight Flush',
    example: '5♥ 6♥ 7♥ 8♥ 9♥',
    note: '同花且连续（非皇家）',
  },
  {
    rank: 3,
    nameZh: '四条',
    nameEn: 'Four of a Kind',
    example: '9♠ 9♥ 9♦ 9♣ K♠',
    note: '四张同一点数',
  },
  {
    rank: 4,
    nameZh: '葫芦',
    nameEn: 'Full House',
    example: 'K♠ K♥ K♦ 5♣ 5♠',
    note: '三条 + 一对',
  },
  {
    rank: 5,
    nameZh: '同花',
    nameEn: 'Flush',
    example: 'A♦ J♦ 8♦ 6♦ 2♦',
    note: '五张同一花色，非顺子',
  },
  {
    rank: 6,
    nameZh: '顺子',
    nameEn: 'Straight',
    example: '9♠ 10♥ J♦ Q♣ K♠',
    note: '五张连续，花色不全相同',
  },
  {
    rank: 7,
    nameZh: '三条',
    nameEn: 'Three of a Kind',
    example: '8♠ 8♥ 8♦ A♣ 3♠',
    note: '三张同一点数',
  },
  {
    rank: 8,
    nameZh: '两对',
    nameEn: 'Two Pair',
    example: 'Q♠ Q♥ 7♦ 7♣ 2♠',
    note: '两个不同点数的对子',
  },
  {
    rank: 9,
    nameZh: '一对',
    nameEn: 'One Pair',
    example: 'J♠ J♥ A♦ 9♣ 4♠',
    note: '一个对子',
  },
  {
    rank: 10,
    nameZh: '高牌',
    nameEn: 'High Card',
    example: 'A♠ K♦ 10♣ 7♥ 3♠',
    note: '以上皆无，比最大单牌及踢脚',
  },
]
