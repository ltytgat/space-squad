import { createElement } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { HeatRedistribution } from '@/app/(frontend)/ship/HeatRedistribution'
import { ShipClient } from '@/app/(frontend)/ship/ShipClient'
import * as actions from '@/app/(frontend)/ship/actions'

vi.mock('@/app/(frontend)/ship/actions', () => ({
  assignCrewSeat: vi.fn(), disembarkCrewMember: vi.fn(), joinShip: vi.fn(),
  updateShipConfiguration: vi.fn(), updateShipState: vi.fn(),
  updateShipTurretWeaponState: vi.fn(), updateShipWeaponState: vi.fn(), logShipAmmoState: vi.fn(),
}))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

const targets = [
  { key: 'pilot', label: 'Pilote · Laser', heat: 20, maxHeat: 100 },
  { key: 'turret', label: 'Tourelle 1 · Plasma', heat: 0, maxHeat: 500 },
]

describe('redirection locale de la chaleur', () => {
  it('répartit entre plusieurs armes sans dépasser le budget et autorise les décimales', () => {
    const onApply = vi.fn()
    render(createElement(HeatRedistribution, { targets, budget: 150.5, initial: {}, onApply, onClose: vi.fn() }))
    fireEvent.click(screen.getByLabelText('Pilote · Laser'))
    fireEvent.click(screen.getByLabelText('Tourelle 1 · Plasma'))
    fireEvent.change(screen.getByLabelText('MJ pour Pilote · Laser'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Chaleur pour Tourelle 1 · Plasma'), { target: { value: '120' } })
    expect(screen.getByText('150.5 MJ répartis · 0 MJ non redirigés')).toBeTruthy()
    expect(screen.getByText('Capacité de la cartouche dépassée de 20 MJ')).toBeTruthy()
    fireEvent.click(screen.getByText('Appliquer'))
    expect(onApply).toHaveBeenCalledWith({ pilot: 100, turret: 50.5 })
  })

  it('annule sans appliquer et permet de désélectionner une arme', () => {
    const onApply = vi.fn(), onClose = vi.fn()
    render(createElement(HeatRedistribution, { targets, budget: 200, initial: { pilot: 100 }, onApply, onClose }))
    fireEvent.click(screen.getByLabelText('Pilote · Laser'))
    expect(screen.getByText('0 MJ répartis · 200 MJ non redirigés')).toBeTruthy()
    fireEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onApply).not.toHaveBeenCalled()
  })

  const ship = {
    id: 1, modele: { chassis: {} }, moduleGenerateur: { puissance: '2 GW' }, modulePropulseurs: { consommation: 3.5 },
    armesPilote: [{ arme: { id: 1, nom: 'Laser', type: 'thermique' }, chauffeActuelle: 20,
      chargeurRelie: { id: 3, nom: 'Cartouche', calibre: '500 MJ', bonus: 'Refroidissement : 50' } }],
    armesTourelles: [{ tourelle: 1, armes: [{ arme: { id: 2, nom: 'Canon', type: 'cinetique' } }] }],
  }

  it('cumule les applications et fait évoluer la chauffe localement avec les actions', () => {
    render(createElement(ShipClient, { ship, crew: [], readOnly: true }))
    expect(screen.getByText('Surchauffe : +1.5 de consommation · 150 MJ')).toBeTruthy()
    fireEvent.click(screen.getByText('Rediriger la chaleur'))
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    fireEvent.click(screen.getByLabelText('Pilote · Laser (1)'))
    fireEvent.change(screen.getByLabelText('MJ pour Pilote · Laser (1)'), { target: { value: '150' } })
    fireEvent.click(screen.getByText('Appliquer'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Chauffe 170 / 500 MJ')).toBeTruthy()
    expect(screen.queryByText(/Chaleur redirigée/)).toBeNull()
    fireEvent.click(screen.getByText('Rediriger la chaleur'))
    fireEvent.click(screen.getByText('Appliquer'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Chauffe 320 / 500 MJ')).toBeTruthy()
    fireEvent.click(screen.getByText('❄ Refroidir'))
    expect(screen.getByText('Chauffe 270 / 500 MJ')).toBeTruthy()
    fireEvent.click(screen.getByText('♨ Tirer'))
    expect(screen.getByText('Chauffe 280 / 500 MJ')).toBeTruthy()
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByText('❄ Refroidir'))
    expect(screen.getByText('Chauffe 0 / 500 MJ')).toBeTruthy()
    expect(ship.armesPilote[0].chauffeActuelle).toBe(20)
    for (const action of Object.values(actions)) expect(action).not.toHaveBeenCalled()
  })

  it('masque la redirection sans dépassement et explique l’absence d’armes thermiques', () => {
    const view = render(createElement(ShipClient, { ship: { ...ship, modulePropulseurs: { consommation: 2 } }, crew: [] }))
    expect(screen.queryByText('Rediriger la chaleur')).toBeNull()
    view.rerender(createElement(ShipClient, { key: 'empty', ship: { ...ship, armesPilote: [] }, crew: [] }))
    fireEvent.click(screen.getByText('Rediriger la chaleur'))
    expect(screen.getByText('Aucune arme thermique installée.')).toBeTruthy()
    expect((screen.getByText('Appliquer') as HTMLButtonElement).disabled).toBe(true)
  })
})
