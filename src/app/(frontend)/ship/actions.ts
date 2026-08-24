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

export async function updateShipState(shipId: number, data: { blindageActuel?: number; bouclierActuel?: number; esquiveActuelle?: number }) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  await payload.update({ collection: 'ships', id: shipId, data, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}

export async function updateShipWeaponState(
  shipId: number,
  slot: 'armesPilote' | 'armesTourelles',
  index: number,
  data: { munitionsActuelles?: number; chauffeActuelle?: number; chargeurRelie?: number | null },
) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 0, overrideAccess: true }) as any
  const entries = [...(ship?.[slot] ?? [])]
  if (!entries[index]) throw new Error('Arme introuvable')
  entries[index] = { ...entries[index], ...data }
  await payload.update({ collection: 'ships', id: shipId, data: { [slot]: entries }, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}

export async function updateShipTurretWeaponState(shipId: number, turretIndex: number, weaponIndex: number, data: { munitionsActuelles?: number; chauffeActuelle?: number; chargeurRelie?: number | null }) {
  const { payload, user } = await context()
  await authorize(payload, user, shipId)
  const ship = await payload.findByID({ collection: 'ships', id: shipId, depth: 0, overrideAccess: true }) as any
  const turrets = [...(ship?.armesTourelles ?? [])]
  if (!turrets[turretIndex]?.armes?.[weaponIndex]) throw new Error('Arme de tourelle introuvable')
  turrets[turretIndex] = { ...turrets[turretIndex], armes: [...turrets[turretIndex].armes] }
  turrets[turretIndex].armes[weaponIndex] = { ...turrets[turretIndex].armes[weaponIndex], ...data }
  await payload.update({ collection: 'ships', id: shipId, data: { armesTourelles: turrets }, user, overrideAccess: true })
  revalidatePath('/ship')
  return { success: true }
}
