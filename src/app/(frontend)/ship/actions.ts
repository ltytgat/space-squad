'use server'

import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { revalidatePath } from 'next/cache'
import config from '@/payload.config'
import { validateShipConfiguration } from '@/lib/shipStats'

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
  const current = await payload.findByID({ collection: 'ships', id: shipId, depth: 3, overrideAccess: true })
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

export async function updateCrewRole(shipId: number, characterId: number, role: 'pilote' | 'copilote' | 'canonnier' | 'passager') {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 0, overrideAccess: true }) as any
  const crewResult = await payload.find({ collection: 'characters', where: { vaisseau: { equals: shipId } }, depth: 0, limit: 100, overrideAccess: true })
  const crew = crewResult.docs as any[]
  if (!crew.some((member) => String(member.id) === String(characterId))) throw new Error('Personnage absent de cet équipage')

  const previous = crew.find((member) => String(member.id) === String(characterId))
  const updatedRole = role === 'passager' ? 'passager' : role
  await payload.update({ collection: 'characters', id: characterId, data: { roleVaisseau: updatedRole }, user, overrideAccess: true })

  const roleFor = (member: any) => {
    if (String(member.id) === String(characterId)) return updatedRole
    const currentRole = member.roleVaisseau || 'passager'
    if ((updatedRole === 'pilote' && currentRole === 'pilote') || (updatedRole === 'copilote' && currentRole === 'copilote')) return 'passager'
    return currentRole
  }
  const withNewRoles = crew.map((member) => ({ ...member, roleVaisseau: roleFor(member) }))
  for (const member of withNewRoles) {
    if (String(member.id) !== String(characterId) && member.roleVaisseau !== crew.find((entry) => entry.id === member.id)?.roleVaisseau) {
      await payload.update({ collection: 'characters', id: member.id, data: { roleVaisseau: member.roleVaisseau }, user, overrideAccess: true })
    }
  }
  const pilote = withNewRoles.find((member) => member.roleVaisseau === 'pilote')?.id ?? null
  const copilote = withNewRoles.find((member) => member.roleVaisseau === 'copilote')?.id ?? null
  const canonniers = withNewRoles.filter((member) => member.roleVaisseau === 'canonnier').map((member, index) => ({
    personnage: member.id,
    tourelle: ship?.canonniers?.[index]?.tourelle ?? index + 1,
  }))
  await payload.update({ collection: 'ships', id: shipId, data: { pilote, copilote, canonniers }, user, overrideAccess: true })
  revalidatePath(`/ships/${shipId}`)
  revalidatePath(`/ship/${shipId}`)
  return { success: true, previousRole: previous?.roleVaisseau ?? 'passager' }
}

export async function updateShipWeaponState(
  shipId: number,
  slot: 'armesPilote' | 'armesTourelles',
  index: number,
  data: { munitionsActuelles?: number; chauffeActuelle?: number; chargeurRelie?: number | null; inventoryConsommables?: any[] },
) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 0, overrideAccess: true }) as any
  const entries = [...(ship?.[slot] ?? [])]
  if (!entries[index]) throw new Error('Arme introuvable')
  const { inventoryConsommables, ...weaponData } = data
  entries[index] = { ...entries[index], ...weaponData }
  const updateData: any = { [slot]: entries }
  if (inventoryConsommables) updateData.inventaireConsommables = inventoryConsommables
  await payload.update({ collection: 'ships', id: shipId, data: updateData, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}

export async function updateShipTurretWeaponState(shipId: number, turretIndex: number, weaponIndex: number, data: { munitionsActuelles?: number; chauffeActuelle?: number; chargeurRelie?: number | null; inventoryConsommables?: any[] }) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 0, overrideAccess: true }) as any
  const turrets = [...(ship?.armesTourelles ?? [])]
  if (!turrets[turretIndex]?.armes?.[weaponIndex]) throw new Error('Arme de tourelle introuvable')
  turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }
  const { inventoryConsommables, ...weaponData } = data
  turrets[turretIndex].armes[weaponIndex] = { ...turrets[turretIndex].armes[weaponIndex], ...weaponData }
  const updateData: any = { armesTourelles: turrets }
  if (inventoryConsommables) updateData.inventaireConsommables = inventoryConsommables
  await payload.update({ collection: 'ships', id: shipId, data: updateData, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}
