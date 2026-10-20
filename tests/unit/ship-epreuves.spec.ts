import { describe, expect, it } from 'vitest'
import { getShipEpreuves } from '@/lib/shipEpreuves'
import { findShipCrew } from '@/lib/shipAccess'

const epreuvesFor = (scores: Record<string, number>) => ({
  vaisseau: [
    { label: 'Pilotage – Chasseur/Léger', value: scores.chasseur ?? 0 },
    { label: 'Pilotage – Bombardier/Intermédiaire', value: scores.bombardier ?? 0 },
    { label: 'Pilotage – Corvette/Poids lourds', value: scores.corvette ?? 0 },
    { label: 'Pilotage – Frégate/Blindé', value: scores.fregate ?? 0 },
    { label: 'Tir – Pilote', value: scores.tirPilote ?? 0 },
    { label: 'Tir – Tourelle', value: scores.tirTourelle ?? 0 },
    { label: 'Tir - Véhicule', value: scores.tirVehicule ?? 0 },
  ],
  pacifiques: [
    { label: 'Réparation', value: scores.reparation ?? 0 },
    { label: 'Négocier / Influencer', value: scores.negocier ?? 0 },
  ],
  combat: [{ label: 'Initiative', value: scores.initiative ?? 0 }],
})

const shipFor = (classe: string, crew: { pilote?: number; copilote?: number; canonniers?: { personnage: number; tourelle: number }[] } = {}) => ({
  modele: { chassis: { classe, tourelles: 2 } },
  pilote: crew.pilote ?? null,
  copilote: crew.copilote ?? null,
  canonniers: crew.canonniers ?? [],
})

describe('épreuves de vaisseau', () => {
  it.each([
    ['alpha', 'Pilotage – Chasseur/Léger'],
    ['beta', 'Pilotage – Bombardier/Intermédiaire'],
    ['gamma', 'Pilotage – Corvette/Poids lourds'],
    ['delta', 'Pilotage – Frégate/Blindé'],
  ])('sélectionne le pilotage du châssis %s', (classe, pilotage) => {
    const rows = getShipEpreuves(shipFor(classe, { pilote: 1 }), [
      { id: 1, nom: 'Pilote', epreuves: epreuvesFor({ chasseur: 1, bombardier: 2, corvette: 3, fregate: 4, tirPilote: 5 }) },
    ]).vaisseau

    expect(rows.map((row) => row.label)).toEqual([pilotage, 'Tir – Pilote'])
    expect(rows[0].role).toBe('pilote')
  })

  it('affiche un tir par canonnier présent et ignore les autres postes pour les épreuves de vaisseau', () => {
    const displayed = getShipEpreuves(shipFor('gamma', {
      pilote: 1,
      copilote: 2,
      canonniers: [{ personnage: 3, tourelle: 1 }, { personnage: 4, tourelle: 2 }],
    }), [
      { id: 1, nom: 'Pilote', epreuves: epreuvesFor({ corvette: 4, tirPilote: 5 }) },
      { id: 2, nom: 'Copilote', epreuves: epreuvesFor({ corvette: 90, tirPilote: 91, tirTourelle: 92 }) },
      { id: 3, nom: 'Canonnier 1', epreuves: epreuvesFor({ tirTourelle: 6 }) },
      { id: 4, nom: 'Canonnier 2', epreuves: epreuvesFor({ tirTourelle: 7 }) },
    ]).vaisseau

    expect(displayed.map(({ label, value, role }) => [label, value, role])).toEqual([
      ['Pilotage – Corvette/Poids lourds', 4, 'pilote'],
      ['Tir – Pilote', 5, 'pilote'],
      ['Tir – Tourelle 1', 6, 'canonnier'],
      ['Tir – Tourelle 2', 7, 'canonnier'],
    ])
  })

  it('retient le meilleur score pacifique et initiative, avec le détail de chaque membre', () => {
    const displayed = getShipEpreuves(shipFor('alpha', { pilote: 1, canonniers: [{ personnage: 3, tourelle: 1 }] }), [
      { id: 1, nom: 'Pilote', epreuves: epreuvesFor({ reparation: 2, negocier: 4, initiative: 1 }) },
      { id: 2, nom: 'Passager', epreuves: epreuvesFor({ reparation: 8, negocier: 3, initiative: 7 }) },
      { id: 3, nom: 'Canonnier', epreuves: epreuvesFor({ reparation: 8, negocier: 9, initiative: 5 }) },
    ]).actions

    expect(displayed.map(({ label, value, role }) => [label, value, role])).toEqual([
      ['Réparation', 8, 'passager'],
      ['Négocier / Influencer', 9, 'canonnier'],
      ['Initiative', 7, 'passager'],
    ])
    expect(displayed[0].details?.map(({ name, value }) => [name, value])).toEqual([
      ['Pilote', 2], ['Passager', 8], ['Canonnier', 8],
    ])
  })
})

describe('données d’épreuves de l’équipage', () => {
  it('renvoie les scores calculés avec les compétences sélectionnées par la requête Payload', async () => {
    const character = {
      id: 12,
      nom: 'Pilote de test',
      origine: 'Humain',
      pointsDeRang: 0,
      force: 10,
      habilite: 14,
      connaissances: 10,
      culture: 10,
      anticipation: 10,
      perception: 12,
      competences: [{ competence: 'Chasseur', valeur: 2 }],
    }
    let selectedCompetences = false
    const payload = {
      find: async ({ select }: { select: Record<string, unknown> }) => {
        selectedCompetences = select.competences === true
        return { docs: [character] }
      },
    }

    const [member] = await findShipCrew(payload, 42)

    expect(selectedCompetences).toBe(true)
    const scores = member.epreuves as {
      vaisseau: { label: string; value: number }[]
      combat: { label: string; value: number }[]
    }
    expect(scores.vaisseau.find((epreuve) => epreuve.label === 'Pilotage – Chasseur/Léger')?.value).toBe(6)
    expect(scores.combat.find((epreuve) => epreuve.label === 'Initiative')?.value).toBe(0)
  })
})
