import { describe, expect, it } from 'vitest'
import {
  applySeatChange,
  isSeatFree,
  listSeats,
  normalizeCanonniers,
  roleForSeat,
  seatOf,
  seatOccupant,
  withSeatChange,
} from '@/lib/shipCrew'
import { checkSeatChange, computeShipAccess } from '@/lib/shipAccess'

const chassis = { nom: 'Corvette', classe: 'beta', tourelles: 2, pointsEmportPilote: 2, blindage: 25, esquiveBase: 12 }
const baseShip = { id: 7, modele: { chassis }, proprietaire: 1, pilote: 1, copilote: 2, canonniers: [{ personnage: 3, tourelle: 1 }] }

describe('places d’équipage', () => {
  it('expose une place par poste du châssis, passagers exclus', () => {
    const seats = listSeats(baseShip)
    expect(seats.map((seat) => seat.key)).toEqual(['pilote', 'copilote', 'canonnier:1', 'canonnier:2'])
    expect(seats.map((seat) => seat.occupantId)).toEqual([1, 2, 3, null])
  })

  it('résout la place d’un personnage et l’occupant d’une place', () => {
    expect(seatOf(baseShip, 3)).toBe('canonnier:1')
    expect(seatOf(baseShip, 99)).toBe('passager')
    expect(seatOccupant(baseShip, 'copilote')).toBe(2)
    expect(isSeatFree(baseShip, 'canonnier:2')).toBe(true)
    expect(isSeatFree(baseShip, 'canonnier:1')).toBe(false)
  })

  it('purge les canonniers hors bornes et les doublons', () => {
    const ship = {
      ...baseShip,
      canonniers: [
        { personnage: 3, tourelle: 1 },
        { personnage: 4, tourelle: 1 },
        { personnage: 5, tourelle: 9 },
        { personnage: 3, tourelle: 2 },
        { personnage: 6, tourelle: 2 },
      ],
    }
    expect(normalizeCanonniers(ship)).toEqual([
      { personnage: 3, tourelle: 1 },
      { personnage: 6, tourelle: 2 },
    ])
  })

  it('affecte un passager à une place libre', () => {
    const change = applySeatChange(baseShip, 4, 'canonnier:2')
    expect(change.canonniers).toEqual([
      { personnage: 3, tourelle: 1 },
      { personnage: 4, tourelle: 2 },
    ])
    expect(change.pilote).toBe(1)
    expect(change.roleUpdates).toEqual([{ characterId: 4, role: 'canonnier' }])
  })

  it('échange les places quand la place visée est occupée', () => {
    const change = applySeatChange(baseShip, 3, 'pilote')
    expect(change.pilote).toBe(3)
    expect(change.canonniers).toEqual([{ personnage: 1, tourelle: 1 }])
    expect(change.roleUpdates).toEqual([
      { characterId: 3, role: 'pilote' },
      { characterId: 1, role: 'canonnier' },
    ])
  })

  it('renvoie l’occupant chez les passagers quand l’échange est désactivé', () => {
    const change = applySeatChange(baseShip, 3, 'pilote', { swap: false })
    expect(change.pilote).toBe(3)
    expect(change.canonniers).toEqual([])
    expect(change.roleUpdates).toContainEqual({ characterId: 1, role: 'passager' })
  })

  it('libère la place d’un personnage qui redevient passager', () => {
    const change = applySeatChange(baseShip, 1, 'passager')
    expect(change.pilote).toBeNull()
    expect(change.copilote).toBe(2)
    expect(seatOf(withSeatChange(baseShip, change), 1)).toBe('passager')
    expect(roleForSeat('passager')).toBe('passager')
  })

  it('ne duplique pas la place quand un personnage reprend la sienne', () => {
    const change = applySeatChange(baseShip, 3, 'canonnier:1')
    expect(change.canonniers).toEqual([{ personnage: 3, tourelle: 1 }])
    expect(change.roleUpdates).toEqual([{ characterId: 3, role: 'canonnier' }])
  })
})

describe('droits sur un vaisseau', () => {
  const access = (character: { id: number; vaisseau?: number; groupe?: number }) =>
    computeShipAccess({ ship: baseShip, character, groupShipIds: [7] })

  it('donne tous les droits au propriétaire', () => {
    const rights = access({ id: 1, vaisseau: 7, groupe: 1 })
    expect(rights).toMatchObject({ isOwner: true, canRead: true, canEdit: true, canManageCrew: true })
  })

  it('donne tous les droits à l’admin même hors groupe', () => {
    const rights = computeShipAccess({ ship: baseShip, character: null, isAdmin: true })
    expect(rights).toMatchObject({ canRead: true, canEdit: true, canManageCrew: true })
  })

  it('donne l’édition à un membre posté, sans gestion de l’équipage', () => {
    const rights = access({ id: 3, vaisseau: 7, groupe: 1 })
    expect(rights).toMatchObject({ seat: 'canonnier:1', canRead: true, canEdit: true, canManageCrew: false })
  })

  it('limite un passager à la lecture', () => {
    const rights = access({ id: 9, vaisseau: 7, groupe: 1 })
    expect(rights).toMatchObject({ seat: 'passager', canRead: true, canEdit: false, canJoin: false })
  })

  it('autorise un personnage du groupe à lire et à rejoindre', () => {
    const rights = access({ id: 9, vaisseau: 8, groupe: 1 })
    expect(rights).toMatchObject({ canRead: true, canEdit: false, canJoin: true, isAboard: false })
  })

  it('refuse tout accès hors groupe', () => {
    const rights = computeShipAccess({ ship: baseShip, character: { id: 9, vaisseau: 8 }, groupShipIds: [8] })
    expect(rights).toMatchObject({ canRead: false, canEdit: false, canJoin: false })
  })
})

describe('contrôle des affectations', () => {
  const owner = { canEdit: true, canManageCrew: true }
  const posted = { canEdit: true, canManageCrew: false }
  const passenger = { canEdit: false, canManageCrew: false }

  it('laisse le propriétaire affecter n’importe qui, même sur une place occupée', () => {
    expect(checkSeatChange(owner, baseShip, 1, 3, 'pilote')).toBeNull()
    expect(checkSeatChange(owner, baseShip, 1, 2, 'passager')).toBeNull()
  })

  it('laisse un membre posté prendre une place libre ou redevenir passager', () => {
    expect(checkSeatChange(posted, baseShip, 3, 3, 'canonnier:2')).toBeNull()
    expect(checkSeatChange(posted, baseShip, 3, 3, 'passager')).toBeNull()
  })

  it('refuse à un membre posté une place occupée', () => {
    expect(checkSeatChange(posted, baseShip, 3, 3, 'pilote')).toMatch(/déjà occupé/)
  })

  it('refuse à un membre posté d’affecter quelqu’un d’autre', () => {
    expect(checkSeatChange(posted, baseShip, 3, 9, 'canonnier:2')).toMatch(/propriétaire/)
  })

  it('refuse toute affectation à un passager', () => {
    expect(checkSeatChange(passenger, baseShip, 9, 9, 'canonnier:2')).toMatch(/droits/)
  })

  it('refuse une place inexistante sur le châssis', () => {
    expect(checkSeatChange(owner, baseShip, 1, 3, 'canonnier:5')).toMatch(/n'existe pas/)
  })
})
