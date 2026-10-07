'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { exactMultiply, exactSubtract, relationId } from '@/lib/shop'
import { computeRank } from '@/lib/rankSystem'

type FormationPurchaseInput = { transactionId: string; formationId: number }

class FormationPurchaseError extends Error {}
function fail(message: string): never { throw new FormationPurchaseError(message) }

const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getContext() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const character = docs[0]
  if (!character) fail('Aucun personnage associé à ce compte.')
  return { payload, user, characterId: character.id }
}

function normalizedCost(value: unknown, label: string, integer = false) {
  if (value === null || value === undefined) return 0
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    fail(`Le coût configuré pour ${label} est invalide.`)
  }
  return value
}

export async function purchaseFormation(raw: FormationPurchaseInput) {
  const { payload, user, characterId } = await getContext()
  if (!raw || !uuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!Number.isSafeInteger(raw.formationId) || raw.formationId <= 0) fail('Formation invalide.')

  const fingerprint = JSON.stringify(['formation', raw.formationId])
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let amount = 0
  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')

    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${characterId} FOR UPDATE` })
    const character: any = await payload.findByID({ collection: 'characters', id: characterId, depth: 1, overrideAccess: true, req })
    if (numericId(character.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')

    const previous = await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1`,
    })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) {
        fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      }
      await payload.db.rollbackTransaction?.(transactionID)
      revalidatePath('/shop/formations')
      return { success: true, alreadyApplied: true, amount: Number(record.amount) || 0 }
    }

    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM formations WHERE id = ${raw.formationId} FOR SHARE` })
    const formation: any = await payload.findByID({ collection: 'formations', id: raw.formationId, depth: 1, overrideAccess: true, req }).catch(() => null)
    if (!formation) fail('Cette formation est introuvable.')
    const factionId = numericId(formation.organisationFormation)
    if (!factionId) fail('Cette formation ne possède pas d’organisation valide.')
    const faction: any = typeof formation.organisationFormation === 'object'
      ? formation.organisationFormation
      : await payload.findByID({ collection: 'factions', id: factionId, depth: 0, overrideAccess: true, req }).catch(() => null)
    const factionName = String(faction?.nom ?? '').trim()
    if (!factionName) fail('L’organisation de cette formation est introuvable.')

    const baseKonis = normalizedCost(formation.coutKonis, 'Konis', true)
    const basePR = normalizedCost(formation.coutPointsDeRang, 'points de rang')
    const baseReputation = normalizedCost(formation.coutRenommee, 'renommée')
    const skillRows: any[] = Array.isArray(character.competences) ? character.competences : []
    const skillIndex = skillRows.findIndex((entry) => entry.competence === formation.competence)
    const currentSkillLevel = skillIndex < 0 ? 0 : Number(skillRows[skillIndex].valeur)
    if (!Number.isInteger(currentSkillLevel) || currentSkillLevel < 0) fail('Le niveau de cette compétence est incohérent.')
    const multiplier = currentSkillLevel + 1
    const costKonis = exactMultiply(baseKonis, multiplier)
    const costPR = exactMultiply(basePR, multiplier)
    const costReputation = exactMultiply(baseReputation, multiplier)

    const currentKonis = Number(character.konis ?? 0)
    const currentPR = Number(character.pointsDeRang ?? 0)
    if (!Number.isFinite(currentKonis) || currentKonis < 0) fail('Le solde de Konis est incohérent.')
    if (!Number.isFinite(currentPR) || currentPR < 0) fail('Le solde de points de rang est incohérent.')
    if (currentKonis < costKonis) fail('Vous ne possédez pas assez de Konis.')
    const rankBefore = computeRank(currentPR)
    if (costPR > rankBefore.pointsInRank) fail('Vous ne possédez pas assez de points de rang courants.')
    const nextPR = exactSubtract(currentPR, costPR)
    if (computeRank(nextPR).level < rankBefore.level) fail('Cette dépense ferait perdre un rang.')

    const reputationRows: any[] = Array.isArray(character.reputation) ? character.reputation : []
    const factionKey = factionName.toLocaleLowerCase('fr')
    const reputationIndex = reputationRows.findIndex(
      (entry) => String(entry.categorie ?? '').trim().toLocaleLowerCase('fr') === factionKey,
    )
    const currentReputation = reputationIndex < 0 ? 0 : Number(reputationRows[reputationIndex].valeur ?? 0)
    if (!Number.isFinite(currentReputation) || currentReputation < 0) fail('La renommée auprès de cette organisation est incohérente.')
    if (currentReputation < costReputation) fail(`Vous ne possédez pas assez de renommée auprès de ${factionName}.`)

    const nextKonis = exactSubtract(currentKonis, costKonis)
    const nextReputation = exactSubtract(currentReputation, costReputation)
    const nextCompetences = skillIndex < 0
      ? [...skillRows, { competence: formation.competence, valeur: 1 }]
      : skillRows.map((entry, index) => index === skillIndex
        ? { ...entry, valeur: currentSkillLevel + 1 }
        : entry)
    const nextReputationRows = costReputation === 0
      ? reputationRows
      : reputationRows.map((entry, index) => index === reputationIndex
        ? { ...entry, valeur: nextReputation }
        : entry)

    await payload.update({
      collection: 'characters',
      id: characterId,
      data: {
        konis: nextKonis,
        pointsDeRang: nextPR,
        competences: nextCompetences,
        ...(costReputation > 0 ? { reputation: nextReputationRows } : {}),
      } as any,
      overrideAccess: true,
      user,
      req,
    })

    amount = costKonis
    const details = JSON.stringify({
      formationId: formation.id,
      competence: formation.competence,
      niveauAvant: currentSkillLevel,
      niveauApres: currentSkillLevel + 1,
      factionId,
      factionName,
      costs: { konis: costKonis, pointsDeRang: costPR, renommee: costReputation },
      balancesBefore: { konis: currentKonis, pointsDeRang: currentPR, renommee: currentReputation },
      balancesAfter: { konis: nextKonis, pointsDeRang: nextPR, renommee: nextReputation },
    })
    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, 'formation', ${user.id}, ${characterId}, ${null}, ${-costKonis}, ${details}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof FormationPurchaseError) throw error
    const existing = await payload.db.execute({
      drizzle: (payload.db as any).drizzle,
      sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1`,
    }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) {
      revalidatePath('/shop/formations')
      return { success: true, alreadyApplied: true, amount: Number(record.amount) || 0 }
    }
    throw new Error(error instanceof Error ? error.message : 'L’achat de la formation a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/formations')
  revalidatePath(`/characters/${characterId}`)
  return { success: true, alreadyApplied: false, amount: -amount }
}
