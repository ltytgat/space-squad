import { isMJMode } from './activeMode'

const relationId = (value: any): number | null => {
  const raw = value && typeof value === 'object' ? value.id : value
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function getMJGroupIds(payload: any, user: any): Promise<number[]> {
  if (!user?.id || !(await isMJMode(user))) return []
  const { docs } = await payload.find({
    collection: 'groups',
    where: { creator: { equals: user.id } },
    depth: 0,
    limit: 10,
    select: { id: true },
    overrideAccess: true,
  })
  return (docs as any[]).map((group) => Number(group.id)).filter(Number.isSafeInteger)
}

export async function getMJCharacterIds(payload: any, user: any): Promise<number[]> {
  const groupIds = await getMJGroupIds(payload, user)
  if (!groupIds.length) return []
  const { docs } = await payload.find({
    collection: 'characters',
    where: { groupe: { in: groupIds } },
    depth: 0,
    limit: 1000,
    select: { id: true },
    overrideAccess: true,
  })
  return (docs as any[]).map((character) => Number(character.id)).filter(Number.isSafeInteger)
}

export async function canMJManageCharacter(payload: any, user: any, character: any): Promise<boolean> {
  if (!(await isMJMode(user))) return false
  const groupId = relationId(character?.groupe)
  if (!groupId) return false
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 0, overrideAccess: true }).catch(() => null)
  return relationId(group?.creator) === Number(user.id)
}

export async function getMJShipIds(payload: any, user: any): Promise<number[]> {
  const characterIds = await getMJCharacterIds(payload, user)
  if (!characterIds.length) return []
  const { docs } = await payload.find({
    collection: 'ships',
    where: { proprietaire: { in: characterIds } },
    depth: 0,
    limit: 1000,
    select: { id: true },
    overrideAccess: true,
  })
  return (docs as any[]).map((ship) => Number(ship.id)).filter(Number.isSafeInteger)
}

export async function getMJVehicleIds(payload: any, user: any): Promise<number[]> {
  const characterIds = await getMJCharacterIds(payload, user)
  if (!characterIds.length) return []
  const { docs } = await payload.find({
    collection: 'vehicles',
    where: { proprietaire: { in: characterIds } },
    depth: 0,
    limit: 1000,
    select: { id: true },
    overrideAccess: true,
  })
  return (docs as any[]).map((vehicle) => Number(vehicle.id)).filter(Number.isSafeInteger)
}

export async function canMJManageGroup(payload: any, user: any, group: any): Promise<boolean> {
  if (!(await isMJMode(user))) return false
  return relationId(group?.creator) === Number(user.id)
}
