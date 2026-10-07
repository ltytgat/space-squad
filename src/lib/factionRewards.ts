export type FactionRewardType = 'acces-armes-ex' | 'bon-reduction'
export type FactionRewardUsage = 'arme-sol' | 'arme-espace' | 'module-espace'
export type FactionRewardApplication = 'sol' | 'espace' | 'module'

export type OwnedFactionReward = {
  nom: string
  effet: string
  faction: string
  grade: string
  typeRecompense?: FactionRewardType | null
  pourcentageReduction?: number | null
  usage?: FactionRewardUsage | null
  id?: string | null
}

export type DiscountTarget = {
  kind: 'weapon' | 'ship-weapon' | 'ship-module'
  categorie?: string | null
  taille?: string | null
}

export function factionKey(name: unknown): string {
  return String(name ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
}

export function factionExWeaponType(name: unknown): 'thermique' | 'cinetique' | 'lourde' | null {
  const key = factionKey(name)
  if (key === 'alliance') return 'thermique'
  if (key === 'union') return 'cinetique'
  if (key === 'guilde') return 'lourde'
  return null
}

export function rewardUsageForApplication(application: unknown): FactionRewardUsage | null {
  if (application === 'sol') return 'arme-sol'
  if (application === 'espace') return 'arme-espace'
  if (application === 'module') return 'module-espace'
  return null
}

export function factionRewardsTitle(name: unknown): string {
  const faction = String(name ?? '').trim()
  const key = factionKey(faction)
  if (key === 'guilde') return `Récompenses de la ${faction}`
  if (key === 'alliance' || key === 'union') return `Récompenses de l’${faction}`
  return `Récompenses de ${faction}`
}

export function isExWeaponName(name: unknown): boolean {
  return String(name ?? '').includes('eX')
}

export function ownsFactionExWeaponAccess(rewards: OwnedFactionReward[] | null | undefined, factionName: unknown): boolean {
  const key = factionKey(factionName)
  return !!key && !!rewards?.some((reward) => reward.typeRecompense === 'acces-armes-ex' && factionKey(reward.faction) === key)
}

export function factionCanBuyExWeapon(
  name: unknown,
  category: unknown,
  types: unknown,
  rewards: OwnedFactionReward[] | null | undefined,
  factionName: unknown,
): boolean {
  if (!isExWeaponName(name)) return true
  const requiredType = factionExWeaponType(factionName)
  if (!requiredType || !ownsFactionExWeaponAccess(rewards, factionName)) return false
  if (requiredType === 'lourde') return category === 'lourde'
  const weaponTypes = Array.isArray(types) ? types.map(String) : String(types ?? '').split(/\s*,\s*/)
  return weaponTypes.includes(requiredType)
}

export function isFactionDiscountCouponApplicable(
  reward: OwnedFactionReward,
  factionName: unknown,
  target: DiscountTarget,
): boolean {
  const usage = reward.usage
  if (reward.typeRecompense !== 'bon-reduction' || !usage || factionKey(reward.faction) !== factionKey(factionName)) return false
  if (!Number.isFinite(Number(reward.pourcentageReduction)) || Number(reward.pourcentageReduction) <= 0 || Number(reward.pourcentageReduction) > 100) return false
  if (usage === 'arme-sol') return target.kind === 'weapon' && target.categorie !== 'lourde'
  if (usage === 'arme-espace') return target.kind === 'ship-weapon' && target.taille !== '4'
  return usage === 'module-espace' && target.kind === 'ship-module'
}
