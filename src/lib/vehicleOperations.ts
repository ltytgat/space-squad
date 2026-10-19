import { mergeShipInventory } from './shipyard'
import { isAmmoCompatibleWith, sameShipAmmo } from './shipWeaponAmmo'
import { vehicleRelationId } from './vehicleAccess'

const idOf = vehicleRelationId

export function vehicleWeaponFitsModel(weapon: any, model: any) {
  const maxSizeByClass: Record<string, number> = { alpha: 1, beta: 2, gamma: 3 }
  const maxSize = maxSizeByClass[String(model?.tourelleClasseMax ?? '')]
  return Boolean(maxSize && weapon && Number(weapon.taille) <= maxSize)
}

export function takeShipWeapon(inventory: any[], weaponId: number) {
  let taken = false
  const next = (inventory ?? []).map((row: any) => {
    if (taken || idOf(row.arme) !== weaponId) return { ...row, arme: idOf(row.arme) }
    const quantity = Number(row.quantite)
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { ...row, arme: idOf(row.arme) }
    taken = true
    return { ...row, arme: weaponId, quantite: quantity - 1 }
  }).filter((row: any) => Number(row.quantite) > 0)
  if (!taken) throw new Error('Cette arme n’est plus disponible dans la soute du vaisseau actif.')
  return next
}

export function replaceVehicleTurretWeapon(vehicle: any, ship: any, newWeapon: any | null) {
  const model = vehicle.modele && typeof vehicle.modele === 'object' ? vehicle.modele : null
  if (!model?.tourelleClasseMax) throw new Error('Ce modèle de véhicule ne dispose pas de tourelle.')

  const currentId = idOf(vehicle.armeTourelle)
  const newWeaponId = newWeapon ? idOf(newWeapon) : null
  if (currentId === newWeaponId) return { vehicleData: null, shipData: null }

  let nextWeapons = (ship.inventaireArmes ?? [])
    .map((row: any) => ({ ...row, arme: idOf(row.arme) }))
    .filter((row: any) => Number(row.quantite) > 0)
  let nextConsumables = (ship.inventaireConsommables ?? [])
    .map((row: any) => ({ ...row, consommable: idOf(row.consommable) }))
    .filter((row: any) => Number(row.quantite) > 0)
  if (newWeaponId !== null) {
    if (!vehicleWeaponFitsModel(newWeapon, model)) {
      throw new Error(`La tourelle de classe ${model.tourelleClasseMax} ne peut pas accueillir cette arme de vaisseau.`)
    }
    nextWeapons = takeShipWeapon(nextWeapons, newWeaponId)
  }

  if (currentId) {
    nextWeapons = mergeShipInventory(nextWeapons, 'arme', currentId, 1)
    const ammoId = idOf(vehicle.chargeurRelie)
    const ammoCount = Number(vehicle.munitionsActuelles ?? 0)
    if (!Number.isSafeInteger(ammoCount) || ammoCount < 0) throw new Error('Le nombre de munitions du véhicule est incohérent.')
    if (ammoId && ammoCount > 0) {
      nextConsumables = mergeShipInventory(nextConsumables, 'consommable', ammoId, ammoCount)
    }
  }

  return {
    vehicleData: { armeTourelle: newWeaponId, chargeurRelie: null, munitionsActuelles: 0 },
    shipData: {
      inventaireArmes: nextWeapons,
      inventaireConsommables: nextConsumables,
    },
  }
}

export function reloadVehicleWeapon(vehicle: any, ship: any, requestedAmmo: any) {
  const weapon = vehicle.armeTourelle && typeof vehicle.armeTourelle === 'object' ? vehicle.armeTourelle : null
  if (!weapon) throw new Error('Aucune arme n’est équipée sur la tourelle.')
  if (!requestedAmmo || !isAmmoCompatibleWith(weapon, requestedAmmo)) {
    throw new Error('Cette munition n’est pas compatible avec l’arme équipée.')
  }

  const inventory = (ship.inventaireConsommables ?? []).map((row: any) => ({
    ...row,
    consommable: row.consommable && typeof row.consommable === 'object' ? row.consommable : null,
  }))
  const matchingRows = inventory.filter((row: any) =>
    row.consommable && sameShipAmmo(row.consommable, requestedAmmo),
  )
  const available = matchingRows.reduce((sum: number, row: any) => {
    const quantity = Number(row.quantite)
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Une quantité de munitions en soute est incohérente.')
    return sum + quantity
  }, 0)
  const oldAmmo = vehicle.chargeurRelie && typeof vehicle.chargeurRelie === 'object' ? vehicle.chargeurRelie : null
  const oldCount = Number(vehicle.munitionsActuelles ?? 0)
  if (!Number.isSafeInteger(oldCount) || oldCount < 0) throw new Error('Le nombre de munitions du véhicule est incohérent.')
  const changingType = Boolean(oldAmmo && !sameShipAmmo(oldAmmo, requestedAmmo))
  const thermal = weapon.type === 'thermique'
  const capacity = weapon.type === 'explosif' ? 1 : Math.max(0, Number(weapon.chargeur) || 0)
  const baseCount = changingType ? 0 : oldCount
  const needed = thermal ? 1 : Math.max(0, capacity - baseCount)
  const loadUnits = thermal ? (available > 0 ? 1 : 0) : Math.min(needed, available)
  if (!loadUnits) throw new Error(available ? 'Le chargeur est déjà plein.' : 'Aucune munition compatible disponible dans la soute du vaisseau actif.')

  let remaining = loadUnits
  let returned = changingType ? oldCount : 0
  const nextInventory = inventory.map((row: any) => {
    let quantity = Number(row.quantite)
    if (row.consommable && sameShipAmmo(row.consommable, requestedAmmo) && remaining > 0) {
      const consumed = Math.min(quantity, remaining)
      quantity -= consumed
      remaining -= consumed
    }
    if (oldAmmo && row.consommable && sameShipAmmo(row.consommable, oldAmmo) && returned > 0) {
      quantity += returned
      returned = 0
    }
    return { consommable: idOf(row.consommable), quantite: quantity }
  })
  if (returned > 0 && oldAmmo) nextInventory.push({ consommable: idOf(oldAmmo), quantite: returned })

  return {
    vehicleData: {
      chargeurRelie: idOf(requestedAmmo),
      munitionsActuelles: thermal ? 0 : baseCount + loadUnits,
    },
    shipData: {
      inventaireConsommables: nextInventory.filter((row: any) => row.quantite > 0),
    },
  }
}
