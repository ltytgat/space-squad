'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { computeShipAccess } from '@/lib/shipAccess'
import { exactAdd, exactSubtract, readShopPrice, relationId, resalePrice } from '@/lib/shop'
import { detachShipTransferItem, listInstalledShipComponents, listShipTransferItems, mergeShipInventory, shipPurchasePrice, shipSalePrice, shipyardFingerprint, type ShipTransferKind } from '@/lib/shipyard'

type ShipyardInput = {
  transactionId: string
  action: 'buy' | 'sell' | 'transfer'
  saleModelId?: number
  chassisOnly?: boolean
  shipName?: string
  shipId?: number
  destinationShipId?: number
  componentKeys?: string[]
  sourceKey?: string
  quantity?: number
}

class ShipyardError extends Error {}
function fail(message: string): never {
  throw new ShipyardError(message)
}
function withoutTransientWeaponHeat(value: any): any {
  if (Array.isArray(value)) return value.map(withoutTransientWeaponHeat)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'chauffeActuelle')
    .map(([key, child]) => [key, withoutTransientWeaponHeat(child)]))
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
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 0, limit: 1, overrideAccess: true })
  const character = docs[0] as any
  if (!character) fail('Aucun personnage associé à ce compte.')
  return { payload, user, character }
}

function inventoryField(kind: ShipTransferKind) {
  return kind === 'module' ? ['inventaireModules', 'module'] as const
    : kind === 'weapon' ? ['inventaireArmes', 'arme'] as const
      : ['inventaireConsommables', 'consommable'] as const
}

async function lockShips(payload: any, transactionDb: any, ids: number[]) {
  for (const id of [...new Set(ids)].sort((a, b) => a - b)) {
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ships WHERE id = ${id} FOR UPDATE` })
  }
}

async function fetchShip(payload: any, id: number, req: any) {
  const ship = await payload.findByID({ collection: 'ships', id, depth: 4, overrideAccess: true, req }).catch(() => null) as any
  if (!ship) fail('Vaisseau introuvable.')
  return ship
}

function assertCanEditShip(ship: any, character: any, user: any) {
  if (!computeShipAccess({ ship, character, isAdmin: user.role === 'admin' }).canEdit) {
    fail('Vous devez avoir les droits d’écriture sur ce vaisseau.')
  }
}

function componentTransfer(destination: any, component: { kind: ShipTransferKind; itemId: number; quantity: number }) {
  const [field, relationField] = inventoryField(component.kind)
  destination[field] = mergeShipInventory(destination[field] ?? [], relationField, component.itemId, component.quantity)
}

function mergeCargo(destination: any, source: any) {
  const groups = [
    ['inventaireModules', 'module'],
    ['inventaireArmes', 'arme'],
    ['inventaireConsommables', 'consommable'],
  ] as const
  for (const [field, relationField] of groups) {
    for (const row of source[field] ?? []) {
      const itemId = numericId(row[relationField])
      const quantity = Number(row.quantite)
      if (!itemId || !Number.isSafeInteger(quantity) || quantity < 1) fail('La soute du vaisseau contient une quantité incohérente.')
      destination[field] = mergeShipInventory(destination[field] ?? [], relationField, itemId, quantity)
    }
  }
}

function loadedWeaponAmmo(ship: any) {
  const equipped = [
    ...(ship.armesPilote ?? []),
    ...(ship.armesTourelles ?? []).flatMap((turret: any) => turret.armes ?? []),
  ]
  return equipped.flatMap((weapon: any) => {
    const itemId = numericId(weapon.chargeurRelie)
    const quantity = Number(weapon.munitionsActuelles) || 0
    return itemId && Number.isSafeInteger(quantity) && quantity > 0
      ? [{ kind: 'consumable' as const, itemId, quantity }]
      : []
  })
}

function mergeInstalledRemainder(destination: any, source: any, soldKeys: Set<string>) {
  for (const item of listInstalledShipComponents(source)) {
    if (soldKeys.has(item.key)) continue
    componentTransfer(destination, { kind: item.kind, itemId: item.itemId, quantity: 1 })
  }
  for (const row of source.consommablesVaisseau ?? []) {
    const itemId = numericId(row.consommable)
    const quantity = Number(row.quantite)
    if (!itemId || !Number.isSafeInteger(quantity) || quantity < 0) fail('Un consommable embarqué est incohérent.')
    if (quantity > 0) componentTransfer(destination, { kind: 'consumable', itemId, quantity })
  }
  for (const ammo of loadedWeaponAmmo(source)) componentTransfer(destination, ammo)
}

function transactionResponse(record: any, alreadyApplied: boolean) {
  const details = record.details && typeof record.details === 'object' ? record.details : {}
  return { success: true, alreadyApplied, amount: Math.abs(Number(record.amount) || 0), shipId: details.shipId ?? null }
}

export async function executeShipyardTransaction(raw: ShipyardInput) {
  const { payload, user, character } = await getContext()
  if (!raw || !uuid.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!['buy', 'sell', 'transfer'].includes(raw.action)) fail('Opération inconnue.')
  if (raw.saleModelId !== undefined && !validId(raw.saleModelId)) fail('Modèle de vente invalide.')
  if (raw.shipId !== undefined && !validId(raw.shipId)) fail('Vaisseau invalide.')
  if (raw.destinationShipId !== undefined && !validId(raw.destinationShipId)) fail('Vaisseau de destination invalide.')
  if (raw.quantity !== undefined && (!Number.isSafeInteger(raw.quantity) || raw.quantity < 1)) fail('La quantité doit être un entier positif.')
  if (raw.componentKeys !== undefined && (!Array.isArray(raw.componentKeys) || raw.componentKeys.some((key) => typeof key !== 'string') || new Set(raw.componentKeys).size !== raw.componentKeys.length)) fail('Sélection de composants invalide.')
  if (raw.action === 'buy' && (!raw.saleModelId || raw.shipId || raw.destinationShipId || raw.componentKeys || raw.sourceKey)) fail('Données d’achat invalides.')
  if (raw.action === 'sell' && (!raw.shipId || !raw.destinationShipId || raw.saleModelId || raw.sourceKey || raw.quantity !== undefined)) fail('Données de vente invalides.')
  if (raw.action === 'transfer' && (!raw.shipId || !raw.destinationShipId || !raw.sourceKey || raw.saleModelId || raw.componentKeys)) fail('Données de transfert invalides.')
  if (raw.action === 'transfer' && raw.shipId === raw.destinationShipId) fail('Choisissez deux vaisseaux différents.')

  const fingerprint = shipyardFingerprint({
    action: raw.action,
    saleModelId: raw.saleModelId,
    chassisOnly: raw.chassisOnly,
    shipId: raw.shipId,
    destinationShipId: raw.destinationShipId,
    shipName: raw.shipName,
    componentKeys: raw.componentKeys,
    sourceKey: raw.sourceKey,
    quantity: raw.quantity,
  })
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let amount = 0
  let resultShipId: number | null = null

  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    const currentCharacter = await payload.findByID({ collection: 'characters', id: character.id, depth: 1, overrideAccess: true, req }) as any
    if (numericId(currentCharacter.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')

    await lockShips(payload, transactionDb, [raw.shipId, raw.destinationShipId].filter(validId))
    const previous = await payload.db.execute({ db: transactionDb, sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      await payload.db.rollbackTransaction?.(transactionID)
      return transactionResponse(record, true)
    }

    const detail: Record<string, unknown> = { action: raw.action }
    let ledgerShipId: number | null = null
    if (raw.action === 'buy') {
      const modelLock = await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ship_sale_models WHERE id = ${raw.saleModelId} FOR SHARE` })
      if (!modelLock.rows[0]) fail('Modèle de vente introuvable.')
      const model = await payload.findByID({ collection: 'ship-sale-models', id: raw.saleModelId!, depth: 2, overrideAccess: true, req }) as any
      const price = shipPurchasePrice(model.prix, raw.chassisOnly === true)
      if (price === null) fail('Ce modèle n’a pas de prix commercialisable.')
      const currentBalance = Number(currentCharacter.konis ?? 0)
      if (!Number.isFinite(currentBalance) || currentBalance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = exactSubtract(currentBalance, price)
      if (nextBalance < 0) fail('Vous ne possédez pas assez de Konis.')
      const shipName = String(raw.shipName ?? '').trim() || String(model.nom ?? '').trim()
      if (!shipName || shipName.length > 100) fail('Le nom du vaisseau doit contenir entre 1 et 100 caractères.')

      await payload.update({ collection: 'characters', id: character.id, data: { konis: nextBalance }, overrideAccess: true, user, req })
      const created = await payload.create({
        collection: 'ships',
        data: { nom: shipName, modele: model.id, proprietaire: character.id },
        overrideAccess: true,
        user,
        req,
        context: { shipyardChassisOnly: raw.chassisOnly === true },
      }) as any
      amount = price
      resultShipId = Number(created.id)
      ledgerShipId = resultShipId
      Object.assign(detail, { shipId: resultShipId, shipName, saleModelId: model.id, saleModelName: model.nom, chassisOnly: raw.chassisOnly === true, balanceBefore: currentBalance, balanceAfter: nextBalance })
    } else if (raw.action === 'sell') {
      const source = await fetchShip(payload, raw.shipId!, req)
      const destination = await fetchShip(payload, raw.destinationShipId!, req)
      if (numericId(source.proprietaire) !== Number(currentCharacter.id)) fail('Seul le propriétaire peut vendre ce vaisseau.')
      if (Number(relationId(currentCharacter.vaisseau)) !== Number(destination.id)) fail('La soute doit être transférée vers votre vaisseau actif.')
      if (Number(source.id) === Number(destination.id)) fail('La destination doit être un autre vaisseau.')
      assertCanEditShip(destination, currentCharacter, user)

      const model = source.modele
      const modelPrice = readShopPrice(model?.prix)
      if (modelPrice === null) fail('Le modèle de vente de ce vaisseau n’a pas de prix valide.')
      const components = listInstalledShipComponents(source)
      const selectedKeys = raw.componentKeys ?? []
      const installedByKey = new Map(components.map((component) => [component.key, component]))
      const selected = selectedKeys.map((key) => {
        const component = installedByKey.get(key)
        if (!component) fail('Un composant sélectionné n’est plus installé sur le vaisseau.')
        const price = readShopPrice(component.prix)
        if (price === null) fail(`${component.nom} n’a pas de prix et ne peut pas être vendu.`)
        return { component, price }
      })
      const total = shipSalePrice(model.prix, selected.map(({ price }) => price))
      if (total === null) fail('Le montant de revente ne peut pas être calculé.')

      mergeCargo(destination, source)
      mergeInstalledRemainder(destination, source, new Set(selectedKeys))
      const update: Record<string, any> = {}
      for (const field of ['inventaireModules', 'inventaireArmes', 'inventaireConsommables'] as const) update[field] = destination[field]
      await payload.update({ collection: 'ships', id: destination.id, data: update, overrideAccess: true, user, req })

      const { docs: crew } = await payload.find({ collection: 'characters', where: { vaisseau: { equals: source.id } }, depth: 0, pagination: false, overrideAccess: true, req })
      for (const member of crew as any[]) {
        await payload.update({ collection: 'characters', id: member.id, data: { vaisseau: null, roleVaisseau: null }, overrideAccess: true, user, req })
      }
      await payload.delete({ collection: 'ships', id: source.id, overrideAccess: true, user, req })

      const currentBalance = Number(currentCharacter.konis ?? 0)
      if (!Number.isFinite(currentBalance) || currentBalance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = exactAdd(currentBalance, total)
      await payload.update({ collection: 'characters', id: character.id, data: { konis: nextBalance }, overrideAccess: true, user, req })
      amount = total
      ledgerShipId = Number(destination.id)
      Object.assign(detail, { soldShipId: Number(source.id), shipName: source.nom, destinationShipId: Number(destination.id), chassisAmount: resalePrice(modelPrice) / 2, soldComponentKeys: selectedKeys, balanceBefore: currentBalance, balanceAfter: nextBalance })
    } else {
      const source = await fetchShip(payload, raw.shipId!, req)
      const destination = await fetchShip(payload, raw.destinationShipId!, req)
      assertCanEditShip(source, currentCharacter, user)
      assertCanEditShip(destination, currentCharacter, user)
      const item = listShipTransferItems(source).find((entry) => entry.key === raw.sourceKey)
      if (!item) fail('Cet élément n’est plus disponible sur le vaisseau source.')
      const quantity = raw.quantity ?? item.quantity
      const detached = detachShipTransferItem(source, item, quantity)
      await payload.update({ collection: 'ships', id: source.id, data: withoutTransientWeaponHeat(detached.update), overrideAccess: true, user, req })
      const destinationUpdate: Record<string, any> = {}
      for (const moved of detached.moved) {
        const [field, relationField] = inventoryField(moved.kind)
        destinationUpdate[field] = mergeShipInventory(destinationUpdate[field] ?? destination[field] ?? [], relationField, moved.itemId, moved.quantity)
      }
      await payload.update({ collection: 'ships', id: destination.id, data: destinationUpdate, overrideAccess: true, user, req })
      ledgerShipId = Number(source.id)
      Object.assign(detail, { sourceShipId: Number(source.id), destinationShipId: Number(destination.id), sourceKey: item.key, itemId: item.itemId, itemName: item.nom, quantity, ammoReturned: item.ammoQuantity ?? 0 })
    }

    await payload.db.execute({
      db: transactionDb,
      sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${raw.transactionId}, ${fingerprint}, ${`ship-${raw.action}`}, ${user.id}, ${character.id}, ${ledgerShipId}, ${raw.action === 'buy' ? -amount : amount}, ${JSON.stringify(detail)}::jsonb)`,
    })
    await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof ShipyardError) throw error
    const existing = await payload.db.execute({ drizzle: (payload.db as any).drizzle, sql: sql`SELECT fingerprint, actor_id, amount, details FROM shop_transactions WHERE transaction_id = ${raw.transactionId} LIMIT 1` }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) return transactionResponse(record, true)
    throw new Error(error instanceof Error ? error.message : 'La transaction du chantier naval a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath('/shop/chantier-naval')
  revalidatePath('/ships')
  revalidatePath('/ship')
  if (raw.shipId) revalidatePath(`/ships/${raw.shipId}`)
  if (raw.destinationShipId) revalidatePath(`/ships/${raw.destinationShipId}`)
  if (resultShipId) revalidatePath(`/ships/${resultShipId}`)
  return { success: true, alreadyApplied: false, amount: raw.action === 'buy' ? -amount : amount, shipId: resultShipId }
}
