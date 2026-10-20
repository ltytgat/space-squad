import { describe, expect, it } from 'vitest'
import { ranksGainedFromPoints, rollRankUpRewards, type CharacterOrigin } from '@/lib/rankUpRewards'
import { ArmorSets } from '@/collections/ArmorSets'

function randomFrom(values: number[]) {
  let index = 0
  return () => values[index++]!
}

describe('rank-up rewards', () => {
  it.each([
    [6, 'Humain'],
    [4, 'Strani'],
    [8, 'Vada'],
  ] as const)('uses d%s for %s health bonuses', (dieSides: number, origin: CharacterOrigin) => {
    const result = rollRankUpRewards(2, 2, origin, randomFrom([0, 0.99, 0, 0.99]))

    expect(result.promotions[0]).toMatchObject({
      deBlessures: dieSides,
      jetsBlessures: [1, dieSides],
      bonusBlessures: dieSides,
      jetsCompetence: [1, 6],
      pointsDeCompetence: 6,
    })
  })

  it('rolls rewards for each crossed rank and totals the best results', () => {
    const result = rollRankUpRewards(2, 3, 'Humain', randomFrom([
      0.1, 0.8, 0.2, 0.9,
      0.3, 0.6, 0.4, 0.7,
    ]))

    expect(result.promotions).toHaveLength(2)
    expect(result.promotions.map(({ rang }) => rang)).toEqual([2, 3])
    expect(result.bonusBlessures).toBe(9)
    expect(result.pointsDeCompetence).toBe(11)
  })

  it('only returns newly crossed ranks and caps progression at rank 10', () => {
    expect(ranksGainedFromPoints(4, 1)).toEqual([2])
    expect(ranksGainedFromPoints(4, 0)).toEqual([])
    expect(ranksGainedFromPoints(5, -1)).toEqual([])
    expect(ranksGainedFromPoints(1390, 10000)).toEqual([10])
    expect(ranksGainedFromPoints(2390, 1)).toEqual([])
  })

  it('requires a unique integer rank from 1 to 10 on each armor set', () => {
    const rankField = ArmorSets.fields.find((field) => 'name' in field && field.name === 'rang') as unknown as {
      required: boolean
      unique: boolean
      min: number
      max: number
      validate: (value: unknown, options?: unknown) => string | true
    }

    expect(rankField).toMatchObject({ required: true, unique: true, min: 1, max: 10 })
    expect(rankField.validate(1)).toBe(true)
    expect(rankField.validate(1.5)).toContain('entier')
    expect(rankField.validate(null)).toContain('entier')
  })
})
