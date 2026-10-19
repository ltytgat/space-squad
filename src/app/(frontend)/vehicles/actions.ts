'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { computeShipAccess } from '@/lib/shipAccess'
import { reloadVehicleWeapon as buildVehicleReload, replaceVehicleTurretWeapon } from '@/lib/vehicleOperations'
import { vehicleRelationId } from '@/lib/vehicleAccess'

const validId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0

async function context() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) throw new Error('Connexion requise.')
  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  if (!docs[0]) throw new Error('Aucun personnage associé à ce compte.')
  return { payload, user, character: docs[0] as any }
}

async function withVehicleTransaction<T>(
  vehicleId: number,
  needsShip: boolean,
  operation: (state: { payload: any; user: any; character: any; vehicle: any; ship: any; req: any }) => Promise<T>,
): Promise<T> {
  if (!validId(vehicleId)) throw new Error('Véhicule invalide.')
  const { payload, user, character } = await context()
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) throw new Error('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE`,
    })
    const currentCharacter = await payload.findByID({
      collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req,
    }) as any
    if (vehicleRelationId(currentCharacter.user) !== Number(user.id)) {
      throw new Error('Ce personnage ne vous appartient pas.')
    }
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM vehicles WHERE id = ${vehicleId} FOR UPDATE`,
    })
    const vehicle = await payload.findByID({
      collection: 'vehicles', id: vehicleId, depth: 3, overrideAccess: true, req,
    }).catch(() => null) as any
    if (!vehicle) throw new Error('Véhicule introuvable.')
    if (vehicleRelationId(vehicle.proprietaire) !== Number(currentCharacter.id)) {
      throw new Error('Seul le propriétaire peut modifier ce véhicule.')
    }

    let ship: any = null
    if (needsShip) {
      const shipId = vehicleRelationId(currentCharacter.vaisseau)
      if (!shipId) throw new Error('Aucun vaisseau actif ne peut fournir cet équipement.')
      await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM ships WHERE id = ${shipId} FOR UPDATE`,
      })
      ship = await payload.findByID({
        collection: 'ships', id: shipId, depth: 3, overrideAccess: true, req,
      }).catch(() => null) as any
      if (!ship || !computeShipAccess({ ship, character: currentCharacter }).canEdit) {
        throw new Error('Vous devez avoir les droits d’écriture sur votre vaisseau actif.')
      }
    }

    const result = await operation({ payload, user, character: currentCharacter, vehicle, ship, req })
    await payload.db.commitTransaction?.(transactionID)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'La modification du véhicule a échoué.')
  }
}

function revalidateVehicle(vehicleId: number, shipId?: number | null) {
  revalidatePath('/vehicles')
  revalidatePath(`/vehicles/${vehicleId}`)
  if (shipId) {
    revalidatePath('/ship')
    revalidatePath(`/ship/${shipId}`)
    revalidatePath(`/ships/${shipId}`)
  }
}

export async function updateVehicleArmor(vehicleId: number, value: number) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('La valeur de blindage doit être un entier positif ou nul.')
  }
  await withVehicleTransaction(vehicleId, false, async ({ payload, user, vehicle, req }) => {
    const model = vehicle.modele && typeof vehicle.modele === 'object' ? vehicle.modele : null
    const maxArmor = Number(model?.blindageMax)
    if (!Number.isFinite(maxArmor) || value > maxArmor) {
      throw new Error('Le blindage actuel ne peut pas dépasser le maximum du modèle.')
    }
    await payload.update({
      collection: 'vehicles', id: vehicleId, data: { blindageActuel: value },
      overrideAccess: true, user, req,
    })
  })
  revalidateVehicle(vehicleId)
  return { success: true }
}

export async function equipVehicleWeapon(vehicleId: number, weaponId: number | null) {
  if (weaponId !== null && !validId(weaponId)) throw new Error('Arme invalide.')
  let activeShipId: number | null = null
  await withVehicleTransaction(vehicleId, true, async ({ payload, user, vehicle, ship, req }) => {
    activeShipId = Number(ship.id)
    const weapon = weaponId === null
      ? null
      : await payload.findByID({ collection: 'ship-weapons', id: weaponId, depth: 0, overrideAccess: true, req }).catch(() => null)
    if (weaponId !== null && !weapon) throw new Error('Arme de vaisseau introuvable.')
    const next = replaceVehicleTurretWeapon(vehicle, ship, weapon)
    if (!next.vehicleData) return
    await payload.update({
      collection: 'ships', id: ship.id, data: next.shipData,
      overrideAccess: true, user, req,
    })
    await payload.update({
      collection: 'vehicles', id: vehicleId, data: next.vehicleData,
      overrideAccess: true, user, req,
    })
  })
  revalidateVehicle(vehicleId, activeShipId)
  return { success: true }
}

export async function reloadVehicleWeapon(vehicleId: number, ammoId: number) {
  if (!validId(ammoId)) throw new Error('Munition invalide.')
  let activeShipId: number | null = null
  await withVehicleTransaction(vehicleId, true, async ({ payload, user, vehicle, ship, req }) => {
    activeShipId = Number(ship.id)
    const ammo = await payload.findByID({
      collection: 'ship-consumables', id: ammoId, depth: 0, overrideAccess: true, req,
    }).catch(() => null) as any
    if (!ammo) throw new Error('Munition introuvable.')
    const stocked = (ship.inventaireConsommables ?? []).some((row: any) =>
      vehicleRelationId(row.consommable) === ammoId && Number(row.quantite) > 0,
    )
    if (!stocked) throw new Error('Cette munition n’est pas disponible dans la soute du vaisseau actif.')
    const next = buildVehicleReload(vehicle, ship, ammo)
    await payload.update({
      collection: 'ships', id: ship.id, data: next.shipData,
      overrideAccess: true, user, req,
    })
    await payload.update({
      collection: 'vehicles', id: vehicleId, data: next.vehicleData,
      overrideAccess: true, user, req,
    })
  })
  revalidateVehicle(vehicleId, activeShipId)
  return { success: true }
}
