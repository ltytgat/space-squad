import { computeRank } from './rankSystem'

export type CharacterOrigin = 'Humain' | 'Strani' | 'Vada'

export type RankUpRoll = {
  rang: number
  origine: CharacterOrigin
  deBlessures: number
  jetsBlessures: [number, number]
  bonusBlessures: number
  deCompetence: 6
  jetsCompetence: [number, number]
  pointsDeCompetence: number
}

export type RankUpRewards = {
  bonusBlessures: number
  pointsDeCompetence: number
  promotions: RankUpRoll[]
}

const HEALTH_DIE_BY_ORIGIN: Record<CharacterOrigin, number> = {
  Humain: 6,
  Strani: 4,
  Vada: 8,
}

export function ranksGainedFromPoints(pointsBefore: number, pointsGained: number): number[] {
  if (pointsGained <= 0) return []

  const rankBefore = computeRank(pointsBefore).level
  const rankAfter = computeRank(pointsBefore + pointsGained).level
  return Array.from({ length: Math.max(0, rankAfter - rankBefore) }, (_, index) => rankBefore + index + 1)
}

function rollDie(sides: number, random: () => number): number {
  return Math.floor(random() * sides) + 1
}

function rollBestOfTwo(sides: number, random: () => number): [number, number] {
  return [rollDie(sides, random), rollDie(sides, random)]
}

/** Rolls and totals the rewards for every newly reached rank. */
export function rollRankUpRewards(
  firstNewRank: number,
  lastNewRank: number,
  origin: CharacterOrigin,
  random: () => number = Math.random,
): RankUpRewards {
  const healthDie = HEALTH_DIE_BY_ORIGIN[origin]
  if (!healthDie) throw new Error(`Espèce non prise en charge pour un passage de rang : ${origin}`)

  const promotions: RankUpRoll[] = []
  for (let rang = firstNewRank; rang <= lastNewRank; rang += 1) {
    const jetsBlessures = rollBestOfTwo(healthDie, random)
    const jetsCompetence = rollBestOfTwo(6, random)
    promotions.push({
      rang,
      origine: origin,
      deBlessures: healthDie,
      jetsBlessures,
      bonusBlessures: Math.max(...jetsBlessures),
      deCompetence: 6,
      jetsCompetence,
      pointsDeCompetence: Math.max(...jetsCompetence),
    })
  }

  return {
    bonusBlessures: promotions.reduce((total, promotion) => total + promotion.bonusBlessures, 0),
    pointsDeCompetence: promotions.reduce((total, promotion) => total + promotion.pointsDeCompetence, 0),
    promotions,
  }
}
