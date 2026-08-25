'use server'

import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import config from '@/payload.config'
import { validateShipConfiguration } from '@/lib/shipStats'

const idOf = (value: any) => (typeof value === 'object' && value ? value.id : value)

async function context() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) throw new Error('Non autorisé')
  return { payload, user }
}

async function authorize(payload: any, user: any, shipId: number) {
  if (user.role === 'admin') return
  const crew = await payload.find({
    collection: 'characters',
    where: { and: [{ user: { equals: user.id } }, { vaisseau: { equals: shipId } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (!crew.docs.length) throw new Error('Vous ne faites pas partie de cet équipage')
}

export async function updateShipConfiguration(shipId: number, data: Record<string, unknown>) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const current = await payload.findByID({
    collection: 'ships',
    id: shipId,
    depth: 3,
    overrideAccess: true,
  })
  if (!current) throw new Error('Vaisseau introuvable')
  const next = { ...current, ...data }
  validateShipConfiguration(next)
  await payload.update({ collection: 'ships', id: shipId, data, user, overrideAccess: true })
  revalidatePath('/ship')
  revalidatePath('/ships')
  return { success: true }
}

export async function updateShipState(shipId: number, data: { blindageActuel?: number }) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  await payload.update({ collection: 'ships', id: shipId, data, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}

export async function updateCrewRole(
  shipId: number,
  characterId: number,
  role: 'pilote' | 'copilote' | 'canonnier' | 'passager',
  turretNumber?: number,
) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = (await payload.findByID({
    collection: 'ships',
    id: shipId,
    depth: 2,
    overrideAccess: true,
  })) as any
  const crewResult = await payload.find({
    collection: 'characters',
    where: { vaisseau: { equals: shipId } },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  const crew = crewResult.docs as any[]
  if (!crew.some((member) => String(member.id) === String(characterId)))
    throw new Error('Personnage absent de cet équipage')

  const previous = crew.find((member) => String(member.id) === String(characterId))
  const existingPilotId =
    idOf(ship?.pilote) ?? crew.find((member) => member.roleVaisseau === 'pilote')?.id
  const existingCopilotId =
    idOf(ship?.copilote) ?? crew.find((member) => member.roleVaisseau === 'copilote')?.id
  const turretCount = Number(
    typeof ship?.modele === 'object' && typeof ship.modele?.chassis === 'object'
      ? ship.modele.chassis.tourelles
      : 0,
  )
  if (role === 'canonnier' && (!turretNumber || turretNumber < 1 || turretNumber > turretCount))
    throw new Error('Tourelle invalide')
  const existingCannoniers = (ship?.canonniers ?? []).filter(
    (entry: any) => Number(entry.tourelle) <= turretCount,
  )
  const assignedTurret = existingCannoniers.find(
    (entry: any) => String(entry.personnage?.id ?? entry.personnage) === String(characterId),
  )?.tourelle
  let canonniers = existingCannoniers.filter(
    (entry: any) => String(entry.personnage?.id ?? entry.personnage) !== String(characterId),
  )
  const displacedIds = new Set<number>()
  if (role === 'canonnier') {
    const displacedTurret = canonniers.find((entry: any) => Number(entry.tourelle) === turretNumber)
    if (displacedTurret) displacedIds.add(Number(idOf(displacedTurret.personnage)))
    canonniers = canonniers.filter((entry: any) => Number(entry.tourelle) !== turretNumber)
    canonniers.push({ personnage: characterId, tourelle: turretNumber })
  }
  if (role === 'pilote' && existingPilotId && String(existingPilotId) !== String(characterId))
    displacedIds.add(Number(existingPilotId))
  if (role === 'copilote' && existingCopilotId && String(existingCopilotId) !== String(characterId))
    displacedIds.add(Number(existingCopilotId))
  if (role !== 'pilote' && String(existingPilotId) === String(characterId))
    displacedIds.add(characterId)
  if (role !== 'copilote' && String(existingCopilotId) === String(characterId))
    displacedIds.add(characterId)
  if (role !== 'canonnier' && assignedTurret)
    canonniers = canonniers.filter(
      (entry: any) => Number(entry.tourelle) !== Number(assignedTurret),
    )
  const canonniersById = new Set(canonniers.map((entry: any) => Number(idOf(entry.personnage))))
  const finalRoles = crew.map((member) => ({
    ...member,
    roleVaisseau:
      String(member.id) === String(characterId)
        ? role
        : displacedIds.has(Number(member.id))
          ? 'passager'
          : canonniersById.has(Number(member.id))
            ? 'canonnier'
            : member.roleVaisseau === 'pilote' && role !== 'pilote'
              ? 'pilote'
              : member.roleVaisseau === 'copilote' && role !== 'copilote'
                ? 'copilote'
                : member.roleVaisseau || 'passager',
  }))
  for (const member of finalRoles) {
    const original = crew.find((entry) => entry.id === member.id)
    if (member.roleVaisseau !== original?.roleVaisseau)
      await payload.update({
        collection: 'characters',
        id: member.id,
        data: { roleVaisseau: member.roleVaisseau },
        user,
        overrideAccess: true,
      })
  }
  const finalPilot =
    role === 'pilote'
      ? characterId
      : displacedIds.has(Number(existingPilotId))
        ? null
        : (existingPilotId ?? null)
  const finalCopilot =
    role === 'copilote'
      ? characterId
      : displacedIds.has(Number(existingCopilotId))
        ? null
        : (existingCopilotId ?? null)
  await payload.update({
    collection: 'ships',
    id: shipId,
    data: { pilote: finalPilot, copilote: finalCopilot, canonniers },
    user,
    overrideAccess: true,
  })
  revalidatePath(`/ships/${shipId}`)
  revalidatePath(`/ship/${shipId}`)
  return {
    success: true,
    previousRole: previous?.roleVaisseau ?? 'passager',
    pilote: finalPilot,
    copilote: finalCopilot,
  }
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
  await authorize(payload, user, shipId)
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
  await authorize(payload, user, shipId)
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
  return { success: true }
}
