export type ShipRecord = any

const idOf = (value: any) => typeof value === 'object' && value ? value.id : value
const objectOf = (value: any) => typeof value === 'object' && value ? value : null

const numericText = (value: unknown) => {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : 0
}

export function getModuleModifier(module: any, label: string) {
  const text = String(module?.modificateurs ?? '')
  const match = text.match(new RegExp(`${label}\\s*([+-]?\\d+)`, 'i'))
  return match ? Number(match[1]) : 0
}

export function getPilotAbilityBonus(pilot: any) {
  if (!pilot) return 0
  return Math.floor(((Number(pilot.habilite) || 0) - (Number(pilot.malusHabilite) || 0) - 10) / 2)
}

export function getChassis(ship: ShipRecord) {
  const model = objectOf(ship?.modele)
  return objectOf(model?.chassis)
}

export function getShipLimits(ship: ShipRecord) {
  const chassis = getChassis(ship)
  const turretWeaponSlots = String(chassis?.pointsEmportTourelles ?? '')
    .split('+').filter(Boolean).reduce((sum, value) => sum + (Number(value) || 0), 0)
  return {
    pilotWeaponPoints: Number(chassis?.pointsEmportPilote ?? 0),
    turretCount: Number(chassis?.tourelles ?? 0),
    turretWeaponPoints: turretWeaponSlots,
    moduleSlots: String(chassis?.modulesSupplementaires ?? '').split('+').filter(Boolean).reduce((sum, value) => sum + (Number(value) || 0), 0),
    consumableSlots: Number(chassis?.consommables ?? 0),
  }
}

export function getShipStats(ship: ShipRecord) {
  const chassis = getChassis(ship)
  const modules = [ship?.moduleGenerateur, ship?.modulePropulseurs, ship?.moduleSurvie, ship?.moduleBoucliers, ...(ship?.modulesSupplementaires ?? [])]
    .map(objectOf).filter(Boolean)
  const numeric = (key: string) => modules.reduce((sum, module) => sum + (Number(module?.[key]) || 0), 0)
  const generator = objectOf(ship?.moduleGenerateur)
  const thrusters = objectOf(ship?.modulePropulseurs)
  const pilot = objectOf(ship?.pilote) ?? (ship?.crew ?? []).find((member: any) => member?.roleVaisseau === 'pilote')
  const weaponConsumption = [...(ship?.armesPilote ?? []), ...(ship?.armesTourelles ?? []).flatMap((turret: any) => turret.armes ?? [])]
    .reduce((sum: number, entry: any) => sum + (Number(objectOf(entry.arme)?.consommation) || 0), 0)
  const maxShield = numeric('bouclierMax')
  const maxArmor = (Number(chassis?.blindage) || 0) + numeric('blindageBonus')
  const consumption = numeric('consommation') + weaponConsumption
  const power = numericText(generator?.puissance)
  const evasionBase = Number(chassis?.esquiveBase) || 0
  const evasionPilot = getPilotAbilityBonus(pilot)
  const evasionThrusters = getModuleModifier(thrusters, 'Esquive')
  return {
    maxArmor,
    maxShield,
    armor: ship?.blindageActuel ?? maxArmor,
    shield: ship?.bouclierActuel ?? maxShield,
    evasion: evasionBase + evasionPilot + evasionThrusters,
    evasionBase,
    evasionPilot,
    evasionThrusters,
    power,
    consumption,
    overConsumption: consumption > power,
  }
}

export function validateShipConfiguration(ship: ShipRecord) {
  const limits = getShipLimits(ship)
  const pilotPoints = (ship?.armesPilote ?? []).reduce((sum: number, entry: any) => sum + (Number(objectOf(entry.arme)?.pointsEmport) || 1), 0)
  if (pilotPoints > limits.pilotWeaponPoints) throw new Error("Les points d'emport du pilote sont dépassés")
  if ((ship?.armesTourelles ?? []).some((entry: any) => Number(entry.tourelle) < 1 || Number(entry.tourelle) > limits.turretCount)) throw new Error('Une tourelle est incompatible avec le châssis')
  const moduleCount = (ship?.modulesSupplementaires ?? []).length
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
