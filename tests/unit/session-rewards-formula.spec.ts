import { describe, expect, it } from 'vitest'
import { computeFactionPoints, factionGrade } from '../../src/app/(frontend)/characters/session-rewards-formula'

const faction = {
  id: 7,
  nom: 'Alliance',
  rangs: [
    { nom: 'Bleu', pointsRequis: 0 },
    { nom: 'Cadet', pointsRequis: 15 },
    { nom: 'Officier', pointsRequis: 90 },
  ],
}

describe('session rewards faction points', () => {
  it('resolves the stored 1-based rank index', () => {
    expect(factionGrade('2', faction)).toBe(2)
    expect(
      computeFactionPoints({
        affiliation: faction,
        rangDeFaction: '2',
        konisGain: 0,
        commanditaireId: 7,
        commanditaireName: 'Alliance',
        ciblesAbattues: 0,
        ciblesCapturees: 0,
        horsConfederation: false,
      }),
    ).toMatchObject({ total: 20, commanditaire: 20 })
  })

  it('keeps resolving rank names for compatibility', () => {
    expect(factionGrade('Officier', faction)).toBe(3)
  })

  it('does not grant the sponsor bonus to another affiliation', () => {
    expect(
      computeFactionPoints({
        affiliation: { ...faction, id: 8 },
        rangDeFaction: '2',
        konisGain: 0,
        commanditaireId: 7,
        commanditaireName: 'Alliance',
        ciblesAbattues: 0,
        ciblesCapturees: 0,
        horsConfederation: false,
      }).commanditaire,
    ).toBe(0)
  })
})
