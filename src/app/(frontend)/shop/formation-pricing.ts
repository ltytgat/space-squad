import { exactMultiply, exactSubtract } from '@/lib/shop'
import { computeRank } from '@/lib/rankSystem'

export type FormationOffer = {
  id: number
  competence: string
  organisationFormation: { id: number; nom: string }
  coutKonis?: number | null
  coutPointsDeRang?: number | null
  coutRenommee?: number | null
}

export type FormationCharacterState = {
  konis?: number | null
  pointsDeRang?: number | null
  competences?: { competence: string; valeur?: number | null }[] | null
  reputation?: { categorie: string; valeur?: number | null }[] | null
}

export function formationQuote(formation: FormationOffer, character: FormationCharacterState) {
  const skill = character.competences?.find((entry) => entry.competence === formation.competence)
  const level = typeof skill?.valeur === 'number' && Number.isFinite(skill.valeur) && skill.valeur >= 0
    ? skill.valeur
    : 0
  const multiplier = level + 1
  const cost = (base: number | null | undefined) => base == null ? 0 : exactMultiply(base, multiplier)
  const costs = {
    konis: cost(formation.coutKonis),
    pointsDeRang: cost(formation.coutPointsDeRang),
    renommee: cost(formation.coutRenommee),
  }
  const konis = typeof character.konis === 'number' && Number.isFinite(character.konis) ? character.konis : 0
  const pointsDeRang = typeof character.pointsDeRang === 'number' && Number.isFinite(character.pointsDeRang) ? character.pointsDeRang : 0
  const currentRank = computeRank(pointsDeRang)
  const pointsDeRangDisponibles = currentRank.pointsInRank
  const nextRank = computeRank(exactSubtract(pointsDeRang, costs.pointsDeRang))
  const factionName = formation.organisationFormation.nom.trim().toLocaleLowerCase('fr')
  const reputationRow = character.reputation?.find(
    (entry) => String(entry.categorie ?? '').trim().toLocaleLowerCase('fr') === factionName,
  )
  const reputation = typeof reputationRow?.valeur === 'number' && Number.isFinite(reputationRow.valeur)
    ? reputationRow.valeur
    : 0

  const reasons: string[] = []
  if (!Number.isInteger(level)) reasons.push('Le niveau de cette compétence est invalide.')
  if (costs.konis > konis) reasons.push('Pas assez de Konis.')
  if (costs.pointsDeRang > pointsDeRangDisponibles) reasons.push('Pas assez de points de rang courants.')
  else if (nextRank.level < currentRank.level) reasons.push('Cette dépense ferait perdre un rang.')
  if (costs.renommee > reputation) reasons.push(`Pas assez de renommée auprès de ${formation.organisationFormation.nom}.`)

  return {
    level,
    costs,
    balances: { konis, pointsDeRang: pointsDeRangDisponibles, reputation },
    canBuy: reasons.length === 0,
    reasons,
  }
}
