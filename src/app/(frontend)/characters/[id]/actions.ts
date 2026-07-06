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

export async function updateCharacterSkills(characterId: number, data: {
  competences: Character['competences'],
  pointsDeCompetence: number
}) {
  const { payload, user } = await getAuthenticatedPayload()

  if (!user) {
    throw new Error('Non autorisé')
  }

  // Vérifier que l'utilisateur est admin ou propriétaire
  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
    depth: 0, // Optimisation : pas besoin de peupler les relations
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
  // On passe 'user' même avec overrideAccess: true pour que les hooks disposent de l'initiateur
  await payload.update({
    collection: 'characters',
    id: characterId,
    data: {
      competences: data.competences,
      pointsDeCompetence: data.pointsDeCompetence,
    },
    user,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  return { success: true }
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
