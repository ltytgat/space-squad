/**
 * ═══════════════════════════════════════════════════════
 *  Système de Rang — Space Squad
 *  Modifiez uniquement ce fichier pour rééquilibrer les seuils.
 * ═══════════════════════════════════════════════════════
 */

// ── Seuils cumulatifs de points par rang (index 0 = Rang 1) ──────────────────
export const RANK_THRESHOLDS: readonly number[] = [
  0,    // Rang 1
  5,    // Rang 2
  15,   // Rang 3
  40,   // Rang 4
  90,   // Rang 5
  190,  // Rang 6
  390,  // Rang 7
  790,  // Rang 8
  1390,  // Rang 9
  2390, // Rang 10
]

// ── Noms de grade par rang (index 0 = Rang 1) ────────────────────────────────
export const RANK_NAMES: readonly string[] = [
  'Bleu',
  'Novice',
  'Cadet',
  'Compétent',
  'Expert',
  'Officier',
  'Vétéran',
  'Capitaine',
  'Élite',
  'Maître',
]

export const RANK_MAX = RANK_THRESHOLDS.length // 10

// ── Type de retour ────────────────────────────────────────────────────────────

export type RankInfo = {
  /** Niveau de rang affiché (1–10) */
  level: number
  /** Nom de grade correspondant */
  name: string
  /** Points accumulés depuis le dernier palier (compteur remis à zéro) */
  pointsInRank: number
  /** Points totaux nécessaires pour atteindre le prochain rang (null si rang max) */
  pointsForNext: number | null
  /** Points manquants pour le prochain rang (null si rang max) */
  pointsToNext: number | null
  /** Progression dans le rang courant, en pourcentage (0–100) */
  progressPercent: number
}

// ── Fonction de calcul ────────────────────────────────────────────────────────

export function computeRank(totalPoints: number): RankInfo {
  const pts = Math.max(0, Math.floor(totalPoints))

  // Détermine le rang courant (le palier le plus haut atteint)
  let rankIndex = 0
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= RANK_THRESHOLDS[i]!) {
      rankIndex = i
      break
    }
  }

  const level = rankIndex + 1
  const currentThreshold = RANK_THRESHOLDS[rankIndex]!
  const nextThreshold =
    rankIndex + 1 < RANK_THRESHOLDS.length ? RANK_THRESHOLDS[rankIndex + 1]! : null

  const pointsInRank = pts - currentThreshold
  const pointsToNext = nextThreshold !== null ? nextThreshold - pts : null
  const pointsForNext = nextThreshold !== null ? nextThreshold - currentThreshold : null

  const progressPercent =
    pointsForNext !== null && pointsForNext > 0
      ? Math.min(100, Math.round((pointsInRank / pointsForNext) * 100))
      : 100

  return {
    level,
    name: RANK_NAMES[rankIndex]!,
    pointsInRank,
    pointsForNext,
    pointsToNext,
    progressPercent,
  }
}
