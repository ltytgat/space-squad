'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { exactSubtract, relationId } from '@/lib/shop'
import { factionGrade } from '@/app/(frontend)/characters/session-rewards-formula'
import { factionExWeaponType, rewardUsageForApplication } from '@/lib/factionRewards'

type FactionRewardActionInput =
  | { transactionId: string; action: 'promote' }
  | { transactionId: string; action: 'purchase'; rewardId: number }

class FactionRewardActionError extends Error {}
function fail(message: string): never { throw new FactionRewardActionError(message) }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}

export async function performFactionRewardAction(raw: FactionRewardActionInput) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  if (!raw || !uuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (raw.action !== 'promote' && raw.action !== 'purchase') fail('Opération inconnue.')
  if (raw.action === 'purchase' && (!Number.isSafeInteger(raw.rewardId) || raw.rewardId <= 0)) fail('Récompense invalide.')

  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 2, limit: 1, overrideAccess: true })
  const character: any = docs[0]
  if (!character) fail('Aucun personnage associé à ce compte.')
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    const lockedCharacter: any = await payload.findByID({ collection: 'characters', id: character.id, depth: 2, overrideAccess: true, req })
    if (numericId(lockedCharacter.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    const factionId = numericId(lockedCharacter.affiliation)
    const faction: any = lockedCharacter.affiliation && typeof lockedCharacter.affiliation === 'object'
      ? lockedCharacter.affiliation
      : factionId ? await payload.findByID({ collection: 'factions', id: factionId, depth: 1, overrideAccess: true, req }).catch(() => null) : null
    if (!factionId || !faction?.nom || !Array.isArray(faction.rangs) || faction.rangs.length === 0) fail('Ce personnage n’est affilié à aucune faction configurée.')

    const fingerprint = raw.action === 'promote'
      ? JSON.stringify(['faction-promotion', factionId])
      : JSON.stringify(['faction-reward', raw.rewardId, factionId])
    const previous = await payload.db.execute({ db: transactionDb, sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) fail('Cet identifiant a déjà été utilisé pour une autre opération.')
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true, amount: Number(record.amount) || 0 }
    }

    let details: Record<string, unknown>
    let amount = 0
    let updateData: Record<string, unknown>
    let operation: 'faction-reward' | 'faction-promotion'

    if (raw.action === 'promote') {
      const grade = factionGrade(lockedCharacter.rangDeFaction, faction)
      const nextRank = faction.rangs[grade]
      if (!nextRank) fail('Ce personnage a déjà atteint le grade maximal.')
      const threshold = Number(nextRank.pointsRequis)
      const currentPoints = Number(lockedCharacter.pointsDeFaction ?? 0)
      if (!Number.isSafeInteger(threshold) || threshold < 0) fail('Le seuil du grade suivant est invalide.')
      if (!Number.isFinite(currentPoints) || currentPoints < threshold) fail(`Il faut au moins ${threshold} points de faction pour obtenir le grade ${nextRank.nom}.`)
      amount = currentPoints
      details = { factionId, factionName: faction.nom, gradeAvant: grade, gradeApres: grade + 1, nomGrade: nextRank.nom, seuil: threshold, pointsConsommes: currentPoints }
      updateData = { rangDeFaction: String(grade + 1), pointsDeFaction: 0 }
      operation = 'faction-promotion'
    } else {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM faction_reward_tiers WHERE id = ${raw.rewardId} FOR SHARE` })
      const reward: any = await payload.findByID({ collection: 'faction-reward-tiers', id: raw.rewardId, depth: 2, overrideAccess: true, req }).catch(() => null)
      if (!reward) fail('Cette récompense est introuvable.')
      const factionVariant = (reward.factions ?? []).find((entry: any) => numericId(entry.faction) === factionId)
      if (!factionVariant) fail('Cette récompense n’est pas disponible pour votre faction.')
      const grade = factionGrade(lockedCharacter.rangDeFaction, faction)
      const requiredGrade = Number(reward.gradeRequis)
      const costPointsFaction = Number(reward.coutPointsFaction ?? 0)
      const currentPoints = Number(lockedCharacter.pointsDeFaction ?? 0)
      if (!Number.isSafeInteger(requiredGrade) || requiredGrade < 1 || !Number.isSafeInteger(costPointsFaction) || costPointsFaction < 0) fail('Le coût ou le grade requis de cette récompense est invalide.')
      const requiredGradeName = faction.rangs[requiredGrade - 1]?.nom ?? 'non configuré'
      if (grade < requiredGrade) fail(`Le grade ${requiredGradeName} est requis pour cette récompense.`)
      if (!Number.isFinite(currentPoints) || currentPoints < costPointsFaction) fail('Vous ne possédez pas assez de points de faction.')
      const rewardType = reward.typeRecompense === 'acces-armes-ex' ? 'acces-armes-ex' : 'bon-reduction'
      if (rewardType === 'acces-armes-ex' && !factionExWeaponType(faction.nom)) fail('Ce droit d’accès aux armes eX n’est pas défini pour cette faction.')
      if (rewardType === 'bon-reduction') {
        const percentage = Number(reward.pourcentageReduction)
        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100 || !rewardUsageForApplication(factionVariant.application)) fail('La valeur de réduction ou l’application de ce bon est invalide.')
      }
      const inventory: any[] = Array.isArray(lockedCharacter.inventaireRecompensesFaction) ? lockedCharacter.inventaireRecompensesFaction : []
      amount = costPointsFaction
      details = { rewardId: reward.id, rewardName: reward.nom, factionId, factionName: faction.nom, costs: { pointsFaction: costPointsFaction }, balancesBefore: { pointsFaction: currentPoints } }
      updateData = {
        pointsDeFaction: exactSubtract(currentPoints, costPointsFaction),
        inventaireRecompensesFaction: [...inventory, {
          nom: reward.nom,
          effet: factionVariant.description,
          faction: faction.nom,
          grade: faction.rangs[requiredGrade - 1]?.nom ?? 'Grade non configuré',
          typeRecompense: rewardType,
          pourcentageReduction: reward.pourcentageReduction ?? null,
          usage: rewardUsageForApplication(factionVariant.application),
        }],
      }
      operation = 'faction-reward'
    }

    await payload.update({ collection: 'characters', id: character.id, data: updateData as any, overrideAccess: true, user, req })
    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, ${operation}, ${user.id}, ${character.id}, ${null}, ${raw.action === 'promote' ? 0 : -amount}, ${JSON.stringify(details)}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof FactionRewardActionError) throw error
    throw new Error(error instanceof Error ? error.message : 'L’opération de faction a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/recompenses')
  revalidatePath(`/characters/${character.id}`)
  return { success: true, alreadyApplied: false }
}
