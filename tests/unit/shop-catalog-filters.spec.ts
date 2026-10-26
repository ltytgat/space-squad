import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ShipyardClient } from '@/app/(frontend)/shop/chantier-naval/ShipyardClient'
import { GarageClient } from '@/app/(frontend)/shop/garage/GarageClient'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/(frontend)/shop/shipyard-actions', () => ({ executeShipyardTransaction: vi.fn() }))
vi.mock('@/app/(frontend)/shop/vehicle-garage-actions', () => ({ executeVehicleGarageTransaction: vi.fn() }))

afterEach(() => { cleanup(); vi.clearAllMocks() })

const shipModels = [
  { id: 1, nom: 'Aurore', prix: 100, classe: 'alpha', categorie: 'polyvalent', description: null, image: null, chassis: null, tourelles: 0, components: [], details: [] },
  { id: 2, nom: 'Éclair', prix: 200, classe: 'beta', categorie: 'combat', description: null, image: null, chassis: null, tourelles: 0, components: [], details: [] },
]

const vehicleModels = [
  { id: 1, nom: 'Rover', prix: 100, classe: 'alpha', varianteId: 1, variante: 'Buggy', position: '1', image: null, places: 2, emportsArmesPersonnages: 0, blindageMax: 2, bouclierMax: 0, rechargeBouclier: 0, mouvement: 5, options: [] },
  { id: 2, nom: 'Moto', prix: 200, classe: 'alpha', varianteId: 2, variante: 'Moto', position: '2', image: null, places: 1, emportsArmesPersonnages: 0, blindageMax: 1, bouclierMax: 0, rechargeBouclier: 0, mouvement: 8, options: [] },
  { id: 3, nom: 'Porteur', prix: 300, classe: 'beta', varianteId: 3, variante: 'Transport', position: '1', image: null, places: 4, emportsArmesPersonnages: 0, blindageMax: 3, bouclierMax: 0, rechargeBouclier: 0, mouvement: 4, options: [] },
]

describe('filtres et repli des catalogues d’achat', () => {
  it('filtre les vaisseaux par nom sans tenir compte des accents, classe et catégorie', () => {
    render(createElement(ShipyardClient, {
      character: { id: 1, nom: 'Joueur', konis: 1000, rang: 1 }, models: shipModels,
      ownedShips: [], writableShips: [], activeShipId: null,
    }))

    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'ecl' } })
    expect(screen.getByText('Éclair')).toBeTruthy()
    expect(screen.queryByText('Aurore')).toBeNull()

    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'combat' } })
    expect(screen.getByText('Éclair')).toBeTruthy()
    expect(screen.queryByText('Aurore')).toBeNull()

    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: 'alpha' } })
    expect(screen.getByRole('status').textContent).toContain('Aucun modèle ne correspond')
    fireEvent.click(screen.getAllByRole('button', { name: 'Effacer les filtres' })[0])
    expect(screen.getByText('Aurore')).toBeTruthy()
    expect(screen.getByText('Éclair')).toBeTruthy()
  })

  it('ouvre temporairement une classe repliée pendant le filtrage puis restaure son état', () => {
    render(createElement(ShipyardClient, {
      character: { id: 1, nom: 'Joueur', konis: 1000, rang: 1 }, models: shipModels,
      ownedShips: [], writableShips: [], activeShipId: null,
    }))

    fireEvent.click(screen.getAllByRole('button', { name: 'Replier' })[0])
    const alphaContent = document.getElementById('shipyard-class-content-alpha') as HTMLDivElement
    expect(alphaContent.hidden).toBe(true)

    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'aurore' } })
    expect(alphaContent.hidden).toBe(false)
    expect((screen.getByRole('button', { name: 'Replier' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }))
    expect(alphaContent.hidden).toBe(true)
  })

  it('filtre les véhicules par classe, variante et nom', () => {
    render(createElement(GarageClient, {
      character: { id: 1, nom: 'Joueur', konis: 1000, rang: 1 }, models: vehicleModels,
      vehicles: [], activeShipName: null, activeShipCanReceive: false,
    }))

    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: 'beta' } })
    expect(screen.getByText('Porteur')).toBeTruthy()
    expect(screen.queryByText('Rover')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }))
    fireEvent.change(screen.getByLabelText('Variante'), { target: { value: 'id:1' } })
    const visibleModelNames = Array.from(document.querySelectorAll('.garage-model-card .shipyard-model-heading h3')).map((heading) => heading.textContent)
    expect(visibleModelNames).toEqual(['Rover'])

    fireEvent.change(screen.getByLabelText('Nom du modèle'), { target: { value: 'absent' } })
    expect(screen.getByRole('status').textContent).toContain('Aucun modèle ne correspond')
  })
})
