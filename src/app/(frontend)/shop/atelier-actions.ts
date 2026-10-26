'use server'

import { headers as getHeaders } from 'next/headers.js'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { assertPlayerMode } from '@/lib/activeMode'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { isCharacterCreationComplete } from '@/lib/characterCreation'
import { atelierCost, atelierModificationPoints, atelierPointsForPersonalItem, atelierPointsForShip, atelierPurchasePrice, findAtelierCompatibility, applyAtelierEffects, snapshotArmor, snapshotWeapon, atelierRelationId, type AtelierEquipmentKind, type AtelierEffect, type AtelierPurchase } from '@/lib/atelier'
import { exactAdd, exactMultiply, exactSubtract, readShopPrice } from '@/lib/shop'
import { computeShipAccess } from '@/lib/shipAccess'
import { validateShipConfiguration } from '@/lib/shipStats'
import { factionKey, ownsFactionAtelierAccess } from '@/lib/factionRewards'

type PersonalLocation = { location: 'inventory'; index: number; itemId: number }

type CustomizePersonalInput = {
  transactionId: string
  kind: 'arme' | 'armure'
  source: PersonalLocation
  modifications: AtelierPurchase[]
  customName: string
}

type ShipCustomizationInput = {
  transactionId: string
  shipId: number
  modifications: AtelierPurchase[]
}

class AtelierError extends Error {}
function fail(message: string): never { throw new AtelierError(message) }

const numericId = (value: unknown) => atelierRelationId(value)
const isId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

async function getContext() {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) fail('Connexion requise.')
  await assertPlayerMode(user)
  const character = await getActiveCharacter(payload, user, { depth: 1 })
  if (!character) fail('Aucun personnage associé à ce compte.')
  if (character.workspace) fail('Les personnages temporaires ne peuvent pas utiliser les Ateliers.')
  if (!isCharacterCreationComplete(character as any)) fail('Terminez la création du personnage avant d’utiliser les Ateliers.')
  if (numericId((character as any).user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
  const affiliation = (character as any).affiliation
  const factionName = String(affiliation && typeof affiliation === 'object' ? affiliation.nom ?? '' : '').trim()
  const faction = factionKey(factionName)
  const workshopKind: AtelierEquipmentKind | null = faction === 'alliance' ? 'arme' : faction === 'union' ? 'armure' : faction === 'guilde' ? 'vaisseau' : null
  if (!workshopKind) fail('Aucun Atelier n’est défini pour cette organisation.')
  if (!ownsFactionAtelierAccess((character as any).inventaireRecompensesFaction, factionName)) {
    fail('Un permis Accès Atelier valide pour votre organisation est nécessaire.')
  }
  return { payload, user, character: character as any, workshopKind }
}

async function beginTransaction(payload: any) {
  const transactionID = await payload.db.beginTransaction?.()
  if (!transactionID) fail('Les transactions PostgreSQL sont indisponibles.')
  const transactionDb = (payload.db as any).sessions?.[transactionID]?.db
  if (!transactionDb) {
    await payload.db.rollbackTransaction?.(transactionID)
    fail('Impossible d’ouvrir la transaction.')
  }
  return { transactionID, transactionDb, req: { transactionID } as any }
}

async function findPrevious(payload: any, transactionDb: any, transactionId: string, fingerprint: string, actorId: number) {
  const previous = await payload.db.execute({
    db: transactionDb,
    sql: sql`SELECT fingerprint, actor_id, amount FROM shop_transactions WHERE transaction_id = ${transactionId} LIMIT 1`,
  })
  const record: any = previous.rows[0]
  if (!record) return null
  if (record.fingerprint !== fingerprint || Number(record.actor_id) !== actorId) fail('Cet identifiant a déjà été utilisé pour une autre transaction.')
  return Math.abs(Number(record.amount) || 0)
}

async function recordTransaction(payload: any, transactionDb: any, values: {
  transactionId: string; fingerprint: string; operation: string; actorId: number; characterId: number;
  shipId?: number | null; amount: number; details: Record<string, unknown>
}) {
  await payload.db.execute({
    db: transactionDb,
    sql: sql`INSERT INTO shop_transactions (transaction_id, fingerprint, operation, actor_id, character_id, ship_id, amount, details) VALUES (${values.transactionId}, ${values.fingerprint}, ${values.operation}, ${values.actorId}, ${values.characterId}, ${values.shipId ?? null}, ${values.amount}, ${JSON.stringify(values.details)}::jsonb)`,
  })
}

async function getActiveModifications(payload: any, purchases: AtelierPurchase[], req: any) {
  if (!Array.isArray(purchases) || purchases.length < 1 || purchases.length > 50) fail('Sélectionnez au moins une modification valide.')
  const seen = new Set<number>()
  const resolved = []
  for (const purchase of purchases) {
    if (!purchase || !isId(purchase.modificationId) || !Number.isSafeInteger(purchase.quantity) || purchase.quantity < 1 || seen.has(purchase.modificationId)) {
      fail('La sélection de modifications est invalide.')
    }
    seen.add(purchase.modificationId)
    const modification = await payload.findByID({ collection: 'atelier-modifications', id: purchase.modificationId, depth: 0, overrideAccess: true, req }).catch(() => null) as any
    if (!modification || modification.active === false) fail('Une modification sélectionnée est indisponible.')
    resolved.push({ modification, quantity: purchase.quantity })
  }
  return resolved
}

function modificationSnapshot(modification: any) {
  const compatibility = modification.atelierCompatibilite
  return {
    modificationSourceId: Number(modification.id),
    nom: String(modification.nom ?? ''),
    prix: Number(compatibility.prix),
    maximum: Number(compatibility.maximum),
    multiplicateurRachat: compatibility.multiplicateurRachat == null ? null : Number(compatibility.multiplicateurRachat),
    compatibilite: {
      categorieEquipement: compatibility.categorieEquipement,
      sousCategorie: compatibility.sousCategorie ?? null,
      typeArme: compatibility.typeArme ?? null,
      classeVaisseau: compatibility.classeVaisseau ?? null,
      points: Number(compatibility.points),
    },
    effets: (modification.effets ?? []).map((effect: any) => ({
      cible: String(effect.cible), operation: String(effect.operation), valeur: String(effect.valeur),
    })),
  }
}

function applyModifications(base: Record<string, any>, selections: { modification: any; quantity: number }[], kind: AtelierEquipmentKind, item: any) {
  const effects: AtelierEffect[] = []
  const selectedModifications = selections.map(({ modification, quantity }) => {
    const compatibility = findAtelierCompatibility(modification, item)
    if (!compatibility) fail(`La modification « ${modification.nom} » n’est pas compatible avec cet équipement.`)
    if (!Number.isSafeInteger(compatibility.maximum) || quantity > Number(compatibility.maximum)) fail(`La modification « ${modification.nom} » dépasse son nombre maximum d’achats.`)
    return { ...modification, atelierCompatibilite: compatibility, atelierQuantite: quantity }
  })
  for (const modification of selectedModifications) {
    for (let purchase = 0; purchase < modification.atelierQuantite; purchase += 1) {
      for (const effect of modification.effets ?? []) {
        effects.push({ cible: String(effect.cible), operation: String(effect.operation) as AtelierEffect['operation'], valeur: String(effect.valeur) })
      }
    }
  }
  return {
    properties: applyAtelierEffects(base, effects, kind),
    selections: selectedModifications,
    modifications: selectedModifications.flatMap((modification) => Array.from({ length: modification.atelierQuantite }, () => modification)),
  }
}

export async function customizePersonalEquipment(input: CustomizePersonalInput) {
  const { payload, user, character, workshopKind } = await getContext()
  if (!isUuid(input?.transactionId)) fail('Identifiant de transaction invalide.')
  if (!['arme', 'armure'].includes(input?.kind) || input.kind !== workshopKind) fail('Cet Atelier n’autorise pas la modification de cet équipement.')
  const customName = typeof input.customName === 'string' ? input.customName.trim() : ''
  if (!customName || customName.length > 120) fail('Le nom personnalisé doit contenir entre 1 et 120 caractères.')
  if (input.source?.location !== 'inventory' || !Number.isSafeInteger(input.source.index) || input.source.index < 0 || !isId(input.source.itemId)) fail('Seul un objet présent dans la réserve peut être sélectionné.')
  const purchases = input.modifications
  const fingerprint = JSON.stringify(['atelier-customize', input.kind, input.source.index, input.source.itemId, customName, purchases])
  const { transactionID, transactionDb, req } = await beginTransaction(payload)
  try {
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    const already = await findPrevious(payload, transactionDb, input.transactionId, fingerprint, Number(user.id))
    if (already !== null) {
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true, amount: already }
    }
    const current = await payload.findByID({ collection: 'characters', id: character.id, depth: 2, overrideAccess: true, req }) as any
    const modifications = await getActiveModifications(payload, purchases, req)
    const inventoryField = input.kind === 'arme' ? 'inventaireArmes' : 'inventaireArmures'
    const sourceCollection = input.kind === 'arme' ? 'weapons' : 'armors'
    const rows = Array.isArray(current[inventoryField]) ? [...current[inventoryField]] : []
    const sourceEntry: any = rows[input.source.index]
    const sourceId = numericId(sourceEntry?.item)
    if (sourceId !== input.source.itemId) fail('L’objet sélectionné a changé dans la réserve. Rechargez la page avant de confirmer.')
    if (!sourceId || sourceEntry?.customItem) fail('Seul un équipement standard possédé peut être personnalisé.')
    const sourceItem = await payload.findByID({ collection: sourceCollection, id: sourceId, depth: input.kind === 'armure' ? 1 : 0, overrideAccess: true, req }).catch(() => null) as any
    if (!sourceItem) fail('Équipement source introuvable.')
    const pointsAvailable = atelierPointsForPersonalItem(input.kind, sourceItem)
    if (pointsAvailable === null) fail('Cet équipement ne remplit pas les conditions de cet Atelier.')
    const baseSnapshot = input.kind === 'arme' ? snapshotWeapon(sourceItem) : snapshotArmor(sourceItem)
    const type: AtelierEquipmentKind = input.kind
    const applied = applyModifications(baseSnapshot, modifications, type, {
      kind: type, categorie: sourceItem.categorie, type: sourceItem.type ?? [],
    })
    const customProperties: Record<string, any> = { ...applied.properties, nom: customName }
    const selectedModifications = applied.modifications
    const pointsSpent = applied.selections.reduce((total: number, modification: any) => total + atelierModificationPoints(modification.atelierCompatibilite, modification.atelierQuantite), 0)
    if (!Number.isSafeInteger(pointsSpent) || pointsSpent > pointsAvailable) fail('Le total des points dépasse le budget de cet équipement.')
    const cost = atelierCost(sourceItem.prix, applied.selections.map((modification: any) => atelierPurchasePrice(modification.atelierCompatibilite, modification.atelierQuantite)))
    const balance = Number(current.konis ?? 0)
    if (!Number.isFinite(balance) || balance < cost) fail('Vous ne possédez pas assez de Konis pour cette personnalisation.')
    const nextBalance = exactSubtract(balance, cost)
    const mods = Array.isArray(sourceEntry.mods) ? sourceEntry.mods.map(numericId).filter(Boolean) : []
    const created = await payload.create({
      collection: 'custom-equipment',
      data: {
        nom: customName,
        categorieEquipement: input.kind,
        categorie: String(customProperties.categorie ?? sourceItem.categorie),
        typeArme: input.kind === 'arme' ? (sourceItem.type ?? []).filter((value: string) => ['thermique', 'cinetique'].includes(value)).join(',') : undefined,
        armeSource: input.kind === 'arme' ? sourceId : undefined,
        armureSource: input.kind === 'armure' ? sourceId : undefined,
        set: input.kind === 'armure' ? numericId(customProperties.set) : undefined,
        proprietaireActuel: Number(current.id),
        proprietaireOrigine: Number(current.id),
        prixAchat: cost,
        mods,
        munitionsActuelles: input.kind === 'arme' ? Number(sourceEntry.munitionsActuelles) || 0 : undefined,
        chargeurRelie: input.kind === 'arme' ? numericId(sourceEntry.chargeurRelie) : undefined,
        proprietesFigees: customProperties,
        modificationsAtelier: selectedModifications.map(modificationSnapshot),
      },
      depth: 0, overrideAccess: true, req,
    }) as any

    const customInventory = (current.inventaireEquipementsCustom ?? []).map(numericId).filter(Boolean)
    customInventory.push(Number(created.id))
    const update: Record<string, any> = { inventaireEquipementsCustom: customInventory, konis: nextBalance }
    rows.splice(input.source.index, 1)
    update[inventoryField] = rows.map((row) => ({
      item: numericId(row.item), mods: (row.mods ?? []).map(numericId).filter(Boolean),
      ...(input.kind === 'arme' ? { munitionsActuelles: Number(row.munitionsActuelles) || 0, chargeurRelie: numericId(row.chargeurRelie) } : {}),
    }))
    await payload.update({ collection: 'characters', id: current.id, data: update, depth: 0, overrideAccess: true, user, req })
    await recordTransaction(payload, transactionDb, {
      transactionId: input.transactionId, fingerprint, operation: 'atelier-customize-equipment',
      actorId: Number(user.id), characterId: Number(current.id), amount: -cost,
      details: { kind: input.kind, sourceId, customEquipmentId: Number(created.id), modifications: purchases, pointsSpent, price: cost },
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/shop')
    revalidatePath('/shop/atelier')
    revalidatePath(`/characters/${current.id}`)
    return { success: true, alreadyApplied: false, amount: cost, customEquipmentId: Number(created.id) }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'La personnalisation a échoué.')
  }
}

function groupRelationId(value: unknown) { return numericId(value) }

async function transferableCharacters(payload: any, source: any, destinationId: number, req: any) {
  if (!isId(destinationId) || destinationId === Number(source.id)) fail('Choisissez un autre personnage de votre escouade.')
  const destination = await payload.findByID({ collection: 'characters', id: destinationId, depth: 0, overrideAccess: true, req }).catch(() => null) as any
  if (!destination || destination.workspace || !isCharacterCreationComplete(destination)) fail('Le destinataire ne possède pas une fiche permanente valide.')
  const sourceGroup = groupRelationId(source.groupe)
  if (!sourceGroup || groupRelationId(destination.groupe) !== sourceGroup) fail('Le destinataire doit appartenir à votre escouade.')
  return destination
}

export async function transferCustomEquipment(input: { transactionId: string; customEquipmentId: number; destinationCharacterId: number }) {
  const { payload, user, character } = await getContext()
  if (!isUuid(input?.transactionId) || !isId(input.customEquipmentId)) fail('Données de transfert invalides.')
  const fingerprint = JSON.stringify(['atelier-transfer-equipment', input.customEquipmentId, input.destinationCharacterId])
  const { transactionID, transactionDb, req } = await beginTransaction(payload)
  try {
    const destination = await transferableCharacters(payload, character, input.destinationCharacterId, req)
    for (const id of [Number(character.id), Number(destination.id)].sort((a, b) => a - b)) {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${id} FOR UPDATE` })
    }
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM custom_equipment WHERE id = ${input.customEquipmentId} FOR UPDATE` })
    const already = await findPrevious(payload, transactionDb, input.transactionId, fingerprint, Number(user.id))
    if (already !== null) {
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true }
    }
    const current = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req }) as any
    const target = await payload.findByID({ collection: 'characters', id: destination.id, depth: 0, overrideAccess: true, req }) as any
    if (numericId(current.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    const equipment = await payload.findByID({ collection: 'custom-equipment', id: input.customEquipmentId, depth: 0, overrideAccess: true, req }).catch(() => null) as any
    if (!equipment || numericId(equipment.proprietaireActuel) !== Number(current.id)) fail('Cet équipement custom ne vous appartient pas.')
    const sourceInventory = (current.inventaireEquipementsCustom ?? []).map(numericId).filter(Boolean)
    const index = sourceInventory.indexOf(Number(equipment.id))
    if (index < 0) fail('Rangez l’équipement avant de le transférer.')
    sourceInventory.splice(index, 1)
    const destinationInventory = (target.inventaireEquipementsCustom ?? []).map(numericId).filter(Boolean)
    if (destinationInventory.includes(Number(equipment.id))) fail('Le destinataire possède déjà cet équipement.')
    await payload.update({ collection: 'characters', id: current.id, data: { inventaireEquipementsCustom: sourceInventory }, overrideAccess: true, user, req })
    await payload.update({ collection: 'characters', id: target.id, data: { inventaireEquipementsCustom: [...destinationInventory, Number(equipment.id)] }, overrideAccess: true, user, req })
    await payload.update({ collection: 'custom-equipment', id: equipment.id, data: { proprietaireActuel: Number(target.id) }, overrideAccess: true, user, req })
    await recordTransaction(payload, transactionDb, {
      transactionId: input.transactionId, fingerprint, operation: 'atelier-transfer-equipment',
      actorId: Number(user.id), characterId: Number(current.id), amount: 0,
      details: { customEquipmentId: Number(equipment.id), sourceCharacterId: Number(current.id), destinationCharacterId: Number(target.id) },
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/shop/transfert-personnages')
    revalidatePath(`/characters/${current.id}`)
    revalidatePath(`/characters/${target.id}`)
    return { success: true, alreadyApplied: false }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'Le transfert a échoué.')
  }
}

export async function sellCustomEquipment(input: { transactionId: string; customEquipmentId: number }) {
  const { payload, user, character } = await getContext()
  if (!isUuid(input?.transactionId) || !isId(input.customEquipmentId)) fail('Données de vente invalides.')
  const fingerprint = JSON.stringify(['atelier-sell-equipment', input.customEquipmentId])
  const { transactionID, transactionDb, req } = await beginTransaction(payload)
  try {
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM custom_equipment WHERE id = ${input.customEquipmentId} FOR UPDATE` })
    const already = await findPrevious(payload, transactionDb, input.transactionId, fingerprint, Number(user.id))
    if (already !== null) {
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true, amount: already }
    }
    const current = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req }) as any
    if (numericId(current.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    const equipment = await payload.findByID({ collection: 'custom-equipment', id: input.customEquipmentId, depth: 1, overrideAccess: true, req }).catch(() => null) as any
    if (!equipment || numericId(equipment.proprietaireActuel) !== Number(current.id)) fail('Cet équipement custom ne vous appartient pas.')
    const inventory = (current.inventaireEquipementsCustom ?? []).map(numericId).filter(Boolean)
    const index = inventory.indexOf(Number(equipment.id))
    if (index < 0) fail('Déséquipez l’objet avant de le vendre.')
    const purchasePrice = readShopPrice(equipment.prixAchat)
    if (purchasePrice === null) fail('Le prix d’achat stocké est invalide.')
    const amount = exactMultiply(purchasePrice, 0.25)
    inventory.splice(index, 1)
    const update: Record<string, any> = { inventaireEquipementsCustom: inventory, konis: exactAdd(Number(current.konis) || 0, amount) }
    const returnedMods = (equipment.mods ?? []).map(numericId).filter(Boolean) as number[]
    if (returnedMods.length) update.inventaireMods = [...(current.inventaireMods ?? []).map(numericId).filter(Boolean), ...returnedMods]
    await payload.update({ collection: 'characters', id: current.id, data: update, overrideAccess: true, user, req })
    await payload.delete({ collection: 'custom-equipment', id: equipment.id, overrideAccess: true, user, req })
    await recordTransaction(payload, transactionDb, {
      transactionId: input.transactionId, fingerprint, operation: 'atelier-sell-equipment',
      actorId: Number(user.id), characterId: Number(current.id), amount,
      details: { customEquipmentId: Number(equipment.id), kind: equipment.categorieEquipement, pricePurchase: purchasePrice, returnedMods },
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/shop')
    revalidatePath(`/characters/${current.id}`)
    return { success: true, alreadyApplied: false, amount }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'La vente a échoué.')
  }
}

function relation(value: unknown) { return numericId(value) }
function requiredRelation(value: unknown, label: string): number {
  const id = relation(value)
  if (!id) fail(`${label} est introuvable sur le modèle source.`)
  return id
}

function shipStateForCopy(ship: any, newModelId: number, originalOwnerId: number, purchasePrice: number) {
  const weaponState = (entry: any) => ({
    arme: relation(entry.arme), munitionsActuelles: Number(entry.munitionsActuelles) || 0,
    chargeurRelie: relation(entry.chargeurRelie),
  })
  return {
    nom: ship.nom,
    modele: newModelId,
    proprietaire: relation(ship.proprietaire),
    proprietaireOrigineAtelier: originalOwnerId,
    prixAchatAtelier: purchasePrice,
    atelierPersonnalise: true,
    blindageActuel: ship.blindageActuel,
    bouclierActuel: ship.bouclierActuel,
    esquiveActuelle: ship.esquiveActuelle,
    pilote: null,
    copilote: null,
    canonniers: [],
    moduleGenerateur: relation(ship.moduleGenerateur),
    modulePropulseurs: relation(ship.modulePropulseurs),
    moduleBoucliers: relation(ship.moduleBoucliers),
    moduleSurvie: relation(ship.moduleSurvie),
    modulesSupplementaires: (ship.modulesSupplementaires ?? []).map(relation).filter(Boolean),
    armesPilote: (ship.armesPilote ?? []).map(weaponState),
    armesTourelles: (ship.armesTourelles ?? []).map((turret: any) => ({
      tourelle: turret.tourelle,
      module: relation(turret.module),
      armes: (turret.armes ?? []).map(weaponState),
    })),
    consommablesVaisseau: (ship.consommablesVaisseau ?? []).map((entry: any) => ({ consommable: relation(entry.consommable), quantite: entry.quantite })),
    inventaireModules: (ship.inventaireModules ?? []).map((entry: any) => ({ module: relation(entry.module), quantite: entry.quantite })),
    inventaireArmes: (ship.inventaireArmes ?? []).map((entry: any) => ({ arme: relation(entry.arme), quantite: entry.quantite })),
    inventaireConsommables: (ship.inventaireConsommables ?? []).map((entry: any) => ({ consommable: relation(entry.consommable), quantite: entry.quantite })),
    notes: ship.notes,
    image: relation(ship.image),
  }
}


export async function customizeShip(input: ShipCustomizationInput) {
  const { payload, user, character, workshopKind } = await getContext()
  if (workshopKind !== 'vaisseau') fail('Cet Atelier n’autorise pas la modification des vaisseaux.')
  if (!isUuid(input?.transactionId) || !isId(input.shipId) || !Array.isArray(input.modifications)) fail('Données de personnalisation du vaisseau invalides.')
  const fingerprint = JSON.stringify(['atelier-customize-ship', input.shipId, input.modifications])
  const { transactionID, transactionDb, req } = await beginTransaction(payload)
  try {
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${character.id} FOR UPDATE` })
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ships WHERE id = ${input.shipId} FOR UPDATE` })
    const already = await findPrevious(payload, transactionDb, input.transactionId, fingerprint, Number(user.id))
    if (already !== null) {
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true, amount: already }
    }
    const current = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req }) as any
    const source = await payload.findByID({ collection: 'ships', id: input.shipId, depth: 4, overrideAccess: true, req }).catch(() => null) as any
    if (!source || numericId(source.proprietaire) !== Number(current.id)) fail('Seul le propriétaire peut personnaliser ce vaisseau.')
    if (numericId(current.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    if (source.atelierPersonnalise) fail('Un vaisseau déjà personnalisé en Atelier ne peut pas être modifié à nouveau.')
    if (numericId(current.vaisseau) === Number(source.id)) fail('Un vaisseau actuellement utilisé ne peut pas être personnalisé.')
    const rights = computeShipAccess({ ship: source, character: current, isAdmin: user.role === 'admin' })
    if (!rights.canManageCrew) fail('Seul le propriétaire du vaisseau peut le personnaliser.')
    const aboard = await payload.find({ collection: 'characters', where: { vaisseau: { equals: source.id } }, depth: 0, pagination: false, overrideAccess: true, req })
    if (aboard.docs.length > 0 || source.pilote || source.copilote || (source.canonniers ?? []).some((entry: any) => entry.personnage)) {
      fail('Un vaisseau occupé ne peut pas être personnalisé.')
    }
    const sourceSaleModelId = numericId(source.modele)
    if (!sourceSaleModelId) fail('Le modèle de vente du vaisseau est introuvable.')
    const model = await payload.findByID({ collection: 'ship-sale-models', id: sourceSaleModelId, depth: 2, overrideAccess: true, req }) as any
    if (!model || model.atelierPrive || (model.atelierModifications ?? []).length > 0) fail('Un vaisseau déjà personnalisé en Atelier ne peut pas être modifié à nouveau.')
    const chassis = model.chassis && typeof model.chassis === 'object'
      ? model.chassis
      : await payload.findByID({ collection: 'ship-models', id: numericId(model.chassis)!, depth: 0, overrideAccess: true, req }) as any
    if (!chassis) fail('Le châssis source est introuvable.')
    const pointsAvailable = atelierPointsForShip(chassis.classe)
    if (pointsAvailable === null) fail('La classe de ce vaisseau ne donne pas accès aux points de modification.')
    const modifications = await getActiveModifications(payload, input.modifications, req)
    const baseChassis = { ...chassis }
    delete baseChassis.id; delete baseChassis.createdAt; delete baseChassis.updatedAt
    const applied = applyModifications(baseChassis, modifications, 'vaisseau', { kind: 'vaisseau', classe: chassis.classe })
    const customChassis = applied.properties
    const selectedModifications = applied.modifications
    const pointsSpent = applied.selections.reduce((total: number, modification: any) => total + atelierModificationPoints(modification.atelierCompatibilite, modification.atelierQuantite), 0)
    if (!Number.isSafeInteger(pointsSpent) || pointsSpent > pointsAvailable) fail('Le total des points dépasse le budget de ce vaisseau.')
    try {
      validateShipConfiguration({ ...source, modele: { ...model, chassis: customChassis } })
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Les composants du vaisseau ne sont pas compatibles avec le nouveau châssis.')
    }
    const cost = atelierCost(model.prix, applied.selections.map((modification: any) => atelierPurchasePrice(modification.atelierCompatibilite, modification.atelierQuantite)))
    const balance = Number(current.konis ?? 0)
    if (!Number.isFinite(balance) || balance < cost) fail('Vous ne possédez pas assez de Konis pour cette personnalisation.')
    const nextBalance = exactSubtract(balance, cost)
    const originalOwner = numericId(source.proprietaireOrigineAtelier) ?? numericId(model.atelierProprietaireOrigine) ?? Number(current.id)
    const suffix = `Atelier ${Number(source.id)} ${Date.now()}`
    const newChassis = await payload.create({
      collection: 'ship-models',
      data: {
        ...customChassis,
        nom: `${String(customChassis.nom ?? chassis.nom).slice(0, 100)} · ${suffix}`,
        image: relation(chassis.image),
        atelierPrive: true,
        atelierProprietaire: Number(current.id),
      } as any,
      depth: 0, overrideAccess: true, req,
    }) as any
    const newSaleModel = await payload.create({
      collection: 'ship-sale-models',
      data: {
        nom: `${String(model.nom ?? chassis.nom).slice(0, 100)} · ${suffix}`,
        chassis: Number(newChassis.id),
        prix: String(cost),
        generateur: requiredRelation(model.generateur, 'Le générateur'),
        propulseurs: requiredRelation(model.propulseurs, 'Les propulseurs'),
        boucliers: requiredRelation(model.boucliers, 'Les boucliers'),
        survie: requiredRelation(model.survie, 'Le système de survie'),
        armes: (model.armes ?? []).map((entry: any) => ({ arme: relation(entry.arme), emplacement: entry.emplacement })),
        modulesOptionnels: (model.modulesOptionnels ?? []).map(relation).filter(Boolean),
        description: model.description,
        image: relation(model.image),
        atelierPrive: true,
        atelierProprietaire: Number(current.id),
        atelierProprietaireOrigine: originalOwner,
        atelierModeleSource: Number(model.id),
        atelierPrixAchat: cost,
        atelierModifications: selectedModifications.map(modificationSnapshot),
      },
      depth: 0, overrideAccess: true, req,
    }) as any
    const state = shipStateForCopy(source, Number(newSaleModel.id), originalOwner, cost)
    const createdShip = await payload.create({
      collection: 'ships', data: state, depth: 0, overrideAccess: true, user, req,
      context: { atelierPreserveShipState: true },
    }) as any
    await payload.update({ collection: 'characters', id: current.id, data: { konis: nextBalance }, overrideAccess: true, user, req })
    await payload.delete({ collection: 'ships', id: source.id, overrideAccess: true, user, req })
    await recordTransaction(payload, transactionDb, {
      transactionId: input.transactionId, fingerprint, operation: 'atelier-customize-ship',
      actorId: Number(user.id), characterId: Number(current.id), shipId: Number(createdShip.id), amount: -cost,
      details: { sourceShipId: Number(source.id), customShipId: Number(createdShip.id), chassisId: Number(newChassis.id), saleModelId: Number(newSaleModel.id), modifications: input.modifications, pointsSpent, price: cost },
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/shop/chantier-naval')
    revalidatePath('/shop/atelier')
    revalidatePath('/ships')
    revalidatePath('/ship')
    return { success: true, alreadyApplied: false, amount: cost, shipId: Number(createdShip.id) }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'La personnalisation du vaisseau a échoué.')
  }
}

export async function transferCustomShip(input: { transactionId: string; shipId: number; destinationCharacterId: number }) {
  const { payload, user, character } = await getContext()
  if (!isUuid(input?.transactionId) || !isId(input.shipId)) fail('Données de transfert invalides.')
  const fingerprint = JSON.stringify(['atelier-transfer-ship', input.shipId, input.destinationCharacterId])
  const { transactionID, transactionDb, req } = await beginTransaction(payload)
  try {
    const destination = await transferableCharacters(payload, character, input.destinationCharacterId, req)
    for (const id of [Number(character.id), Number(destination.id)].sort((a, b) => a - b)) {
      await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM characters WHERE id = ${id} FOR UPDATE` })
    }
    await payload.db.execute({ db: transactionDb, sql: sql`SELECT id FROM ships WHERE id = ${input.shipId} FOR UPDATE` })
    const already = await findPrevious(payload, transactionDb, input.transactionId, fingerprint, Number(user.id))
    if (already !== null) {
      await payload.db.rollbackTransaction?.(transactionID)
      return { success: true, alreadyApplied: true }
    }
    const sourceCharacter = await payload.findByID({ collection: 'characters', id: character.id, depth: 0, overrideAccess: true, req }) as any
    const ship = await payload.findByID({ collection: 'ships', id: input.shipId, depth: 1, overrideAccess: true, req }).catch(() => null) as any
    if (!ship || !ship.atelierPersonnalise || numericId(ship.proprietaire) !== Number(sourceCharacter.id)) fail('Ce vaisseau Atelier ne vous appartient pas.')
    if (numericId(sourceCharacter.user) !== Number(user.id)) fail('Ce personnage ne vous appartient pas.')
    const modelId = numericId(ship.modele)
    if (!modelId) fail('Le modèle privé du vaisseau est introuvable.')
    const model = await payload.findByID({ collection: 'ship-sale-models', id: modelId, depth: 1, overrideAccess: true, req }) as any
    await payload.update({ collection: 'ships', id: ship.id, data: { proprietaire: Number(destination.id) }, overrideAccess: true, user, req })
    await payload.update({ collection: 'ship-sale-models', id: modelId, data: { atelierProprietaire: Number(destination.id) }, overrideAccess: true, user, req })
    const chassisId = numericId(model?.chassis)
    if (chassisId) await payload.update({ collection: 'ship-models', id: chassisId, data: { atelierProprietaire: Number(destination.id) }, overrideAccess: true, user, req })
    await recordTransaction(payload, transactionDb, {
      transactionId: input.transactionId, fingerprint, operation: 'atelier-transfer-ship',
      actorId: Number(user.id), characterId: Number(sourceCharacter.id), shipId: Number(ship.id), amount: 0,
      details: { shipId: Number(ship.id), sourceCharacterId: Number(sourceCharacter.id), destinationCharacterId: Number(destination.id), originalOwnerId: numericId(ship.proprietaireOrigineAtelier) },
    })
    await payload.db.commitTransaction?.(transactionID)
    revalidatePath('/shop/transfert-personnages')
    revalidatePath('/ships')
    return { success: true, alreadyApplied: false }
  } catch (error) {
    await payload.db.rollbackTransaction?.(transactionID).catch(() => undefined)
    throw new Error(error instanceof Error ? error.message : 'Le transfert du vaisseau a échoué.')
  }
}
