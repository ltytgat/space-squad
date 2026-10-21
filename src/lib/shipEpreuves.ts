import { listSeats, roleForSeat, seatLabel, seatOf, type CrewRole } from './shipCrew'
import { getChassis, getShipModuleCalculationBonus } from './shipStats'

type Epreuve = { label: string; value: number }
type EpreuvesByCategory = Partial<Record<'vaisseau' | 'pacifiques' | 'combat', Epreuve[]>>

export type ShipEpreuveCrewMember = {
  id: number | string
  nom?: string | null
  epreuves?: EpreuvesByCategory
}

export type ShipEpreuveShip = {
  modele?: { chassis?: { classe?: string | null } | number | null } | number | null
  pilote?: number | string | { id: number | string } | null
  copilote?: number | string | { id: number | string } | null
  canonniers?: { personnage: number | string | { id: number | string }; tourelle: number | string }[]
  moduleGenerateur?: any
  modulePropulseurs?: any
  moduleSurvie?: any
  moduleBoucliers?: any
  modulesSupplementaires?: any[]
  armesTourelles?: { module?: any }[]
}

export type ShipEpreuveDetail = {
  characterId: number | string
  name: string
  role: CrewRole
  seatLabel: string
  value: number
}

export type ShipEpreuveRow = {
  key: string
  label: string
  value: number
  role: CrewRole
  details?: ShipEpreuveDetail[]
}

const PILOTAGE_LABEL_BY_CLASS: Record<string, string> = {
  alpha: 'Pilotage – Chasseur/Léger',
  beta: 'Pilotage – Bombardier/Intermédiaire',
  gamma: 'Pilotage – Corvette/Poids lourds',
  delta: 'Pilotage – Frégate/Blindé',
}

function epreuveFor(member: ShipEpreuveCrewMember | null, category: keyof EpreuvesByCategory, label: string) {
  return member?.epreuves?.[category]?.find((epreuve) => epreuve.label === label) ?? null
}

export function getShipEpreuves(ship: ShipEpreuveShip, crew: ShipEpreuveCrewMember[]) {
  const seats = listSeats(ship)
  const memberForSeat = (seat: (typeof seats)[number]) =>
    crew.find((member) => seat.occupantId !== null && String(member.id) === String(seat.occupantId)) ?? null
  const rows: ShipEpreuveRow[] = []
  const pilotSeat = seats.find((seat) => seat.role === 'pilote')
  const pilot = pilotSeat ? memberForSeat(pilotSeat) : null
  const chassisClass = String(getChassis(ship)?.classe ?? '').toLowerCase()
  const pilotageLabel = PILOTAGE_LABEL_BY_CLASS[chassisClass]
  const pilotage = pilotageLabel ? epreuveFor(pilot, 'vaisseau', pilotageLabel) : null
  const pilotageBonus = getShipModuleCalculationBonus(ship, 'pilotage')
  const pilotShotBonus = getShipModuleCalculationBonus(ship, 'tir-pilote')

  if (pilot && pilotSeat && pilotage) {
    rows.push({
      key: `pilotage-${pilot.id}`,
      label: pilotage.label,
      value: pilotage.value + pilotageBonus,
      role: roleForSeat(pilotSeat.key),
    })
  }

  const pilotShot = epreuveFor(pilot, 'vaisseau', 'Tir – Pilote')
  if (pilot && pilotSeat && pilotShot) {
    rows.push({
      key: `tir-pilote-${pilot.id}`,
      label: pilotShot.label,
      value: pilotShot.value + pilotShotBonus,
      role: roleForSeat(pilotSeat.key),
    })
  }

  for (const seat of seats.filter((entry) => entry.role === 'canonnier')) {
    const gunner = memberForSeat(seat)
    const turretShot = epreuveFor(gunner, 'vaisseau', 'Tir – Tourelle')
    if (!gunner || !turretShot) continue
    rows.push({
      key: `tir-tourelle-${seat.turret}-${gunner.id}`,
      label: `Tir – Tourelle ${seat.turret}`,
      value: turretShot.value,
      role: roleForSeat(seat.key),
    })
  }

  const definitions = crew[0]?.epreuves
  const groupedEpreuves = [
    ...(definitions?.pacifiques ?? []).map((epreuve) => ({ ...epreuve, category: 'pacifiques' as const })),
    ...(definitions?.combat?.filter((epreuve) => epreuve.label === 'Initiative') ?? [])
      .map((epreuve) => ({ ...epreuve, category: 'combat' as const })),
  ]
  const bestRows: ShipEpreuveRow[] = groupedEpreuves.flatMap((definition) => {
    const bonus = definition.label === 'Crypter / Décrypter / Analyse'
      ? getShipModuleCalculationBonus(ship, 'analyse')
      : 0
    const details: ShipEpreuveDetail[] = crew.flatMap((member) => {
      const epreuve = epreuveFor(member, definition.category, definition.label)
      if (!epreuve || !Number.isFinite(epreuve.value)) return []
      const seat = seatOf(ship, member.id)
      return [{
        characterId: member.id,
        name: member.nom || 'Sans nom',
        role: roleForSeat(seat),
        seatLabel: seatLabel(ship, seat),
        value: epreuve.value + bonus,
      }]
    })
    if (details.length === 0) return []

    const bestValue = Math.max(...details.map((detail) => detail.value))
    const winners = details.filter((detail) => detail.value === bestValue)
    return [{
      key: `${definition.category}-${definition.label}`,
      label: definition.label,
      value: bestValue,
      role: winners[0].role,
      details,
    }]
  })

  return { vaisseau: rows, actions: bestRows }
}
