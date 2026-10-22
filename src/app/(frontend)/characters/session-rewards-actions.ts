'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers as getHeaders } from 'next/headers.js'
import type { User, Character, Faction } from '@/payload-types'
import { isMJMode } from '@/lib/activeMode'
import { getMJGroupIds } from '@/lib/mjAccess'
import { computeFactionPoints, type FactionLite } from './session-rewards-formula'
import {
  ranksGainedFromPoints,
  rollRankUpRewards,
  type CharacterOrigin,
  type RankUpRoll,
} from '@/lib/rankUpRewards'

/**
 * Payload envoyé par le drawer "Terminer la session".
 *
 * — `batchId` : UUID généré côté client. Rejoué à l'identique en cas de
 *   double-clic ou de rafraîchissement, garantit l'idempotence.
 * — `perCharacter.konis` / `perCharacter.pointsDeCompetence` : valeurs finales
 *   à ajouter, éventuellement ajustées manuellement par la personne qui termine la session.
 * — `apply.*` : cases à cocher du drawer (défaut true).
 */
export type SessionRewardsInput = {
  batchId: string
  scopeType: 'group' | 'selection'
  groupId?: number | null
  characterIds: number[]
  apply: {
    konis: boolean
    pr: boolean
    pointsDeCompetence: boolean
    reputation: boolean
    /** Application des points de faction (bonus commanditaire + points de mission). */
    faction: boolean
  }
  values: {
    konisTotal: number
    pr: number
    factionId?: number | null
    reputationValeur: number
    /**
     * Id de la faction commanditaire ; `null` = « Autre ».
     * Sert au bonus commanditaire (10×grade) et au calcul Union.
     */
    commanditaireId?: number | null
    ciblesAbattues: number
    ciblesCapturees: number
    horsConfederation: boolean
  }
  perCharacter: Record<
    string,
    {
      konis: number
      pointsDeCompetence: number
    }
  >
}

type PerCharSnapshot = {
  id: number
  nom: string
  before: {
    konis: number
    pointsDeRang: number
    pointsDeCompetence: number
    bonusPointsDeBlessures: number
    pointsDeFaction: number
    reputation: { categorie: string; valeur: number }[]
  }
  after: {
    konis: number
    pointsDeRang: number
    pointsDeCompetence: number
    bonusPointsDeBlessures: number
    pointsDeFaction: number
    reputation: { categorie: string; valeur: number }[]
  }
  delta: {
    konis: number
    pointsDeRang: number
    pointsDeCompetence: number
    pointsDeCompetenceMission: number
    bonusPointsDeBlessures: number
    pointsDeFaction: number
    /** Décomposition des points de faction : bonus commanditaire + points liés à l'affiliation. */
    pointsDeFactionBreakdown: {
      commanditaire: number
      faction: number
      factionLabel: string | null
    }
    reputation: { categorie: string; delta: number } | null
    progressionRang: (RankUpRoll & {
      armureSetId: number | null
      armuresAjoutees: number[]
      armureManquante: boolean
    })[]
  }
}

async function getAuthenticatedPayload() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return { payload, user: user as User | null }
}

/**
 * Applique en une transaction unique les récompenses de fin de session
 * à un ensemble de personnages, et journalise l'opération.
 *
 * Idempotence : si un document `session-rewards` avec ce `batchId` existe déjà,
 * l'opération n'est PAS rejouée et le résultat existant est renvoyé.
 */
export async function applySessionRewards(input: SessionRewardsInput) {
  const { payload, user } = await getAuthenticatedPayload()
  const isAdmin = user?.role === 'admin'
  const isMJ = user?.role === 'player' && user.isMJ === true && await isMJMode(user)

  if (!user || (!isAdmin && !isMJ)) {
    throw new Error('Non autorisé')
  }

  if (!input.batchId || typeof input.batchId !== 'string') {
    throw new Error('batchId manquant')
  }
  if (!Array.isArray(input.characterIds) || input.characterIds.length === 0) {
    throw new Error('Aucun personnage ciblé')
  }

  if (
    !input.characterIds.every((id) => Number.isSafeInteger(id) && id > 0) ||
    new Set(input.characterIds).size !== input.characterIds.length
  ) {
    throw new Error('Sélection de personnages invalide')
  }
  if (input.scopeType !== 'group' && input.scopeType !== 'selection') {
    throw new Error('Périmètre de récompense invalide')
  }

  if (isMJ) {
    const groupIds = await getMJGroupIds(payload, user)
    if (groupIds.length === 0) throw new Error('Aucune escouade gérée')

    let allowedGroupIds = groupIds
    if (input.scopeType === 'group') {
      const groupId = Number(input.groupId)
      if (!Number.isSafeInteger(groupId) || !groupIds.includes(groupId)) {
        throw new Error('Escouade non autorisée')
      }
      allowedGroupIds = [groupId]
    }

    const { docs } = await payload.find({
      collection: 'characters',
      where: {
        and: [
          { id: { in: input.characterIds } },
          { groupe: { in: allowedGroupIds } },
        ],
      },
      depth: 0,
      limit: input.characterIds.length,
      select: { id: true },
      overrideAccess: true,
    })
    if (docs.length !== input.characterIds.length) {
      throw new Error('Un ou plusieurs personnages ne sont pas dans vos escouades')
    }
  }

  // — Idempotence : on regarde si ce batch a déjà été appliqué.
  const existing = await payload.find({
    collection: 'session-rewards',
    where: { batchId: { equals: input.batchId } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) {
    return { success: true, alreadyApplied: true, batchId: input.batchId }
  }

  // — Résolution éventuelle de la faction pour la réputation.
  let factionName: string | null = null
  if (input.apply.reputation && input.values.factionId) {
    const faction = await payload.findByID({
      collection: 'factions',
      id: input.values.factionId,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
    if (!faction) throw new Error('Faction introuvable')
    factionName = (faction as Faction).nom ?? null
    if (!factionName) throw new Error('La faction sélectionnée n’a pas de nom')
  }

  // — Résolution éventuelle de la faction commanditaire (nom nécessaire pour
  //   la règle Union : « +5 si le commanditaire n'est pas l'Union »).
  let commanditaireName: string | null = null
  if (input.apply.faction && input.values.commanditaireId != null) {
    const faction = await payload.findByID({
      collection: 'factions',
      id: input.values.commanditaireId,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
    if (!faction) throw new Error('Faction commanditaire introuvable')
    commanditaireName = (faction as Faction).nom ?? null
  }

  // — Répartition des konis par personnage.
  //   La personne qui termine la session peut avoir ajusté les valeurs par personnage
  //   (perCharacter), sinon on tombe sur la division du total.
  const N = input.characterIds.length
  const konisPart = input.apply.konis
    ? Math.floor((input.values.konisTotal || 0) / N)
    : 0

  // — Transaction Payload : tout ou rien.
  const transactionID = await payload.db.beginTransaction?.()
  const reqOpts = transactionID ? { transactionID } : undefined

  try {
    const perCharacterLog: PerCharSnapshot[] = []

    for (const charId of input.characterIds) {
      const perChar = input.perCharacter[String(charId)] ?? {
        konis: konisPart,
        pointsDeCompetence: 0,
      }

      // Snapshot avant. `depth: 1` pour récupérer l'affiliation peuplée
      //   (nom + rangs) — nécessaire au calcul des points de faction.
      const before = (await payload.findByID({
        collection: 'characters',
        id: charId,
        depth: 1,
        overrideAccess: true,
        req: reqOpts as any,
      })) as Character

      const beforeKonis = before.konis ?? 0
      const beforePR = before.pointsDeRang ?? 0
      const beforePC = before.pointsDeCompetence ?? 0
      const beforeBonusBlessures = before.bonusPointsDeBlessures ?? 0
      const beforePF = (before as any).pointsDeFaction ?? 0
      const beforeRep = Array.isArray(before.reputation)
        ? before.reputation.map((r) => ({
            categorie: r.categorie,
            valeur: r.valeur ?? 0,
          }))
        : []

      const deltaKonis = input.apply.konis ? perChar.konis ?? 0 : 0
      const deltaPR = input.apply.pr ? input.values.pr || 0 : 0
      const deltaPC = input.apply.pointsDeCompetence
        ? perChar.pointsDeCompetence ?? 0
        : 0

      const nouveauxRangs = ranksGainedFromPoints(beforePR, deltaPR)
      const rankUpRewards =
        nouveauxRangs.length > 0
          ? rollRankUpRewards(nouveauxRangs[0]!, nouveauxRangs[nouveauxRangs.length - 1]!, before.origine as CharacterOrigin)
          : { bonusBlessures: 0, pointsDeCompetence: 0, promotions: [] }
      const progressionRang: PerCharSnapshot['delta']['progressionRang'] = []
      const inventaireArmures = [...(before.inventaireArmures ?? [])]

      for (const promotion of rankUpRewards.promotions) {
        const armorSetResult = await payload.find({
          collection: 'armor-sets',
          where: { rang: { equals: promotion.rang } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
          req: reqOpts as any,
        })
        const armorSet = armorSetResult.docs[0]
        const armureSetId: number | null = armorSet?.id ?? null
        let armuresAjoutees: number[] = []

        if (armorSet) {
          const armorResult = await payload.find({
            collection: 'armors',
            where: { set: { equals: armorSet.id } },
            limit: 1000,
            depth: 0,
            overrideAccess: true,
            req: reqOpts as any,
          })
          armuresAjoutees = armorResult.docs.map((armor) => armor.id)
          for (const armorId of armuresAjoutees) {
            inventaireArmures.push({ item: armorId, mods: [] })
          }
        }

        progressionRang.push({
          ...promotion,
          armureSetId,
          armuresAjoutees,
          armureManquante: !armorSet || armuresAjoutees.length === 0,
        })
      }

      // Points de faction — calcul via la formule partagée.
      //   Le "konisGain" pour la Guilde correspond aux konis reçus durant
      //   cette session par ce personnage précis (pas au total actuel).
      const affiliation = (before.affiliation && typeof before.affiliation === 'object'
        ? (before.affiliation as unknown as FactionLite)
        : null)
      const factionPtsBreakdown = input.apply.faction
        ? computeFactionPoints({
            affiliation,
            rangDeFaction: (before as any).rangDeFaction ?? null,
            konisGain: deltaKonis,
            commanditaireId: input.values.commanditaireId ?? null,
            commanditaireName,
            ciblesAbattues: input.values.ciblesAbattues || 0,
            ciblesCapturees: input.values.ciblesCapturees || 0,
            horsConfederation: !!input.values.horsConfederation,
          })
        : { total: 0, commanditaire: 0, faction: 0, factionLabel: null }
      const deltaPF = factionPtsBreakdown.total

      // Mise à jour de la réputation : on cherche l'entrée par nom de faction.
      let afterRep = beforeRep
      let repDelta: { categorie: string; delta: number } | null = null
      if (
        input.apply.reputation &&
        factionName &&
        (input.values.reputationValeur ?? 0) !== 0
      ) {
        const inc = input.values.reputationValeur
        const idx = beforeRep.findIndex(
          (r) => (r.categorie || '').trim().toLowerCase() === factionName!.trim().toLowerCase(),
        )
        if (idx >= 0) {
          afterRep = beforeRep.map((r, i) =>
            i === idx ? { ...r, valeur: (r.valeur ?? 0) + inc } : r,
          )
        } else {
          afterRep = [...beforeRep, { categorie: factionName, valeur: inc }]
        }
        repDelta = { categorie: factionName, delta: inc }
      }

      const nextKonis = beforeKonis + deltaKonis
      const nextPR = beforePR + deltaPR
      const nextPC = beforePC + deltaPC + rankUpRewards.pointsDeCompetence
      const nextBonusBlessures = beforeBonusBlessures + rankUpRewards.bonusBlessures
      const nextPF = beforePF + deltaPF

      const updateData: Partial<Character> = {}
      if (deltaKonis !== 0) updateData.konis = nextKonis
      if (deltaPR !== 0) updateData.pointsDeRang = nextPR
      if (deltaPC !== 0 || rankUpRewards.pointsDeCompetence !== 0) updateData.pointsDeCompetence = nextPC
      if (rankUpRewards.bonusBlessures !== 0) updateData.bonusPointsDeBlessures = nextBonusBlessures
      if (inventaireArmures.length !== (before.inventaireArmures ?? []).length) {
        updateData.inventaireArmures = inventaireArmures
      }
      if (deltaPF !== 0) (updateData as any).pointsDeFaction = nextPF
      if (repDelta) (updateData as any).reputation = afterRep

      if (Object.keys(updateData).length > 0) {
        await payload.update({
          collection: 'characters',
          id: charId,
          data: updateData,
          user,
          overrideAccess: true,
          req: reqOpts as any,
        })
      }

      perCharacterLog.push({
        id: before.id,
        nom: before.nom ?? '',
        before: {
          konis: beforeKonis,
          pointsDeRang: beforePR,
          pointsDeCompetence: beforePC,
          bonusPointsDeBlessures: beforeBonusBlessures,
          pointsDeFaction: beforePF,
          reputation: beforeRep,
        },
        after: {
          konis: nextKonis,
          pointsDeRang: nextPR,
          pointsDeCompetence: nextPC,
          bonusPointsDeBlessures: nextBonusBlessures,
          pointsDeFaction: nextPF,
          reputation: afterRep,
        },
        delta: {
          konis: deltaKonis,
          pointsDeRang: deltaPR,
          pointsDeCompetence: deltaPC + rankUpRewards.pointsDeCompetence,
          pointsDeCompetenceMission: deltaPC,
          bonusPointsDeBlessures: rankUpRewards.bonusBlessures,
          pointsDeFaction: deltaPF,
          pointsDeFactionBreakdown: {
            commanditaire: factionPtsBreakdown.commanditaire,
            faction: factionPtsBreakdown.faction,
            factionLabel: factionPtsBreakdown.factionLabel,
          },
          reputation: repDelta,
          progressionRang,
        },
      })
    }

    // — Journal d'audit.
    await payload.create({
      collection: 'session-rewards',
      data: {
        batchId: input.batchId,
        appliedBy: user.id,
        scopeType: input.scopeType,
        group: input.scopeType === 'group' ? input.groupId ?? null : null,
        characterIds: input.characterIds,
        rewards: {
          apply: input.apply,
          values: input.values,
          factionName,
          commanditaireName,
          konisPart,
        },
        perCharacter: perCharacterLog,
      },
      user,
      overrideAccess: true,
      req: reqOpts as any,
    })

    if (transactionID) await payload.db.commitTransaction?.(transactionID)
  } catch (err) {
    if (transactionID) await payload.db.rollbackTransaction?.(transactionID)
    throw err
  }

  revalidatePath('/characters')
  return { success: true, alreadyApplied: false, batchId: input.batchId }
}
