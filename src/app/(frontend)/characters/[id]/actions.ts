'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers as getHeaders } from 'next/headers.js'
import type { User, Character } from '@/payload-types'

/**
 * Helper pour récupérer l'instance Payload et l'utilisateur courant.
 */
async function getAuthenticatedPayload() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return { payload, user: user as User | null }
}

export async function updateCharacter(characterId: number, data: any) {
  const { payload, user } = await getAuthenticatedPayload()

  if (!user) {
    throw new Error('Non autorisé')
  }

  // Vérifier que l'utilisateur est admin ou propriétaire
  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
    depth: 0,
    overrideAccess: true,
  })

  if (!character) {
    throw new Error('Personnage non trouvé')
  }

  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  const isAdmin = user.role === 'admin'
  const isOwner = String(ownerId) === String(user.id)

  if (!isAdmin && !isOwner) {
    throw new Error('Non autorisé')
  }

  // Mise à jour du personnage
  await payload.update({
    collection: 'characters',
    id: characterId,
    data,
    user,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}

export async function updateCharacterSkills(characterId: number, data: {
  competences: Character['competences'],
  pointsDeCompetence: number
}) {
  return updateCharacter(characterId, {
    competences: data.competences,
    pointsDeCompetence: data.pointsDeCompetence,
  })
}

export async function updateMalus(characterId: number, field: string, value: number) {
  const { payload, user } = await getAuthenticatedPayload()

  if (!user || user.role !== 'admin') {
    throw new Error('Non autorisé')
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: {
      [field]: value,
    },
    user,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}
