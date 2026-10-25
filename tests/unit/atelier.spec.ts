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
  it('adds the configured number of damage dice and preserves flat bonuses', () => {
    expect(applyAtelierEffects({ valeurDegats: '2d6+1' }, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '2' },
    ], 'arme').valeurDegats).toBe('4d6+1')
  })

  it('increases damage die size by one progression step and preserves signed flat bonuses', () => {
    const custom = applyAtelierEffects({ valeurDegats: '3d6 - 2' }, [
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
    ], 'arme')
    expect(custom.valeurDegats).toBe('3d10-2')
  })

  it('follows each configured die size in order', () => {
    let damage = '1d2+5'
    for (const size of [3, 4, 6, 8, 10, 12, 15, 18, 20]) {
      damage = applyAtelierEffects({ valeurDegats: damage }, [
        { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
      ], 'arme').valeurDegats
      expect(damage).toBe(`1d${size}+5`)
    }
  })

  it('applies configured effects to a frozen property copy', () => {
    const source = { nom: 'Fusil', valeurDegats: '2d6', poids: 4 }
    const custom = applyAtelierEffects(source, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '2' },
      { cible: 'poids', operation: 'add', valeur: '-1' },
    ], 'arme')
    expect(custom).toMatchObject({ nom: 'Fusil', valeurDegats: '4d6', poids: 3 })
    expect(source).toEqual({ nom: 'Fusil', valeurDegats: '2d6', poids: 4 })
  })

  it('prevents chassis reductions and invalid effect targets', () => {
    expect(() => applyAtelierEffects({ blindage: 10 }, [{ cible: 'blindage', operation: 'add', valeur: '-1' }], 'vaisseau')).toThrow()
    expect(() => applyAtelierEffects({ nom: 'Fusil' }, [{ cible: 'id', operation: 'add', valeur: '4' }], 'arme')).toThrow()
  })

  it('blocks damage die sizes outside the progression and increases above d20', () => {
    expect(() => applyAtelierEffects({ valeurDegats: '2d5' }, [
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
    ], 'arme')).toThrow()
    expect(() => applyAtelierEffects({ valeurDegats: '2d6+' }, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '1' },
    ], 'arme')).toThrow()
    expect(() => applyAtelierEffects({ valeurDegats: '2d20+3' }, [
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
    ], 'arme')).toThrow(/d20/)
  })

  it('requires a positive integer for added dice and exactly one step for die size', () => {
    expect(() => applyAtelierEffects({ valeurDegats: '2d6' }, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '1.5' },
    ], 'arme')).toThrow()
    expect(() => applyAtelierEffects({ valeurDegats: '2d6' }, [
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '2' },
    ], 'arme')).toThrow()
  })

  it('rejects the removed operations at runtime', () => {
    for (const operation of ['percent', 'replace']) {
      expect(() => applyAtelierEffects({ poids: 4 }, [
        { cible: 'poids', operation: operation as never, valeur: '10' },
      ], 'arme')).toThrow('Opération Atelier inconnue.')
    }
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
