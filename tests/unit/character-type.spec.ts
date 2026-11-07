import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assertCharacterCanJoinSquad, canEditOwnedNPC, validateCharacterSquadMembership } from '@/lib/characterType'

const findByID = vi.fn()
const req = { transactionID: 'tx', payload: { findByID } }
const validate = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
  validateCharacterSquadMembership({ data, originalDoc, req } as unknown as Parameters<typeof validateCharacterSquadMembership>[0])

beforeEach(() => {
  vi.clearAllMocks()
  findByID.mockResolvedValue({ id: 30, creator: { id: 7 } })
})

describe('character squad validation', () => {
  it('rejects player membership using populated or unpopulated ownership relations', () => {
    expect(() => assertCharacterCanJoinSquad({ user: { id: 7 }, typePersonnage: 'joueur' }, { creator: '7' })).toThrow('PNJ dédié')
    expect(() => assertCharacterCanJoinSquad({ user: 7 }, { creator: { id: 7 } })).toThrow('PNJ dédié')
  })

  it('blocks direct collection assignment to the owner’s squad', async () => {
    await expect(validate({ groupe: 30 }, { user: 7, typePersonnage: 'joueur' })).rejects.toThrow('PNJ dédié')
    expect(findByID).toHaveBeenCalledWith({ collection: 'groups', id: '30', depth: 0, overrideAccess: true, req })
  })

  it('checks membership when creating an already assigned player', async () => {
    await expect(validate({ groupe: 30, user: 7, typePersonnage: 'joueur' })).rejects.toThrow('PNJ dédié')
  })

  it('allows direct NPC assignment to its owner’s squad', async () => {
    const data = { groupe: 30, user: 7, typePersonnage: 'pnj' }
    expect(await validate(data)).toEqual(data)
  })

  it('blocks converting an assigned NPC to a player in its owner’s squad', async () => {
    await expect(validate({ typePersonnage: 'joueur' }, { groupe: 30, user: 7, typePersonnage: 'pnj' })).rejects.toThrow('PNJ dédié')
  })

  it('blocks transferring an assigned player to the squad’s MJ', async () => {
    await expect(validate({ user: 7 }, { groupe: 30, user: 8, typePersonnage: 'joueur' })).rejects.toThrow('PNJ dédié')
  })

  it('permits leaving an old squad and does not interfere with ordinary sheet updates', async () => {
    expect(await validate({ groupe: null }, { groupe: 30, user: 7 })).toEqual({ groupe: null })
    expect(await validate({ nom: 'Nouveau nom' }, { groupe: 30, user: 7 })).toEqual({ nom: 'Nouveau nom' })
    expect(findByID).not.toHaveBeenCalled()
  })
})

describe('owned NPC editing', () => {
  it('authorizes an MJ’s dedicated NPC without requiring a squad or active mode', () => {
    expect(canEditOwnedNPC({ id: 7, role: 'player', isMJ: true }, { user: { id: 7 }, typePersonnage: 'pnj' })).toBe(true)
  })

  it('never promotes an ordinary player character, another owner’s NPC or a non-MJ', () => {
    expect(canEditOwnedNPC({ id: 7, isMJ: true }, { user: 7, typePersonnage: 'joueur' })).toBe(false)
    expect(canEditOwnedNPC({ id: 7, isMJ: true }, { user: 8, typePersonnage: 'pnj' })).toBe(false)
    expect(canEditOwnedNPC({ id: 7, isMJ: false }, { user: 7, typePersonnage: 'pnj' })).toBe(false)
    expect(canEditOwnedNPC(null, { user: 7, typePersonnage: 'pnj' })).toBe(false)
  })
})
