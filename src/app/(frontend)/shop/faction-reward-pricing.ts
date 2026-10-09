import { factionGrade, type FactionLite } from '@/app/(frontend)/characters/session-rewards-formula'
import { ownsAnyFactionWeaponPermit, type FactionRewardApplication, type OwnedFactionReward } from '@/lib/factionRewards'

export type FactionRewardOffer = {
  id: number
  nom: string
  description: string
  gradeRequis: number
  gradeName: string
  coutPointsFaction: number
  typeRecompense: 'acces-armes-ex' | 'bon-reduction'
  pourcentageReduction: number | null
  application: FactionRewardApplication | null
}

export type FactionRewardCharacter = {
  id: number
  nom: string
  konis: number
  pointsDeFaction: number
  rangDeFaction: string | null
  affiliation: FactionLite & { rangs: { nom: string; pointsRequis: number }[] }
  inventaireRecompensesFaction: OwnedFactionReward[]
}

export function factionPromotionQuote(character: FactionRewardCharacter) {
  const grade = factionGrade(character.rangDeFaction, character.affiliation)
  const nextRank = character.affiliation.rangs[grade]
  const threshold = nextRank ? Number(nextRank.pointsRequis) : null
  const points = Number(character.pointsDeFaction)
  const validBalances = Number.isFinite(points) && points >= 0
  const canPromote = !!nextRank && threshold !== null && Number.isSafeInteger(threshold) && threshold >= 0 && validBalances && points >= threshold
  return {
    grade,
    nextGrade: nextRank ? grade + 1 : null,
    nextRankName: nextRank?.nom ?? null,
    minimumPoints: threshold,
    pointsToSpend: validBalances ? points : 0,
    canPromote,
  }
}

export function factionRewardQuote(offer: FactionRewardOffer, character: FactionRewardCharacter) {
  const promotion = factionPromotionQuote(character)
  const permitAlreadyOwned = offer.typeRecompense === 'acces-armes-ex' && ownsAnyFactionWeaponPermit(character.inventaireRecompensesFaction)
  const costsValid = Number.isSafeInteger(offer.coutPointsFaction) && offer.coutPointsFaction >= 0 &&
    Number.isSafeInteger(offer.gradeRequis) && offer.gradeRequis >= 1
  const canBuy = costsValid && !permitAlreadyOwned && promotion.grade >= offer.gradeRequis && Number(character.pointsDeFaction) >= offer.coutPointsFaction
  return {
    canBuy,
    permitAlreadyOwned,
    nextPointsDeFaction: costsValid ? Number(character.pointsDeFaction) - offer.coutPointsFaction : Number(character.pointsDeFaction),
  }
}
