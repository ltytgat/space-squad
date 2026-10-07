'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { computeShipAccess } from '@/lib/shipAccess'
import { factionCanBuyExWeapon, isExWeaponName, isFactionDiscountCouponApplicable, type DiscountTarget, type OwnedFactionReward } from '@/lib/factionRewards'
import { exactAdd, exactMultiply, exactSubtract, isWeaponModCompatible, readShopPrice, relationId, resalePrice, shopRequestFingerprint, weaponModPrice } from '@/lib/shop'

type ItemKind = 'weapon' | 'armor' | 'consumable' | 'ship-weapon' | 'ship-module' | 'ship-consumable' | 'weapon-mod' | 'armor-mod'
type ShopInput = {
  transactionId: string
  action: 'buy' | 'sell' | 'apply-weapon-mod'
  kind: ItemKind
  itemId: number
  quantity?: number
  shipId?: number
  ownedIndex?: number
  discountRewardId?: string
  weaponTarget?: { location: 'inventory' | 'equipped'; index?: number; slot?: 'armePrincipale' | 'armeSecondaire' | 'armeLourde' | 'armeDeMelee' }
}

const catalogs: Record<ItemKind, string> = {
  weapon: 'weapons', armor: 'armors', consumable: 'consumables',
  'ship-weapon': 'ship-weapons', 'ship-module': 'ship-modules', 'ship-consumable': 'ship-consumables',
  'weapon-mod': 'mods', 'armor-mod': 'mods',
}

class ShopError extends Error {}
function fail(message: string): never { throw new ShopError(message) }
const numericId = (value: unknown) => {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}
const isIndex = (value: unknown, length: number): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) < length
const quantityOf = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fail('La quantité doit être un entier positif.')

function assertKind(input: ShopInput) {
  const shipKind = input.kind.startsWith('ship-')
  if (shipKind !== (input.shipId !== undefined)) fail('La destination de cette transaction est invalide.')
  if (input.action === 'apply-weapon-mod' && input.kind !== 'weapon-mod') fail('Type de Mod invalide.')
  if (input.kind === 'weapon-mod' && input.action === 'buy') fail('Un Mod d’arme doit être acheté et appliqué à une arme dans la même opération.')
  if (input.kind === 'armor-mod' && input.action === 'apply-weapon-mod') fail('Type de Mod invalide.')
  if (input.kind === 'weapon-mod' && input.action === 'sell') fail('Un Mod d’arme appliqué est vendu avec son arme.')
}

function getInventoryIds(entries: unknown): string[] {
  return Array.isArray(entries) ? entries.map(relationId).filter((id): id is string => id !== null) : []
}

function addQuantity(rows: any[], key: string, id: number, quantity: number) {
  const next: any[] = []
  let total = quantity
  let inserted = false
  for (const row of rows) {
    const rowId = numericId(row?.[key])
    if (rowId === id) {
      total += Number(row?.quantite) || 0
      if (!inserted) { next.push({ [key]: id, quantite: total }); inserted = true }
    } else next.push({ [key]: rowId, quantite: Number(row?.quantite) || 0 })
  }
  if (inserted) next[next.findIndex((row) => row[key] === id)].quantite = total
  else next.push({ [key]: id, quantite: total })
  return next
}

function removeQuantity(rows: any[], key: string, id: number, quantity: number) {
  const total = rows.filter((row) => numericId(row?.[key]) === id).reduce((sum, row) => sum + (Number(row?.quantite) || 0), 0)
  if (total < quantity) fail('La quantité possédée est insuffisante.')
  const next: any[] = []
  let inserted = false
  for (const row of rows) {
    const rowId = numericId(row?.[key])
    const rowQuantity = Number(row?.quantite) || 0
    if (rowId !== id) { next.push({ [key]: rowId, quantite: rowQuantity }); continue }
    if (inserted) continue
    const after = total - quantity
    if (after > 0) next.push({ [key]: id, quantite: after })
    inserted = true
  }
  return next
}

function normalizePersonalWeapons(entries: any[]) {
  return entries.map((entry) => ({
    item: numericId(entry.item), mods: getInventoryIds(entry.mods).map(Number),
    munitionsActuelles: entry.munitionsActuelles ?? 0,
    chargeurRelie: numericId(entry.chargeurRelie), chauffeActuelle: entry.chauffeActuelle ?? 0,
  }))
}
function normalizePersonalArmors(entries: any[]) {
  return entries.map((entry) => ({ item: numericId(entry.item), mods: getInventoryIds(entry.mods).map(Number) }))
}

function weaponTargetRecord(character: any, target: ShopInput['weaponTarget']) {
  if (!target) return fail('Sélectionnez une arme compatible.')
  if (target.location === 'inventory') {
    const entries = Array.isArray(character.inventaireArmes) ? character.inventaireArmes : []
    if (!isIndex(target.index, entries.length)) return fail('Cette arme n’est plus dans la réserve.')
    return { location: 'inventory' as const, index: target.index!, weaponId: numericId(entries[target.index!].item), entry: entries[target.index!] }
  }
  const slot = target.slot
  if (!slot || !['armePrincipale', 'armeSecondaire', 'armeLourde', 'armeDeMelee'].includes(slot)) fail('Emplacement d’arme invalide.')
  const entry = character[slot]
  return { location: 'equipped' as const, slot, weaponId: numericId(entry?.item), entry }
}

async function getContext() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  const { docs } = await payload.find({ collection: 'characters', where: { user: { equals: user.id } }, depth: 0, limit: 1, overrideAccess: true })
  const character = docs[0]
  if (!character) fail('Aucun personnage associé à ce compte.')
  return { payload, user, characterId: character.id }
}

export async function executeShopTransaction(raw: ShopInput) {
  const { payload, user, characterId } = await getContext()
  if (!raw || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.transactionId ?? '')) fail('Identifiant de transaction invalide.')
  if (!['buy', 'sell', 'apply-weapon-mod'].includes(raw.action)) fail('Opération inconnue.')
  if (!Object.keys(catalogs).includes(raw.kind)) fail('Type d’objet inconnu.')
  if (!Number.isSafeInteger(raw.itemId) || raw.itemId <= 0) fail('Objet invalide.')
  if (raw.shipId !== undefined && (!Number.isSafeInteger(raw.shipId) || raw.shipId <= 0)) fail('Vaisseau invalide.')
  if (raw.ownedIndex !== undefined && (!Number.isSafeInteger(raw.ownedIndex) || raw.ownedIndex < 0)) fail('Position d’inventaire invalide.')
  if (raw.discountRewardId !== undefined && (typeof raw.discountRewardId !== 'string' || raw.discountRewardId.length === 0 || raw.discountRewardId.length > 100 || raw.action !== 'buy')) fail('Bon de réduction invalide.')
  assertKind(raw)
  const input: ShopInput = { ...raw, quantity: raw.action === 'apply-weapon-mod' ? 1 : quantityOf(raw.quantity ?? 1) }
  if (['weapon', 'armor', 'weapon-mod', 'armor-mod'].includes(input.kind) && input.quantity !== 1) fail('Cet objet ne se traite pas en quantité multiple.')
  const fingerprint = shopRequestFingerprint({ ...input, quantity: input.quantity! })

  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const req = { transactionID } as any
  let alreadyApplied = false
  let amount = 0
  try {
    const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
    if (!transactionDb) fail('Impossible d’ouvrir la transaction.')
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${characterId} FOR UPDATE` })
    let character = await payload.findByID({ collection: 'characters', id: characterId, depth: 2, overrideAccess: true, req }) as any
    if (numericId(character.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')

    let ship: any = null
    if (input.shipId !== undefined) {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ships WHERE id = ${input.shipId} FOR UPDATE` })
      ship = await payload.findByID({ collection: 'ships', id: input.shipId, depth: 1, overrideAccess: true, req }).catch(() => null) as any
      if (!ship) fail('Vaisseau introuvable.')
      const rights = computeShipAccess({ ship, character, isAdmin: user.role === 'admin' })
      if (!rights.canEdit) fail('Vous devez occuper un poste autorisé sur ce vaisseau pour effectuer cette transaction.')
    }

    const previous = await payload.db.execute({ db: transactionDb, sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${input.transactionId} LIMIT 1` })
    if (previous.rows[0]) {
      const record: any = previous.rows[0]
      if (record.fingerprint !== fingerprint || Number(record.actor_id) !== Number(user.id)) fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
      alreadyApplied = true
      amount = Math.abs(Number(record.amount) || 0)
    } else {
      const item = await payload.findByID({ collection: catalogs[input.kind] as any, id: input.itemId, depth: 1, overrideAccess: true, req }).catch(() => null) as any
      if (!item) fail('Objet introuvable dans le catalogue.')
      const faction = character.affiliation && typeof character.affiliation === 'object'
        ? character.affiliation
        : numericId(character.affiliation) ? await payload.findByID({ collection: 'factions', id: numericId(character.affiliation)!, depth: 0, overrideAccess: true, req }).catch(() => null) : null
      const factionName = String(faction?.nom ?? '')
      const rewards: OwnedFactionReward[] = Array.isArray(character.inventaireRecompensesFaction) ? character.inventaireRecompensesFaction : []
      const catalogPrice = readShopPrice(item.prix)
      const characterUpdate: Record<string, any> = {}
      const shipUpdate: Record<string, any> = {}
      let detail: Record<string, unknown> = { action: input.action, kind: input.kind, itemId: item.id, itemName: item.nom, quantity: input.quantity }
      const debit = () => {
        if (catalogPrice === null) fail('Cet objet n’a pas de prix et n’est pas commercialisable.')
        amount = exactMultiply(catalogPrice, input.quantity!)
      }
      const credit = (base: number) => { amount = exactMultiply(resalePrice(base), input.quantity!) }
      let discountUsed = false
      const applyDiscount = (target: DiscountTarget) => {
        if (input.discountRewardId === undefined) return
        const couponIndex = rewards.findIndex((reward) => reward.id === input.discountRewardId)
        const coupon = rewards[couponIndex]
        if (couponIndex < 0 || !coupon || !isFactionDiscountCouponApplicable(coupon, factionName, target)) fail('Ce bon de réduction ne peut pas être utilisé pour cet achat.')
        const percentage = Number(coupon.pourcentageReduction)
        const discount = exactMultiply(amount, percentage / 100)
        amount = exactSubtract(amount, discount)
        characterUpdate.inventaireRecompensesFaction = rewards.filter((_, index) => index !== couponIndex)
        detail = { ...detail, reduction: { nom: coupon.nom, pourcentage: percentage, montant: discount } }
        discountUsed = true
      }

      if (input.action === 'buy' && input.kind === 'weapon') {
        if (isExWeaponName(item.nom) && !factionCanBuyExWeapon(item.nom, item.categorie, item.type, rewards, factionName)) fail('Cette arme eX nécessite le droit d’accès de votre faction.')
        debit()
        applyDiscount({ kind: 'weapon', categorie: item.categorie })
        characterUpdate.inventaireArmes = normalizePersonalWeapons(character.inventaireArmes ?? []).concat([{ item: item.id, mods: [], munitionsActuelles: 0, chargeurRelie: null, chauffeActuelle: 0 }])
      } else if (input.action === 'buy' && input.kind === 'armor') {
        debit()
        characterUpdate.inventaireArmures = normalizePersonalArmors(character.inventaireArmures ?? []).concat([{ item: item.id, mods: [] }])
      } else if (input.action === 'buy' && input.kind === 'consumable') {
        debit()
        const rows = Array.isArray(character.inventaire) ? character.inventaire.map((row: any) => ({ consommable: numericId(row.consommable), quantite: Number(row.quantite) || 0 })) : []
        characterUpdate.inventaire = addQuantity(rows, 'consommable', item.id, input.quantity!)
      } else if (input.action === 'buy' && input.kind === 'armor-mod') {
        if (item.categoriePrincipale !== 'armures') fail('Ce Mod n’est pas un Mod d’armure.')
        debit()
        characterUpdate.inventaireMods = getInventoryIds(character.inventaireMods).map(Number).concat([item.id])
      } else if (input.action === 'buy' && input.kind.startsWith('ship-')) {
        debit()
        if (input.kind === 'ship-weapon' || input.kind === 'ship-module') {
          applyDiscount({ kind: input.kind, categorie: item.categorie, taille: item.taille })
        }
        const key = input.kind === 'ship-weapon' ? 'inventaireArmes' : input.kind === 'ship-module' ? 'inventaireModules' : 'inventaireConsommables'
        const itemKey = input.kind === 'ship-weapon' ? 'arme' : input.kind === 'ship-module' ? 'module' : 'consommable'
        shipUpdate[key] = addQuantity(ship[key] ?? [], itemKey, item.id, input.quantity!)
      } else if (input.action === 'apply-weapon-mod') {
        if (item.categoriePrincipale !== 'armes') fail('Ce Mod ne concerne pas une arme.')
        if (catalogPrice === null) fail('Ce Mod n’a pas de prix et ne peut pas être appliqué depuis la boutique.')
        const target = weaponTargetRecord(character, input.weaponTarget)
        if (!target.weaponId) fail('L’arme sélectionnée est introuvable.')
        const weapon = await payload.findByID({ collection: 'weapons', id: target.weaponId, depth: 0, overrideAccess: true, req }) as any
        const basePrice = readShopPrice(weapon.prix)
        if (basePrice === null) fail('Une arme sans prix ne peut pas recevoir un Mod depuis la boutique.')
        if (!isWeaponModCompatible(weapon, item)) fail('Ce Mod n’est pas compatible avec l’arme sélectionnée.')
        const attached = getInventoryIds(target.entry?.mods)
        if (attached.length > 0) fail('Cette arme possède déjà un Mod. Un seul Mod d’arme est autorisé et il ne peut pas être remplacé.')
        const ownedMods = getInventoryIds(character.inventaireMods)
        const ownedIndex = ownedMods.indexOf(String(item.id))
        if (ownedIndex >= 0) {
          ownedMods.splice(ownedIndex, 1)
          characterUpdate.inventaireMods = ownedMods.map(Number)
          amount = 0
        } else {
          amount = weaponModPrice(basePrice, catalogPrice)
        }
        if (target.location === 'inventory') {
          const weapons = normalizePersonalWeapons(character.inventaireArmes ?? [])
          weapons[target.index] = { ...weapons[target.index], mods: [item.id] }
          characterUpdate.inventaireArmes = weapons
        } else {
          characterUpdate[target.slot!] = { ...target.entry, item: target.weaponId, mods: [item.id] }
        }
        detail = { ...detail, weaponId: weapon.id, weaponName: weapon.nom, purchased: ownedIndex < 0 }
      } else if (input.action === 'sell' && input.kind === 'weapon') {
        const rows = Array.isArray(character.inventaireArmes) ? character.inventaireArmes : []
        if (!isIndex(input.ownedIndex, rows.length) || numericId(rows[input.ownedIndex!].item) !== item.id) fail('Cette arme n’est plus dans la réserve.')
        const basePrice = readShopPrice(item.prix)
        if (basePrice === null) fail('Cet objet n’a pas de prix et ne peut pas être vendu.')
        const mods = getInventoryIds(rows[input.ownedIndex!].mods)
        let total = basePrice
        if (mods.length > 1) fail('Les données de cette arme dépassent la limite d’un Mod et nécessitent une correction administrative.')
        if (mods.length === 1) {
          const mod = await payload.findByID({ collection: 'mods', id: Number(mods[0]), depth: 0, overrideAccess: true, req }) as any
          const factor = readShopPrice(mod.prix)
          if (factor === null) fail('Cette arme porte un Mod sans prix ; sa valeur de revente ne peut pas être calculée.')
          if (mod.categoriePrincipale !== 'armes') fail('Le Mod associé à cette arme est incohérent.')
          total = exactAdd(total, weaponModPrice(basePrice, factor))
          detail = { ...detail, modId: mod.id, modName: mod.nom }
        }
        amount = resalePrice(total)
        characterUpdate.inventaireArmes = normalizePersonalWeapons(rows.filter((_: any, index: number) => index !== input.ownedIndex))
      } else if (input.action === 'sell' && input.kind === 'armor') {
        const rows = Array.isArray(character.inventaireArmures) ? character.inventaireArmures : []
        if (!isIndex(input.ownedIndex, rows.length) || numericId(rows[input.ownedIndex!].item) !== item.id) fail('Cette armure n’est plus dans la réserve.')
        const basePrice = readShopPrice(item.prix)
        if (basePrice === null) fail('Cet objet n’a pas de prix et ne peut pas être vendu.')
        const returnedMods = getInventoryIds(rows[input.ownedIndex!].mods)
        amount = resalePrice(basePrice)
        characterUpdate.inventaireArmures = normalizePersonalArmors(rows.filter((_: any, index: number) => index !== input.ownedIndex))
        if (returnedMods.length) characterUpdate.inventaireMods = getInventoryIds(character.inventaireMods).concat(returnedMods).map(Number)
        detail = { ...detail, returnedMods }
      } else if (input.action === 'sell' && input.kind === 'consumable') {
        const rows = Array.isArray(character.inventaire) ? character.inventaire : []
        const owned = rows.filter((row: any) => numericId(row.consommable) === item.id).reduce((sum: number, row: any) => sum + (Number(row.quantite) || 0), 0)
        if (owned < input.quantity!) fail('La quantité possédée est insuffisante.')
        const basePrice = readShopPrice(item.prix)
        if (basePrice === null) fail('Cet objet n’a pas de prix et ne peut pas être vendu.')
        credit(basePrice)
        characterUpdate.inventaire = removeQuantity(rows, 'consommable', item.id, input.quantity!)
      } else if (input.action === 'sell' && input.kind === 'armor-mod') {
        if (item.categoriePrincipale !== 'armures') fail('Seuls les Mods d’armure peuvent être vendus séparément.')
        const owned = getInventoryIds(character.inventaireMods)
        const index = owned.indexOf(String(item.id))
        if (index < 0) fail('Ce Mod n’est pas dans votre réserve.')
        if (catalogPrice === null) fail('Cet objet n’a pas de prix et ne peut pas être vendu.')
        owned.splice(index, 1)
        characterUpdate.inventaireMods = owned.map(Number)
        amount = resalePrice(catalogPrice)
      } else if (input.action === 'sell' && input.kind.startsWith('ship-')) {
        const basePrice = readShopPrice(item.prix)
        if (basePrice === null) fail('Cet objet n’a pas de prix et ne peut pas être vendu.')
        const key = input.kind === 'ship-weapon' ? 'inventaireArmes' : input.kind === 'ship-module' ? 'inventaireModules' : 'inventaireConsommables'
        const itemKey = input.kind === 'ship-weapon' ? 'arme' : input.kind === 'ship-module' ? 'module' : 'consommable'
        const quantity = input.kind === 'ship-weapon' || input.kind === 'ship-module' ? 1 : input.quantity!
        shipUpdate[key] = removeQuantity(ship[key] ?? [], itemKey, item.id, quantity)
        amount = exactMultiply(resalePrice(basePrice), quantity)
      } else {
        fail('Cette combinaison d’opération et d’objet n’est pas autorisée.')
      }
      if (input.discountRewardId !== undefined && !discountUsed) fail('Ce bon de réduction ne peut pas être utilisé pour cet achat.')

      const balance = Number(character.konis ?? 0)
      if (!Number.isFinite(balance) || balance < 0) fail('Le solde du personnage est incohérent.')
      const nextBalance = input.action === 'sell' ? exactAdd(balance, amount) : exactSubtract(balance, amount)
      if (input.action !== 'sell' && nextBalance < 0) fail('Vous ne possédez pas assez de Konis.')
      if (!Number.isFinite(nextBalance)) fail('Le montant calculé est invalide.')
      if (Object.keys(characterUpdate).length) character = await payload.update({ collection: 'characters', id: characterId, data: { ...characterUpdate, konis: nextBalance }, overrideAccess: true, user, req }) as any
      else await payload.update({ collection: 'characters', id: characterId, data: { konis: nextBalance }, overrideAccess: true, user, req })
      if (Object.keys(shipUpdate).length) await payload.update({ collection: 'ships', id: input.shipId!, data: shipUpdate, overrideAccess: true, user, req })

      const ledgerDetails = JSON.stringify({ ...detail, balanceBefore: balance, balanceAfter: nextBalance })
      await payload.db.execute({ db: transactionDb, sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${input.transactionId}, ${fingerprint}, ${input.action}, ${user.id}, ${characterId}, ${input.shipId ?? null}, ${input.action === 'sell' ? amount : -amount}, ${ledgerDetails}::jsonb)` })
    }

    if (alreadyApplied) await payload.db.rollbackTransaction?.(transactionID)
    else await payload.db.commitTransaction?.(transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    if (error instanceof ShopError) throw error
    // A unique index is the final arbiter for requests racing with the same idempotency key.
    const existing = await payload.db.execute({ drizzle: (payload.db as any).drizzle, sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${input.transactionId} LIMIT 1` }).catch(() => ({ rows: [] as any[] }))
    const record: any = existing.rows[0]
    if (record && record.fingerprint === fingerprint && Number(record.actor_id) === Number(user.id)) {
      revalidatePath('/shop')
      return { success: true, alreadyApplied: true, amount: Number(record.amount) }
    }
    throw new Error(error instanceof Error ? error.message : 'La transaction a échoué.')
  }

  revalidatePath('/shop')
  revalidatePath(`/characters/${characterId}`)
  if (input.shipId !== undefined) revalidatePath(`/ship/${input.shipId}`)
  return { success: true, alreadyApplied, amount: input.action === 'sell' ? amount : -amount }
}
