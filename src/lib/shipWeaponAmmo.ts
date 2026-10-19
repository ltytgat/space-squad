import { isShipAmmunition } from './shipConsumables'

export const shipAmmoName = (item: any) =>
  String(item?.nom ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim()

export const sameShipAmmo = (left: any, right: any) =>
  Boolean(shipAmmoName(left)) && shipAmmoName(left) === shipAmmoName(right)

const isKineticAmmunition = (item: any) =>
  isShipAmmunition(item) && !/cartouche/i.test(`${item?.nom ?? ''} ${item?.typeMunition ?? ''}`)

const isExplosiveAmmoFor = (weapon: any, ammo: any) => {
  const weaponCategory = String(weapon?.categorie ?? '').toLowerCase()
  const weaponName = String(weapon?.nom ?? '').toLowerCase()
  const ammoName = String(ammo?.nom ?? '').toLowerCase()
  if (weaponCategory === 'mine' || weaponName.includes('mine')) return /mine/.test(ammoName)
  if (weaponCategory === 'lance-missile' || weaponName.includes('missile')) return /roquette|missile/.test(ammoName)
  return false
}

export function isAmmoCompatibleWith(weapon: any, ammo: any) {
  if (weapon?.type === 'thermique') return /cartouche/i.test(`${ammo?.typeMunition ?? ''} ${ammo?.nom ?? ''}`)
  if (weapon?.type === 'explosif') return isExplosiveAmmoFor(weapon, ammo)
  return isKineticAmmunition(ammo)
}
