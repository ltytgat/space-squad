import { idOf } from './shipStats'
import { isSeatFree, listSeats, roleForSeat, seatOf, type SeatKey } from './shipCrew'

/**
 * Droits d'un utilisateur (via son personnage unique) sur un vaisseau.
 *
 * - Lecture : tous les vaisseaux de son groupe (plus celui où il est embarqué).
 * - Édition de la fiche : s'il occupe une place autre que passager, ou s'il est
 *   propriétaire du vaisseau.
 * - Gestion libre des affectations : propriétaire uniquement (et admin).
 * - Un personnage posté ne peut déplacer que lui-même, et seulement vers une
 *   place libre ; les passagers attendent une affectation du propriétaire.
 */

export type ShipAccess = {
  isAdmin: boolean
  isOwner: boolean
  isAboard: boolean
  seat: SeatKey
  canRead: boolean
  canEdit: boolean
  canManageCrew: boolean
  canJoin: boolean
}

export function computeShipAccess({
  ship,
  character,
  isAdmin = false,
  groupShipIds = [],
}: {
  ship: any
  character: any
  isAdmin?: boolean
  groupShipIds?: (number | string)[]
}): ShipAccess {
  const shipId = idOf(ship)
  const characterId = character ? idOf(character) : null
  const isOwner = Boolean(
    characterId !== null && ship?.proprietaire && String(idOf(ship.proprietaire)) === String(characterId),
  )
  const isAboard = Boolean(
    characterId !== null && character?.vaisseau && String(idOf(character.vaisseau)) === String(shipId),
  )
  const seat = isAboard ? seatOf(ship, characterId) : ('passager' as SeatKey)
  const inGroup = groupShipIds.some((id) => String(id) === String(shipId))
  const canRead = isAdmin || isOwner || isAboard || inGroup
  const canManageCrew = isAdmin || isOwner

  return {
    isAdmin,
    isOwner,
    isAboard,
    seat,
    canRead,
    canManageCrew,
    canEdit: canManageCrew || (isAboard && roleForSeat(seat) !== 'passager'),
    // On ne rejoint que depuis un vaisseau du groupe où l'on n'est pas déjà.
    canJoin: Boolean(characterId !== null && !isAboard && (inGroup || isOwner)),
  }
}

/**
 * Vérifie qu'une affectation est permise. Renvoie le message d'erreur à
 * remonter, ou `null` si le changement est autorisé.
 *
 * Le propriétaire (et l'admin) affecte librement. Un membre simplement posté ne
 * déplace que lui-même, et seulement vers une place libre — ou vers les
 * passagers, ce qui lui fait perdre l'édition.
 */
export function checkSeatChange(
  rights: Pick<ShipAccess, 'canEdit' | 'canManageCrew'>,
  ship: any,
  viewerCharacterId: unknown,
  characterId: unknown,
  seat: string,
): string | null {
  if (roleForSeat(seat) !== 'passager' && !listSeats(ship).some((entry) => entry.key === seat))
    return "Ce poste n'existe pas sur ce vaisseau"
  if (rights.canManageCrew) return null
  if (!rights.canEdit) return "Vous n'avez pas les droits sur ce vaisseau"
  if (String(characterId) !== String(idOf(viewerCharacterId)))
    return 'Seul le propriétaire peut affecter un autre membre'
  if (roleForSeat(seat) !== 'passager' && !isSeatFree(ship, seat))
    return 'Ce poste est déjà occupé'
  return null
}

/**
 * Équipage d'un vaisseau, limité aux champs utiles à la fiche : le nom, le rôle
 * miroir, et l'Habilité qui alimente le bonus d'esquive du pilote. On ne
 * renvoie pas la fiche complète des autres personnages.
 */
export async function findShipCrew(payload: any, shipId: number | string) {
  const { docs } = await payload.find({
    collection: 'characters',
    where: { vaisseau: { equals: shipId } },
    depth: 0,
    limit: 50,
    sort: 'nom',
    select: { nom: true, roleVaisseau: true, habilite: true, malusHabilite: true },
    overrideAccess: true,
  })
  return docs as any[]
}

/** Personnage unique de l'utilisateur connecté. */
export async function getViewerCharacter(payload: any, user: any) {
  if (!user) return null
  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  return (docs[0] as any) ?? null
}

/**
 * Vaisseaux accessibles au personnage : ceux appartenant à un membre de son
 * groupe, plus celui où il est actuellement embarqué.
 */
export async function findGroupShipIds(payload: any, character: any): Promise<number[]> {
  const ids = new Set<number>()
  const assignedShipId = idOf(character?.vaisseau)
  if (assignedShipId) ids.add(Number(assignedShipId))

  const groupId = idOf(character?.groupe)
  if (groupId) {
    const { docs: groupCharacters } = await payload.find({
      collection: 'characters',
      where: { groupe: { equals: groupId } },
      depth: 0,
      limit: 500,
      overrideAccess: true,
    })
    const ownerIds = groupCharacters.map((member: any) => member.id)
    if (ownerIds.length > 0) {
      const { docs: groupShips } = await payload.find({
        collection: 'ships',
        where: { proprietaire: { in: ownerIds } },
        depth: 0,
        limit: 200,
        overrideAccess: true,
      })
      for (const ship of groupShips as any[]) ids.add(Number(ship.id))
    }
  }
  return [...ids]
}

/**
 * Charge le vaisseau et calcule les droits de l'utilisateur courant.
 * `ship` est `null` si le vaisseau n'existe pas.
 */
export async function getShipAccess(
  payload: any,
  user: any,
  shipId: number,
  { depth = 4 }: { depth?: number } = {},
): Promise<ShipAccess & { ship: any; character: any }> {
  const isAdmin = user?.role === 'admin'
  const character = await getViewerCharacter(payload, user)

  let ship: any = null
  try {
    ship = await payload.findByID({ collection: 'ships', id: shipId, depth, overrideAccess: true })
  } catch {
    ship = null
  }
  if (!ship) {
    return {
      ...computeShipAccess({ ship: null, character, isAdmin }),
      canRead: false,
      canEdit: false,
      canManageCrew: false,
      canJoin: false,
      ship: null,
      character,
    }
  }

  const groupShipIds = character ? await findGroupShipIds(payload, character) : []
  return { ...computeShipAccess({ ship, character, isAdmin, groupShipIds }), ship, character }
}
