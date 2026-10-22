'use server'

import { randomInt } from 'node:crypto'
import { headers } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getActiveMode } from '@/lib/activeMode'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const relationId = (value: any): number | null => {
  const raw = value && typeof value === 'object' ? value.id : value
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

async function context() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.role !== 'player') throw new Error('Connexion joueur requise.')
  return { payload, user, mode: await getActiveMode(user) }
}

function newInviteCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
}

export async function createSquad(name: string) {
  const { payload, user, mode } = await context()
  if (mode !== 'mj' || (user as any).isMJ !== true) return { success: false, error: 'Passez en mode MJ pour créer une escouade.' }
  const nom = typeof name === 'string' ? name.trim() : ''
  if (!nom) return { success: false, error: 'Le nom de l’escouade ne peut pas être vide.' }

  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) return { success: false, error: 'Les transactions PostgreSQL sont indisponibles.' }
  const req = { transactionID } as any
  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT pg_advisory_xact_lock(hashtextextended(${`mj-squads:${user.id}`}, 0))`,
    })
    // Serialize code checks and inserts so a concurrent request cannot win the same code.
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT pg_advisory_xact_lock(hashtextextended('squad-invite-codes', 0))`,
    })

    const { docs: existingGroups } = await payload.find({
      collection: 'groups', where: { creator: { equals: user.id } },
      depth: 0, limit: 6, overrideAccess: true, req,
    })
    if (existingGroups.length >= 5) throw new Error('Vous avez atteint la limite de cinq escouades.')

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const inviteCode = newInviteCode()
      // Explicitly verify each generated code before attempting to save it.
      const { docs: matches } = await payload.find({
        collection: 'groups', where: { inviteCode: { equals: inviteCode } },
        depth: 0, limit: 1, overrideAccess: true, req,
      })
      if (matches.length) continue
      const group = await payload.create({
        collection: 'groups',
        data: { nom, creator: user.id, inviteCode },
        overrideAccess: true,
        user,
        req,
      })
      await payload.db.commitTransaction?.(transactionID)
      revalidatePath('/escouade')
      revalidatePath('/characters')
      return { success: true, group: { id: group.id, nom: group.nom, inviteCode } }
    }
    throw new Error('Impossible de générer un code unique. Réessayez.')
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    return { success: false, error: error instanceof Error ? error.message : 'La création de l’escouade a échoué.' }
  }
}

export async function joinSquadWithCode(submittedCode: string) {
  const { payload, user, mode } = await context()
  if (mode !== 'player') return { success: false, error: 'Passez en mode joueur pour rejoindre une escouade.' }
  const code = typeof submittedCode === 'string' ? submittedCode.trim().toUpperCase() : ''
  if (code.length !== CODE_LENGTH || [...code].some((character) => !CODE_ALPHABET.includes(character))) {
    return { success: false, error: 'Le code doit contenir huit caractères valides.' }
  }

  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) return { success: false, error: 'Les transactions PostgreSQL sont indisponibles.' }
  const req = { transactionID } as any
  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    const { docs: characters } = await payload.find({
      collection: 'characters', where: { user: { equals: user.id } },
      depth: 0, limit: 1, overrideAccess: true, req,
    })
    const character = characters[0] as any
    if (!character) throw new Error('Aucun personnage n’est associé à ce compte.')
    await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE`,
    })
    const current = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req }) as any
    const { docs: matches } = await payload.find({
      collection: 'groups', where: { inviteCode: { equals: code } },
      depth: 0, limit: 1, overrideAccess: true, req,
    })
    const destination = matches[0] as any
    if (!destination) throw new Error('Aucune escouade ne correspond à ce code.')
    if (String(relationId(current.groupe)) === String(destination.id)) {
      await payload.db.commitTransaction?.(transactionID)
      return { success: true, unchanged: true }
    }

    const { docs: ownedShips } = await payload.find({
      collection: 'ships', where: { proprietaire: { equals: current.id } },
      depth: 0, pagination: false, overrideAccess: true, req,
    })
    const ownedShipIds = ownedShips.map((ship: any) => Number(ship.id)).filter(Number.isSafeInteger)
    const disembarkIds = new Set<number>([Number(current.id)])
    if (ownedShipIds.length) {
      for (const shipId of ownedShipIds) {
        await payload.db.execute({
          db: transactionDb,
          sql: sql`SELECT id FROM ships WHERE id = ${shipId} FOR UPDATE`,
        })
      }
      const { docs: crew } = await payload.find({
        collection: 'characters', where: { vaisseau: { in: ownedShipIds } },
        depth: 0, pagination: false, overrideAccess: true, req,
      })
      for (const member of crew as any[]) disembarkIds.add(Number(member.id))
      for (const ship of ownedShips as any[]) {
        await payload.update({
          collection: 'ships', id: ship.id,
          data: { pilote: null, copilote: null, canonniers: [] },
          overrideAccess: true, user, req,
        })
      }
    }

    for (const characterId of [...disembarkIds].sort((a, b) => a - b)) {
      if (characterId === Number(current.id)) continue
      await payload.update({
        collection: 'characters', id: characterId,
        data: { vaisseau: null, roleVaisseau: null },
        overrideAccess: true, user, req,
      })
    }
    await payload.update({
      collection: 'characters', id: current.id,
      data: { groupe: destination.id, vaisseau: null, roleVaisseau: null },
      overrideAccess: true, user, req,
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/escouade')
    revalidatePath('/characters')
    revalidatePath('/ships')
    revalidatePath('/vehicles')
    revalidatePath('/ship')
    return { success: true }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    return { success: false, error: error instanceof Error ? error.message : 'Le changement d’escouade a échoué.' }
  }
}
