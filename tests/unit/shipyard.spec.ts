import { describe, expect, it } from 'vitest'
import { detachShipTransferItem, groupShipCatalog, listInstalledShipComponents, listShipTransferItems, mergeShipInventory, shipPurchasePrice, shipSalePrice, shipyardFingerprint } from '@/lib/shipyard'

describe('shipyard pricing', () => {
  it('charges the full sale-model price or half for a chassis-only purchase', () => {
    expect(shipPurchasePrice('1000000', false)).toBe(1_000_000)
    expect(shipPurchasePrice('1000000', true)).toBe(500_000)
    expect(shipPurchasePrice('0', true)).toBe(0)
    expect(shipPurchasePrice(null, false)).toBeNull()
  })

  it('resells a hull for one quarter of its sale-model price and selected parts at half-price', () => {
    expect(shipSalePrice('1000000', [200_000, 0])).toBe(350_000)
    expect(shipSalePrice('1000000', [])).toBe(250_000)
    expect(shipSalePrice('1000000', [null])).toBeNull()
    expect(shipSalePrice(null, [])).toBeNull()
  })
})

describe('shipyard purchase catalog grouping', () => {
  it('groups models by the four chassis classes, then category, then ascending price', () => {
    const sections = groupShipCatalog([
      { id: 1, nom: 'Polyvalent cher', prix: '300', classe: 'alpha', categorie: 'polyvalent' },
      { id: 2, nom: 'Polyvalent gratuit', prix: '0', classe: 'alpha', categorie: 'polyvalent' },
      { id: 3, nom: 'Polyvalent sans prix', prix: null, classe: 'alpha', categorie: 'polyvalent' },
      { id: 4, nom: 'Combat', prix: '100', classe: 'alpha', categorie: 'combat' },
      { id: 5, nom: 'Exploration Beta', prix: '50', classe: 'beta', categorie: 'exploration' },
    ])

    expect(sections.map(({ value }) => value)).toEqual(['alpha', 'beta', 'gamma', 'delta'])
    expect(sections[0].categories.map(({ value }) => value)).toEqual(['polyvalent', 'combat'])
    expect(sections[0].categories[0].models.map(({ id }) => id)).toEqual([2, 1, 3])
    expect(sections[1].categories[0].models.map(({ id }) => id)).toEqual([5])
    expect(sections[2].categories).toEqual([])
  })
})

describe('shipyard installed components', () => {
  it('collects installed modules and weapons without treating cargo or onboard consumables as sale items', () => {
    const items = listInstalledShipComponents({
      moduleGenerateur: { id: 1, nom: 'Générateur', prix: '100' },
      modulePropulseurs: 2,
      moduleSurvie: null,
      moduleBoucliers: { id: 3, nom: 'Boucliers', prix: null },
      modulesSupplementaires: [{ id: 4, nom: 'Scanner', prix: '50' }],
      armesPilote: [{ arme: { id: 5, nom: 'Canon', prix: '200' }, munitionsActuelles: 3 }],
      armesTourelles: [{ tourelle: 1, module: { id: 6, nom: 'Tourelle', prix: '70' }, armes: [{ arme: { id: 7, nom: 'Fusil', prix: '80' } }] }],
      inventaireModules: [{ module: { id: 8 }, quantite: 1 }],
      consommablesVaisseau: [{ consommable: { id: 9 }, quantite: 2 }],
    })

    expect(items.map(({ key, itemId }) => [key, itemId])).toEqual([
      ['moduleGenerateur', 1],
      ['modulePropulseurs', 2],
      ['moduleBoucliers', 3],
      ['modulesSupplementaires:0', 4],
      ['armesPilote:0', 5],
      ['armesTourelles:0:module', 6],
      ['armesTourelles:0:armes:0', 7],
    ])
    expect(items[2].prix).toBeNull()
  })

  it('makes component selection part of the idempotency identity independent of order', () => {
    const request = { action: 'sell' as const, shipId: 12, destinationShipId: 5, componentKeys: ['moduleBoucliers', 'armesPilote:0'] }
    expect(shipyardFingerprint(request)).toBe(shipyardFingerprint({ ...request, componentKeys: [...request.componentKeys].reverse() }))
    expect(shipyardFingerprint(request)).not.toBe(shipyardFingerprint({ ...request, componentKeys: ['moduleBoucliers'] }))
  })

  it('offers cargo and installed equipment as transfer sources and returns loaded rounds with a weapon', () => {
    const ship = {
      inventaireArmes: [{ arme: { id: 8, nom: 'Canon' }, quantite: 2 }],
      armesPilote: [{ arme: { id: 5, nom: 'Fusil' }, chargeurRelie: { id: 9, nom: 'Munitions' }, munitionsActuelles: 6 }],
      inventaireConsommables: [{ consommable: { id: 9, nom: 'Munitions' }, quantite: 4 }],
    }
    const items = listShipTransferItems(ship)
    expect(items.map((item) => item.key)).toEqual(['inventaireArmes:0', 'inventaireConsommables:0', 'armesPilote:0'])
    const weapon = items.find((item) => item.key === 'armesPilote:0')!
    expect(weapon).toMatchObject({ nom: 'Fusil', ammoId: 9, ammoQuantity: 6 })

    const detached = detachShipTransferItem(ship, weapon, 1)
    expect(detached.update.armesPilote).toEqual([])
    expect(detached.moved).toEqual([
      { kind: 'weapon', itemId: 5, quantity: 1 },
      { kind: 'consumable', itemId: 9, quantity: 6 },
    ])
  })

  it('moves a partial hold stack and combines matching rows without merging unrelated items incorrectly', () => {
    const ship = { inventaireModules: [{ module: 4, quantite: 5 }, { module: 8, quantite: 2 }] }
    const items = listShipTransferItems(ship)
    const detached = detachShipTransferItem(ship, items[0], 2)
    expect(detached.update.inventaireModules).toEqual([{ module: 4, quantite: 3 }, { module: 8, quantite: 2 }])
    expect(mergeShipInventory([{ module: 8, quantite: 2 }, { module: 4, quantite: 1 }], 'module', 4, 3)).toEqual([
      { module: 8, quantite: 2 },
      { module: 4, quantite: 4 },
    ])
  })
})
