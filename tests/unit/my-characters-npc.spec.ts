import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ create: vi.fn(), save: vi.fn(), push: vi.fn() }))
vi.mock('@/app/(frontend)/mes-personnages/actions', () => ({
  createOwnedCharacter: mocks.create, selectOwnedCharacter: vi.fn(), deleteOwnedCharacter: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/app/(frontend)/characters/[id]/actions', () => ({
  updateCharacterInEditMode: mocks.save, updateCharacter: vi.fn(), updateCharacterNotes: vi.fn(),
  assignCharacterSkillPoint: vi.fn(), searchCharacterEditCatalog: vi.fn(), updateWeaponStatus: vi.fn(),
  reloadWeapon: vi.fn(), updateMalus: vi.fn(),
}))
import { CharacterClient } from '@/app/(frontend)/characters/[id]/CharacterClient'
import { MyCharactersClient } from '@/app/(frontend)/mes-personnages/MyCharactersClient'

const props = { characters: [], activeCharacterId: null, canCreate: true, canCreateNPC: false }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.create.mockResolvedValue({ success: false, error: 'Réessayez.' })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('NPC creation controls', () => {
  it.each([
    { players: 5, npcs: 0, playerDisabled: true, npcDisabled: false },
    { players: 4, npcs: 10, playerDisabled: false, npcDisabled: true },
    { players: 5, npcs: 9, playerDisabled: true, npcDisabled: false },
    { players: 5, npcs: 10, playerDisabled: true, npcDisabled: true },
  ])('displays independent MJ quotas and buttons: %j', ({ players, npcs, playerDisabled, npcDisabled }) => {
    const characters = Array.from({ length: players + npcs }, (_, id) => ({
      id: id + 1, typePersonnage: id < players ? 'joueur' as const : 'pnj' as const,
      nom: null, sexe: null, origine: null, affiliation: null,
      rank: 0, konis: 0, creationComplete: true, shipsCount: 0, vehiclesCount: 0,
    }))
    render(createElement(MyCharactersClient, { ...props, characters, canCreateNPC: true }))
    expect(screen.getByText(`Joueur : ${players} / 5 · PNJ : ${npcs} / 10`)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Créer un personnage' })).toHaveProperty('disabled', playerDisabled)
    expect(screen.getByRole('button', { name: 'Créer un PNJ vierge' })).toHaveProperty('disabled', npcDisabled)
  })

  it('shows the normal creation flow for an ordinary player', async () => {
    render(createElement(MyCharactersClient, props))
    expect(screen.queryByRole('button', { name: 'Créer un PNJ vierge' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Créer un personnage' }))
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith('joueur'))
    await screen.findByRole('status')
  })

  it('allows an MJ to choose a blank NPC even in MJ mode', async () => {
    render(createElement(MyCharactersClient, { ...props, canCreate: false, canCreateNPC: true }))
    expect(screen.getByRole('button', { name: 'Créer un personnage' })).toHaveProperty('disabled', true)
    const createNPC = screen.getByRole('button', { name: 'Créer un PNJ vierge' })
    expect(createNPC).toHaveProperty('disabled', false)
    fireEvent.click(createNPC)
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith('pnj'))
    await screen.findByRole('status')
  })
})


describe('blank NPC sheet', () => {
  it('renders the existing editor and saves the name and attributes of a blank NPC', async () => {
    vi.stubGlobal('alert', vi.fn())
    mocks.save.mockResolvedValue({ success: true })
    render(createElement(CharacterClient, {
      character: { id: 20, user: 7, typePersonnage: 'pnj', creationEtape: 'termine' },
      isAdmin: true, isOwner: true, editMode: true, factions: [], allBaseSkills: [], relatedShips: [], relatedVehicles: [],
    }))
    expect(screen.getByRole('heading', { name: 'PNJ sans nom' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Le mécano' } })
    fireEvent.change(screen.getByLabelText('Force'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(20, expect.objectContaining({ nom: 'Le mécano', force: 12 })))
  })
})
