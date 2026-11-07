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
