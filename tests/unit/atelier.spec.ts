import { describe, expect, it } from 'vitest'
import { applyAtelierEffects, atelierCost, atelierModificationMatches, atelierNextPurchasePrice, atelierPurchasePrice, findAtelierCompatibility, hasDuplicateAtelierCompatibilities, reconcileCustomEquipmentInventory, snapshotWeapon } from '@/lib/atelier'
import { weaponRangeRows } from '@/lib/weaponRanges'
import { weaponAllowedInSlot, weaponFromGroup } from '@/lib/characterWeapons'

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

  it('resolves the exact compatibility row so each equipment match can have its own price', () => {
    const modification = {
      compatibilites: [
        { categorieEquipement: 'arme' as const, sousCategorie: 'fusil-assaut', typeArme: 'thermique', prix: 120, points: 3, maximum: 2, multiplicateurRachat: 3 },
        { categorieEquipement: 'arme' as const, sousCategorie: 'fusil-assaut', typeArme: 'cinetique', prix: 250, points: 5, maximum: 1, multiplicateurRachat: 4 },
      ],
    }
    expect(findAtelierCompatibility(modification, { kind: 'arme', categorie: 'fusil-assaut', type: ['cinetique'] })).toMatchObject({ prix: 250, points: 5, maximum: 1, multiplicateurRachat: 4 })
    expect(atelierCost(1000, [findAtelierCompatibility(modification, { kind: 'arme', categorie: 'fusil-assaut', type: ['thermique'] })?.prix])).toBe(1120)
  })

  it('matches the canon weapon subcategory', () => {
    expect(atelierModificationMatches({
      compatibilites: [{ categorieEquipement: 'arme', sousCategorie: 'canon', typeArme: 'thermique' }],
    }, { kind: 'arme', categorie: 'canon', type: ['thermique'] })).toBe(true)
  })

  it('rejects duplicate compatibility keys but allows separate weapon variants', () => {
    expect(hasDuplicateAtelierCompatibilities([
      { categorieEquipement: 'arme', sousCategorie: 'fusil-assaut', typeArme: 'thermique' },
      { categorieEquipement: 'arme', sousCategorie: 'fusil-assaut', typeArme: 'cinetique' },
    ])).toBe(false)
    expect(hasDuplicateAtelierCompatibilities([
      { categorieEquipement: 'vaisseau', classeVaisseau: 'beta' },
      { categorieEquipement: 'vaisseau', classeVaisseau: 'beta' },
    ])).toBe(true)
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

  it('preserves sniper star notation while applying dice changes', () => {
    expect(applyAtelierEffects({ valeurDegats: '2d8*' }, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '1' },
    ], 'arme').valeurDegats).toBe('3d8*')
    expect(applyAtelierEffects({ valeurDegats: '2d8+3*' }, [
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
    ], 'arme').valeurDegats).toBe('2d10+3*')
  })

  it('adds weapon heat segment bonuses to the default 100 percent segment', () => {
    expect(applyAtelierEffects({} as Record<string, number>, [
      { cible: 'weaponHeatSegment', operation: 'add', valeur: '50' },
    ], 'arme').weaponHeatSegment).toBe(150)
    expect(applyAtelierEffects({ weaponHeatSegment: 150 }, [
      { cible: 'weaponHeatSegment', operation: 'add', valeur: '25' },
    ], 'arme').weaponHeatSegment).toBe(175)
    expect(() => applyAtelierEffects({}, [
      { cible: 'weaponHeatSegment', operation: 'add', valeur: '-100' },
    ], 'arme')).toThrow()
  })

  it('applies repeated modification effects in sequence', () => {
    const custom = applyAtelierEffects({ valeurDegats: '1d4+2' }, [
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '1' },
      { cible: 'valeurDegats', operation: 'dice-count-add', valeur: '1' },
      { cible: 'valeurDegats', operation: 'dice-size-step', valeur: '1' },
    ], 'arme')
    expect(custom.valeurDegats).toBe('3d6+2')
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

describe('Character weapon slot normalization', () => {
  it('does not turn empty weapon groups into equipable weapons', () => {
    expect(weaponFromGroup({ item: null, customItem: null, mods: [] })).toBeNull()
    expect(weaponFromGroup({ item: 42, mods: [] })).toBeNull()
    expect(weaponFromGroup({})).toBeNull()
    expect(weaponFromGroup({ item: { id: 42, nom: 'Fusil', categorie: 'fusil-assaut' } })).toMatchObject({ nom: 'Fusil' })
  })

  it('keeps weapons in slots matching their categories', () => {
    expect(weaponAllowedInSlot('fusil-assaut', 'armePrincipale')).toBe(true)
    expect(weaponAllowedInSlot('fusil-assaut', 'armeLourde')).toBe(false)
    expect(weaponAllowedInSlot('lourde', 'armeLourde')).toBe(true)
    expect(weaponAllowedInSlot('melee', 'armeDeMelee')).toBe(true)
    expect(weaponAllowedInSlot(undefined, 'armePrincipale')).toBe(false)
  })
})

describe('Atelier weapon range previews and repurchase prices', () => {
  it('shows the next repeated purchase price using the configured multiplier', () => {
    const compatibility = { prix: 100, maximum: 4, multiplicateurRachat: 2 }
    expect(atelierNextPurchasePrice(compatibility, 0)).toBe(100)
    expect(atelierNextPurchasePrice(compatibility, 1)).toBe(200)
    expect(atelierNextPurchasePrice(compatibility, 2)).toBe(400)
    expect(atelierPurchasePrice(compatibility, 3)).toBe(700)
  })

  it('prevents weapon ranges and sniper stages from falling below one metre', () => {
    expect(() => applyAtelierEffects({ courtePortee: 2 }, [
      { cible: 'courtePortee', operation: 'add', valeur: '-2' },
    ], 'arme')).toThrow('ne peut pas être inférieure à 1 mètre')
    expect(() => applyAtelierEffects({ paliersSniper: [{ distanceMax: 4, modificateur: -2 }] }, [
      { cible: 'paliersSniper', operation: 'add', valeur: '-4' },
    ], 'arme')).toThrow('ne peut pas être inférieure à 1 mètre')
  })

  it('lists sniper stages with their corresponding modifiers', () => {
    expect(weaponRangeRows({
      categorie: 'sniper', courtePortee: 30, modCourtePortee: -1,
      paliersSniper: [{ distanceMax: 50, modificateur: -2 }, { distanceMax: 100, modificateur: -4 }],
    }, { shortRangeBonus: 1 })).toEqual([
      { label: '< 30m', mod: '+0' },
      { label: '< 50m', mod: '-1' },
      { label: '< 100m', mod: '-3' },
    ])
  })
})
