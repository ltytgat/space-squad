import { describe, expect, it } from 'vitest'
import { getShipLimits, getShipStats, validateShipConfiguration } from '@/lib/shipStats'

const chassis = { nom: 'Scout', classe: 'alpha', tourelles: 1, pointsEmportPilote: 2, pointsEmportTourelles: '1', modulesSupplementaires: '1', consommables: 2, blindage: 20, esquiveBase: 15 }
const ship = { modele: { chassis }, blindageActuel: 18, bouclierActuel: 3, moduleBoucliers: { bouclierMax: 6 }, armesPilote: [{ arme: { pointsEmport: 1, taille: '1' } }], armesTourelles: [{ tourelle: 1, armes: [{ arme: { pointsEmport: 1, taille: '1' } }] }], modulesSupplementaires: [], consommablesVaisseau: [] }

describe('ship rules', () => {
  it('exposes chassis capacities and calculated runtime values', () => {
    expect(getShipLimits(ship)).toMatchObject({ pilotWeaponPoints: 2, turretCount: 1, moduleSlots: 1, consumableSlots: 2 })
    expect(getShipStats(ship)).toMatchObject({ maxArmor: 20, maxShield: 6, armor: 18, shield: 3, evasion: 15 })
  })

  it('rejects weapon capacity overflow', () => {
    expect(() => validateShipConfiguration({ ...ship, armesPilote: [{ arme: { pointsEmport: 3, taille: '1' } }] })).toThrow("points d'emport")
  })
})
