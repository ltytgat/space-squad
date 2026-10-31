import { exactMultiply, readShopPrice, type ShopPrice } from './shop'
import { isShipAmmunition } from './shipConsumables'
import { CHIP_PURCHASE_PRICES } from './chipShopPrices'

export type GroupShopRule = {
  percentage?: number
  available?: boolean
}

export type GroupShopPolicy = {
  rules: Record<string, GroupShopRule>
}

export type ShopPolicyNode = {
  key: string
  label: string
  children: ShopPolicyNode[]
  referencePrice?: number | string | null
  priceFormat?: 'konis' | 'weapon-factor'
  priceNote?: string
  /** Legacy rule paths retained while the visible hierarchy is simplified. */
  legacyRulePaths?: string[]
  legacyInsertAfterKey?: string
  legacyRuleScopes?: Record<string, string>
}

export type ShopPolicyPaths = string[] & {
  legacyRulePaths?: string[]
  legacyInsertAfterKey?: string
  legacyRuleScopes?: Record<string, string>
}

export type ResolvedShopRule = {
  percentage: number
  available: boolean
}

const segment = (value: unknown) => encodeURIComponent(String(value ?? '').trim() || 'autres')
const itemKey = (collection: string, id: unknown) => `item:${collection}:${String(id)}`
const idOf = (value: any): number | null => {
  const id = Number(value && typeof value === 'object' ? value.id : value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const vehicleClassLabels: Record<string, string> = {
  '1': 'Légers', alpha: 'Légers',
  '2': 'Intermédiaires', beta: 'Intermédiaires',
  '3': 'Poids Lourds', gamma: 'Poids Lourds',
  '4': 'Blindés', delta: 'Blindés',
}

function shopPolicyPathsWithLegacyRules(paths: string[], legacyRulePaths: string[], legacyInsertAfterKey: string, legacyRuleScopes: Record<string, string>): ShopPolicyPaths {
  const result = paths as ShopPolicyPaths
  if (legacyRulePaths.length) {
    Object.defineProperties(result, {
      legacyRulePaths: { value: legacyRulePaths },
      legacyInsertAfterKey: { value: legacyInsertAfterKey },
      legacyRuleScopes: { value: legacyRuleScopes },
    })
  }
  return result
}

/** Add obsolete paths only when resolving a policy; they are omitted from the visible tree. */
export function shopPolicyNodePaths(lineage: string[], node: Pick<ShopPolicyNode, 'legacyRulePaths' | 'legacyInsertAfterKey'>): string[] {
  if (!node.legacyRulePaths?.length || !node.legacyInsertAfterKey) return lineage
  const insertAt = lineage.indexOf(node.legacyInsertAfterKey)
  if (insertAt < 0) return lineage
  return [...lineage.slice(0, insertAt + 1), ...node.legacyRulePaths, ...lineage.slice(insertAt + 1)]
}

/** Legacy rule keys nested below a visible node, used when resetting that section. */
export function legacyShopPolicyRuleKeysInSubtree(nodes: ShopPolicyNode[], key: string): string[] {
  const find = (items: ShopPolicyNode[]): ShopPolicyNode | null => {
    for (const node of items) {
      if (node.key === key) return node
      const found = find(node.children)
      if (found) return found
    }
    return null
  }
  const target = find(nodes)
  if (!target) return []
  const visibleKeys = new Set<string>()
  const keys: string[] = []
  const visit = (node: ShopPolicyNode) => {
    visibleKeys.add(node.key)
    node.children.forEach(visit)
  }
  visit(target)
  const collect = (node: ShopPolicyNode) => {
    for (const legacyKey of node.legacyRulePaths ?? []) {
      const scopeKey = node.legacyRuleScopes?.[legacyKey] ?? node.legacyInsertAfterKey
      if (scopeKey && visibleKeys.has(scopeKey)) keys.push(legacyKey)
    }
    node.children.forEach(collect)
  }
  collect(target)
  return keys
}

/** Obsolete direct-child paths are dropped when their visible parent is changed. */
export function legacyShopPolicyRuleKeysChangedAtNode(nodes: ShopPolicyNode[], key: string): string[] {
  const keys: string[] = []
  const visit = (node: ShopPolicyNode) => {
    for (const legacyKey of node.legacyRulePaths ?? []) {
      const scopeKey = node.legacyRuleScopes?.[legacyKey] ?? node.legacyInsertAfterKey
      if (node.legacyInsertAfterKey === key || scopeKey === key) keys.push(legacyKey)
    }
    node.children.forEach(visit)
  }
  nodes.forEach(visit)
  return keys
}

/** Stable hierarchy paths shared by the manager, catalog pages and transactions. */
export function shopPolicyPaths(collection: string, item: any): ShopPolicyPaths {
  const id = String(item?.id ?? '')
  const leaf = itemKey(collection, id)
  const category = segment(item?.categorie ?? item?.famille ?? item?.typeModule)
  switch (collection) {
    case 'weapons': {
      const root = `sol/armes/${category}`
      const sub = `${root}/${segment(Array.isArray(item?.type) ? item.type[0] : item?.type)}`
      return ['sol', 'sol/armes', root, sub, `${sub}/${leaf}`]
    }
    case 'armors': {
      const root = `sol/armures/${category}`
      const set = item?.set && typeof item.set === 'object' ? idOf(item.set) ?? item.set.nom : idOf(item?.set)
      const sub = `${root}/${segment(set ?? 'hors-set')}`
      return ['sol', 'sol/armures', root, sub, `${sub}/${leaf}`]
    }
    case 'consumables': {
      const root = `sol/consommables/${category}`
      const oldSubcategory = `${root}/${segment(item?.typeMunition ?? item?.taille)}`
      const itemPath = `${root}/${leaf}`
      return shopPolicyPathsWithLegacyRules(
        ['sol', 'sol/consommables', root, itemPath],
        [oldSubcategory, `${oldSubcategory}/${leaf}`],
        root,
        { [oldSubcategory]: root, [`${oldSubcategory}/${leaf}`]: itemPath },
      )
    }
    case 'chips': return ['sol', 'sol/puces', `sol/puces/${category}`, `sol/puces/${category}/${leaf}`]
    case 'mods': {
      const primary = segment(item?.categoriePrincipale)
      const sub = segment(item?.sousCategorieArme ?? item?.sousCategorieArmure)
      const root = `sol/mods/${primary}`
      return ['sol', 'sol/mods', root, `${root}/${sub}`, `${root}/${sub}/${leaf}`]
    }
    case 'ship-weapons': {
      const root = 'espace/armes'
      const typePath = `${root}/${segment(item?.type)}`
      const sub = `${typePath}/${segment(item?.categorie)}`
      const normalizedType = String(item?.type ?? '').trim().toLocaleLowerCase('fr')
      const normalizedCategory = String(item?.categorie ?? '').trim().toLocaleLowerCase('fr')
      if (normalizedType && normalizedCategory === normalizedType) {
        const size = `${typePath}/${segment(item?.taille)}`
        const oldSize = `${sub}/${segment(item?.taille)}`
        const itemPath = `${size}/${leaf}`
        return shopPolicyPathsWithLegacyRules(
          ['espace', root, typePath, size, itemPath],
          [sub, oldSize, `${oldSize}/${leaf}`],
          typePath,
          { [sub]: typePath, [oldSize]: size, [`${oldSize}/${leaf}`]: itemPath },
        )
      }
      const size = `${sub}/${segment(item?.taille)}`
      return ['espace', root, typePath, sub, size, `${size}/${leaf}`]
    }
    case 'ship-modules': {
      const root = 'espace/modules'
      const typePath = `${root}/${segment(item?.typeModule)}`
      const familyPath = `${typePath}/${segment(item?.famille)}`
      const size = `${familyPath}/${segment(item?.taille)}`
      return ['espace', root, typePath, familyPath, size, `${size}/${leaf}`]
    }
    case 'ship-consumables': {
      const root = 'espace/consommables'
      const name = String(item?.nom ?? '').trim()
      const firstWord = name.split(/\s+/)[0] ?? ''
      const displayWord = firstWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      const groupKey = displayWord.toLocaleLowerCase('fr') || 'autres'
      const isAmmunition = isShipAmmunition(item)
      const group = `${root}/${isAmmunition ? 'munitions' : segment(groupKey)}`
      const subcategory = (name.length > 1 ? name.slice(0, -1).trim() : name).toLocaleLowerCase('fr')
      const sub = isAmmunition ? `${group}/${segment(subcategory)}` : group
      return ['espace', root, group, ...(sub === group ? [] : [sub]), `${sub}/${leaf}`]
    }
    case 'vehicle-sale-models': {
      const variant = item?.variante && typeof item.variante === 'object' ? item.variante : {}
      const classKey = segment(variant.classe)
      const root = `garage/${classKey}`
      const variantKey = segment(idOf(item?.variante) ?? variant.nom ?? 'autres')
      return ['garage', root, `${root}/${variantKey}`, `${root}/${variantKey}/${leaf}`]
    }
    case 'ship-sale-models': {
      const chassis = item?.chassis && typeof item.chassis === 'object' ? item.chassis : {}
      const root = `chantier-naval/${segment(chassis.classe)}`
      const categoryPath = `${root}/${segment(chassis.categorie)}`
      return ['chantier-naval', root, categoryPath, `${categoryPath}/${leaf}`]
    }
    case 'atelier-modifications': {
      const kind = segment(item?.compatibilityKind ?? 'modifications')
      const root = `atelier/${kind}`
      return ['atelier', root, `${root}/${leaf}`]
    }
    default: return [collection, `${collection}/${leaf}`]
  }
}

export function resolveShopPolicy(policy: unknown, paths: string[]): ResolvedShopRule {
  const rules = policy && typeof policy === 'object' && 'rules' in policy && (policy as any).rules && typeof (policy as any).rules === 'object'
    ? (policy as GroupShopPolicy).rules
    : {}
  let percentage = 0
  let available = true
  const pathMetadata = paths as ShopPolicyPaths
  const effectivePaths = shopPolicyNodePaths(paths, {
    legacyRulePaths: pathMetadata.legacyRulePaths,
    legacyInsertAfterKey: pathMetadata.legacyInsertAfterKey,
  })
  for (const key of effectivePaths) {
    const rule = rules[key]
    if (!rule || typeof rule !== 'object') continue
    if (typeof rule.percentage === 'number' && Number.isSafeInteger(rule.percentage) && rule.percentage >= -100) percentage = rule.percentage
    if (typeof rule.available === 'boolean') available = rule.available
  }
  return { percentage, available }
}

export function adjustedShopPrice(price: ShopPrice, percentage: number): number | null {
  const parsed = readShopPrice(price)
  if (parsed === null) return null
  if (!Number.isSafeInteger(percentage) || percentage < -100) throw new Error('Pourcentage de boutique invalide.')
  return exactMultiply(parsed, (100 + percentage) / 100)
}

export function shopPolicyTreeFromCatalogs(catalogs: Record<string, any[]>): ShopPolicyNode[] {
  const roots = new Map<string, ShopPolicyNode>()
  const nodes = new Map<string, ShopPolicyNode>()
  const ensure = (key: string, label: string, parent: ShopPolicyNode | null, pricing: Partial<Pick<ShopPolicyNode, 'referencePrice' | 'priceFormat' | 'priceNote' | 'legacyRulePaths' | 'legacyInsertAfterKey' | 'legacyRuleScopes'>> = {}) => {
    const existing = nodes.get(key)
    if (existing) return existing
    const node: ShopPolicyNode = { key, label, children: [], ...pricing }
    nodes.set(key, node)
    if (parent) parent.children.push(node)
    else roots.set(key, node)
    return node
  }
  const labels: Record<string, string> = {
    sol: 'Sol', espace: 'Espace', garage: 'Garage', 'chantier-naval': 'Chantier naval', atelier: 'Atelier',
    armes: 'Armes', armures: 'Armures', consommables: 'Consommables', puces: 'Puces', mods: 'Mods',
    modules: 'Modules', modifications: 'Modifications', munitions: 'Munitions',
  }
  const shipCategoriesByType = new Map<string, Set<string>>()
  for (const weapon of catalogs['ship-weapons'] ?? []) {
    const typeKey = segment(weapon?.type)
    const categories = shipCategoriesByType.get(typeKey) ?? new Set<string>()
    categories.add(segment(weapon?.categorie))
    shipCategoriesByType.set(typeKey, categories)
  }
  const singleCategoryTypes = new Set([...shipCategoriesByType.entries()]
    .filter(([, categories]) => categories.size === 1)
    .map(([typeKey]) => typeKey))

  for (const [collection, docs] of Object.entries(catalogs)) {
    for (const doc of docs) {
      let paths = shopPolicyPaths(collection, doc)
      if (collection === 'ship-weapons' && paths.length === 6 && singleCategoryTypes.has(segment(doc?.type))) {
        const hiddenCategoryPath = paths[3]!
        const typePath = paths[2]!
        paths = shopPolicyPathsWithLegacyRules(
          [...paths.slice(0, 3), ...paths.slice(4)],
          [...(paths.legacyRulePaths ?? []), hiddenCategoryPath],
          typePath,
          { ...(paths.legacyRuleScopes ?? {}), [hiddenCategoryPath]: typePath },
        )
      }
      const preciseItemKey = paths.at(-1)
      let referencePrice: number | string | null = doc.prix ?? null
      let priceFormat: ShopPolicyNode['priceFormat'] = 'konis'
      let priceNote: string | undefined
      if (collection === 'chips') {
        referencePrice = CHIP_PURCHASE_PRICES[doc.categorie as keyof typeof CHIP_PURCHASE_PRICES]
      } else if (collection === 'mods' && doc.categoriePrincipale === 'armes') {
        priceFormat = 'weapon-factor'
      } else if (collection === 'atelier-modifications') {
        const compatibility = doc.atelierCompatibility
        referencePrice = compatibility?.prix ?? null
        const multiplier = Number(compatibility?.multiplicateurRachat ?? 1)
        priceNote = Number.isSafeInteger(multiplier) && multiplier > 1
          ? `Premier achat ; les suivants augmentent ×${multiplier}`
          : 'Prix du premier achat'
      } else if (collection === 'ship-sale-models') {
        priceNote = 'Modèle complet'
      }
      let parent: ShopPolicyNode | null = null
      for (const [pathIndex, key] of paths.entries()) {
        const last = decodeURIComponent(key.split('/').at(-1) ?? key)
        let categoryLabel: string | null = null
        if (collection === 'ship-consumables' && key.startsWith('espace/consommables/')) {
          const depth = key.split('/').length
          const name = String(doc.nom ?? '').trim()
          if (depth === 3 && !isShipAmmunition(doc)) {
            const firstWord = name.split(/\s+/)[0] ?? ''
            categoryLabel = firstWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || 'Objets'
          } else if (depth === 4 && isShipAmmunition(doc)) {
            categoryLabel = name.length > 1 ? name.slice(0, -1).trim() : name
          }
        } else if (collection === 'armors' && pathIndex === 3) {
          const set = doc.set && typeof doc.set === 'object' ? doc.set : null
          categoryLabel = set?.nom ? String(set.nom) : doc.set == null ? 'Hors set' : 'Set inconnu'
        } else if (collection === 'vehicle-sale-models' && pathIndex === 1) {
          const variant = doc.variante && typeof doc.variante === 'object' ? doc.variante : {}
          const classValue = String(variant.classe ?? '').trim().toLocaleLowerCase('fr')
          categoryLabel = vehicleClassLabels[classValue] ?? (classValue || 'Autres véhicules')
        } else if (collection === 'vehicle-sale-models' && pathIndex === 2) {
          const variant = doc.variante && typeof doc.variante === 'object' ? doc.variante : {}
          categoryLabel = variant.nom ? String(variant.nom) : 'Autres véhicules'
        }
        const label = key.startsWith('item:') || last.startsWith('item:')
          ? String(doc.nom ?? `Élément ${doc.id}`)
          : categoryLabel ?? labels[last] ?? last.replaceAll('-', ' ')
        parent = ensure(key, label, parent, key === preciseItemKey ? {
          referencePrice,
          priceFormat,
          priceNote,
          legacyRulePaths: paths.legacyRulePaths,
          legacyInsertAfterKey: paths.legacyInsertAfterKey,
          legacyRuleScopes: paths.legacyRuleScopes,
        } : {})
      }
    }
  }
  const sort = (nodes: ShopPolicyNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    nodes.forEach((node) => sort(node.children))
  }
  const result = [...roots.values()]
  sort(result)
  return result
}

/** Counts leaf items whose effective price or availability differs from the catalog. */
export function summarizeShopPolicyImpacts(tree: ShopPolicyNode[], policy: unknown): Map<string, number> {
  const counts = new Map<string, number>()
  const visit = (nodes: ShopPolicyNode[], ancestors: string[]): number => nodes.reduce((total, node) => {
    const lineage = [...ancestors, node.key]
    let count: number
    if (node.priceFormat !== undefined) {
      const effective = resolveShopPolicy(policy, shopPolicyNodePaths(lineage, node))
      const referencePrice = readShopPrice(node.referencePrice)
      const adjustedPrice = adjustedShopPrice(node.referencePrice, effective.percentage)
      count = !effective.available || (referencePrice !== null && adjustedPrice !== null && referencePrice !== adjustedPrice) ? 1 : 0
    } else {
      count = visit(node.children, lineage)
    }
    counts.set(node.key, count)
    return total + count
  }, 0)
  visit(tree, [])
  return counts
}

export async function loadShopPolicyCatalogs(payload: any): Promise<Record<string, any[]>> {
  const collections = ['weapons', 'armors', 'consumables', 'mods', 'chips', 'ship-weapons', 'ship-modules', 'ship-consumables', 'vehicle-sale-models', 'ship-sale-models']
  const results = await Promise.all(collections.map((collection) => payload.find({
    collection,
    ...(collection === 'ship-sale-models' ? { where: { atelierPrive: { equals: false } } } : {}),
    depth: collection === 'armors' ? 1 : collection === 'vehicle-sale-models' ? 2 : collection === 'ship-sale-models' ? 4 : 0,
    limit: 1000,
    sort: 'nom',
    overrideAccess: true,
  })))
  const catalogs = Object.fromEntries(collections.map((collection, index) => [collection, results[index].docs as any[]])) as Record<string, any[]>
  const { docs: atelierDocs } = await payload.find({ collection: 'atelier-modifications', where: { active: { equals: true } }, depth: 0, limit: 1000, sort: 'nom', overrideAccess: true })
  catalogs['atelier-modifications'] = (atelierDocs as any[]).flatMap((doc) => {
    const kinds = [...new Set((doc.compatibilites ?? []).map((compatibility: any) => compatibility.categorieEquipement))]
    return kinds.map((compatibilityKind) => ({
      ...doc,
      compatibilityKind,
      atelierCompatibility: (doc.compatibilites ?? []).find((compatibility: any) => compatibility.categorieEquipement === compatibilityKind),
    }))
  })
  return catalogs
}

export async function getShopPolicyForGroup(payload: any, groupId: unknown): Promise<GroupShopPolicy> {
  const id = idOf(groupId)
  if (!id) return { rules: {} }
  const group = await payload.findByID({ collection: 'groups', id, depth: 0, overrideAccess: true }).catch(() => null) as any
  const policy = group?.shopPolicy
  return policy && typeof policy === 'object' && policy.rules && typeof policy.rules === 'object' ? policy : { rules: {} }
}

export async function getShopPolicyForCharacter(payload: any, character: any): Promise<GroupShopPolicy> {
  return getShopPolicyForGroup(payload, character?.groupe)
}
