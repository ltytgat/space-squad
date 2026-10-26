import { describe, expect, it } from 'vitest'
import { Characters } from '@/collections/Characters'
import {
  factionAtelierAccessLabel,
  factionNameWithArticle,
  ownsFactionAtelierAccess,
  removeAtelierPermitOnAffiliationChange,
  type OwnedFactionReward,
} from '@/lib/factionRewards'

const atelierPermit: OwnedFactionReward = {
  nom: 'Accès Atelier', effet: '', faction: 'Alliance', grade: '2', typeRecompense: 'acces-atelier',
}

describe('Atelier faction permits', () => {
  it('formats the three organization names and access states', () => {
    expect(factionAtelierAccessLabel('', false)).toBe('Ateliers - Accès réglementé')
    expect(factionAtelierAccessLabel('Alliance', false)).toBe('Atelier de l’Alliance - Permis nécessaire')
    expect(factionAtelierAccessLabel('Guilde', false)).toBe('Atelier de la Guilde - Permis nécessaire')
    expect(factionAtelierAccessLabel('Union', true)).toBe('Atelier de l’Union')
    expect(factionNameWithArticle('Guilde')).toBe('la Guilde')
  })

  it('grants Atelier access only for the organization named on the permit', () => {
    expect(ownsFactionAtelierAccess([atelierPermit], 'Alliance')).toBe(true)
    expect(ownsFactionAtelierAccess([atelierPermit], 'alliance')).toBe(true)
    expect(ownsFactionAtelierAccess([atelierPermit], 'Guilde')).toBe(false)
    expect(ownsFactionAtelierAccess([atelierPermit], '')).toBe(false)
  })

  it('removes only the Atelier permit when affiliation changes', () => {
    const existingInventory = [atelierPermit, {
      nom: 'Permis armes', effet: '', faction: 'Alliance', grade: '2', typeRecompense: 'acces-armes-ex',
    }, {
      nom: 'Bon', effet: '', faction: 'Alliance', grade: '2', typeRecompense: 'bon-reduction',
    }]

    const changeData: Record<string, unknown> = { affiliation: 2 }
    const result = removeAtelierPermitOnAffiliationChange(
      changeData,
      { affiliation: { id: 1 }, inventaireRecompensesFaction: existingInventory },
    )

    expect(result.inventaireRecompensesFaction).toEqual(existingInventory.slice(1))
  })

  it('applies the affiliation rule through the character collection hook', async () => {
    const beforeChange = Characters.hooks?.beforeChange?.[1] as unknown as (args: unknown) => Promise<Record<string, unknown>>
    const result = await beforeChange({
      data: { affiliation: 2 },
      originalDoc: { affiliation: 1, inventaireRecompensesFaction: [atelierPermit] },
      req: {},
    })

    expect(result.inventaireRecompensesFaction).toEqual([])
  })

  it('preserves the permit when the affiliation is unchanged', () => {
    const data = { affiliation: { id: 1 } }
    expect(removeAtelierPermitOnAffiliationChange(data, {
      affiliation: 1,
      inventaireRecompensesFaction: [atelierPermit],
    })).toBe(data)
    expect('inventaireRecompensesFaction' in data).toBe(false)
  })
})
