import { exactAdd, exactMultiply, readShopPrice, relationId, resalePrice, type ShopPrice } from './shop'

export type ShipComponentKind = 'module' | 'weapon'
export type ShipSaleComponent = {
  key: string
  kind: ShipComponentKind
  itemId: number
  nom: string
  prix: ShopPrice
  emplacement: string
}
export type ShipTransferKind = 'module' | 'weapon' | 'consumable'
export type ShipTransferItem = {
  key: string
  kind: ShipTransferKind
  itemId: number
  nom: string
  quantity: number
  emplacement: string
  equipe: boolean
  ammoId?: number
  ammoNom?: string
  ammoQuantity?: number
}

export const shipCatalogClasses = [
  { value: 'alpha', label: 'Alpha', size: 1 },
  { value: 'beta', label: 'Beta', size: 2 },
  { value: 'gamma', label: 'Gamma', size: 3 },
  { value: 'delta', label: 'Delta', size: 4 },
] as const

export const shipCatalogCategories = [
  { value: 'polyvalent', label: 'Polyvalent' },
  { value: 'combat', label: 'Combat' },
  { value: 'transport', label: 'Transport' },
  { value: 'exploration', label: 'Exploration' },
] as const

export type ShipCatalogEntry = {
  id: number
  nom: string
  prix: ShopPrice
  classe: string | null
  categorie: string | null
}

/** Groups ship sale models by chassis class and category, sorting each category by price. */
export function groupShipCatalog<T extends ShipCatalogEntry>(models: T[]) {
  return shipCatalogClasses.map((shipClass) => ({
    ...shipClass,
    categories: shipCatalogCategories
      .map((category) => ({
        ...category,
        models: models
          .filter((model) => model.classe === shipClass.value && model.categorie === category.value)
          .sort((left, right) => {
            const leftPrice = readShopPrice(left.prix)
            const rightPrice = readShopPrice(right.prix)
            if (leftPrice === null) return rightPrice === null ? left.nom.localeCompare(right.nom, 'fr') : 1
            if (rightPrice === null) return -1
            return leftPrice - rightPrice || left.nom.localeCompare(right.nom, 'fr') || left.id - right.id
          }),
      }))
      .filter((category) => category.models.length > 0),
  }))
}

function populatedItem(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && 'id' in value
    ? value as Record<string, unknown>
    : null
}

function addComponent(
  result: ShipSaleComponent[],
  key: string,
  kind: ShipComponentKind,
  value: unknown,
  emplacement: string,
) {
  const id = relationId(value)
  if (!id || !/^\d+$/.test(id)) return
  const item = populatedItem(value)
  result.push({
    key,
    kind,
    itemId: Number(id),
    nom: String(item?.nom ?? `${kind === 'module' ? 'Module' : 'Arme'} #${id}`),
    prix: (item?.prix as ShopPrice | undefined) ?? null,
    emplacement,
  })
}

/** Lists installed modules and weapons. Cargo and ship consumables are intentionally excluded. */
export function listInstalledShipComponents(ship: Record<string, any>): ShipSaleComponent[] {
  const result: ShipSaleComponent[] = []
  const baseModules = [
    ['moduleGenerateur', 'Générateur'],
    ['modulePropulseurs', 'Propulseurs'],
    ['moduleSurvie', 'Système de survie'],
    ['moduleBoucliers', 'Boucliers'],
  ] as const
  for (const [field, label] of baseModules) addComponent(result, field, 'module', ship[field], label)

  for (const [index, module] of (ship.modulesSupplementaires ?? []).entries()) {
    addComponent(result, `modulesSupplementaires:${index}`, 'module', module, `Module optionnel ${index + 1}`)
  }
  for (const [index, weapon] of (ship.armesPilote ?? []).entries()) {
    addComponent(result, `armesPilote:${index}`, 'weapon', weapon.arme, `Arme pilote ${index + 1}`)
  }
  for (const [turretIndex, turret] of (ship.armesTourelles ?? []).entries()) {
    const turretName = `Tourelle ${turret.tourelle ?? turretIndex + 1}`
    addComponent(result, `armesTourelles:${turretIndex}:module`, 'module', turret.module, `Module ${turretName.toLowerCase()}`)
    for (const [weaponIndex, weapon] of (turret.armes ?? []).entries()) {
      addComponent(result, `armesTourelles:${turretIndex}:armes:${weaponIndex}`, 'weapon', weapon.arme, `Arme ${turretName.toLowerCase()} ${weaponIndex + 1}`)
    }
  }
  return result
}

function transferRow(
  result: ShipTransferItem[],
  key: string,
  kind: ShipTransferKind,
  value: unknown,
  quantity: unknown,
  emplacement: string,
  equipe: boolean,
  ammo?: { id?: unknown; nom?: unknown; quantity?: unknown },
) {
  const id = relationId(value)
  if (!id || !/^\d+$/.test(id)) return
  const item = populatedItem(value)
  const ammoId = relationId(ammo?.id)
  result.push({
    key,
    kind,
    itemId: Number(id),
    nom: String(item?.nom ?? `${kind === 'module' ? 'Module' : kind === 'weapon' ? 'Arme' : 'Consommable'} #${id}`),
    quantity: Math.max(0, Number(quantity) || 0),
    emplacement,
    equipe,
    ...(ammoId && /^\d+$/.test(ammoId) && Number(ammo?.quantity) > 0 ? {
      ammoId: Number(ammoId),
      ammoNom: String(ammo?.nom ?? `Munition #${ammoId}`),
      ammoQuantity: Number(ammo?.quantity),
    } : {}),
  })
}

export function listShipTransferItems(ship: Record<string, any>): ShipTransferItem[] {
  const result: ShipTransferItem[] = []
  for (const [index, row] of (ship.inventaireModules ?? []).entries()) transferRow(result, `inventaireModules:${index}`, 'module', row.module, row.quantite, 'Soute', false)
  for (const [index, row] of (ship.inventaireArmes ?? []).entries()) transferRow(result, `inventaireArmes:${index}`, 'weapon', row.arme, row.quantite, 'Soute', false)
  for (const [index, row] of (ship.inventaireConsommables ?? []).entries()) transferRow(result, `inventaireConsommables:${index}`, 'consumable', row.consommable, row.quantite, 'Soute', false)

  for (const component of listInstalledShipComponents(ship)) {
    const parts = component.key.split(':')
    let equippedItem: any
    if (component.key === 'moduleGenerateur' || component.key === 'modulePropulseurs' || component.key === 'moduleSurvie' || component.key === 'moduleBoucliers') equippedItem = ship[component.key]
    else if (parts[0] === 'modulesSupplementaires') equippedItem = ship.modulesSupplementaires?.[Number(parts[1])]
    else if (parts[0] === 'armesPilote') equippedItem = ship.armesPilote?.[Number(parts[1])]
    else if (parts[0] === 'armesTourelles' && parts[2] === 'module') equippedItem = ship.armesTourelles?.[Number(parts[1])]
    else if (parts[0] === 'armesTourelles') equippedItem = ship.armesTourelles?.[Number(parts[1])]?.armes?.[Number(parts[3])]
    const isWeapon = component.kind === 'weapon'
    const transferValue = isWeapon ? equippedItem?.arme : component.key.endsWith(':module') ? equippedItem?.module : equippedItem
    const ammo = isWeapon ? populatedItem(equippedItem?.chargeurRelie) : null
    transferRow(
      result,
      component.key,
      component.kind,
      transferValue,
      1,
      component.emplacement,
      true,
      ammo ? { id: ammo.id, nom: ammo.nom, quantity: equippedItem?.munitionsActuelles } : undefined,
    )
  }

  for (const [index, row] of (ship.consommablesVaisseau ?? []).entries()) {
    transferRow(result, `consommablesVaisseau:${index}`, 'consumable', row.consommable, row.quantite, `Emplacement consommable ${index + 1}`, true)
  }
  return result
}

export function detachShipTransferItem(ship: Record<string, any>, item: ShipTransferItem, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > item.quantity) throw new Error('Quantité de transfert invalide.')
  if (item.equipe && quantity !== item.quantity) throw new Error('Un équipement installé doit être transféré en entier.')
  const update: Record<string, any> = {}
  const parts = item.key.split(':')
  const removeCargo = (field: string, relationField: string) => {
    const entries = [...(ship[field] ?? [])]
    const index = Number(parts[1])
    const row = entries[index]
    if (!Number.isInteger(index) || index < 0 || !row || Number(relationId(row[relationField])) !== item.itemId) throw new Error('Cet objet n’est plus dans la soute.')
    const remaining = Number(row.quantite) - quantity
    if (remaining < 0) throw new Error('La quantité en soute est insuffisante.')
    if (remaining === 0) entries.splice(index, 1)
    else entries[index] = { ...row, quantite: remaining, [relationField]: item.itemId }
    update[field] = entries
  }

  if (parts[0] === 'inventaireModules') removeCargo('inventaireModules', 'module')
  else if (parts[0] === 'inventaireArmes') removeCargo('inventaireArmes', 'arme')
  else if (parts[0] === 'inventaireConsommables') removeCargo('inventaireConsommables', 'consommable')
  else if (parts[0] === 'consommablesVaisseau') {
    const rows = [...(ship.consommablesVaisseau ?? [])]
    const index = Number(parts[1])
    const row = rows[index]
    if (!Number.isInteger(index) || index < 0 || !row || Number(relationId(row.consommable)) !== item.itemId || Number(row.quantite) !== quantity) throw new Error('Cet consommable embarqué a changé.')
    rows.splice(index, 1)
    update.consommablesVaisseau = rows
  } else if (parts[0] === 'moduleGenerateur' || parts[0] === 'modulePropulseurs' || parts[0] === 'moduleSurvie' || parts[0] === 'moduleBoucliers') {
    if (Number(relationId(ship[parts[0]])) !== item.itemId) throw new Error('Ce module n’est plus installé.')
    update[parts[0]] = null
  } else if (parts[0] === 'modulesSupplementaires') {
    const rows = [...(ship.modulesSupplementaires ?? [])]
    const index = Number(parts[1])
    if (!rows[index] || Number(relationId(rows[index])) !== item.itemId) throw new Error('Ce module n’est plus installé.')
    rows.splice(index, 1)
    update.modulesSupplementaires = rows.map(relationId).filter(Boolean).map(Number)
  } else if (parts[0] === 'armesPilote') {
    const rows = [...(ship.armesPilote ?? [])]
    const index = Number(parts[1])
    if (!rows[index] || Number(relationId(rows[index].arme)) !== item.itemId) throw new Error('Cette arme n’est plus installée.')
    rows.splice(index, 1)
    update.armesPilote = rows.map((row) => ({ ...row, arme: relationId(row.arme), chargeurRelie: relationId(row.chargeurRelie) }))
  } else if (parts[0] === 'armesTourelles' && parts[2] === 'module') {
    const rows = [...(ship.armesTourelles ?? [])]
    const turretIndex = Number(parts[1])
    if (!rows[turretIndex] || Number(relationId(rows[turretIndex].module)) !== item.itemId) throw new Error('Ce module de tourelle n’est plus installé.')
    rows[turretIndex] = { ...rows[turretIndex], module: null }
    update.armesTourelles = rows
  } else if (parts[0] === 'armesTourelles') {
    const rows = [...(ship.armesTourelles ?? [])]
    const turretIndex = Number(parts[1])
    const weaponIndex = Number(parts[3])
    const turret = rows[turretIndex]
    if (!turret?.armes?.[weaponIndex] || Number(relationId(turret.armes[weaponIndex].arme)) !== item.itemId) throw new Error('Cette arme de tourelle n’est plus installée.')
    const weapons = [...turret.armes]
    weapons.splice(weaponIndex, 1)
    rows[turretIndex] = { ...turret, armes: weapons.map((row: any) => ({ ...row, arme: relationId(row.arme), chargeurRelie: relationId(row.chargeurRelie) })) }
    update.armesTourelles = rows
  } else throw new Error('Source de transfert inconnue.')

  const moved = [{ kind: item.kind, itemId: item.itemId, quantity }]
  if (item.ammoId && (item.ammoQuantity ?? 0) > 0) moved.push({ kind: 'consumable', itemId: item.ammoId, quantity: item.ammoQuantity! })
  return { update, moved }
}

export function mergeShipInventory(rows: any[], relationField: 'module' | 'arme' | 'consommable', itemId: number, quantity: number) {
  const next: any[] = []
  let mergedIndex = -1
  for (const row of rows ?? []) {
    const id = Number(relationId(row?.[relationField]))
    const count = Math.max(0, Number(row?.quantite) || 0)
    if (id === itemId) {
      if (mergedIndex < 0) {
        mergedIndex = next.length
        next.push({ [relationField]: itemId, quantite: count + quantity })
      } else next[mergedIndex].quantite += count
    } else next.push({ [relationField]: id || null, quantite: count })
  }
  if (mergedIndex < 0) next.push({ [relationField]: itemId, quantite: quantity })
  return next
}

export function shipPurchasePrice(modelPrice: ShopPrice, chassisOnly: boolean): number | null {
  const price = readShopPrice(modelPrice)
  return price === null ? null : chassisOnly ? exactMultiply(price, 0.5) : price
}

/** The hull is worth a quarter of the complete sale-model price; installed items resell at half-price. */
export function shipSalePrice(modelPrice: ShopPrice, selectedComponentPrices: ShopPrice[]): number | null {
  const price = readShopPrice(modelPrice)
  if (price === null) return null
  let total = exactMultiply(price, 0.25)
  for (const componentPrice of selectedComponentPrices) {
    const component = readShopPrice(componentPrice)
    if (component === null) return null
    total = exactAdd(total, resalePrice(component))
  }
  return total
}

export function shipyardFingerprint(input: {
  action: 'buy' | 'sell' | 'transfer'
  saleModelId?: number
  chassisOnly?: boolean
  shipId?: number
  destinationShipId?: number
  shipName?: string
  componentKeys?: string[]
  sourceKey?: string
  quantity?: number
}): string {
  return JSON.stringify([
    input.action,
    input.saleModelId ?? null,
    input.chassisOnly ?? false,
    input.shipId ?? null,
    input.destinationShipId ?? null,
    input.shipName?.trim() ?? null,
    [...(input.componentKeys ?? [])].sort(),
    input.sourceKey ?? null,
    input.quantity ?? null,
  ])
}
