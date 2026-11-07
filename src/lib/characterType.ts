import type { CollectionBeforeChangeHook } from 'payload'

export type CharacterType = 'joueur' | 'pnj'

type CharacterIdentity = { typePersonnage?: unknown; user?: unknown }
type Account = { id: string | number; role?: string | null; isMJ?: boolean | null }

function relationId(value: unknown): string | null {
  const id = value && typeof value === 'object' && 'id' in value ? value.id : value
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null
}

export function canCreateNPC(user: Account | null | undefined): boolean {
  return user?.role === 'admin' || user?.isMJ === true
}

export function canEditOwnedNPC(user: Account | null | undefined, character: CharacterIdentity): boolean {
  return !!user && canCreateNPC(user) && character.typePersonnage === 'pnj'
    && relationId(character.user) === String(user.id)
}

export function assertCharacterCanJoinSquad(character: CharacterIdentity, squad: { creator?: unknown }): void {
  const ownerId = relationId(character.user)
  if (character.typePersonnage !== 'pnj' && ownerId && ownerId === relationId(squad.creator)) {
    throw new Error('Un personnage Joueur ne peut pas rejoindre une escouade dont son utilisateur est le MJ. Utilisez un PNJ dédié.')
  }
}

// Also enforce membership rules for direct collection writes and admin assignments.
export const validateCharacterSquadMembership: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const changed = ['groupe', 'user', 'typePersonnage'].some((field) => Object.prototype.hasOwnProperty.call(data, field)
    && (field === 'typePersonnage' ? data[field] !== originalDoc?.[field] : relationId(data[field]) !== relationId(originalDoc?.[field])))
  if (!changed) return data
  const groupId = relationId(Object.prototype.hasOwnProperty.call(data, 'groupe') ? data.groupe : originalDoc?.groupe)
  if (!groupId) return data
  const squad = await req.payload.findByID({ collection: 'groups', id: groupId, depth: 0, overrideAccess: true, req })
  assertCharacterCanJoinSquad({
    user: Object.prototype.hasOwnProperty.call(data, 'user') ? data.user : originalDoc?.user,
    typePersonnage: Object.prototype.hasOwnProperty.call(data, 'typePersonnage') ? data.typePersonnage : originalDoc?.typePersonnage,
  }, squad)
  return data
}
