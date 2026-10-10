'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers as getHeaders } from 'next/headers.js'
import type { User, Character } from '@/payload-types'

const relationNumericId = (value: any): number | null => {
  const raw = value && typeof value === 'object' ? value.id : value
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function withoutTransientWeaponHeat(value: any): any {
  if (Array.isArray(value)) return value.map(withoutTransientWeaponHeat)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'chauffeActuelle')
    .map(([key, child]) => [key, withoutTransientWeaponHeat(child)]))
}

async function assertConsumablesCanBeEquipped(payload: any, character: any, values: any[]) {
  const consumableIds = [...new Set<number>(values.map(relationNumericId).filter((id: number | null): id is number => id !== null))]
  if (!consumableIds.length) return
  const ownedRoleIds = new Set<number>((Array.isArray(character.rolesSpeciaux) ? character.rolesSpeciaux : [])
    .map(relationNumericId).filter((id: number | null): id is number => id !== null))
  const { docs } = await payload.find({
    collection: 'consumables',
    where: { id: { in: consumableIds } },
    depth: 0,
    limit: consumableIds.length,
    overrideAccess: true,
  })
  for (const consumable of docs as any[]) {
    const requiredRoleId = relationNumericId(consumable.roleSpecialRequis)
    if (requiredRoleId && !ownedRoleIds.has(requiredRoleId)) {
      const role: any = await payload.findByID({ collection: 'special-roles', id: requiredRoleId, depth: 0, overrideAccess: true }).catch(() => null)
      throw new Error(`Le rôle spécial « ${role?.nom ?? 'requis'} » est nécessaire pour équiper ${consumable.nom}.`)
    }
  }
}

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

  // Filtrer les données si l'utilisateur n'est pas admin
  let updateData = withoutTransientWeaponHeat(data)
  if (!isAdmin) {
    const forbiddenPatterns = [
      /^coaching.*(Label|Max)$/,
      /^malus.*$/,
      /^bonusPointsDeBlessures$/,
      /^pointsDeRang$/,
      /^pointsDeCompetence$/,
      /^konis$/,
      // L'embarquement et les postes passent par joinShip / assignCrewSeat.
      /^vaisseau$/,
      /^roleVaisseau$/,
      /^rolesSpeciaux$/,
    ]

    Object.keys(updateData).forEach((key) => {
      if (forbiddenPatterns.some((pattern) => pattern.test(key))) {
        delete updateData[key]
      }
    })
  }

  const consumablesToEquip: any[] = []
  if (Array.isArray(updateData.consommablesEquipes)) consumablesToEquip.push(...updateData.consommablesEquipes)
  for (const field of ['consommableEquipe1', 'consommableEquipe2', 'consommableEquipe3']) {
    if (updateData[field]) consumablesToEquip.push(updateData[field])
  }
  for (const field of ['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee']) {
    const linkedMagazine = updateData[field]?.chargeurRelie
    if (linkedMagazine) consumablesToEquip.push(linkedMagazine)
  }
  if (consumablesToEquip.length) await assertConsumablesCanBeEquipped(payload, character, consumablesToEquip)

  // Mise à jour du personnage
  await payload.update({
    collection: 'characters',
    id: characterId,
    data: updateData,
    user,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}

export async function updateWeaponStatus(
  characterId: number, 
  slot: string, 
  data: { munitionsActuelles?: number; chargeurRelie?: any }
) {
  const { payload, user } = await getAuthenticatedPayload()
  if (!user) throw new Error('Non autorisé')

  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
    depth: 0,
    overrideAccess: true,
  })
  if (!character) throw new Error('Personnage non trouvé')

  // Vérifier que l'utilisateur est admin ou propriétaire
  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  if (user.role !== 'admin' && String(ownerId) !== String(user.id)) throw new Error('Non autorisé')
  if (data.chargeurRelie != null) await assertConsumablesCanBeEquipped(payload, character, [data.chargeurRelie])

  const updatedWeaponGroup = {
    ...(character[slot as keyof typeof character] as any),
    ...data
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: { [slot]: withoutTransientWeaponHeat(updatedWeaponGroup) },
    user,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  return { success: true }
}

export async function reloadWeapon(
  characterId: number,
  slot: string,
  consumableId: number,
  newAmmoCount: number,
  fromSlot?: string
) {
  const { payload, user } = await getAuthenticatedPayload()
  if (!user) throw new Error('Non autorisé')

  const character = await payload.findByID({
    collection: 'characters',
    id: characterId,
    depth: 0,
    overrideAccess: true,
  })
  if (!character) throw new Error('Personnage non trouvé')

  // Vérifier que l'utilisateur est admin ou propriétaire
  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  if (user.role !== 'admin' && String(ownerId) !== String(user.id)) throw new Error('Non autorisé')

  const magazine: any = await payload.findByID({ collection: 'consumables', id: consumableId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!magazine) throw new Error('Consommable introuvable')
  await assertConsumablesCanBeEquipped(payload, character, [consumableId])

  // Mettre à jour le slot d'arme
  const currentWeaponGroup = character[slot as keyof typeof character] as any
  const updatedWeaponGroup = {
    ...currentWeaponGroup,
    munitionsActuelles: newAmmoCount,
    chargeurRelie: consumableId,
  }

  const updateData: any = {
    [slot]: updatedWeaponGroup,
  }

  if (fromSlot) {
    if (fromSlot.startsWith('equipped[')) {
      const match = fromSlot.match(/\[(\d+)\]/)
      const idx = match ? parseInt(match[1]) : -1
      if (idx > -1) {
        const currentEquipped = (character as any).consommablesEquipes || []
        updateData.consommablesEquipes = currentEquipped.filter((_: any, i: number) => i !== idx)
      }
    } else {
      // Si ça vient d'un slot équipé classique (ancien système ou autres slots)
      updateData[fromSlot] = null
    }
  } else {
    // Sinon, on met à jour l'inventaire : diminuer la quantité du consommable
    const updatedInventory = (character.inventaire || []).map((item: any) => {
      const cId = typeof item.consommable === 'object' ? item.consommable.id : item.consommable
      if (String(cId) === String(consumableId)) {
        return { ...item, quantite: (item.quantite || 1) - 1 }
      }
      return item
    }).filter((item: any) => item.quantite > 0)
    updateData.inventaire = updatedInventory
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: withoutTransientWeaponHeat(updateData),
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
