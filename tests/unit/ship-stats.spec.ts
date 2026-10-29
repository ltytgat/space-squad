import { describe, expect, it } from 'vitest'
import { canEquipOptionalModule, canEquipWeaponForPilot, canEquipWeaponInTurret, completeTurretEntries, getShipLimits, getShipStats, optionalModuleSlotsRemaining, pilotWeaponPointsRemaining, turretWeaponPointsRemaining, validateShipConfiguration } from '@/lib/shipStats'

const chassis = { nom: 'Scout', classe: 'alpha', tourelles: 1, pointsEmportPilote: 2, pointsEmportTourelles: '1', modulesSupplementaires: '1+1', consommables: 2, blindage: 20, esquiveBase: 15 }
const ship = { modele: { chassis }, blindageActuel: 18, bouclierActuel: 3, moduleGenerateur: { puissance: '6 GW', consommation: 1 }, modulePropulseurs: { consommation: 2, modificateurs: 'Esquive +3' }, moduleBoucliers: { bouclierMax: 6 }, pilote: { habilite: 14 }, armesPilote: [{ arme: { pointsEmport: 1, taille: '1', consommation: 1 } }], armesTourelles: [{ tourelle: 1, armes: [{ arme: { pointsEmport: 1, taille: '1' } }] }], modulesSupplementaires: [], consommablesVaisseau: [] }

describe('ship rules', () => {
  it('exposes chassis capacities and calculated runtime values', () => {
    expect(getShipLimits(ship)).toMatchObject({ pilotWeaponPoints: 2, turretCount: 1, moduleSlots: 1, consumableSlots: 2 })
    expect(getShipStats(ship)).toMatchObject({ maxArmor: 20, maxShield: 6, armor: 18, shield: 3, evasion: 20, evasionCopilot: 0, power: 6, consumption: 3 })
  })

  it('adds the copilots ability modifier to evasion when the seat is occupied', () => {
    const shipWithCopilot = {
      ...ship,
      copilote: 2,
      crew: [{ id: 2, habiliteDieMod: 3 }],
    }

    expect(getShipStats(shipWithCopilot)).toMatchObject({ evasion: 23, evasionCopilot: 3 })
  })

  it('flags power overflow', () => {
    expect(getShipStats({ ...ship, modulePropulseurs: { consommation: 10 } }).overConsumption).toBe(true)
  })

  it('details consumption for every installed module and weapon', () => {
    expect(getShipStats(ship).consumptionBreakdown).toEqual([
      { label: 'Propulseurs', value: 2 },
    ])
  })

  it('rejects weapon capacity overflow', () => {
    expect(() => validateShipConfiguration({ ...ship, armesPilote: [{ arme: { pointsEmport: 3, taille: '1' } }] })).toThrow("points d'emport")
  })

  it('allows empty pilot weapon entries without spending points', () => {
    const shipWithEmptyPilotMount = { ...ship, armesPilote: [{ arme: null }, { arme: { pointsEmport: 1, taille: '1' } }] }

    expect(pilotWeaponPointsRemaining(shipWithEmptyPilotMount)).toBe(1)
    expect(canEquipWeaponForPilot(shipWithEmptyPilotMount, { pointsEmport: 1, taille: '1' })).toBe(true)
    expect(canEquipWeaponForPilot(shipWithEmptyPilotMount, { pointsEmport: 2, taille: '1' })).toBe(false)
    expect(() => validateShipConfiguration(shipWithEmptyPilotMount)).not.toThrow()
  })

  it('does not count turret modules as ship additional modules', () => {
    const configuredShip = {
      ...ship,
      modulesSupplementaires: [{ nom: 'Scanner', typeModule: 'supplementaire' }, { nom: 'Tourelle', typeModule: 'tourelle' }],
      armesTourelles: [{ tourelle: 1, module: { nom: 'Module tourelle', typeModule: 'tourelle', consommation: 1 }, armes: [] }],
    }
    expect(getShipLimits(configuredShip).moduleSlots).toBe(1)
    expect(() => validateShipConfiguration(configuredShip)).not.toThrow()
    expect(getShipStats(configuredShip).consumptionBreakdown).toContainEqual({ label: 'Module tourelle', value: 1 })
  })

  it('creates empty turret entries while preserving existing turret equipment', () => {
    const turretTwo = { tourelle: 2, module: { id: 12 }, armes: [{ arme: { id: 22 } }] }
    const entries = completeTurretEntries([turretTwo], 3)

    expect(entries).toEqual([
      { tourelle: 1, module: null, armes: [] },
      turretTwo,
      { tourelle: 3, module: null, armes: [] },
    ])
  })

  it('offers only turret weapons that fit the remaining points and chassis size', () => {
    const expandedShip = {
      ...ship,
      modele: { chassis: { ...chassis, tourelles: 2, pointsEmportTourelles: '1+2' } },
      armesTourelles: completeTurretEntries([{ tourelle: 1, armes: [{ arme: { pointsEmport: 1, taille: '1' } }] }], 2),
    }

    expect(turretWeaponPointsRemaining(expandedShip, 1)).toBe(0)
    expect(turretWeaponPointsRemaining(expandedShip, 2)).toBe(2)
    expect(canEquipWeaponInTurret(expandedShip, 2, { pointsEmport: 2, taille: '1' })).toBe(true)
    expect(canEquipWeaponInTurret(expandedShip, 2, { pointsEmport: 3, taille: '1' })).toBe(false)
    expect(canEquipWeaponInTurret(expandedShip, 2, { pointsEmport: 1, taille: '2' })).toBe(false)
  })

  it('allows optional modules only when a compatible slot is available', () => {
    const optionalModule = { typeModule: 'supplementaire', taille: '1' }
    expect(optionalModuleSlotsRemaining(ship)).toBe(1)
    expect(canEquipOptionalModule(ship, optionalModule)).toBe(true)
    expect(canEquipOptionalModule({ ...ship, modulesSupplementaires: [{ typeModule: 'supplementaire' }] }, optionalModule)).toBe(false)
    expect(canEquipOptionalModule(ship, { ...optionalModule, taille: '2' })).toBe(false)
    expect(canEquipOptionalModule(ship, { ...optionalModule, typeModule: 'tourelle' })).toBe(false)
  })
})
