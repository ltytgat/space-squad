'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { relationId } from '@/lib/shop'

type PurchaseInput = { transactionId: string; roleId: number }

class PurchaseError extends Error {}
function fail(message: string): never { throw new PurchaseError(message) }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}

export async function purchaseSpecialRole(raw: PurchaseInput) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  if (!raw || !uuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!Number.isSafeInteger(raw.roleId) || raw.roleId <= 0) fail('Rôle spécial invalide.')

  const { docs } = await payload.find({
    collection: 'characters',
    where: { user: { equals: user.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const character = docs[0]
  if (!character) fail('Aucun personnage associé à ce compte.')

  const fingerprint = JSON.stringify(['special-role', raw.roleId])
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })

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
      revalidatePath(`/characters/${character.id}`)
      return { success: true, alreadyApplied: true, amount: Number(record.amount) || 0 }
    }

    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM special_roles WHERE id = ${raw.roleId} FOR SHARE` })
    const specialRole: any = await payload.findByID({ collection: 'special-roles', id: raw.roleId, depth: 0, overrideAccess: true, req }).catch(() => null)
    if (!specialRole) fail('Ce rôle spécial est introuvable.')
    const currentCharacter: any = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req })
    const ownedRoles: any[] = Array.isArray(currentCharacter.rolesSpeciaux) ? currentCharacter.rolesSpeciaux : []
    const ownedIds = ownedRoles.map(numericId).filter((id): id is number => id !== null)
    if (ownedIds.includes(raw.roleId)) fail('Votre personnage possède déjà ce rôle spécial.')

    const price = specialRole.prix
    if (typeof price !== 'number' || !Number.isSafeInteger(price) || price < 0) fail('Le prix configuré pour ce rôle spécial est invalide.')
    const balance = Number(currentCharacter.konis ?? 0)
    if (!Number.isFinite(balance) || balance < 0) fail('Le solde de Konis est incohérent.')
    if (balance < price) fail('Vous ne possédez pas assez de Konis.')

    const nextBalance = balance - price
    await payload.update({
      collection: 'characters',
      id: character.id,
      data: { konis: nextBalance, rolesSpeciaux: [...ownedIds, raw.roleId] } as any,
      overrideAccess: true,
      user,
      req,
    })

    const details = JSON.stringify({
      roleId: raw.roleId,
      roleName: specialRole.nom,
      price,
      balanceBefore: balance,
      balanceAfter: nextBalance,
    })
    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, 'special-role', ${user.id}, ${character.id}, ${null}, ${-price}, ${details}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof PurchaseError) throw error
    const existing = await payload.db.execute({
      drizzle: (payload.db as any).drizzle,
      sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1`,
    }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) {
      revalidatePath('/shop/formations')
      revalidatePath(`/characters/${character.id}`)
      return { success: true, alreadyApplied: true, amount: Number(record.amount) || 0 }
    }
    throw new Error(error instanceof Error ? error.message : 'L’achat du rôle spécial a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/formations')
  revalidatePath(`/characters/${character.id}`)
  return { success: true, alreadyApplied: false }
}
