import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), create: vi.fn(), find: vi.fn(), findByID: vi.fn(), update: vi.fn(),
  getActiveMode: vi.fn(), getActiveCharacter: vi.fn(), getOwnedCharacters: vi.fn(),
  setActiveCharacterCookie: vi.fn(), revalidatePath: vi.fn(), canMJManageCharacter: vi.fn(),
  execute: vi.fn(), beginTransaction: vi.fn(), commitTransaction: vi.fn(), rollbackTransaction: vi.fn(),
}))
vi.mock('payload', () => ({ getPayload: async () => ({
  auth: mocks.auth, create: mocks.create, find: mocks.find, findByID: mocks.findByID, update: mocks.update,
  db: { beginTransaction: mocks.beginTransaction, commitTransaction: mocks.commitTransaction,
    rollbackTransaction: mocks.rollbackTransaction, execute: mocks.execute, sessions: { tx: { db: {} } } },
}) }))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: async () => ({ get: vi.fn() }) }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/activeMode', () => ({ getActiveMode: mocks.getActiveMode, isMJMode: async () => false }))
vi.mock('@/lib/activeCharacter', () => ({
  getActiveCharacter: mocks.getActiveCharacter, getOwnedCharacters: mocks.getOwnedCharacters,
  setActiveCharacterCookie: mocks.setActiveCharacterCookie, clearActiveCharacterCookie: vi.fn(),
  ACTIVE_CHARACTER_COOKIE: 'space-squad-character',
}))
vi.mock('@/lib/mjAccess', () => ({ canMJManageCharacter: mocks.canMJManageCharacter, getMJGroupIds: async () => [] }))
vi.mock('@/lib/temporaryCharacterWorkspace', () => ({
  getWorkspaceFromCookie: async () => null, consumeWorkspaceRequest: vi.fn(),
  TEMP_WORKSPACE_MAX_ARRAY_ITEMS: 100, TEMP_WORKSPACE_MAX_CUSTOM_SKILLS: 10, TEMP_WORKSPACE_MAX_PAYLOAD_BYTES: 100000,
}))

import { createOwnedCharacter, selectOwnedCharacter } from '@/app/(frontend)/mes-personnages/actions'
import { joinSquadWithCode } from '@/app/(frontend)/escouade/actions'
import { updateCharacter, updateCharacterInEditMode } from '@/app/(frontend)/characters/[id]/actions'

const mj = { id: 7, role: 'player', isMJ: true }
const npc = { id: 20, user: 7, typePersonnage: 'pnj', creationEtape: 'termine', groupe: null }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: mj })
  mocks.getActiveMode.mockResolvedValue('player')
  mocks.getOwnedCharacters.mockResolvedValue([])
  mocks.getActiveCharacter.mockResolvedValue({ id: 20 })
  mocks.beginTransaction.mockResolvedValue('tx')
  mocks.commitTransaction.mockResolvedValue(undefined)
  mocks.rollbackTransaction.mockResolvedValue(undefined)
  mocks.create.mockResolvedValue(npc)
  mocks.findByID.mockResolvedValue(npc)
  mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: collection === 'groups' ? [{ id: 30, creator: 7 }] : [],
  }))
  mocks.canMJManageCharacter.mockResolvedValue(false)
})

describe('character creation types', () => {
  it('creates a normal player through the usual wizard even for an MJ', async () => {
    const result = await createOwnedCharacter()
    expect(result).toMatchObject({ success: true, href: '/character' })
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { user: 7, typePersonnage: 'joueur', creationEtape: 'caracteristiques' },
    }))
  })

  it.each(['player', 'mj'])('creates a blank completed NPC for an MJ in %s mode', async (mode) => {
    mocks.getActiveMode.mockResolvedValue(mode)
    expect(await createOwnedCharacter('pnj')).toMatchObject({ success: true, href: '/characters/20?edit=1' })
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { user: 7, typePersonnage: 'pnj', creationEtape: 'termine' },
    }))
    expect(mocks.setActiveCharacterCookie).toHaveBeenCalledWith(20)
    expect(mocks.commitTransaction).toHaveBeenCalledWith('tx')
  })

  it('rejects NPC creation for an ordinary player', async () => {
    mocks.auth.mockResolvedValue({ user: { ...mj, isMJ: false } })
    expect(await createOwnedCharacter('pnj')).toMatchObject({ success: false })
    expect(mocks.beginTransaction).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid type submitted directly', async () => {
    expect(await createOwnedCharacter('invalid' as 'pnj')).toMatchObject({ success: false })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('keeps the usual creation restricted to player mode', async () => {
    mocks.getActiveMode.mockResolvedValue('mj')
    expect(await createOwnedCharacter()).toMatchObject({ success: false })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it.each([
    { players: 5, npcs: 0, type: 'joueur', success: false },
    { players: 4, npcs: 10, type: 'joueur', success: true },
    { players: 5, npcs: 9, type: 'pnj', success: true },
    { players: 0, npcs: 10, type: 'pnj', success: false },
    { players: 0, npcs: 10, type: 'joueur', success: true },
    { players: 5, npcs: 10, type: 'joueur', success: false },
    { players: 5, npcs: 10, type: 'pnj', success: false },
  ] as const)('enforces independent MJ slots: %j', async ({ players, npcs, type, success }) => {
    mocks.getOwnedCharacters.mockResolvedValue([
      ...Array.from({ length: players }, (_, id) => ({ id, typePersonnage: 'joueur' })),
      ...Array.from({ length: npcs }, (_, id) => ({ id: id + players, typePersonnage: 'pnj' })),
    ])
    const result = await createOwnedCharacter(type)
    expect(result).toMatchObject({ success })
    if (success) {
      expect(mocks.create).toHaveBeenCalledTimes(1)
      expect(mocks.commitTransaction).toHaveBeenCalledWith('tx')
    } else {
      expect(result.error).toBe(type === 'pnj' ? 'Vous avez atteint la limite de dix PNJ.' : 'Vous avez atteint la limite de cinq personnages Joueur.')
      expect(mocks.create).not.toHaveBeenCalled()
      expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx')
    }
  })

  it('keeps ordinary accounts limited to five characters', async () => {
    mocks.auth.mockResolvedValue({ user: { ...mj, isMJ: false } })
    mocks.getOwnedCharacters.mockResolvedValue(Array.from({ length: 5 }, (_, id) => ({ id })))
    expect(await createOwnedCharacter()).toMatchObject({ success: false, error: 'Vous avez atteint la limite de cinq personnages.' })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('counts legacy characters without a type as player characters', async () => {
    mocks.getOwnedCharacters.mockResolvedValue(Array.from({ length: 5 }, (_, id) => ({ id })))
    expect(await createOwnedCharacter()).toMatchObject({ success: false, error: 'Vous avez atteint la limite de cinq personnages Joueur.' })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('opens an owned NPC directly when selected in MJ mode', async () => {
    mocks.getActiveMode.mockResolvedValue('mj')
    mocks.getOwnedCharacters.mockResolvedValue([npc])
    expect(await selectOwnedCharacter(20)).toMatchObject({ success: true, href: '/characters/20' })
  })
})

describe('joining squads', () => {
  it.each(['joueur', undefined])('rejects a player or legacy character joining its owner’s squad: %s', async (typePersonnage) => {
    mocks.findByID.mockResolvedValue({ ...npc, typePersonnage })
    expect(await joinSquadWithCode('ABCDEFGH')).toMatchObject({ success: false, error: expect.stringContaining('Utilisez un PNJ') })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.commitTransaction).not.toHaveBeenCalled()
    expect(mocks.rollbackTransaction).toHaveBeenCalledWith('tx')
  })

  it('allows an NPC to join its owner’s squad', async () => {
    expect(await joinSquadWithCode('ABCDEFGH')).toMatchObject({ success: true })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 20, data: { groupe: 30, vaisseau: null, roleVaisseau: null },
    }))
  })

  it('allows a player character to join another MJ’s squad', async () => {
    mocks.findByID.mockResolvedValue({ ...npc, typePersonnage: 'joueur' })
    mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({ docs: collection === 'groups' ? [{ id: 30, creator: 8 }] : [] }))
    expect(await joinSquadWithCode('ABCDEFGH')).toMatchObject({ success: true })
    expect(mocks.update).toHaveBeenCalled()
  })

  it('keeps NPC joining idempotent', async () => {
    mocks.findByID.mockResolvedValue({ ...npc, groupe: 30 })
    expect(await joinSquadWithCode('ABCDEFGH')).toEqual({ success: true, unchanged: true })
    expect(mocks.update).not.toHaveBeenCalled()
  })
})

describe('editing owned NPCs', () => {
  it.each(['player', 'mj'])('allows full editing without a squad in %s mode', async (mode) => {
    mocks.getActiveMode.mockResolvedValue(mode)
    expect(await updateCharacterInEditMode(20, {
      nom: '  PNJ témoin  ', force: 12, konis: 100, coachingForceLabel: '  Endurance  ', coachingForceMax: '3',
    })).toEqual({ success: true })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 20, data: { nom: 'PNJ témoin', force: 12, konis: 100, coachingForceLabel: 'Endurance', coachingForceMax: 3 },
    }))
  })

  it.each([-1, 1.5])('rejects invalid coaching maximum %s', async (coachingForceMax) => {
    await expect(updateCharacterInEditMode(20, { coachingForceMax })).rejects.toThrow('Maximum de coaching invalide')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it.each([
    { ...npc, user: 8 },
    { ...npc, typePersonnage: 'joueur' },
  ])('does not grant full editing to other characters: %j', async (character) => {
    mocks.findByID.mockResolvedValue(character)
    await expect(updateCharacterInEditMode(20, { force: 12 })).rejects.toThrow()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('does not let a non-MJ owner use full NPC editing', async () => {
    mocks.auth.mockResolvedValue({ user: { ...mj, isMJ: false } })
    await expect(updateCharacterInEditMode(20, { force: 12 })).rejects.toThrow('réservé')
  })

  it('blocks changing type or membership through the full editor', async () => {
    await expect(updateCharacterInEditMode(20, { typePersonnage: 'joueur' })).rejects.toThrow('ces champs')
    await expect(updateCharacterInEditMode(20, { groupe: 30 })).rejects.toThrow('ces champs')
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('strips ownership, type, group and wizard changes from ordinary updates', async () => {
    await updateCharacter(20, { typePersonnage: 'joueur', user: 8, groupe: 30, creationEtape: 'caracteristiques', nom: 'PNJ' })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { nom: 'PNJ' } }))
  })
})

describe.each([
  ['ordinary save', updateCharacter],
  ['edit mode', updateCharacterInEditMode],
] as const)('unequipping equipment through %s', (_mode, save) => {
  it.each(['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'])(
    'clears %s while preserving the weapon state in inventory', async (slot) => {
      const weapon = { item: 31, mods: [42], munitionsActuelles: 7, chargeurRelie: 53 }
      mocks.findByID.mockResolvedValue({ ...npc, [slot]: weapon })
      mocks.find.mockImplementation(async ({ collection }: { collection: string }) => ({
        docs: collection === 'weapons' ? [{ id: 31 }] : collection === 'mods' ? [{ id: 42 }] : [{ id: 53 }],
      }))

      await save(20, { [slot]: null, inventaireArmes: [weapon] })

      expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
        collection: 'characters',
        data: expect.objectContaining({
          [slot]: { item: null, customItem: null, mods: [], munitionsActuelles: 0, chargeurRelie: null },
          inventaireArmes: [weapon],
        }),
      }))
    },
  )

  it.each(['armureTete', 'armureTorse', 'armureBras', 'armureJambes', 'armureBackpack'])(
    'clears %s without leaving its previous relationships', async (slot) => {
      mocks.findByID.mockResolvedValue({ ...npc, [slot]: { item: 31, mods: [42] } })

      await save(20, { [slot]: null })

      expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ [slot]: { item: null, customItem: null, mods: [] } }),
      }))
    },
  )

  it('returns a custom weapon to its reserve and saves its ammo before clearing the slot', async () => {
    const weapon = { item: null, customItem: 31, mods: [42], munitionsActuelles: 7, chargeurRelie: 53 }
    mocks.findByID.mockImplementation(async ({ collection }: { collection: string }) => collection === 'characters'
      ? { ...npc, armePrincipale: weapon, inventaireEquipementsCustom: [] }
      : { id: 31, categorieEquipement: 'arme', proprietaireActuel: 20 })

    await save(20, { armePrincipale: null })

    expect(mocks.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'custom-equipment', id: 31,
      data: { munitionsActuelles: 7, chargeurRelie: 53 },
    }))
    expect(mocks.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'characters',
      data: {
        armePrincipale: { item: null, customItem: null, mods: [], munitionsActuelles: 0, chargeurRelie: null },
        inventaireEquipementsCustom: [31],
      },
    }))
  })

  it('preserves partial equipment updates and nullable non-group relationships', async () => {
    await save(20, { armePrincipale: { munitionsActuelles: 3 }, puceMk1: null })

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { armePrincipale: { munitionsActuelles: 3 }, puceMk1: null, inventaireEquipementsCustom: [] },
    }))
  })
})
