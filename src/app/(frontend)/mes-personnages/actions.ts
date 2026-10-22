'use server'

import { headers } from 'next/headers.js'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getActiveMode } from '@/lib/activeMode'
import {
  ACTIVE_CHARACTER_COOKIE,
  clearActiveCharacterCookie,
  getOwnedCharacters,
  setActiveCharacterCookie,
} from '@/lib/activeCharacter'
import { relationId } from '@/lib/shop'

const MAX_CHARACTERS_PER_USER = 5

async function getSession() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) throw new Error('Connexion requise.')
  return { payload, user }
}

function revalidateCharacterViews() {
  revalidatePath('/', 'layout')
  revalidatePath('/mes-personnages')
  revalidatePath('/character')
  revalidatePath('/shop')
  revalidatePath('/vehicles')
  revalidatePath('/ship')
  revalidatePath('/escouade')
}

export async function createOwnedCharacter() {
  const { payload, user } = await getSession()
  if (user.role === 'player' && await getActiveMode(user) === 'mj') {
    return { success: false, error: 'Passez en mode joueur pour créer un personnage.' }
  }

  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) return { success: false, error: 'Les transactions PostgreSQL sont indisponibles.' }
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`,
    })

    const characters = await getOwnedCharacters(payload, user, { req })
    if (characters.length >= MAX_CHARACTERS_PER_USER) {
      throw new Error('Vous avez atteint la limite de cinq personnages.')
    }

    const character = await payload.create({
      collection: 'characters',
      data: { user: user.id, creationEtape: 'caracteristiques' },
      overrideAccess: true,
      user,
      req,
    })
    await payload.db.commitTransaction?.(transactionID)
    await setActiveCharacterCookie(character.id)
    revalidateCharacterViews()
    return { success: true, characterId: Number(character.id) }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    return { success: false, error: error instanceof Error ? error.message : 'La création du personnage a échoué.' }
  }
}

export async function selectOwnedCharacter(characterId: number) {
  const { payload, user } = await getSession()
  if (!Number.isSafeInteger(characterId) || characterId <= 0) {
    return { success: false as const, error: 'Personnage invalide.' }
  }

  const characters = await getOwnedCharacters(payload, user)
  const character = characters.find((entry) => Number(entry.id) === characterId)
  if (!character) return { success: false as const, error: 'Ce personnage ne vous appartient pas.' }

  await setActiveCharacterCookie(character.id)
  revalidateCharacterViews()
  const activeMode = await getActiveMode(user)
  const href = activeMode === 'mj'
    ? '/mes-personnages'
    : character.creationEtape === 'termine' ? `/characters/${character.id}` : '/character'
  return { success: true as const, href }
}

export async function deleteOwnedCharacter(characterId: number) {
  const { payload, user } = await getSession()
  if (!Number.isSafeInteger(characterId) || characterId <= 0) return { success: false, error: 'Personnage invalide.' }

  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) return { success: false, error: 'Les transactions PostgreSQL sont indisponibles.' }
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM characters WHERE id = ${characterId} FOR UPDATE`,
    })

    const character = await payload.findByID({
      collection: 'characters', id: characterId, depth: 0, overrideAccess: true, req,
    }).catch(() => null) as any
    if (!character || relationId(character.user) !== String(user.id) || character.workspace) {
      throw new Error('Ce personnage ne vous appartient pas.')
    }

    const [ownedShipsResult, ownedVehiclesResult] = await Promise.all([
      payload.find({
        collection: 'ships', where: { proprietaire: { equals: characterId } },
        depth: 0, pagination: false, overrideAccess: true, req,
      }),
      payload.find({
        collection: 'vehicles', where: { proprietaire: { equals: characterId } },
        depth: 0, pagination: false, overrideAccess: true, req,
      }),
    ])
    const ownedShips = ownedShipsResult.docs as any[]
    const ownedVehicles = ownedVehiclesResult.docs as any[]
    const ownedShipIds = ownedShips.map((ship) => Number(ship.id)).sort((a, b) => a - b)

    if (ownedShipIds.length) {
      await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM ships WHERE id IN (${sql.join(ownedShipIds.map((id) => sql`${id}`), sql`, `)}) ORDER BY id FOR UPDATE`,
      })
    }
    const ownedVehicleIds = ownedVehicles.map((vehicle) => Number(vehicle.id)).sort((a, b) => a - b)
    if (ownedVehicleIds.length) {
      await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM vehicles WHERE id IN (${sql.join(ownedVehicleIds.map((id) => sql`${id}`), sql`, `)}) ORDER BY id FOR UPDATE`,
      })
    }

    const activeCookieId = (await cookies()).get(ACTIVE_CHARACTER_COOKIE)?.value
    const crewToDisembark = new Map<number, any>()
    const shipIdsToClear = new Set<number>(ownedShipIds)

    const { docs: characterShips } = await payload.find({
      collection: 'ships',
      where: { or: [
        { pilote: { equals: characterId } },
        { copilote: { equals: characterId } },
        { 'canonniers.personnage': { equals: characterId } },
      ] },
      depth: 0, pagination: false, overrideAccess: true, req,
    })
    for (const ship of characterShips as any[]) shipIdsToClear.add(Number(ship.id))

    for (const shipId of ownedShipIds) {
      const { docs: crew } = await payload.find({
        collection: 'characters', where: { vaisseau: { equals: shipId } },
        depth: 0, pagination: false, overrideAccess: true, req,
      })
      for (const member of crew as any[]) crewToDisembark.set(Number(member.id), member)
    }
    crewToDisembark.set(characterId, character)

    const shipIds = [...shipIdsToClear].sort((a, b) => a - b)
    if (shipIds.length) {
      await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM ships WHERE id IN (${sql.join(shipIds.map((id) => sql`${id}`), sql`, `)}) ORDER BY id FOR UPDATE`,
      })
    }

    for (const member of crewToDisembark.values()) {
      await payload.update({
        collection: 'characters', id: member.id,
        data: { vaisseau: null, roleVaisseau: null },
        overrideAccess: true, user, req,
      })
    }

    for (const shipId of ownedShipIds) {
      await payload.update({
        collection: 'ships', id: shipId,
        data: { pilote: null, copilote: null, canonniers: [] },
        overrideAccess: true, user, req,
      })
      await payload.delete({ collection: 'ships', id: shipId, overrideAccess: true, user, req })
    }
    for (const vehicle of ownedVehicles) {
      await payload.delete({ collection: 'vehicles', id: vehicle.id, overrideAccess: true, user, req })
    }
    await payload.delete({ collection: 'characters', id: characterId, overrideAccess: true, user, req })

    const remainingCharacters = await getOwnedCharacters(payload, user, { req })
    await payload.db.commitTransaction?.(transactionID)

    if (activeCookieId === String(characterId)) {
      if (remainingCharacters[0]) await setActiveCharacterCookie(remainingCharacters[0].id)
      else await clearActiveCharacterCookie()
    }
    revalidateCharacterViews()
    return { success: true, remainingCount: remainingCharacters.length }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    return { success: false, error: error instanceof Error ? error.message : 'La suppression du personnage a échoué.' }
  }
}
