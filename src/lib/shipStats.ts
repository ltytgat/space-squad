import { calculateStats } from './characterStats'

export type ShipRecord = any

const idOf = (value: any) => typeof value === 'object' && value ? value.id : value
const objectOf = (value: any) => typeof value === 'object' && value ? value : null
const isTurretModule = (value: any) => objectOf(value)?.typeModule === 'tourelle'

const numericText = (value: unknown) => {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

export type ShipModuleBonusTarget = 'esquive' | 'tir-pilote' | 'pilotage' | 'analyse'

export function getModuleCalculationBonus(module: any, target: ShipModuleBonusTarget) {
  const bonus = objectOf(module?.bonusCalcul)
  return bonus?.cible === target ? Number(bonus.valeur) || 0 : 0
}

export function getShipModuleCalculationBonus(ship: ShipRecord, target: ShipModuleBonusTarget) {
  const modules = [
    ship?.moduleGenerateur,
    ship?.modulePropulseurs,
    ship?.moduleSurvie,
    ship?.moduleBoucliers,
    ...(ship?.modulesSupplementaires ?? []).filter((module: any) => !isTurretModule(module)),
    ...(ship?.armesTourelles ?? []).map((turret: any) => turret.module),
  ]
  return modules.reduce((total, entry) => total + getModuleCalculationBonus(entry, target), 0)
}

export function getModuleModifier(module: any, label: string) {
  const text = String(module?.modificateurs ?? '')
  const match = text.match(new RegExp(`${label}\\s*([+-]?\\d+)`, 'i'))
  return match ? Number(match[1]) : 0
}

export function getPilotAbilityBonus(pilot: any) {
  if (!pilot) return 0
  if (typeof pilot.habiliteDieMod === 'number') return pilot.habiliteDieMod
  return calculateStats(pilot).habiliteDieMod
}

export function getChassis(ship: ShipRecord) {
  const model = objectOf(ship?.modele)
  return objectOf(model?.chassis)
}

export function completeTurretEntries(entries: any[], turretCount: number): any[] {
  if (!Number.isSafeInteger(turretCount) || turretCount < 0) throw new Error('Le nombre de tourelles du châssis est invalide.')
  const byNumber = new Map<number, any>()
  for (const entry of entries ?? []) {
    const turretNumber = Number(entry?.tourelle)
    if (Number.isSafeInteger(turretNumber) && turretNumber > 0 && turretNumber <= turretCount && !byNumber.has(turretNumber)) {
      byNumber.set(turretNumber, entry)
    }
  }
  return Array.from({ length: turretCount }, (_, index) => {
    const turretNumber = index + 1
    const existing = byNumber.get(turretNumber)
    return existing
      ? { ...existing, tourelle: turretNumber, armes: Array.isArray(existing.armes) ? existing.armes : [] }
      : { tourelle: turretNumber, module: null, armes: [] }
  })
}

export function getShipLimits(ship: ShipRecord) {
  const chassis = getChassis(ship)
  const turretWeaponSlots = String(chassis?.pointsEmportTourelles ?? '')
    .split('+').filter(Boolean).reduce((sum, value) => sum + (Number(value) || 0), 0)
  return {
    pilotWeaponPoints: Number(chassis?.pointsEmportPilote ?? 0),
    turretCount: Number(chassis?.tourelles ?? 0),
    turretWeaponPoints: turretWeaponSlots,
    turretWeaponSlotLimits: String(chassis?.pointsEmportTourelles ?? '').split('+').filter(Boolean).map((value) => Number(value) || 0),
    // Le premier nombre correspond aux emplacements du vaisseau ; les suivants
    // sont réservés aux modules de tourelle.
    moduleSlots: Number(String(chassis?.modulesSupplementaires ?? '').split('+')[0]) || 0,
    consumableSlots: Number(chassis?.consommables ?? 0),
  }
}

export function turretWeaponPointsRemaining(ship: ShipRecord, turretNumber: number): number {
  const limits = getShipLimits(ship)
  if (!Number.isSafeInteger(turretNumber) || turretNumber < 1 || turretNumber > limits.turretCount) return 0
  const capacity = limits.turretWeaponSlotLimits[turretNumber - 1] ?? 0
  const turret = (ship?.armesTourelles ?? []).find((entry: any) => Number(entry?.tourelle) === turretNumber)
  const used = (turret?.armes ?? []).reduce((total: number, entry: any) => total + (Number(objectOf(entry?.arme)?.pointsEmport) || 1), 0)
  return Math.max(0, capacity - used)
}

export function canEquipWeaponInTurret(ship: ShipRecord, turretNumber: number, weapon: any): boolean {
  if (!weapon) return false
  const points = Number(weapon.pointsEmport) || 1
  const chassisSize = Number(getChassis(ship)?.classe?.replace('alpha', '1').replace('beta', '2').replace('gamma', '3').replace('delta', '4'))
  const weaponSize = Number(weapon.taille)
  return Number.isFinite(points) && points > 0
    && Number.isFinite(weaponSize) && weaponSize <= chassisSize
    && points <= turretWeaponPointsRemaining(ship, turretNumber)
}

export function getShipStats(ship: ShipRecord) {
  const chassis = getChassis(ship)
  const moduleEntries = [
    { module: ship?.moduleGenerateur, label: 'Générateur' },
    { module: ship?.modulePropulseurs, label: 'Propulseurs' },
    { module: ship?.moduleSurvie, label: 'Système de survie' },
    { module: ship?.moduleBoucliers, label: 'Boucliers' },
    ...(ship?.modulesSupplementaires ?? []).filter((module: any) => !isTurretModule(module)).map((module: any, index: number) => ({
      module,
      label: `Module supplémentaire ${index + 1}`,
    })),
    ...(ship?.armesTourelles ?? []).flatMap((turret: any, index: number) =>
      turret.module
        ? [{ module: turret.module, label: `Module de la tourelle ${turret.tourelle ?? index + 1}` }]
        : [],
    ),
  ]
  const modules = moduleEntries.map(({ module }) => objectOf(module)).filter(Boolean)
  const numeric = (key: string) => modules.reduce((sum, module) => sum + (Number(module?.[key]) || 0), 0)
  const generator = objectOf(ship?.moduleGenerateur)
  const thrusters = objectOf(ship?.modulePropulseurs)
  const pilotId = idOf(ship?.pilote)
  const pilot =
    (ship?.crew ?? []).find((member: any) => pilotId != null && String(member?.id) === String(pilotId)) ??
    objectOf(ship?.pilote) ??
    (ship?.crew ?? []).find((member: any) => member?.roleVaisseau === 'pilote')
  const copilotId = idOf(ship?.copilote)
  const copilot = copilotId == null
    ? objectOf(ship?.copilote)
    : (ship?.crew ?? []).find((member: any) => String(member?.id) === String(copilotId)) ?? objectOf(ship?.copilote)
  const maxShield = numeric('bouclierMax')
  const maxArmor = (Number(chassis?.blindage) || 0) + numeric('blindageBonus')
  const consumption = numeric('consommation')
  const consumptionBreakdown = [
    ...moduleEntries
      .map(({ module, label }) => {
        const item = objectOf(module)
        const value = Number(item?.consommation) || 0
        return item && value > 0 && module !== ship?.moduleGenerateur
          ? { label: item.nom || label, value }
          : null
      })
      .filter((component): component is { label: string; value: number } => component !== null),
  ]
  const power = numericText(generator?.puissance)
  const evasionBase = Number(chassis?.esquiveBase) || 0
  const evasionPilot = getPilotAbilityBonus(pilot)
  const evasionCopilot = getPilotAbilityBonus(copilot)
  const evasionThrusters = getModuleCalculationBonus(thrusters, 'esquive') || getModuleModifier(thrusters, 'Esquive')
  return {
    maxArmor,
    maxShield,
    armor: ship?.blindageActuel ?? maxArmor,
    shield: ship?.bouclierActuel ?? maxShield,
    evasion: evasionBase + evasionPilot + evasionCopilot + evasionThrusters,
    evasionBase,
    evasionPilot,
    evasionCopilot,
    evasionThrusters,
    power,
    consumption,
    consumptionBreakdown,
    overConsumption: consumption > power,
  }
}

export function validateShipConfiguration(ship: ShipRecord) {
  const limits = getShipLimits(ship)
  const pilotPoints = (ship?.armesPilote ?? []).reduce((sum: number, entry: any) => sum + (Number(objectOf(entry.arme)?.pointsEmport) || 1), 0)
  if (pilotPoints > limits.pilotWeaponPoints) throw new Error("Les points d'emport du pilote sont dépassés")
  if ((ship?.armesTourelles ?? []).some((entry: any) => Number(entry.tourelle) < 1 || Number(entry.tourelle) > limits.turretCount)) throw new Error('Une tourelle est incompatible avec le châssis')
  const moduleCount = (ship?.modulesSupplementaires ?? []).filter((module: any) => !isTurretModule(module)).length
  if (moduleCount > limits.moduleSlots) throw new Error('Les emplacements de modules sont dépassés')
  if ((ship?.consommablesVaisseau ?? []).length > limits.consumableSlots) throw new Error('Les emplacements de consommables sont dépassés')
  const size = Number(getChassis(ship)?.classe?.replace('alpha', '1').replace('beta', '2').replace('gamma', '3').replace('delta', '4'))
  const incompatible = [...(ship?.armesPilote ?? []), ...(ship?.armesTourelles ?? []).flatMap((turret: any) => turret.armes ?? []), ...(ship?.modulesSupplementaires ?? [])]
    .some((entry: any) => { const item = objectOf(entry.arme ?? entry.module ?? entry); return item?.taille && Number(item.taille) > size })
  if (incompatible) throw new Error('Un composant est incompatible avec la taille du châssis')
  const turretSlots = String(getChassis(ship)?.pointsEmportTourelles ?? '').split('+').filter(Boolean).map(Number)
  for (const turret of ship?.armesTourelles ?? []) {
    const used = (turret.armes ?? []).reduce((sum: number, entry: any) => sum + (Number(objectOf(entry.arme)?.pointsEmport) || 1), 0)
    if (used > (turretSlots[(Number(turret.tourelle) || 1) - 1] ?? 0)) throw new Error("Les points d'emport d'une tourelle sont dépassés")
  }
  return true
}

export { idOf }
