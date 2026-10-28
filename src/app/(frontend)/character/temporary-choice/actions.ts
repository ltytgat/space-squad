'use server'

import { cookies, headers } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { setActiveCharacterCookie } from '@/lib/activeCharacter'
import { consumeWorkspaceRequest, TEMP_WORKSPACE_COOKIE } from '@/lib/temporaryCharacterWorkspace'
import {
  getTemporaryCharacterOffer,
  isPristineRegistrationCharacter,
  TEMP_CHARACTER_OFFER_COOKIE,
} from '@/lib/temporaryCharacterOffer'

async function getOfferForCurrentUser() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/login')
  const offer = await getTemporaryCharacterOffer(payload, user.id)
  if (!offer) redirect('/character')
  return { payload, user, offer }
}

export async function chooseNewCharacter() {
  const { payload, user, offer } = await getOfferForCurrentUser()
  const { docs: ownedCharacters } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 10,
    sort: 'id',
    overrideAccess: true,
  })
  let initialCharacter = ownedCharacters.find((character: any) => String(character.id) === String(offer.initialCharacterId))
    ?? ownedCharacters[0]
  if (!initialCharacter) {
    initialCharacter = await payload.create({
      collection: 'characters',
      data: { user: user.id, creationEtape: 'caracteristiques' },
      overrideAccess: true,
    })
  }

  const cookieStore = await cookies()
  await setActiveCharacterCookie(initialCharacter.id)
  cookieStore.delete(TEMP_CHARACTER_OFFER_COOKIE)
  // La fiche temporaire reste disponible jusqu'à l'expiration de son workspace.
  redirect('/character')
}

export async function resumeTemporaryCharacter() {
  const { payload, user, offer } = await getOfferForCurrentUser()
  let transactionID: any
  let transferred = false

  try {
    transactionID = await payload.db.beginTransaction?.()
    if (!transactionID) throw new Error('Les transactions de la base sont indisponibles.')
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) throw new Error('Impossible d’ouvrir la transaction.')
    const req = { transactionID } as any
    const now = new Date()

    // Garder l'ordre workspace puis personnages utilisé par le nettoyage concurrent.
    const workspaceLock = await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM character_workspaces WHERE id = ${offer.workspaceId} AND expires_at > ${now} FOR UPDATE`,
    })
    if (!workspaceLock.rows?.length) throw new Error('Le workspace temporaire a expiré.')

    const characterLock = await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT id FROM characters WHERE id = ${offer.characterId} FOR UPDATE`,
    })
    if (!characterLock.rows?.length) throw new Error('La fiche temporaire est introuvable.')

    await consumeWorkspaceRequest(payload, offer.workspaceId, req)
    const character = await payload.findByID({
      collection: 'characters',
      id: offer.characterId,
      depth: 0,
      overrideAccess: true,
      req,
    }) as any
    const characterWorkspaceId = typeof character.workspace === 'object' ? character.workspace?.id : character.workspace
    if (character.user || String(characterWorkspaceId) !== String(offer.workspaceId)) {
      throw new Error('Cette fiche temporaire n’est plus transférable.')
    }

    await payload.update({
      collection: 'characters',
      id: offer.characterId,
      data: { user: user.id, workspace: null },
      overrideAccess: true,
      req,
    })

    if (offer.initialCharacterId && offer.initialCharacterId !== offer.characterId) {
      const initialCharacterLock = await payload.db.execute({
        db: transactionDb,
        sql: sql`SELECT id FROM characters WHERE id = ${offer.initialCharacterId} FOR UPDATE`,
      })
      if (initialCharacterLock.rows?.length) {
        const initialCharacter = await payload.findByID({
          collection: 'characters',
          id: offer.initialCharacterId,
          depth: 0,
          overrideAccess: true,
          req,
        }) as any
        if (isPristineRegistrationCharacter(initialCharacter, user.id)) {
          await payload.delete({ collection: 'characters', id: offer.initialCharacterId, overrideAccess: true, req })
        }
      }
    }

    await payload.delete({ collection: 'character-workspaces', id: offer.workspaceId, overrideAccess: true, req })
    await payload.db.commitTransaction?.(transactionID)
    transactionID = undefined
    transferred = true
  } catch (error) {
    if (transactionID) {
      try { await payload.db.rollbackTransaction?.(transactionID) } catch { /* La transaction peut déjà être fermée. */ }
    }
    console.error('[Temporary character] Échec du transfert après inscription', error)
  }

  if (!transferred) redirect('/character/temporary-choice?error=transfer')

  const cookieStore = await cookies()
  cookieStore.delete(TEMP_WORKSPACE_COOKIE)
  cookieStore.delete(TEMP_CHARACTER_OFFER_COOKIE)
  await setActiveCharacterCookie(offer.characterId)
  revalidatePath('/character')
  revalidatePath(`/characters/${offer.characterId}`)
  revalidatePath(`/temporary-character/${offer.characterId}`)
  redirect(`/characters/${offer.characterId}`)
}
