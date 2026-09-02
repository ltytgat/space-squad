'use server'

import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import config from '@/payload.config'
import { validateShipConfiguration } from '@/lib/shipStats'
import { checkSeatChange, findShipCrew, getShipAccess, type ShipAccess } from '@/lib/shipAccess'
import { applySeatChange, roleForSeat, withSeatChange, seatOf, type SeatKey } from '@/lib/shipCrew'

const idOf = (value: any) => (typeof value === 'object' && value ? value.id : value)

async function context() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) throw new Error('Non autorisé')
  return { payload, user }
}

function revalidateShip(shipId: number | string) {
  revalidatePath('/ship')
  revalidatePath(`/ship/${shipId}`)
  revalidatePath('/ships')
  revalidatePath(`/ships/${shipId}`)
}

/** Charge les droits sur le vaisseau ; lève une erreur si la lecture est refusée. */
async function access(payload: any, user: any, shipId: number, depth = 2) {
  const result = await getShipAccess(payload, user, shipId, { depth })
  if (!result.ship) throw new Error('Vaisseau introuvable')
  if (!result.canRead) throw new Error("Ce vaisseau n'est pas accessible")
  return result as ShipAccess & { ship: any; character: any }
}

/** Droits d'écriture sur la fiche : propriétaire, admin, ou membre posté. */
async function authorizeEdit(payload: any, user: any, shipId: number, depth = 2) {
  const result = await access(payload, user, shipId, depth)
  if (!result.canEdit)
    throw new Error("Vous devez occuper un poste sur ce vaisseau pour le modifier")
  return result
}

/** Retire un personnage de la place qu'il occupe sur un vaisseau donné. */
async function releaseSeat(payload: any, user: any, shipId: number, characterId: number) {
  let ship: any = null
  try {
    ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 2, overrideAccess: true })
  } catch {
    return
  }
  if (!ship) return
  if (seatOf(ship, characterId) === 'passager') return
  const change = applySeatChange(ship, characterId, 'passager')
  await payload.update({
    collection: 'ships',
    id: shipId,
    data: { pilote: change.pilote, copilote: change.copilote, canonniers: change.canonniers },
    user,
    overrideAccess: true,
  })
}

export async function updateShipConfiguration(shipId: number, data: Record<string, unknown>) {
  const { payload, user } = await context()
  const { ship: current } = await authorizeEdit(payload, user, shipId, 3)
  const next = { ...current, ...data }
  validateShipConfiguration(next)
  await payload.update({ collection: 'ships', id: shipId, data, user, overrideAccess: true })
  revalidateShip(shipId)
  return { success: true }
}

export async function updateShipState(shipId: number, data: { blindageActuel?: number }) {
  const { payload, user } = await context()
  await authorizeEdit(payload, user, shipId, 0)
  await payload.update({ collection: 'ships', id: shipId, data, user, overrideAccess: true })
  revalidatePath('/ship')
  revalidatePath(`/ships/${shipId}`)
  return { success: true }
}

/**
 * Affecte un personnage embarqué à une place du vaisseau.
 *
 * Le propriétaire (et l'admin) affecte librement n'importe qui : si la place
 * visée est occupée, les deux personnages échangent leurs places. Un membre
 * simplement posté ne peut déplacer que lui-même, et uniquement vers une place
 * libre — ou revenir chez les passagers, ce qui lui fait perdre l'édition.
 */
export async function assignCrewSeat(shipId: number, characterId: number, seat: string) {
  const { payload, user } = await context()
  const rights = await access(payload, user, shipId)
  const ship = rights.ship

  const member = (await payload
    .findByID({ collection: 'characters', id: characterId, depth: 0, overrideAccess: true })
    .catch(() => null)) as any
  if (!member || String(idOf(member.vaisseau)) !== String(shipId))
    throw new Error('Personnage absent de cet équipage')

  const refusal = checkSeatChange(rights, ship, rights.character, characterId, seat)
  if (refusal) throw new Error(refusal)

  const change = applySeatChange(ship, characterId, seat)
  await payload.update({
    collection: 'ships',
    id: shipId,
    data: { pilote: change.pilote, copilote: change.copilote, canonniers: change.canonniers },
    user,
    overrideAccess: true,
  })

  // Resynchronise le miroir `roleVaisseau` sur tout l'équipage.
  const nextShip = withSeatChange(ship, change)
  const crew = await findShipCrew(payload, shipId)
  for (const crewMember of crew) {
    const role = roleForSeat(seatOf(nextShip, crewMember.id))
    if (crewMember.roleVaisseau !== role)
      await payload.update({
        collection: 'characters',
        id: crewMember.id,
        data: { roleVaisseau: role },
        user,
        overrideAccess: true,
      })
  }

  revalidateShip(shipId)
  return { success: true, seat: seat as SeatKey, roleUpdates: change.roleUpdates }
}

/** Embarque le personnage de l'utilisateur sur un vaisseau de son groupe, en passager. */
export async function joinShip(shipId: number) {
  const { payload, user } = await context()
  const rights = await access(payload, user, shipId, 0)
  if (!rights.character) throw new Error('Aucun personnage associé à votre compte')
  if (rights.isAboard) return { success: true }
  if (!rights.canJoin) throw new Error("Ce vaisseau n'est pas accessible à votre groupe")

  const characterId = Number(idOf(rights.character))
  const previousShipId = idOf(rights.character.vaisseau)
  if (previousShipId && String(previousShipId) !== String(shipId))
    await releaseSeat(payload, user, Number(previousShipId), characterId)

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: { vaisseau: shipId, roleVaisseau: 'passager' },
    user,
    overrideAccess: true,
  })

  if (previousShipId) revalidateShip(previousShipId)
  revalidateShip(shipId)
  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}

/** Débarque un membre d'équipage : réservé au propriétaire et à l'admin. */
export async function disembarkCrewMember(shipId: number, characterId: number) {
  const { payload, user } = await context()
  const rights = await access(payload, user, shipId, 0)
  if (!rights.canManageCrew)
    throw new Error('Seul le propriétaire peut débarquer un membre d’équipage')

  const member = (await payload
    .findByID({ collection: 'characters', id: characterId, depth: 0, overrideAccess: true })
    .catch(() => null)) as any
  if (!member || String(idOf(member.vaisseau)) !== String(shipId))
    throw new Error('Personnage absent de cet équipage')

  await releaseSeat(payload, user, shipId, characterId)
  await payload.update({
    collection: 'characters',
    id: characterId,
    data: { vaisseau: null, roleVaisseau: null },
    user,
    overrideAccess: true,
  })

  revalidateShip(shipId)
  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}

export async function updateShipWeaponState(
  shipId: number,
  slot: 'armesPilote' | 'armesTourelles',
  index: number,
  data: {
    munitionsActuelles?: number
    chauffeActuelle?: number
    chargeurRelie?: number | null
    inventoryConsommables?: any[]
  },
) {
  const { payload, user } = await context()
  await authorizeEdit(payload, user, shipId, 0)
  const ship = (await payload.findByID({
    collection: 'ships',
    id: shipId,
    depth: 0,
    overrideAccess: true,
  })) as any
  const entries = [...(ship?.[slot] ?? [])]
  if (!entries[index]) throw new Error('Arme introuvable')
  const { inventoryConsommables, ...weaponData } = data
  entries[index] = { ...entries[index], ...weaponData }
  const updateData: any = { [slot]: entries }
  if (inventoryConsommables) updateData.inventaireConsommables = inventoryConsommables
  await payload.update({
    collection: 'ships',
    id: shipId,
    data: updateData,
    user,
    overrideAccess: true,
  })
  revalidatePath('/ship')
  revalidatePath(`/ships/${shipId}`)
  return { success: true }
}

export async function updateShipTurretWeaponState(
  shipId: number,
  turretIndex: number,
  weaponIndex: number,
  data: {
    munitionsActuelles?: number
    chauffeActuelle?: number
    chargeurRelie?: number | null
    inventoryConsommables?: any[]
  },
) {
  const { payload, user } = await context()
  await authorizeEdit(payload, user, shipId, 0)
  const ship = (await payload.findByID({
    collection: 'ships',
    id: shipId,
    depth: 0,
    overrideAccess: true,
  })) as any
  const turrets = [...(ship?.armesTourelles ?? [])]
  if (!turrets[turretIndex]?.armes?.[weaponIndex]) throw new Error('Arme de tourelle introuvable')
  turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }
  const { inventoryConsommables, ...weaponData } = data
  turrets[turretIndex].armes[weaponIndex] = {
    ...turrets[turretIndex].armes[weaponIndex],
    ...weaponData,
  }
  const updateData: any = { armesTourelles: turrets }
  if (inventoryConsommables) updateData.inventaireConsommables = inventoryConsommables
  await payload.update({
    collection: 'ships',
    id: shipId,
    data: updateData,
    user,
    overrideAccess: true,
  })
  revalidatePath('/ship')
  revalidatePath(`/ships/${shipId}`)
  return { success: true }
}

export async function logShipAmmoState(shipId: number, weaponName?: string, loadedAmmoName?: string) {
  const { payload, user } = await context()
  await access(payload, user, shipId, 0)
  const ship = (await payload.findByID({
    collection: 'ships',
    id: shipId,
    depth: 2,
    overrideAccess: true,
  })) as any
  console.warn('[ship-ammo] état réserve', {
    shipId,
    weaponName,
    loadedAmmoName,
    inventory: (ship?.inventaireConsommables ?? []).map((item: any) => ({
      name: typeof item.consommable === 'object' ? item.consommable?.nom : item.consommable,
      quantity: item.quantite,
    })),
  })
  return { success: true }
}
