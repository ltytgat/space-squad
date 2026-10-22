import { relationId } from './shop'
import { getMJVehicleIds } from './mjAccess'
import { isMJMode } from './activeMode'

export function vehicleRelationId(value: unknown): number | null {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}

/** Owner character ids whose vehicles are visible to this character. */
export async function findVehicleOwnerIds(payload: any, character: any): Promise<number[]> {
  const ids = new Set<number>()
  const characterId = vehicleRelationId(character)
  if (characterId) ids.add(characterId)

  const groupId = vehicleRelationId(character?.groupe)
  if (!groupId) return [...ids]

  const { docs } = await payload.find({
    collection: 'characters',
    where: { groupe: { equals: groupId } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })
  for (const member of docs as any[]) {
    const id = vehicleRelationId(member)
    if (id) ids.add(id)
  }
  return [...ids]
}

export async function getUserCharacter(payload: any, user: any) {
  if (!user?.id) return null
  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return (docs[0] as any) ?? null
}

/** Payload read filter for a viewer's own and squad-owned vehicles. */
export async function vehicleReadAccess({ req }: { req: any }) {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  if (await isMJMode(req.user)) {
    const vehicleIds = await getMJVehicleIds(req.payload, req.user)
    return vehicleIds.length ? { id: { in: vehicleIds } } as any : false
  }
  const character = await getUserCharacter(req.payload, req.user)
  if (!character) return false
  const ownerIds = await findVehicleOwnerIds(req.payload, character)
  return ownerIds.length ? { proprietaire: { in: ownerIds } } as any : false
}

export async function getVehicleAccess(payload: any, user: any, vehicleId: number | string, depth = 3) {
  const [vehicle, character] = await Promise.all([
    payload.findByID({ collection: 'vehicles', id: vehicleId, depth, overrideAccess: true }).catch(() => null),
    getUserCharacter(payload, user),
  ])
  if (!vehicle) return { vehicle: null, character, canRead: false, canEdit: false, isOwner: false }
  const isAdmin = user?.role === 'admin'
  const isOwner = Boolean(character && vehicleRelationId(vehicle.proprietaire) === vehicleRelationId(character))
  const isMJ = await isMJMode(user)
  const managedVehicleIds = isMJ ? await getMJVehicleIds(payload, user) : []
  const isManagedByMJ = managedVehicleIds.includes(Number(vehicle.id))
  const ownerIds = character ? await findVehicleOwnerIds(payload, character) : []
  const isInSquad = ownerIds.includes(vehicleRelationId(vehicle.proprietaire) ?? -1)
  return {
    vehicle,
    character,
    isOwner,
    canRead: isAdmin || (isMJ ? isManagedByMJ : isOwner || isInSquad),
    canEdit: isMJ ? isManagedByMJ : isOwner,
  }
}
