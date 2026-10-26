import { describe, expect, it } from 'vitest'
import { factionRewardQuote, type FactionRewardCharacter, type FactionRewardOffer } from '@/app/(frontend)/shop/faction-reward-pricing'

const character: FactionRewardCharacter = {
  id: 1,
  nom: 'Test',
  konis: 0,
  pointsDeFaction: 10,
  rangDeFaction: '1',
  affiliation: { id: 1, nom: 'Alliance', rangs: [{ nom: 'Recrue', pointsRequis: 0 }] },
  inventaireRecompensesFaction: [],
}

const atelierOffer: FactionRewardOffer = {
  id: 2,
  nom: 'Accès Atelier',
  description: 'Accès aux Ateliers',
  gradeRequis: 1,
  gradeName: 'Recrue',
  coutPointsFaction: 5,
  typeRecompense: 'acces-atelier',
  pourcentageReduction: null,
  application: null,
}

describe('faction Atelier permit purchase', () => {
  it('allows purchase when the character meets the grade and has no Atelier permit', () => {
    expect(factionRewardQuote(atelierOffer, character)).toMatchObject({ canBuy: true, permitAlreadyOwned: false, nextPointsDeFaction: 5 })
  })

  it('blocks a duplicate Atelier permit purchase', () => {
    expect(factionRewardQuote(atelierOffer, {
      ...character,
      inventaireRecompensesFaction: [{
        nom: 'Accès Atelier', effet: '', faction: 'Alliance', grade: 'Recrue', typeRecompense: 'acces-atelier',
      }],
    })).toMatchObject({ canBuy: false, permitAlreadyOwned: true })
  })
})
