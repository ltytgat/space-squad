/**
 * Formule pure de calcul des points de faction gagnés en fin de session.
 *
 * Ce fichier est intentionnellement séparé de `session-rewards-actions.ts`
 * (marqué `'use server'`) : il est importé à la fois côté serveur (application
 * réelle) et côté client (récapitulatif live du drawer). Il ne doit donc
 * contenir aucun code Node/Payload — que du calcul déterministe.
 *
 * Règles (spec de fin de session) :
 *   1. Bonus commanditaire : les personnages affiliés à la faction
 *      commanditaire gagnent `10 × grade` points, où `grade` est la position
 *      (1-indexée) de leur `rangDeFaction` dans la liste des rangs de la
 *      faction, triée par `pointsRequis` croissants. Si le rang n'est pas
 *      retrouvé, le grade vaut 0. Si le commanditaire est « Autre » (aucune
 *      faction), aucun bonus commanditaire n'est appliqué.
 *   2. Ensuite, selon la faction du personnage :
 *      — Alliance : 2 pts par cible abattue + 6 pts par cible capturée.
 *      — Guilde   : selon les konis gagnés durant la session, palier fixe
 *                   (10/15/20/25/30). Si la mission est hors Confédération,
 *                   ce palier est doublé (spec : le doublage ne s'applique
 *                   qu'à la Guilde).
 *      — Union    : 15 pts de base, +10 si hors Confédération,
 *                   +5 si le commanditaire n'est pas l'Union.
 */

export type FactionLite = {
  id: number
  nom?: string | null
  rangs?: { nom?: string | null; pointsRequis?: number | null }[] | null
}

/** Retourne la position 1-indexée du rang dans la faction, ou 0 si introuvable. */
export function factionGrade(
  rangDeFaction: string | null | undefined,
  faction: FactionLite | null | undefined,
): number {
  if (!rangDeFaction || !faction?.rangs || faction.rangs.length === 0) return 0

  // `rangDeFaction` est actuellement stocké comme un index 1-basé ("1",
  // "2", ...). Le conserver en priorité permet notamment de respecter
  // l'ordre des rangs défini dans le document de faction.
  const numericGrade = Number(rangDeFaction)
  if (Number.isInteger(numericGrade) && numericGrade >= 1 && numericGrade <= faction.rangs.length) {
    return numericGrade
  }

  // Compatibilité avec les anciennes valeurs éventuellement stockées sous
  // forme de nom de rang.
  const sorted = [...faction.rangs].sort(
    (a, b) => (a.pointsRequis ?? 0) - (b.pointsRequis ?? 0),
  )
  const target = rangDeFaction.trim().toLowerCase()
  const idx = sorted.findIndex((r) => (r.nom ?? '').trim().toLowerCase() === target)
  return idx >= 0 ? idx + 1 : 0
}

/** Palier de points de Guilde selon les konis gagnés durant la session. */
export function guildeKonisBracket(konisGain: number): number {
  if (konisGain <= 0) return 0
  if (konisGain <= 100_000) return 10
  if (konisGain <= 500_000) return 15
  if (konisGain <= 1_000_000) return 20
  if (konisGain <= 5_000_000) return 25
  return 30
}

export type FactionPointsInput = {
  /** Faction du personnage (relation affiliation), avec ses rangs. */
  affiliation: FactionLite | null | undefined
  /** Libellé du rang actuel du personnage. */
  rangDeFaction: string | null | undefined
  /** Konis gagnés par ce personnage durant la session (pas le total !). */
  konisGain: number
  /** Id de la faction commanditaire ; `null` = « Autre ». */
  commanditaireId: number | null
  /** Nom de la faction commanditaire ; `null` = « Autre ». */
  commanditaireName: string | null
  ciblesAbattues: number
  ciblesCapturees: number
  horsConfederation: boolean
}

/**
 * Décomposition détaillée des points gagnés, utile pour l'affichage du récap.
 */
export type FactionPointsBreakdown = {
  total: number
  commanditaire: number
  faction: number
  factionLabel: string | null
}

export function computeFactionPoints(input: FactionPointsInput): FactionPointsBreakdown {
  const { affiliation } = input
  if (!affiliation) {
    return { total: 0, commanditaire: 0, faction: 0, factionLabel: null }
  }

  // — 1. Bonus commanditaire (seulement si le perso est du bon camp).
  let commanditaire = 0
  if (
    input.commanditaireId != null &&
    affiliation.id === input.commanditaireId
  ) {
    commanditaire = 10 * factionGrade(input.rangDeFaction, affiliation)
  }

  // — 2. Points spécifiques à la faction du personnage.
  const nom = (affiliation.nom ?? '').trim().toLowerCase()
  let faction = 0
  let factionLabel: string | null = null

  if (nom === 'alliance') {
    faction = 2 * (input.ciblesAbattues || 0) + 6 * (input.ciblesCapturees || 0)
    factionLabel = 'Alliance'
  } else if (nom === 'guilde') {
    const bracket = guildeKonisBracket(input.konisGain || 0)
    faction = input.horsConfederation ? bracket * 2 : bracket
    factionLabel = 'Guilde'
  } else if (nom === 'union') {
    let unionPts = 15
    if (input.horsConfederation) unionPts += 10
    const commanditaireIsUnion =
      (input.commanditaireName ?? '').trim().toLowerCase() === 'union'
    if (!commanditaireIsUnion) unionPts += 5
    faction = unionPts
    factionLabel = 'Union'
  }

  return {
    total: commanditaire + faction,
    commanditaire,
    faction,
    factionLabel,
  }
}
