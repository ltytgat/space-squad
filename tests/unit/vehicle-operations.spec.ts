import { describe, expect, it } from 'vitest'
import { fireVehicleWeapon, reloadVehicleWeapon, replaceVehicleTurretWeapon } from '@/lib/vehicleOperations'
import { isAmmoCompatibleWith } from '@/lib/shipWeaponAmmo'

describe('vehicle turret equipment', () => {
  it('takes a compatible weapon from ship stock and returns the old weapon and loaded rounds', () => {
    const result = replaceVehicleTurretWeapon(
      {
        modele: { tourelleClasseMax: 'beta' },
        armeTourelle: { id: 1 },
        chargeurRelie: { id: 7 },
        munitionsActuelles: 4,
      },
      {
        inventaireArmes: [{ arme: { id: 2 }, quantite: 1 }],
        inventaireConsommables: [{ consommable: { id: 7 }, quantite: 2 }],
      },
      { id: 2, taille: '2' },
    )

    expect(result.vehicleData).toEqual({ armeTourelle: 2, chargeurRelie: null, munitionsActuelles: 0 })
    expect(result.shipData?.inventaireArmes).toEqual([{ arme: 1, quantite: 1 }])
    expect(result.shipData?.inventaireConsommables).toEqual([{ consommable: 7, quantite: 6 }])
  })

  it('rejects weapons larger than the vehicle turret class', () => {
    expect(() => replaceVehicleTurretWeapon(
      { modele: { tourelleClasseMax: 'alpha' } },
      { inventaireArmes: [{ arme: { id: 2 }, quantite: 1 }], inventaireConsommables: [] },
      { id: 2, taille: '2' },
    )).toThrow('ne peut pas accueillir cette arme')
  })

  it('returns loaded ammunition when removing a turret weapon', () => {
    const result = replaceVehicleTurretWeapon(
      {
        modele: { tourelleClasseMax: 'alpha' },
        armeTourelle: { id: 3 },
        chargeurRelie: { id: 8 },
        munitionsActuelles: 2,
      },
      { inventaireArmes: [], inventaireConsommables: [] },
      null,
    )
    expect(result.vehicleData).toEqual({ armeTourelle: null, chargeurRelie: null, munitionsActuelles: 0 })
    expect(result.shipData?.inventaireArmes).toEqual([{ arme: 3, quantite: 1 }])
    expect(result.shipData?.inventaireConsommables).toEqual([{ consommable: 8, quantite: 2 }])
  })
})

describe('vehicle turret reload', () => {
  const weapon = { id: 3, nom: 'Canon cinétique', type: 'cinetique', categorie: 'cinetique', chargeur: 10 }

  it('tops up from the active ship reserve without exceeding capacity', () => {
    const result = reloadVehicleWeapon(
      { armeTourelle: weapon, chargeurRelie: { id: 8, nom: 'Balles standard', categorie: 'cinetique' }, munitionsActuelles: 8 },
      { inventaireConsommables: [{ consommable: { id: 8, nom: 'Balles standard', categorie: 'cinetique' }, quantite: 5 }] },
      { id: 8, nom: 'Balles standard', categorie: 'cinetique' },
    )
    expect(result.vehicleData).toEqual({ chargeurRelie: 8, munitionsActuelles: 10 })
    expect(result.shipData.inventaireConsommables).toEqual([{ consommable: 8, quantite: 3 }])
  })

  it('returns the old magazine count before loading a compatible new ammo type', () => {
    const result = reloadVehicleWeapon(
      { armeTourelle: weapon, chargeurRelie: { id: 8, nom: 'Balles standard', categorie: 'cinetique' }, munitionsActuelles: 4 },
      { inventaireConsommables: [
        { consommable: { id: 8, nom: 'Balles standard', categorie: 'cinetique' }, quantite: 1 },
        { consommable: { id: 9, nom: 'Balles perforantes', categorie: 'cinetique' }, quantite: 3 },
      ] },
      { id: 9, nom: 'Balles perforantes', categorie: 'cinetique' },
    )
    expect(result.vehicleData).toEqual({ chargeurRelie: 9, munitionsActuelles: 3 })
    expect(result.shipData.inventaireConsommables).toEqual([
      { consommable: 8, quantite: 5 },
    ])
  })

  it('rejects ammunition that does not match the equipped weapon', () => {
    expect(() => reloadVehicleWeapon(
      { armeTourelle: weapon, chargeurRelie: null, munitionsActuelles: 0 },
      { inventaireConsommables: [{ consommable: { id: 12, nom: 'Cartouche thermique' }, quantite: 2 }] },
      { id: 12, nom: 'Cartouche thermique' },
    )).toThrow('pas compatible')
  })

  it('uses the ship weapon rules for thermal cartridges and explosive ammunition', () => {
    expect(isAmmoCompatibleWith({ type: 'thermique' }, { nom: 'Cartouche froide' })).toBe(true)
    expect(isAmmoCompatibleWith({ type: 'thermique' }, { nom: 'Balles standard', categorie: 'cinetique' })).toBe(false)
    expect(isAmmoCompatibleWith({ type: 'explosif', categorie: 'lance-missile' }, { nom: 'Roquette légère' })).toBe(true)
    expect(isAmmoCompatibleWith({ type: 'explosif', categorie: 'mine' }, { nom: 'Mine de proximité' })).toBe(true)
    expect(isAmmoCompatibleWith({ type: 'explosif', categorie: 'mine' }, { nom: 'Roquette légère' })).toBe(false)
  })

  it('consumes one thermal cartridge from the ship inventory', () => {
    const result = reloadVehicleWeapon(
      { armeTourelle: { id: 5, type: 'thermique' }, chargeurRelie: null, munitionsActuelles: 0 },
      { inventaireConsommables: [{ consommable: { id: 14, nom: 'Cartouche froide' }, quantite: 2 }] },
      { id: 14, nom: 'Cartouche froide' },
    )
    expect(result.vehicleData).toEqual({ chargeurRelie: 14, munitionsActuelles: 0 })
    expect(result.shipData.inventaireConsommables).toEqual([{ consommable: 14, quantite: 1 }])
  })
})

describe('vehicle turret firing', () => {
  it('consumes the weapon salvo from the loaded magazine', () => {
    expect(fireVehicleWeapon({
      armeTourelle: { type: 'cinetique', ballesParSalve: 3 },
      munitionsActuelles: 8,
    })).toEqual({ munitionsActuelles: 5 })
  })

  it('consumes one explosive charge', () => {
    expect(fireVehicleWeapon({
      armeTourelle: { type: 'explosif' },
      munitionsActuelles: 1,
    })).toEqual({ munitionsActuelles: 0 })
  })

  it('rejects a shot when the remaining ammunition cannot cover a full salvo', () => {
    expect(() => fireVehicleWeapon({
      armeTourelle: { type: 'cinetique', ballesParSalve: 3 },
      munitionsActuelles: 2,
    })).toThrow('Munitions insuffisantes')
  })

  it('does not persist firing for thermal weapons', () => {
    expect(() => fireVehicleWeapon({
      armeTourelle: { type: 'thermique' },
      munitionsActuelles: 0,
    })).toThrow('ne consomme pas de munitions')
  })
})
