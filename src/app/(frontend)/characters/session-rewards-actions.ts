'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { headers as getHeaders } from 'next/headers.js'
import type { User, Character, Faction } from '@/payload-types'

/**
 * Payload envoyé par le drawer "Terminer la session".
 *
 * — `batchId` : UUID généré côté client. Rejoué à l'identique en cas de
 *   double-clic ou de rafraîchissement, garantit l'idempotence.
 * — `perCharacter.konis` / `perCharacter.pointsDeCompetence` : valeurs finales
 *   à ajouter, éventuellement ajustées manuellement par l'admin.
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
  }
  values: {
    konisTotal: number
    pr: number
    factionId?: number | null
    reputationValeur: number
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
    reputation: { categorie: string; valeur: number }[]
  }
  after: {
    konis: number
    pointsDeRang: number
    pointsDeCompetence: number
    reputation: { categorie: string; valeur: number }[]
  }
  delta: {
    konis: number
    pointsDeRang: number
    pointsDeCompetence: number
    reputation: { categorie: string; delta: number } | null
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

  if (!user || user.role !== 'admin') {
    throw new Error('Non autorisé')
  }

  if (!input.batchId || typeof input.batchId !== 'string') {
    throw new Error('batchId manquant')
  }
  if (!Array.isArray(input.characterIds) || input.characterIds.length === 0) {
    throw new Error('Aucun personnage ciblé')
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

  // — Répartition des konis par personnage.
  //   L'admin peut avoir ajusté manuellement les valeurs par personnage
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

      // Snapshot avant.
      const before = (await payload.findByID({
        collection: 'characters',
        id: charId,
        depth: 0,
        overrideAccess: true,
        req: reqOpts as any,
      })) as Character

      const beforeKonis = before.konis ?? 0
      const beforePR = before.pointsDeRang ?? 0
      const beforePC = before.pointsDeCompetence ?? 0
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
      const nextPC = beforePC + deltaPC

      const updateData: Partial<Character> = {}
      if (deltaKonis !== 0) updateData.konis = nextKonis
      if (deltaPR !== 0) updateData.pointsDeRang = nextPR
      if (deltaPC !== 0) updateData.pointsDeCompetence = nextPC
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
          reputation: beforeRep,
        },
        after: {
          konis: nextKonis,
          pointsDeRang: nextPR,
          pointsDeCompetence: nextPC,
          reputation: afterRep,
        },
        delta: {
          konis: deltaKonis,
          pointsDeRang: deltaPR,
          pointsDeCompetence: deltaPC,
          reputation: repDelta,
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
