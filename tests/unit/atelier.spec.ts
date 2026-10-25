import { describe, expect, it } from 'vitest'
import { applyAtelierEffects, atelierCost, atelierModificationMatches, reconcileCustomEquipmentInventory, snapshotWeapon } from '@/lib/atelier'

describe('Atelier compatibility', () => {
  it('requires an exact weapon subcategory and thermal or kinetic type', () => {
    const modification = {
      compatibilites: [{ categorieEquipement: 'arme' as const, sousCategorie: 'fusil-assaut', typeArme: 'thermique' }],
    }
    expect(atelierModificationMatches(modification, { kind: 'arme', categorie: 'fusil-assaut', type: ['thermique'] })).toBe(true)
    expect(atelierModificationMatches(modification, { kind: 'arme', categorie: 'fusil-assaut', type: ['cinetique'] })).toBe(false)
    expect(atelierModificationMatches({ compatibilites: [{ ...modification.compatibilites[0], typeArme: null }] }, { kind: 'arme', categorie: 'fusil-assaut', type: ['thermique'] })).toBe(false)
  })

  it('matches armor slots and ship classes independently', () => {
    expect(atelierModificationMatches({ compatibilites: [{ categorieEquipement: 'armure', sousCategorie: 'torse' }] }, { kind: 'armure', categorie: 'torse' })).toBe(true)
    expect(atelierModificationMatches({ compatibilites: [{ categorieEquipement: 'vaisseau', classeVaisseau: 'beta' }] }, { kind: 'vaisseau', classe: 'beta' })).toBe(true)
    expect(atelierModificationMatches({ active: false, compatibilites: [{ categorieEquipement: 'armure', sousCategorie: 'torse' }] }, { kind: 'armure', categorie: 'torse' })).toBe(false)
  })
})

describe('Atelier frozen effects and prices', () => {
  it('applies configured effects to a frozen property copy', () => {
    const source = { nom: 'Fusil', valeurDegats: '2d6', poids: 4 }
    const custom = applyAtelierEffects(source, [
      { cible: 'valeurDegats', operation: 'dice-bonus', valeur: '2' },
      { cible: 'poids', operation: 'percent', valeur: '-25' },
    ], 'arme')
    expect(custom).toMatchObject({ nom: 'Fusil', valeurDegats: '2d6+2', poids: 3 })
    expect(source).toEqual({ nom: 'Fusil', valeurDegats: '2d6', poids: 4 })
  })

  it('prevents chassis reductions and invalid effect targets', () => {
    expect(() => applyAtelierEffects({ blindage: 10 }, [{ cible: 'blindage', operation: 'add', valeur: '-1' }], 'vaisseau')).toThrow()
    expect(() => applyAtelierEffects({ nom: 'Fusil' }, [{ cible: 'id', operation: 'replace', valeur: '4' }], 'arme')).toThrow()
  })

  it('adds fixed recipe prices to the source price and strips live item metadata from snapshots', () => {
    expect(atelierCost('1000', [250, 50])).toBe(1300)
    expect(snapshotWeapon({ id: 7, createdAt: 'now', nom: 'Custom', mods: [1], image: { id: 9, url: '/image.png' } })).toEqual({ nom: 'Custom', image: 9 })
  })
})

describe('Atelier equipped-item inventory', () => {
  it('moves newly equipped items out of reserve and unequipped items back without duplicates', () => {
    expect(reconcileCustomEquipmentInventory([1, { id: 2 }, 2], [3], [1])).toEqual([2, 3])
    expect(reconcileCustomEquipmentInventory([], [3], [])).toEqual([3])
    expect(reconcileCustomEquipmentInventory([3], [3], [3])).toEqual([])
  })
})
