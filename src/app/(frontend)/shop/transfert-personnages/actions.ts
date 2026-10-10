'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { exactAdd, exactSubtract, relationId } from '@/lib/shop'

type TransferInput = {
  transactionId: string
  action: 'item' | 'konis'
  destinationCharacterId: number
  sourceKey?: string
  quantity?: number
  amount?: number
}

class TransferError extends Error {}
function fail(message: string): never { throw new TransferError(message) }

const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}
const validId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
const validIndex = (value: string, length: number) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) < length
const transactionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getContext() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 0, limit: 1, overrideAccess: true })
  if (!docs[0]) fail('Aucun personnage associé à ce compte.')
  return { payload, user, character: docs[0] as any }
}

function itemData(character: any, sourceKey: string, quantity: number | undefined, destination: any) {
  const [field, indexText] = sourceKey.split(':')
  const allowed = ['inventaireArmes', 'inventaireArmures', 'inventaireMods', 'inventairePuces', 'inventaire']
  if (!allowed.includes(field) || !validIndex(indexText, character[field]?.length ?? 0)) fail('Cet élément n’est plus disponible dans votre inventaire.')
  const index = Number(indexText)
  const sourceRows = [...(character[field] ?? [])]
  const original = sourceRows[index]

  if (field === 'inventaire') {
    const itemId = numericId(original.consommable)
    const available = Number(original.quantite)
    if (!itemId || !Number.isSafeInteger(available) || available < 1) fail('La réserve de consommables contient une quantité incohérente.')
    const movedQuantity = quantity ?? available
    if (!Number.isSafeInteger(movedQuantity) || movedQuantity < 1 || movedQuantity > available) fail('La quantité de transfert est invalide.')
    sourceRows[index] = { ...original, consommable: itemId, quantite: available - movedQuantity }
    const sourceInventory = sourceRows.map((row) => {
      const rowId = numericId(row.consommable)
      const rowQuantity = Number(row.quantite)
      if (!rowId || !Number.isSafeInteger(rowQuantity) || rowQuantity < 0) fail('La réserve de consommables contient une quantité incohérente.')
      return { ...row, consommable: rowId, quantite: rowQuantity }
    }).filter((row) => row.quantite > 0)
    const targetRows = (destination.inventaire ?? []).map((row: any) => {
      const rowId = numericId(row.consommable)
      const rowQuantity = Number(row.quantite)
      if (!rowId || !Number.isSafeInteger(rowQuantity) || rowQuantity < 1) fail('La réserve de consommables du destinataire est incohérente.')
      return { consommable: rowId, quantite: rowQuantity }
    })
    const existingQuantity = targetRows.filter((row: any) => row.consommable === itemId).reduce((sum: number, row: any) => sum + row.quantite, 0)
    if (!Number.isSafeInteger(existingQuantity + movedQuantity)) fail('La quantité totale dépasserait la limite autorisée.')
    const destinationInventory = targetRows.filter((row: any) => row.consommable !== itemId)
    destinationInventory.push({ consommable: itemId, quantite: existingQuantity + movedQuantity })
    return {
      sourceUpdate: { inventaire: sourceInventory },
      destinationUpdate: { inventaire: destinationInventory },
      quantity: movedQuantity,
      itemId,
      field,
    }
  }

  if (quantity !== undefined && quantity !== 1) fail('Cet élément se transfère à l’unité.')
  const relationField = field === 'inventaireArmes' || field === 'inventaireArmures' ? 'item' : null
  const itemId = numericId(relationField ? original[relationField] : original)
  if (!itemId) fail('Cet élément n’est plus disponible dans votre inventaire.')
  sourceRows.splice(index, 1)

  if (field === 'inventaireArmes') {
    const normalize = (row: any) => {
      const weaponId = numericId(row.item)
      const mods = (row.mods ?? []).map(numericId)
      if (!weaponId || mods.some((id: number | null) => !id)) fail('Une arme en réserve contient une référence invalide.')
      return { item: weaponId, mods, munitionsActuelles: Number(row.munitionsActuelles) || 0, chargeurRelie: numericId(row.chargeurRelie) }
    }
    return { sourceUpdate: { [field]: sourceRows.map(normalize) }, destinationUpdate: { [field]: [...(destination[field] ?? []).map(normalize), normalize(original)] }, quantity: 1, itemId, field }
  }
  if (field === 'inventaireArmures') {
    const normalize = (row: any) => {
      const armorId = numericId(row.item)
      const mods = (row.mods ?? []).map(numericId)
      if (!armorId || mods.some((id: number | null) => !id)) fail('Une armure en réserve contient une référence invalide.')
      return { item: armorId, mods }
    }
    return { sourceUpdate: { [field]: sourceRows.map(normalize) }, destinationUpdate: { [field]: [...(destination[field] ?? []).map(normalize), normalize(original)] }, quantity: 1, itemId, field }
  }

  const normalizeRelations = (rows: unknown[]) => rows.map((value) => {
    const id = numericId(value)
    if (!id) fail('Une réserve contient une référence invalide.')
    return id
  })
  return {
    sourceUpdate: { [field]: normalizeRelations(sourceRows) },
    destinationUpdate: { [field]: [...normalizeRelations(destination[field] ?? []), itemId] },
    quantity: 1,
    itemId,
    field,
  }
}

export async function executeCharacterTransfer(raw: TransferInput) {
  const { payload, user, character } = await getContext()
  if (!raw || !transactionUuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!['item', 'konis'].includes(raw.action)) fail('Opération inconnue.')
  if (!validId(raw.destinationCharacterId) || raw.destinationCharacterId === Number(character.id)) fail('Choisissez un autre personnage de votre escouade.')
  if (raw.action === 'item' && (typeof raw.sourceKey !== 'string' || raw.amount !== undefined)) fail('Données de transfert de matériel invalides.')
  if (raw.action === 'konis' && (raw.sourceKey !== undefined || raw.quantity !== undefined || !Number.isFinite(raw.amount) || Number(raw.amount) <= 0 || !/^\d+(?:\.\d{1,4})?$/.test(String(raw.amount)))) fail('Montant de Konis invalide (maximum quatre décimales).')

  const fingerprint = JSON.stringify([raw.action, character.id, raw.destinationCharacterId, raw.sourceKey ?? null, raw.quantity ?? null, raw.amount ?? null])
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let movedAmount = 0

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    for (const id of [Number(character.id), raw.destinationCharacterId].sort((a, b) => a - b)) {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${id} FOR UPDATE` })
    }
    const source = await payload.findByID({ collection: 'characters', id: character.id, depth: 2, overrideAccess: true, req }) as any
    if (numericId(source.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')

    const previous = await payload.db.execute({ db: transactionDb, sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true, amount: Math.abs(Number(record.amount) || 0) }
    }

    const destination = await payload.findByID({ collection: 'characters', id: raw.destinationCharacterId, depth: 2, overrideAccess: true, req }).catch(() => null) as any
    const groupId = numericId(source.groupe)
    if (!groupId || numericId(destination?.groupe) !== groupId) fail('Le destinataire doit appartenir à votre escouade.')

    let operation: string
    let details: Record<string, unknown>
    let ledgerAmount = 0
    if (raw.action === 'konis') {
      const amount = Number(raw.amount)
      const sourceBalance = Number(source.konis)
      const destinationBalance = Number(destination.konis)
      if (!Number.isFinite(sourceBalance) || sourceBalance < 0 || !Number.isFinite(destinationBalance) || destinationBalance < 0) fail('Le solde d’un personnage est incohérent.')
      if (sourceBalance < amount) fail('Vous ne possédez pas assez de Konis.')
      const nextSourceBalance = exactSubtract(sourceBalance, amount)
      const nextDestinationBalance = exactAdd(destinationBalance, amount)
      if (!Number.isFinite(nextSourceBalance) || !Number.isFinite(nextDestinationBalance)) fail('Le nouveau solde ne peut pas être représenté.')
      await payload.update({ collection: 'characters', id: source.id, data: { konis: nextSourceBalance }, overrideAccess: true, user, req })
      await payload.update({ collection: 'characters', id: destination.id, data: { konis: nextDestinationBalance }, overrideAccess: true, user, req })
      movedAmount = amount
      ledgerAmount = -amount
      operation = 'character-transfer-konis'
      details = { action: raw.action, sourceCharacterId: source.id, destinationCharacterId: destination.id, amount, balanceBefore: sourceBalance, balanceAfter: nextSourceBalance }
    } else {
      const moved = itemData(source, raw.sourceKey!, raw.quantity, destination)
      await payload.update({ collection: 'characters', id: source.id, data: moved.sourceUpdate, overrideAccess: true, user, req })
      await payload.update({ collection: 'characters', id: destination.id, data: moved.destinationUpdate, overrideAccess: true, user, req })
      operation = 'character-transfer-item'
      details = { action: raw.action, sourceCharacterId: source.id, destinationCharacterId: destination.id, sourceKey: raw.sourceKey, field: moved.field, itemId: moved.itemId, quantity: moved.quantity }
    }

    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, ${operation}, ${user.id}, ${source.id}, ${null}, ${ledgerAmount}, ${JSON.stringify(details)}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof TransferError) throw error
    const existing = await payload.db.execute({ drizzle: (payload.db as any).drizzle, sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) return { success: true, alreadyApplied: true, amount: Math.abs(Number(record.amount) || 0) }
    throw new Error(error instanceof Error ? error.message : 'Le transfert a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/transfert-personnages')
  revalidatePath(`/characters/${character.id}`)
  revalidatePath(`/characters/${raw.destinationCharacterId}`)
  return { success: true, alreadyApplied: false, amount: movedAmount }
}
