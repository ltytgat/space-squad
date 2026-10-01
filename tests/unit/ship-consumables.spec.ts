import { describe, expect, it } from 'vitest'
import { canEquipConsumable, changeShipConsumable } from '@/lib/shipConsumables'

const item = { id: 1, nom: 'Leurres', quantiteEquipable: 3, taille: 'toutes' }
const other = { id: 2, nom: 'Réparations', quantiteEquipable: 2 }
const ship = (inventory: any[] = [{ consommable: item, quantite: 5 }], slots: any[] = []) => ({
  modele: { chassis: { classe: 'alpha', consommables: 1 } },
  inventaireConsommables: inventory, consommablesVaisseau: slots,
})

describe('ship consumable transfers', () => {
  it('equips up to capacity and preserves the surplus without mutating the ship', () => {
    const current = ship()
    const result = changeShipConsumable(current, 'equip', 0, 1)
    expect(result.consommablesVaisseau[0].quantite).toBe(3)
    expect(result.inventaireConsommables[0].quantite).toBe(2)
    expect(current.inventaireConsommables[0].quantite).toBe(5)
    expect(() => changeShipConsumable({ ...current, ...result }, 'equip', 1, 1)).toThrow('occupés')
  })
  it('uses the last unit and keeps the slot for a subsequent reload', () => {
    const used = changeShipConsumable(ship([], [{ consommable: item, quantite: 1 }]), 'use', 0)
    expect(used.consommablesVaisseau[0].quantite).toBe(0)
    expect(() => changeShipConsumable({ ...ship(), ...used }, 'use', 0)).toThrow('vide')
  })
  it('reloads from all matching names even with different IDs and only takes available units', () => {
    const current = ship([
      { consommable: { ...item, id: 8, nom: ' Leurres ' }, quantite: 1 },
      { consommable: item, quantite: 1 },
      { consommable: other, quantite: 4 },
    ], [{ consommable: item, quantite: 0 }])
    const result = changeShipConsumable(current, 'reload', 0)
    expect(result.consommablesVaisseau[0].quantite).toBe(2)
    expect(result.inventaireConsommables).toEqual([{ consommable: other, quantite: 4 }])
  })
  it('returns remaining units when replacing or removing a stack', () => {
    const current = ship([{ consommable: other, quantite: 4 }], [{ consommable: item, quantite: 2 }])
    const replaced = changeShipConsumable(current, 'equip', 0, 2)
    expect(replaced.inventaireConsommables).toEqual([
      { consommable: other, quantite: 2 }, { consommable: item, quantite: 2 },
    ])
    const removed = changeShipConsumable({ ...current, ...replaced }, 'remove', 0)
    expect(removed.consommablesVaisseau).toEqual([])
    expect(removed.inventaireConsommables[0].quantite).toBe(4)
  })
  it('rejects ammunition, incompatible sizes, missing stock and full slots', () => {
    for (const nom of ['Munitions', 'Cartouche thermique', 'Missile', 'Mine'])
      expect(canEquipConsumable(ship(), { nom })).toBe(false)
    expect(canEquipConsumable(ship(), { ...item, taille: '2' })).toBe(false)
    expect(() => changeShipConsumable(ship(), 'equip', 0, 42)).toThrow('indisponible')
    expect(() => changeShipConsumable(ship([], [{ consommable: item, quantite: 0 }]), 'reload', 0)).toThrow('Aucun')
    expect(() => changeShipConsumable(ship(undefined, [{ consommable: item, quantite: 3 }]), 'reload', 0)).toThrow('plein')
  })
})
