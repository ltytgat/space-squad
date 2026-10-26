import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AtelierClient, type AtelierItem } from '@/app/(frontend)/shop/atelier/AtelierClient'
import type { AtelierEquipmentKind } from '@/lib/atelier'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/(frontend)/shop/atelier-actions', () => ({ customizePersonalEquipment: vi.fn(), customizeShip: vi.fn() }))

afterEach(() => { cleanup(); vi.clearAllMocks() })

const requirement = 'Le vaisseau doit être vide pour être modifié. Débarquez votre personnage et tous les membres de son équipage avant de le sélectionner.'

function renderAtelier(kind: AtelierEquipmentKind, items: AtelierItem[] = []) {
  render(createElement(AtelierClient, {
    kind,
    character: { id: 1, nom: 'Joueur', konis: 1000 },
    items,
    modifications: [],
  }))
}

describe('rappel de disponibilité des vaisseaux à l’Atelier', () => {
  it('affiche les conditions de sélection même si aucun vaisseau n’est disponible', () => {
    renderAtelier('vaisseau')

    expect(screen.getByText(requirement)).toBeTruthy()
    expect(screen.getByText('Aucun objet de votre réserve ne remplit les conditions de cet Atelier.')).toBeTruthy()
  })

  it('affiche les conditions de sélection quand des vaisseaux sont disponibles', () => {
    renderAtelier('vaisseau', [{
      id: 1, index: 0, kind: 'vaisseau', nom: 'Aigle', categorie: 'combat', type: [], classe: 'alpha',
      prix: 100, points: 3, image: null, setNom: null, modelNom: 'Modèle Aigle', description: null,
      properties: {}, components: [],
    }])

    expect(screen.getByText(requirement)).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Aigle · ALPHA' })).toBeTruthy()
  })

  it.each(['arme', 'armure'] as const)('n’affiche pas le rappel dans l’Atelier %s', (kind) => {
    renderAtelier(kind)

    expect(screen.queryByText(requirement)).toBeNull()
  })
})
