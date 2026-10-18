'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers as getHeaders } from 'next/headers.js'
import type { User, Character } from '@/payload-types'
import { computeRank, minimumRankForChipSlot } from '@/lib/rankSystem'
import { calculateStats } from '@/lib/characterStats'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import {
  consumeWorkspaceRequest,
  getWorkspaceFromCookie,
  TEMP_WORKSPACE_MAX_ARRAY_ITEMS,
  TEMP_WORKSPACE_MAX_CUSTOM_SKILLS,
  TEMP_WORKSPACE_MAX_PAYLOAD_BYTES,
} from '@/lib/temporaryCharacterWorkspace'
import { validateTemporaryCharacterUpdate } from '@/lib/temporaryCharacterRules'

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

async function assertHeavyWeaponsMeetForce(payload: any, character: any, updateData: Record<string, any>) {
  const weaponSlots = ['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee']
  const changedWeaponIds = weaponSlots
    .filter((slot) => Object.prototype.hasOwnProperty.call(updateData, slot))
    .map((slot) => {
      const item = updateData[slot]?.item ?? updateData[slot]
      const currentItem = character[slot]?.item ?? character[slot]
      const id = relationNumericId(item)
      return id && id !== relationNumericId(currentItem) ? id : null
    })
    .filter((id): id is number => id !== null)

  if (!changedWeaponIds.length) return

  const { docs } = await payload.find({
    collection: 'weapons',
    where: { id: { in: [...new Set(changedWeaponIds)] } },
    depth: 0,
    limit: changedWeaponIds.length,
    overrideAccess: true,
  })
  const restrictedWeapons = (docs as any[]).filter((weapon) =>
    weapon.categorie === 'lourde' && weapon.forceMinimum != null,
  )
  if (!restrictedWeapons.length) return

  const populatedCharacter = await payload.findByID({
    collection: 'characters',
    id: character.id,
    depth: 4,
    overrideAccess: true,
  })
  const stats = calculateStats({ ...populatedCharacter, ...updateData })
  const force = (Number(updateData.force ?? populatedCharacter.force) || 0)
    + (Number(stats.totalArmorMods.force) || 0)
    - (Number(updateData.malusForce ?? populatedCharacter.malusForce) || 0)

  for (const weapon of restrictedWeapons) {
    if (force < weapon.forceMinimum) {
      throw new Error(`Force insuffisante pour équiper ${weapon.nom} : Fo ${weapon.forceMinimum} minimum requise (votre Force : ${force}).`)
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

async function getAuthorizedCharacter(characterId: number) {
  if (!Number.isSafeInteger(characterId) || characterId <= 0) throw new Error('Personnage invalide')
  const { payload, user } = await getAuthenticatedPayload()
  const workspace = await getWorkspaceFromCookie(payload)
  if (!user && !workspace) throw new Error('Non autorisé')
  if (!user && workspace) await consumeWorkspaceRequest(payload, Number(workspace.id))
  const character = await payload.findByID({ collection: 'characters', id: characterId, depth: 0, overrideAccess: true }).catch(() => null) as any
  if (!character) throw new Error('Personnage non trouvé')

  const ownerId = typeof character.user === 'object' ? character.user?.id : character.user
  const isAdmin = user?.role === 'admin'
  const isUserOwner = !!user && String(ownerId) === String(user.id)
  if (isAdmin || isUserOwner) return { payload, user, character, isAdmin, isTemporary: false }

  const workspaceId = typeof character.workspace === 'object' ? character.workspace?.id : character.workspace
  if (!workspace || character.user || String(workspaceId) !== String(workspace.id)) throw new Error('Non autorisé')
  if (user) await consumeWorkspaceRequest(payload, Number(workspace.id))
  return { payload, user, character, isAdmin: false, isTemporary: true }
}

export async function updateCharacter(characterId: number, data: any) {
  const { payload, user, character, isAdmin, isTemporary } = await getAuthorizedCharacter(characterId)
  if (!isAdmin && !isCharacterCreationComplete(character)) {
    throw new Error('Terminez le parcours de création avant de modifier cette fiche.')
  }

  // Filtrer les données si l'utilisateur n'est pas admin
  if (isTemporary) validateTemporaryCharacterUpdate(data, character, {
    maxArrayItems: TEMP_WORKSPACE_MAX_ARRAY_ITEMS,
    maxCustomSkills: TEMP_WORKSPACE_MAX_CUSTOM_SKILLS,
    maxPayloadBytes: TEMP_WORKSPACE_MAX_PAYLOAD_BYTES,
  })
  const updateData = withoutTransientWeaponHeat(data)
  if (!isAdmin) {
    const forbiddenPatterns = [
      /^coaching.*(Label|Max)$/,
      /^malus.*$/,
      /^bonusPointsDeBlessures$/,
      /^pointsDeRang$/,
      /^pointsDeCompetence$/,
      /^konis$/,
      /^user$/,
      /^workspace$/,
      /^creationEtape$/,
      /^creationJets$/,
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

  if (!isAdmin) {
    const currentRank = computeRank(Number(character.pointsDeRang) || 0).level
    for (const slot of ['puceMk1', 'puceMk2', 'puceMk3']) {
      if (!Object.prototype.hasOwnProperty.call(updateData, slot) || updateData[slot] == null) continue
      const minimumRank = minimumRankForChipSlot(slot)
      if (minimumRank === null) continue
      const currentChipId = relationNumericId((character as any)[slot])
      const requestedChipId = relationNumericId(updateData[slot])
      if (currentChipId && requestedChipId === currentChipId) continue
      if (currentRank < minimumRank) {
        throw new Error(`L’emplacement Mk${slot.replace('puceMk', '')} nécessite le rang ${minimumRank}.`)
      }
    }
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
  await assertHeavyWeaponsMeetForce(payload, character, updateData)

  // Mise à jour du personnage
  await payload.update({
    collection: 'characters',
    id: characterId,
    data: updateData,
    user: user ?? undefined,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  revalidatePath(`/temporary-character/${characterId}`)
  return { success: true }
}

export async function updateWeaponStatus(
  characterId: number, 
  slot: string, 
  data: { munitionsActuelles?: number; chargeurRelie?: any }
) {
  const { payload, user, character, isAdmin, isTemporary } = await getAuthorizedCharacter(characterId)
  if (isTemporary && !['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'].includes(slot)) throw new Error('Emplacement d’arme invalide.')
  if (isTemporary && data.munitionsActuelles !== undefined && (!Number.isSafeInteger(data.munitionsActuelles) || data.munitionsActuelles < 0 || data.munitionsActuelles > 100_000)) throw new Error('Valeur de munitions invalide.')
  if (!isAdmin && !isCharacterCreationComplete(character)) {
    throw new Error('Terminez le parcours de création avant de modifier cette fiche.')
  }
  if (data.chargeurRelie != null) await assertConsumablesCanBeEquipped(payload, character, [data.chargeurRelie])

  const updatedWeaponGroup = {
    ...(character[slot as keyof typeof character] as any),
    ...data
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: { [slot]: withoutTransientWeaponHeat(updatedWeaponGroup) },
    user: user ?? undefined,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  revalidatePath(`/temporary-character/${characterId}`)
  return { success: true }
}

export async function reloadWeapon(
  characterId: number,
  slot: string,
  consumableId: number,
  newAmmoCount: number,
  fromSlot?: string,
  ammoUnitsToConsume = 1,
) {
  const { payload, user, character, isAdmin, isTemporary } = await getAuthorizedCharacter(characterId)
  if (isTemporary && !['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'].includes(slot)) throw new Error('Emplacement d’arme invalide.')
  if (isTemporary && (!Number.isSafeInteger(newAmmoCount) || newAmmoCount < 0 || newAmmoCount > 100_000)) throw new Error('Valeur de munitions invalide.')
  if (!Number.isSafeInteger(ammoUnitsToConsume) || ammoUnitsToConsume < 1 || ammoUnitsToConsume > 100_000) throw new Error('Quantité de munitions invalide.')
  if (!isAdmin && !isCharacterCreationComplete(character)) {
    throw new Error('Terminez le parcours de création avant de modifier cette fiche.')
  }

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
    if (ammoUnitsToConsume !== 1) throw new Error('Un consommable équipé ne peut être utilisé qu’une unité à la fois.')
    if (fromSlot.startsWith('equipped[')) {
      const match = fromSlot.match(/\[(\d+)\]/)
      const idx = match ? parseInt(match[1]) : -1
      if (isTemporary && (idx < 0 || idx >= ((character as any).consommablesEquipes || []).length)) throw new Error('Emplacement de consommable invalide.')
      if (idx > -1) {
        const currentEquipped = (character as any).consommablesEquipes || []
        updateData.consommablesEquipes = currentEquipped.filter((_: any, i: number) => i !== idx)
      }
    } else {
      if (isTemporary && !['consommableEquipe1', 'consommableEquipe2', 'consommableEquipe3'].includes(fromSlot)) throw new Error('Emplacement de consommable invalide.')
      // Si ça vient d'un slot équipé classique (ancien système ou autres slots)
      updateData[fromSlot] = null
    }
  } else {
    // Sinon, on met à jour l'inventaire : diminuer la quantité du consommable
    const matchingQuantity = (character.inventaire || []).reduce((total: number, item: any) => {
      const cId = typeof item.consommable === 'object' ? item.consommable.id : item.consommable
      return String(cId) === String(consumableId) ? total + Number(item.quantite ?? 1) : total
    }, 0)
    if (matchingQuantity < ammoUnitsToConsume) throw new Error('Quantité de munitions insuffisante dans l’inventaire.')

    let remainingQuantity = ammoUnitsToConsume
    const updatedInventory = (character.inventaire || []).map((item: any) => {
      const cId = typeof item.consommable === 'object' ? item.consommable.id : item.consommable
      if (String(cId) !== String(consumableId) || remainingQuantity <= 0) return item
      const availableQuantity = Number(item.quantite ?? 1)
      const consumedQuantity = Math.min(availableQuantity, remainingQuantity)
      remainingQuantity -= consumedQuantity
      return { ...item, quantite: availableQuantity - consumedQuantity }
    }).filter((item: any) => Number(item.quantite ?? 1) > 0)
    updateData.inventaire = updatedInventory
  }

  await payload.update({
    collection: 'characters',
    id: characterId,
    data: withoutTransientWeaponHeat(updateData),
    user: user ?? undefined,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  revalidatePath(`/temporary-character/${characterId}`)
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
    user: user ?? undefined,
    overrideAccess: true,
  })

  revalidatePath(`/characters/${characterId}`)
  revalidatePath(`/temporary-character/${characterId}`)
  return { success: true }
}
