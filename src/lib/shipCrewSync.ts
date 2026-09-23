import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'
import { idOf } from './shipStats'
import type { CrewRole } from './shipCrew'

/** Read persisted assignments without requiring populated chassis relationships. */
export function assignedCrew(ship: any): Map<number, CrewRole> {
  const members = new Map<number, CrewRole>()
  const add = (value: any, role: CrewRole) => {
    const id = idOf(value)
    if (id == null) return
    if (members.has(Number(id))) throw new Error('Un personnage ne peut occuper qu’un seul poste.')
    members.set(Number(id), role)
  }
  add(ship?.pilote, 'pilote')
  add(ship?.copilote, 'copilote')
  for (const entry of ship?.canonniers ?? []) add(entry.personnage, 'canonnier')
  return members
}

export const validateCrewAssignments: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  assignedCrew({ ...originalDoc, ...data })
  return data
}

/** Nested writes share the original transaction. Ship assignments determine roles. */
export const syncShipCrew: CollectionAfterChangeHook = async ({ doc, previousDoc, req, context }) => {
  if (context.skipShipCrewSync) return doc
  const current = assignedCrew(doc)
  const affected = new Set([...assignedCrew(previousDoc).keys(), ...current.keys()])
  for (const id of affected) {
    const member = await req.payload.findByID({
      collection: 'characters', id, depth: 0, overrideAccess: true, req,
    })
    const role = current.get(id)
    if (!role && String(idOf(member.vaisseau)) !== String(doc.id)) continue
    const nextRole = role ?? 'passager'
    if (String(idOf(member.vaisseau)) === String(doc.id) && member.roleVaisseau === nextRole) continue
    await req.payload.update({
      collection: 'characters', id,
      data: { vaisseau: doc.id, roleVaisseau: nextRole },
      depth: 0, overrideAccess: true, req,
    })
  }
  return doc
}

/** Moving/disembarking a character releases their old assignments, including stale ones. */
export const syncCharacterShip: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const shipId = idOf(data.vaisseau !== undefined ? data.vaisseau : originalDoc?.vaisseau)
  const characterId = originalDoc?.id
  if (characterId && data.vaisseau !== undefined) {
    const { docs: ships } = await req.payload.find({
      collection: 'ships',
      where: { or: [
        { pilote: { equals: characterId } },
        { copilote: { equals: characterId } },
        { 'canonniers.personnage': { equals: characterId } },
      ] },
      depth: 0, pagination: false, overrideAccess: true, req,
    })
    for (const ship of ships) {
      if (String(ship.id) === String(shipId)) continue
      const previousContext = req.context
      try {
        await req.payload.update({
          collection: 'ships', id: ship.id,
          data: {
            pilote: Number(idOf(ship.pilote)) === characterId ? null : idOf(ship.pilote),
            copilote: Number(idOf(ship.copilote)) === characterId ? null : idOf(ship.copilote),
            canonniers: (ship.canonniers ?? []).filter((entry) => Number(idOf(entry.personnage)) !== characterId),
          },
          depth: 0, overrideAccess: true, req, context: { skipShipCrewSync: true },
        })
      } finally {
        // Payload merges nested context into req; keep the guard local to this write.
        req.context = previousContext
      }
    }
  }
  const ship = shipId == null ? null : await req.payload.findByID({
    collection: 'ships', id: shipId, depth: 0, overrideAccess: true, req,
  })
  data.roleVaisseau = ship ? assignedCrew(ship).get(characterId) ?? 'passager' : null
  return data
}
