import { getShipLimits, idOf, type ShipRecord } from './shipStats'

/**
 * Places d'équipage d'un vaisseau.
 *
 * Le vaisseau est la source de vérité : `pilote`, `copilote` et `canonniers`
 * définissent les places. `characters.roleVaisseau` n'en est qu'un miroir
 * dénormalisé, resynchronisé par `applySeatChange`.
 *
 * Places disponibles : 1 pilote, 1 copilote, 1 canonnier par tourelle du
 * châssis, et un nombre illimité de passagers.
 */

export type CrewRole = 'pilote' | 'copilote' | 'canonnier' | 'passager'
export type SeatKey = 'pilote' | 'copilote' | 'passager' | `canonnier:${number}`

export type Seat = {
  key: SeatKey
  label: string
  role: CrewRole
  turret?: number
  occupantId: number | null
}

export type CanonnierEntry = { personnage: any; tourelle: any }

export type SeatChange = {
  pilote: number | null
  copilote: number | null
  canonniers: { personnage: number; tourelle: number }[]
  /** Rôles à réécrire sur les personnages concernés. */
  roleUpdates: { characterId: number; role: CrewRole }[]
}

const sameId = (left: unknown, right: unknown) =>
  left !== null && left !== undefined && String(idOf(left)) === String(idOf(right))

export const turretSeatKey = (turret: number): SeatKey => `canonnier:${turret}`

export function parseSeatKey(seat: string): { role: CrewRole; turret?: number } {
  const [role, turretValue] = String(seat).split(':')
  if (role === 'canonnier') return { role: 'canonnier', turret: Number(turretValue) }
  if (role === 'pilote' || role === 'copilote') return { role }
  return { role: 'passager' }
}

export const roleForSeat = (seat: string): CrewRole => parseSeatKey(seat).role

/**
 * Canonniers valides : tourelle dans les bornes du châssis, un seul canonnier
 * par tourelle et un seul poste par personnage (la première occurrence gagne).
 */
export function normalizeCanonniers(ship: ShipRecord): { personnage: number; tourelle: number }[] {
  const { turretCount } = getShipLimits(ship)
  const seenTurrets = new Set<number>()
  const seenCharacters = new Set<string>()
  const result: { personnage: number; tourelle: number }[] = []
  for (const entry of (ship?.canonniers ?? []) as CanonnierEntry[]) {
    const turret = Number(entry?.tourelle)
    const characterId = idOf(entry?.personnage)
    if (!Number.isInteger(turret) || turret < 1 || turret > turretCount) continue
    if (characterId === null || characterId === undefined || characterId === '') continue
    if (seenTurrets.has(turret) || seenCharacters.has(String(characterId))) continue
    seenTurrets.add(turret)
    seenCharacters.add(String(characterId))
    result.push({ personnage: Number(characterId), tourelle: turret })
  }
  return result.sort((left, right) => left.tourelle - right.tourelle)
}

/** Places fixes du vaisseau, dans l'ordre d'affichage. Les passagers en sont exclus. */
export function listSeats(ship: ShipRecord): Seat[] {
  const { turretCount } = getShipLimits(ship)
  const canonniers = normalizeCanonniers(ship)
  return [
    {
      key: 'pilote' as SeatKey,
      label: 'Pilote',
      role: 'pilote' as CrewRole,
      occupantId: idOf(ship?.pilote) ?? null,
    },
    {
      key: 'copilote' as SeatKey,
      label: 'Copilote',
      role: 'copilote' as CrewRole,
      occupantId: idOf(ship?.copilote) ?? null,
    },
    ...Array.from({ length: Math.max(0, turretCount) }, (_, index) => {
      const turret = index + 1
      return {
        key: turretSeatKey(turret),
        label: `Canonnier · Tourelle ${turret}`,
        role: 'canonnier' as CrewRole,
        turret,
        occupantId: canonniers.find((entry) => entry.tourelle === turret)?.personnage ?? null,
      }
    }),
  ]
}

/** Place occupée par un personnage, `'passager'` s'il n'occupe aucune place. */
export function seatOf(ship: ShipRecord, characterId: unknown): SeatKey {
  return listSeats(ship).find((seat) => sameId(seat.occupantId, characterId))?.key ?? 'passager'
}

/** Personnage occupant une place, ou `null` si elle est libre. */
export function seatOccupant(ship: ShipRecord, seat: string): number | null {
  if (roleForSeat(seat) === 'passager') return null
  return listSeats(ship).find((entry) => entry.key === seat)?.occupantId ?? null
}

export const isSeatFree = (ship: ShipRecord, seat: string) => seatOccupant(ship, seat) === null

export function seatLabel(ship: ShipRecord, seat: string): string {
  if (roleForSeat(seat) === 'passager') return 'Passager'
  return listSeats(ship).find((entry) => entry.key === seat)?.label ?? 'Passager'
}

/**
 * Affecte `characterId` à `seat` et renvoie les valeurs à écrire sur le
 * vaisseau, plus les `roleVaisseau` à resynchroniser.
 *
 * Si la place visée est occupée : avec `swap`, l'occupant récupère la place
 * quittée par `characterId` ; sinon il est renvoyé chez les passagers.
 */
export function applySeatChange(
  ship: ShipRecord,
  characterId: number,
  seat: string,
  { swap = true }: { swap?: boolean } = {},
): SeatChange {
  const target = parseSeatKey(seat)
  const previousSeat = seatOf(ship, characterId)
  const displacedId = seatOccupant(ship, seat)
  const displacedSeat = swap && !sameId(displacedId, characterId) ? previousSeat : 'passager'

  const assignments = new Map<SeatKey, number | null>()
  for (const entry of listSeats(ship)) assignments.set(entry.key, entry.occupantId)

  // Libère la place courante des deux personnages avant de (ré)affecter.
  for (const [key, occupant] of assignments)
    if (sameId(occupant, characterId) || (displacedId !== null && sameId(occupant, displacedId)))
      assignments.set(key, null)

  if (target.role !== 'passager') assignments.set(seat as SeatKey, Number(characterId))
  if (displacedId !== null && !sameId(displacedId, characterId) && displacedSeat !== 'passager')
    assignments.set(displacedSeat as SeatKey, Number(displacedId))

  const canonniers = [...assignments]
    .map(([key, occupant]) => ({ ...parseSeatKey(key), occupant }))
    .filter((entry) => entry.role === 'canonnier' && entry.occupant !== null)
    .map((entry) => ({ personnage: Number(entry.occupant), tourelle: Number(entry.turret) }))
    .sort((left, right) => left.tourelle - right.tourelle)

  const roleUpdates: { characterId: number; role: CrewRole }[] = [
    { characterId: Number(characterId), role: target.role },
  ]
  if (displacedId !== null && !sameId(displacedId, characterId))
    roleUpdates.push({ characterId: Number(displacedId), role: roleForSeat(displacedSeat) })

  return {
    pilote: assignments.get('pilote') ?? null,
    copilote: assignments.get('copilote') ?? null,
    canonniers,
    roleUpdates,
  }
}

/** Applique un `SeatChange` sur une copie du vaisseau (affichage optimiste). */
export function withSeatChange(ship: ShipRecord, change: SeatChange): ShipRecord {
  return {
    ...ship,
    pilote: change.pilote,
    copilote: change.copilote,
    canonniers: change.canonniers,
  }
}
