import { getActiveCharacter } from './activeCharacter'
import { isMJMode } from './activeMode'
import { getMJGroupIds } from './mjAccess'

/** Payload read filter for private workshop ship models and sale models. */
export async function atelierPrivateModelReadAccess({ req }: { req: any }) {
  if (!req.user) return false
  if (req.user.role === 'admin') return true

  const character = await getActiveCharacter(req.payload, req.user).catch(() => null)
  if (!character) return { atelierPrive: { equals: false } } as any

  const ownerIds = new Set<number>([Number(character.id)])
  const groupIds = await isMJMode(req.user)
    ? await getMJGroupIds(req.payload, req.user)
    : character.groupe ? [Number(typeof character.groupe === 'object' ? character.groupe.id : character.groupe)] : []
  if (groupIds.length) {
    const { docs } = await req.payload.find({
      collection: 'characters', where: { groupe: { in: groupIds } }, depth: 0,
      pagination: false, overrideAccess: true, req,
    })
    for (const member of docs as any[]) ownerIds.add(Number(member.id))
  }

  return {
    or: [
      { atelierPrive: { equals: false } },
      { atelierProprietaire: { in: [...ownerIds] } },
    ],
  } as any
}
