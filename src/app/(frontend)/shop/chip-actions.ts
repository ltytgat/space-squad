'use server'

import { randomInt } from 'node:crypto'
import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { exactAdd, exactSubtract, relationId } from '@/lib/shop'

const CHIP_PRICES = { active: 75_000, passive: 100_000 } as const
const DRAW_PRICES = { active: 30_000, passive: 50_000 } as const
const RECYCLE_PRICE = 10_000
type ChipCategory = keyof typeof CHIP_PRICES
type ChipSummary = { id: number; nom: string; categorie: ChipCategory; effet: string; restriction: string | null; cooldown: number | null; image: { url: string; alt: string } | null }
type ChipInput = {
  transactionId: string
  action: 'buy' | 'draw' | 'recycle'
  category?: ChipCategory
  chipId?: number
  ownedIndex?: number
}

class ChipShopError extends Error {}
function fail(message: string): never { throw new ChipShopError(message) }

function validCategory(value: unknown): value is ChipCategory {
  return value === 'active' || value === 'passive'
}

function summary(chip: any): ChipSummary {
  return {
    id: Number(chip.id),
    nom: String(chip.nom ?? 'Puce sans nom'),
    categorie: chip.categorie,
    effet: String(chip.effet ?? ''),
    restriction: chip.restriction ?? null,
    cooldown: chip.cooldown ?? null,
    image: chip.image && typeof chip.image === 'object' && typeof chip.image.url === 'string'
      ? { url: chip.image.url, alt: chip.image.alt ?? chip.nom ?? 'Illustration de la puce' }
      : null,
  }
}

function inventoryIds(entries: unknown): number[] {
  if (!Array.isArray(entries)) return []
  return entries.map((entry) => {
    const id = relationId(entry)
    const numericId = id === null ? NaN : Number(id)
    if (!Number.isSafeInteger(numericId) || numericId <= 0) fail('Votre réserve de puces contient une entrée invalide.')
    return numericId
  })
}

function fingerprint(input: ChipInput): string {
  return JSON.stringify([input.action, input.category ?? null, input.chipId ?? null, input.ownedIndex ?? null])
}

function ledgerChip(details: unknown): ChipSummary | null {
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details
    const chip = parsed && typeof parsed === 'object' ? (parsed as any).chip : null
    return chip && Number.isSafeInteger(Number(chip.id)) && validCategory(chip.categorie) ? { ...chip, image: chip.image ?? null } as ChipSummary : null
  } catch {
    return null
  }
}

export async function executeChipTransaction(raw: ChipInput) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 0, limit: 1, overrideAccess: true })
  const characterRef: any = docs[0]
  if (!characterRef) fail('Aucun personnage associé à ce compte.')
  const characterId = Number(characterRef.id)

  if (!raw || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!['buy', 'draw', 'recycle'].includes(raw.action)) fail('Opération inconnue.')
  if (raw.category !== undefined && !validCategory(raw.category)) fail('Catégorie de puce invalide.')
  if (raw.chipId !== undefined && (!Number.isSafeInteger(raw.chipId) || raw.chipId <= 0)) fail('Puce invalide.')
  if (raw.ownedIndex !== undefined && (!Number.isSafeInteger(raw.ownedIndex) || raw.ownedIndex < 0)) fail('Position d’inventaire invalide.')
  if (raw.action === 'draw' && (!validCategory(raw.category) || raw.chipId !== undefined || raw.ownedIndex !== undefined)) fail('Paramètres du tirage invalides.')
  if (raw.action === 'buy' && (!Number.isSafeInteger(raw.chipId) || raw.chipId! <= 0 || raw.category !== undefined || raw.ownedIndex !== undefined)) fail('Paramètres de l’achat invalides.')
  if (raw.action === 'recycle' && (!Number.isSafeInteger(raw.chipId) || raw.chipId! <= 0 || !Number.isSafeInteger(raw.ownedIndex) || raw.category !== undefined)) fail('Paramètres du recyclage invalides.')

  const requestFingerprint = fingerprint(raw)
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let alreadyApplied = false
  let amount = 0
  let resultChip: ChipSummary | null = null

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${characterId} FOR UPDATE` })
    const character: any = await payload.findByID({ collection: 'characters', id: characterId, depth: 1, overrideAccess: true, req })
    if (relationId(character.user) !== String(user.id)) fail('Ce personnage ne vous appartient pas.')

    const previous = await payload.db.execute({ db: transactionDb, sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== requestFingerprint || Number(record.actor_id) !== Number(user.id)) fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      alreadyApplied = true
      amount = Math.abs(Number(record.amount) || 0)
      resultChip = ledgerChip(record.details)
    } else {
      let chip: any
      if (raw.action === 'draw') {
        const available: any[] = []
        let page = 1
        while (true) {
          const result = await payload.find({
            collection: 'chips', where: { categorie: { equals: raw.category } },
            depth: 1, limit: 500, page, overrideAccess: true, req,
          })
          available.push(...result.docs)
          if (!result.hasNextPage || !result.nextPage) break
          page = result.nextPage
        }
        if (!available.length) fail(`Aucune puce ${raw.category === 'active' ? 'active' : 'passive'} n’est disponible pour le tirage.`)
        chip = available[randomInt(available.length)]
        amount = DRAW_PRICES[raw.category!]
      } else {
        chip = await payload.findByID({ collection: 'chips', id: raw.chipId!, depth: 1, overrideAccess: true, req }).catch(() => null)
        if (!chip) fail('Puce introuvable dans le catalogue.')
        if (!validCategory(chip.categorie)) fail('La catégorie de cette puce est invalide.')
        if (raw.action === 'buy') amount = CHIP_PRICES[chip.categorie as ChipCategory]
      }

      resultChip = summary(chip)
      const owned = inventoryIds(character.inventairePuces)
      if (raw.action === 'recycle') {
        if (raw.ownedIndex! >= owned.length || owned[raw.ownedIndex!] !== chip.id) fail('Cette puce n’est plus dans votre réserve.')
        owned.splice(raw.ownedIndex!, 1)
        amount = RECYCLE_PRICE
      } else {
        owned.push(chip.id)
      }

      const balance = Number(character.konis ?? 0)
      if (!Number.isFinite(balance) || balance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = raw.action === 'recycle' ? exactAdd(balance, amount) : exactSubtract(balance, amount)
      if (raw.action !== 'recycle' && nextBalance < 0) fail('Vous ne possédez pas assez de Konis.')
      if (!Number.isFinite(nextBalance)) fail('Le montant calculé est invalide.')

      await payload.update({
        collection: 'characters', id: characterId,
        data: { inventairePuces: owned, konis: nextBalance }, overrideAccess: true, user, req,
      })
      const details = JSON.stringify({ action: raw.action, chip: resultChip, balanceBefore: balance, balanceAfter: nextBalance })
      const operation = raw.action === 'draw' ? 'chip-draw' : raw.action === 'buy' ? 'chip-buy' : 'chip-recycle'
      await payload.db.execute({ db: transactionDb, sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${requestFingerprint}, ${operation}, ${user.id}, ${characterId}, NULL, ${raw.action === 'recycle' ? amount : -amount}, ${details}::jsonb)` })
    }

    if (alreadyApplied) await payload.db.rollbackTransaction?.(transactionID)
    else await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof ChipShopError) throw error
    const existing = await payload.db.execute({ drizzle: (payload.db as any).drizzle, sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === requestFingerprint && Number(record.actor_id) === Number(user.id)) {
      revalidatePath('/shop')
      return { success: true, alreadyApplied: true, amount: Number(record.amount), chip: ledgerChip(record.details) }
    }
    throw new Error(error instanceof Error ? error.message : 'La transaction a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath(`/characters/${characterId}`)
  return { success: true, alreadyApplied, amount: raw.action === 'recycle' ? amount : -amount, chip: resultChip }
}
