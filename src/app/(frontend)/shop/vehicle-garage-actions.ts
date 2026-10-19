'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { computeShipAccess } from '@/lib/shipAccess'
import { computeRank } from '@/lib/rankSystem'
import { exactAdd, exactSubtract, relationId } from '@/lib/shop'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { minimumRankForVehicleClass, vehicleGarageFingerprint, vehiclePurchasePrice, vehicleSalePrice } from '@/lib/vehicleGarage'
import { mergeShipInventory } from '@/lib/shipyard'

type VehicleGarageInput = {
  transactionId: string
  action: 'buy' | 'sell'
  saleModelId?: number
  vehicleId?: number
  vehicleName?: string
}

class VehicleGarageError extends Error {}
function fail(message: string): never {
  throw new VehicleGarageError(message)
}

const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}
const validId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
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
  const character = docs[0] as any
  if (!character) fail('Aucun personnage associé à ce compte.')
  if (!isCharacterCreationComplete(character)) fail('Terminez le parcours de création avant d’utiliser le Garage.')
  return { payload, user, character }
}

function transactionResponse(record: any, alreadyApplied: boolean) {
  const details = record.details && typeof record.details === 'object' ? record.details : {}
  return {
    success: true,
    alreadyApplied,
    amount: Math.abs(Number(record.amount) || 0),
    vehicleId: details.vehicleId ?? null,
  }
}

export async function executeVehicleGarageTransaction(raw: VehicleGarageInput) {
  const { payload, user, character } = await getContext()
  if (!raw || !uuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (raw.action !== 'buy' && raw.action !== 'sell') fail('Opération inconnue.')
  if (raw.saleModelId !== undefined && !validId(raw.saleModelId)) fail('Modèle de vente invalide.')
  if (raw.vehicleId !== undefined && !validId(raw.vehicleId)) fail('Véhicule invalide.')
  if (raw.vehicleName !== undefined && (typeof raw.vehicleName !== 'string' || raw.vehicleName.trim().length > 100)) {
    fail('Le nom du véhicule ne peut pas dépasser 100 caractères.')
  }
  if (raw.action === 'buy' && (!raw.saleModelId || raw.vehicleId !== undefined)) fail('Données d’achat invalides.')
  if (raw.action === 'sell' && (!raw.vehicleId || raw.saleModelId !== undefined || raw.vehicleName !== undefined)) fail('Données de revente invalides.')

  const fingerprint = vehicleGarageFingerprint({
    action: raw.action,
    saleModelId: raw.saleModelId,
    vehicleId: raw.vehicleId,
    vehicleName: raw.vehicleName,
  })
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let amount = 0
  let resultVehicleId: number | null = null

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    const currentCharacter = await payload.findByID({ collection: 'characters', id: character.id, depth: 1, overrideAccess: true, req }) as any
    if (numericId(currentCharacter.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    if (!isCharacterCreationComplete(currentCharacter)) fail('Terminez le parcours de création avant d’utiliser le Garage.')

    if (raw.action === 'buy') {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM vehicle_sale_models WHERE id = ${raw.saleModelId} FOR SHARE` })
    } else {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM vehicles WHERE id = ${raw.vehicleId} FOR UPDATE` })
    }

    const previous = await payload.db.execute({
      db: transactionDb,
      sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1`,
    })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) {
        fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      }
      await payload.db.rollbackTransaction?.(transactionID)
      return transactionResponse(record, true)
    }

    const detail: Record<string, unknown> = { action: raw.action }
    if (raw.action === 'buy') {
      const modelLock = await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM vehicle_sale_models WHERE id = ${raw.saleModelId} FOR SHARE` })
      if (!modelLock.rows[0]) fail('Modèle de vente introuvable.')
      const model = await payload.findByID({ collection: 'vehicle-sale-models', id: raw.saleModelId!, depth: 2, overrideAccess: true, req }) as any
      const variant = model.variante && typeof model.variante === 'object' ? model.variante : null
      const minimumRank = minimumRankForVehicleClass(variant?.classe)
      if (minimumRank === null) fail('La classe de ce véhicule n’est pas valide pour la vente.')
      const currentRank = computeRank(Number(currentCharacter.pointsDeRang) || 0).level
      if (minimumRank !== null && currentRank < minimumRank) {
        fail(`L’achat d’un véhicule de classe ${variant.classe} nécessite le rang ${minimumRank}.`)
      }
      const price = vehiclePurchasePrice(model.prix)
      if (price === null) fail('Ce modèle n’a pas de prix commercialisable.')
      const currentBalance = Number(currentCharacter.konis ?? 0)
      if (!Number.isFinite(currentBalance) || currentBalance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = exactSubtract(currentBalance, price)
      if (nextBalance < 0) fail('Vous ne possédez pas assez de Konis.')
      const vehicleName = String(raw.vehicleName ?? '').trim() || String(model.nom ?? '').trim()
      if (!vehicleName || vehicleName.length > 100) fail('Le nom du véhicule doit contenir entre 1 et 100 caractères.')

      await payload.update({ collection: 'characters', id: character.id, data: { konis: nextBalance }, overrideAccess: true, user, req })
      const created = await payload.create({
        collection: 'vehicles',
        data: { nom: vehicleName, modele: model.id, proprietaire: character.id, blindageActuel: Number(model.blindageMax) || 0 },
        draft: false,
        overrideAccess: true,
        user,
        req,
      }) as any
      amount = price
      resultVehicleId = Number(created.id)
      Object.assign(detail, {
        vehicleId: resultVehicleId,
        vehicleName,
        saleModelId: model.id,
        saleModelName: model.nom,
        balanceBefore: currentBalance,
        balanceAfter: nextBalance,
      })
    } else {
      const vehicle = await payload.findByID({ collection: 'vehicles', id: raw.vehicleId!, depth: 2, overrideAccess: true, req }) as any
      if (numericId(vehicle.proprietaire) !== Number(currentCharacter.id)) fail('Seul le propriétaire peut vendre ce véhicule.')
      const modelId = numericId(vehicle.modele)
      if (!modelId) fail('Le modèle de vente de ce véhicule est introuvable.')
      const model = vehicle.modele && typeof vehicle.modele === 'object'
        ? vehicle.modele
        : await payload.findByID({ collection: 'vehicle-sale-models', id: modelId, depth: 0, overrideAccess: true, req })
      const total = vehicleSalePrice(model?.prix)
      if (total === null) fail('Le modèle de vente de ce véhicule n’a pas de prix valide.')

      const weaponId = numericId(vehicle.armeTourelle)
      const magazineId = numericId(vehicle.chargeurRelie)
      const ammunition = Number(vehicle.munitionsActuelles ?? 0)
      if (!Number.isSafeInteger(ammunition) || ammunition < 0) fail('Le nombre de munitions du véhicule est incohérent.')
      if (magazineId && !weaponId) fail('Le chargeur du véhicule ne peut pas être transféré sans son arme.')
      if (ammunition > 0 && (!weaponId || !magazineId)) fail('Les munitions restantes ne sont pas associées à une arme et un chargeur valides.')

      let ledgerShipId: number | null = null
      if (weaponId) {
        const activeShipId = numericId(currentCharacter.vaisseau)
        if (!activeShipId) fail('Équipez un vaisseau actif modifiable pour vendre un véhicule armé.')
        await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ships WHERE id = ${activeShipId} FOR UPDATE` })
        const activeShip = await payload.findByID({ collection: 'ships', id: activeShipId, depth: 1, overrideAccess: true, req }).catch(() => null) as any
        if (!activeShip || !computeShipAccess({ ship: activeShip, character: currentCharacter, isAdmin: user.role === 'admin' }).canEdit) {
          fail('Votre vaisseau actif ne peut pas recevoir l’arme de tourelle et ses munitions.')
        }
        activeShip.inventaireArmes = mergeShipInventory(activeShip.inventaireArmes ?? [], 'arme', weaponId, 1)
        if (magazineId && ammunition > 0) {
          activeShip.inventaireConsommables = mergeShipInventory(activeShip.inventaireConsommables ?? [], 'consommable', magazineId, ammunition)
        }
        await payload.update({
          collection: 'ships',
          id: activeShip.id,
          data: {
            inventaireArmes: activeShip.inventaireArmes,
            inventaireConsommables: activeShip.inventaireConsommables ?? [],
          },
          overrideAccess: true,
          user,
          req,
        })
        ledgerShipId = Number(activeShip.id)
      }

      const currentBalance = Number(currentCharacter.konis ?? 0)
      if (!Number.isFinite(currentBalance) || currentBalance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = exactAdd(currentBalance, total)
      await payload.delete({ collection: 'vehicles', id: vehicle.id, overrideAccess: true, user, req })
      await payload.update({ collection: 'characters', id: character.id, data: { konis: nextBalance }, overrideAccess: true, user, req })
      amount = total
      Object.assign(detail, {
        vehicleId: Number(vehicle.id),
        vehicleName: vehicle.nom,
        saleModelId: model.id,
        saleModelName: model.nom,
        resaleAmount: total,
        transferredWeaponId: weaponId,
        transferredMagazineId: magazineId,
        transferredAmmunition: ammunition,
        activeShipId: ledgerShipId,
        balanceBefore: currentBalance,
        balanceAfter: nextBalance,
      })
    }

    const ledgerAmount = raw.action === 'buy' ? -amount : amount
    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, ${`vehicle-${raw.action}`}, ${user.id}, ${character.id}, ${raw.action === 'sell' ? (detail.activeShipId as number | null) ?? null : null}, ${ledgerAmount}, ${JSON.stringify(detail)}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof VehicleGarageError) throw error
    const existing = await payload.db.execute({
      drizzle: (payload.db as any).drizzle,
      sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1`,
    }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) return transactionResponse(record, true)
    throw new Error(error instanceof Error ? error.message : 'La transaction du Garage a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/garage')
  revalidatePath('/ships')
  revalidatePath('/ship')
  if (resultVehicleId) revalidatePath('/vehicles')
  return { success: true, alreadyApplied: false, amount: raw.action === 'buy' ? -amount : amount, vehicleId: resultVehicleId }
}
