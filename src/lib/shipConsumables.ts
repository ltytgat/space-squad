import { getChassis, getShipLimits } from './shipStats'

export const isShipAmmunition = (item: any) =>
  /cartouche|chargeur|munition|balle|obus|cin[eé]tique|roquette|missile|\bmines?\b/i.test(`${item?.nom ?? ''} ${item?.categorie ?? ''}`)
const name = (item: any) => String(item?.nom ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim()
export const sameConsumable = (left: any, right: any) => Boolean(name(left)) && name(left) === name(right)
export const consumableCapacity = (item: any) => Math.max(1, Math.floor(Number(item?.quantiteEquipable) || 1))
export function canEquipConsumable(ship: any, item: any) {
  const size = ['alpha', 'beta', 'gamma', 'delta'].indexOf(getChassis(ship)?.classe) + 1
  return Boolean(item && !isShipAmmunition(item) &&
    (!item.taille || item.taille === 'toutes' || Number(item.taille) <= size))
}

export type ConsumableOperation = 'equip' | 'use' | 'reload' | 'remove'

/** Calculates both sides of a transfer from the persisted ship, never from client quantities. */
export function changeShipConsumable(ship: any, operation: ConsumableOperation, index: number, consumableId?: number | string) {
  const slots = (ship.consommablesVaisseau ?? []).map((entry: any) => ({ ...entry }))
  const inventory = (ship.inventaireConsommables ?? []).map((entry: any) => ({ ...entry }))
  if (!Number.isInteger(index) || index < 0 || index > slots.length) throw new Error('Emplacement introuvable')
  const entry = slots[index]
  const giveBack = (current: any) => {
    if (current.quantite <= 0) return
    const reserve = inventory.find((row: any) => sameConsumable(row.consommable, current.consommable))
    if (reserve) reserve.quantite += current.quantite
    else inventory.push({ consommable: current.consommable, quantite: current.quantite })
  }
  const load = (item: any, quantity: number) => {
    let needed = Math.max(0, consumableCapacity(item) - quantity)
    let loaded = 0
    for (const row of inventory) {
      if (!sameConsumable(row.consommable, item)) continue
      const units = Math.min(needed, row.quantite)
      row.quantite -= units
      needed -= units
      loaded += units
    }
    if (!loaded) throw new Error('Aucun consommable disponible en soute ou emplacement plein')
    return quantity + loaded
  }
  if (operation === 'equip') {
    const source = inventory.find((row: any) => String(row.consommable?.id) === String(consumableId) && row.quantite > 0)
    if (!source || !canEquipConsumable(ship, source.consommable)) throw new Error('Consommable indisponible ou incompatible')
    if (!entry && slots.length >= getShipLimits(ship).consumableSlots) throw new Error('Tous les emplacements sont occupés')
    if (entry) giveBack(entry)
    slots[index] = { ...(entry?.id ? { id: entry.id } : {}), consommable: source.consommable, quantite: load(source.consommable, 0) }
  } else {
    if (!entry) throw new Error('Emplacement introuvable')
    if (operation === 'use') {
      if (entry.quantite <= 0) throw new Error('Emplacement vide : rechargez le consommable')
      entry.quantite -= 1
    } else if (operation === 'reload') entry.quantite = load(entry.consommable, entry.quantite)
    else if (operation === 'remove') { giveBack(entry); slots.splice(index, 1) }
    else throw new Error('Action inconnue')
  }
  return { consommablesVaisseau: slots, inventaireConsommables: inventory.filter((row: any) => row.quantite > 0) }
}
