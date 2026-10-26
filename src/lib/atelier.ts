import { exactAdd, exactMultiply, readShopPrice, relationId } from './shop'
import { weaponMinimumRank } from './factionRewards'

export type AtelierEquipmentKind = 'arme' | 'armure' | 'vaisseau'
export type AtelierOperation = 'add' | 'dice-count-add' | 'dice-size-step' | 'slot-add'

export type AtelierEffect = {
  cible: string
  operation: AtelierOperation
  valeur: string
}

export type AtelierPurchase = {
  modificationId: number
  quantity: number
}

export type AtelierCompatibility = {
  categorieEquipement?: AtelierEquipmentKind
  sousCategorie?: string | null
  typeArme?: string | null
  classeVaisseau?: string | null
  prix?: number | string | null
  points?: number | null
  maximum?: number | null
  multiplicateurRachat?: number | null
}

const TARGETS: Record<AtelierEquipmentKind, ReadonlySet<string>> = {
  arme: new Set([
    'nom', 'fabricant', 'categorie', 'type', 'poids', 'prix', 'forceMinimum', 'valeurDegats', 'zoneEffet',
    'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee',
    'moyennePortee', 'modMoyennePortee', 'paliersSniper', 'trancheMalusLonguePortee', 'malusParTranche',
    'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'weaponHeatSegment', 'zoneEffet',
  ]),
  armure: new Set([
    'nom', 'categorie', 'valeurArmurePhysique', 'valeurBouclier', 'valeurRupture', 'poids',
    'modificateur', 'rang', 'prix', 'stockage', 'set', 'image',
  ]),
  vaisseau: new Set([
    'nom', 'classe', 'categorie', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles',
    'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase', 'image',
  ]),
}

const SHIP_INCREASE_ONLY = new Set([
  'tourelles', 'pointsEmportPilote', 'blindage', 'consommables', 'esquiveBase',
])

const DAMAGE_DIE_SIZES = [2, 3, 4, 6, 8, 10, 12, 15, 18, 20] as const

function finiteValue(value: string, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} doit être un nombre valide.`)
  return parsed
}

function parseDamageExpression(current: unknown): { count: number; size: number; flatBonus: string; suffix: string } {
  if (typeof current !== 'string') throw new Error('Les dés ne peuvent être modifiés qu’avec une expression kdn±x, avec suffixe sniper optionnel (*).')
  const match = current.trim().match(/^(\d+)\s*[dD]\s*(\d+)\s*((?:[+-]\s*\d+))?([*!]*)$/)
  if (!match) throw new Error('Les dés ne peuvent être modifiés qu’avec une expression kdn±x, avec suffixe sniper optionnel (*).')
  const count = Number(match[1])
  const size = Number(match[2])
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(size)) {
    throw new Error('Le nombre ou la taille des dés de dégâts est invalide.')
  }
  return { count, size, flatBonus: (match[3] ?? '').replace(/\s+/g, ''), suffix: match[4] ?? '' }
}

function addDamageDice(current: unknown, value: string): string {
  const damage = parseDamageExpression(current)
  const increment = finiteValue(value, 'Le nombre de dés à ajouter')
  if (!Number.isSafeInteger(increment) || increment <= 0) {
    throw new Error('Le nombre de dés à ajouter doit être un entier positif.')
  }
  const count = damage.count + increment
  if (!Number.isSafeInteger(count)) throw new Error('Le nombre de dés de dégâts dépasse la limite autorisée.')
  return `${count}d${damage.size}${damage.flatBonus}${damage.suffix}`
}

function increaseDamageDieSize(current: unknown, value: string): string {
  const damage = parseDamageExpression(current)
  const increment = finiteValue(value, 'L’augmentation de taille du dé')
  if (increment !== 1) throw new Error('L’augmentation de la taille du dé doit valoir 1 rang.')
  const sizeIndex = DAMAGE_DIE_SIZES.indexOf(damage.size as (typeof DAMAGE_DIE_SIZES)[number])
  if (sizeIndex === -1) throw new Error('La taille du dé de dégâts ne figure pas dans la progression Atelier.')
  if (sizeIndex === DAMAGE_DIE_SIZES.length - 1) throw new Error('La taille du dé de dégâts est déjà au maximum (d20).')
  return `${damage.count}d${DAMAGE_DIE_SIZES[sizeIndex + 1]}${damage.flatBonus}${damage.suffix}`
}

function addEncodedSlots(current: unknown, value: string, increaseOnly: boolean): string {
  if (typeof current !== 'string' || !/^\d+(?:\+\d+)*$/.test(current)) {
    throw new Error('La propriété d’emplacements doit utiliser le format nombre+nombre.')
  }
  const slots = current.split('+').map(Number)
  let increments: number[]
  try {
    const parsed = JSON.parse(value)
    increments = Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)]
  } catch {
    increments = [finiteValue(value, 'L’augmentation des emplacements')]
  }
  if (!increments.length || increments.some((increment) => !Number.isInteger(increment) || !Number.isFinite(increment))) {
    throw new Error('L’augmentation des emplacements doit être un entier ou une liste d’entiers.')
  }
  if (increaseOnly && increments.some((increment) => increment < 0)) throw new Error('Une modification de châssis ne peut pas diminuer les emplacements.')
  if (increments.length > slots.length) throw new Error('La liste d’augmentations dépasse le nombre d’emplacements existants.')
  return slots.map((slot, index) => slot + (increments[index] ?? 0)).join('+')
}

export function applyAtelierEffects<T extends Record<string, any>>(
  properties: T,
  effects: AtelierEffect[],
  kind: AtelierEquipmentKind,
): T {
  const result: Record<string, any> = { ...properties }
  for (const effect of effects) {
    if (!TARGETS[kind].has(effect.cible)) throw new Error(`La propriété « ${effect.cible} » ne peut pas être personnalisée sur cet équipement.`)
    if (!['add', 'dice-count-add', 'dice-size-step', 'slot-add'].includes(effect.operation)) throw new Error('Opération Atelier inconnue.')
    const current = result[effect.cible] ?? (kind === 'arme' && effect.cible === 'weaponHeatSegment' ? 100 : undefined)
    if (kind === 'vaisseau') {
      if (effect.operation === 'dice-count-add' || effect.operation === 'dice-size-step') {
        throw new Error('Les propriétés d’un châssis Atelier ne peuvent être qu’augmentées.')
      }
      if (SHIP_INCREASE_ONLY.has(effect.cible) && finiteValue(effect.valeur, 'La valeur Atelier') < 0) {
        throw new Error('Une modification de châssis ne peut pas diminuer cette propriété.')
      }
    }

    if (effect.operation === 'slot-add') {
      if (!['modulesSupplementaires', 'pointsEmportTourelles'].includes(effect.cible)) throw new Error('Cette propriété ne représente pas des emplacements codés.')
      result[effect.cible] = addEncodedSlots(current, effect.valeur, kind === 'vaisseau')
    } else if (effect.operation === 'add') {
      const increment = finiteValue(effect.valeur, 'La valeur ajoutée')
      if (kind === 'arme' && effect.cible === 'paliersSniper' && Array.isArray(current)) {
        const nextStages = current.map((stage: any) => ({
          ...stage,
          distanceMax: exactAdd(Number(stage.distanceMax), increment),
        }))
        if (nextStages.some((stage: any) => !Number.isFinite(stage.distanceMax) || stage.distanceMax < 1)) {
          throw new Error('La portée d’une arme ne peut pas être inférieure à 1 mètre.')
        }
        result[effect.cible] = nextStages
        continue
      }
      if (typeof current !== 'number') throw new Error(`La propriété « ${effect.cible} » n’est pas numérique et n’accepte pas un ajout.`)
      const nextValue = exactAdd(current, increment)
      if (kind === 'arme' && ['porteeFixe', 'courtePortee', 'moyennePortee'].includes(effect.cible) && nextValue < 1) throw new Error('La portée d’une arme ne peut pas être inférieure à 1 mètre.')
      if (kind === 'arme' && effect.cible === 'weaponHeatSegment' && nextValue < 1) throw new Error('Un segment de chauffe invalide.')
      result[effect.cible] = nextValue
    } else if (effect.operation === 'dice-count-add' || effect.operation === 'dice-size-step') {
      if (kind !== 'arme' || effect.cible !== 'valeurDegats') throw new Error('Les opérations sur les dés sont réservées aux dégâts des armes.')
      result[effect.cible] = effect.operation === 'dice-count-add'
        ? addDamageDice(current, effect.valeur)
        : increaseDamageDieSize(current, effect.valeur)
    } else {
      throw new Error('Opération Atelier inconnue.')
    }
  }

  if (kind === 'vaisseau') {
    for (const key of SHIP_INCREASE_ONLY) {
      if (typeof properties[key] === 'number' && typeof result[key] === 'number' && result[key] < properties[key]) {
        throw new Error(`La propriété « ${key} » ne peut pas diminuer sur un châssis Atelier.`)
      }
    }
  }
  return result as T
}

export function findAtelierCompatibility(
  modification: { compatibilites?: AtelierCompatibility[]; active?: boolean },
  item: { kind: AtelierEquipmentKind; categorie?: string | null; type?: string[]; classe?: string | null },
): AtelierCompatibility | null {
  if (modification.active === false) return null
  return (modification.compatibilites ?? []).find((compatibility) => {
    if (compatibility.categorieEquipement !== item.kind) return false
    if (item.kind === 'arme') {
      return compatibility.sousCategorie === item.categorie &&
        (compatibility.typeArme === 'thermique' || compatibility.typeArme === 'cinetique') &&
        item.type?.includes(compatibility.typeArme) === true
    }
    if (item.kind === 'armure') return compatibility.sousCategorie === item.categorie
    return compatibility.classeVaisseau === item.classe
  }) ?? null
}

export function atelierModificationMatches(
  modification: { compatibilites?: AtelierCompatibility[]; active?: boolean },
  item: { kind: AtelierEquipmentKind; categorie?: string | null; type?: string[]; classe?: string | null },
): boolean {
  return findAtelierCompatibility(modification, item) !== null
}

export function hasDuplicateAtelierCompatibilities(compatibilities: AtelierCompatibility[]): boolean {
  const keys = new Set<string>()
  for (const compatibility of compatibilities) {
    let key: (string | null | undefined)[] | null = null
    if (compatibility.categorieEquipement === 'arme') key = ['arme', compatibility.sousCategorie, compatibility.typeArme]
    else if (compatibility.categorieEquipement === 'armure') key = ['armure', compatibility.sousCategorie]
    else if (compatibility.categorieEquipement === 'vaisseau') key = ['vaisseau', compatibility.classeVaisseau]
    if (!key || key.some((part) => typeof part !== 'string' || !part)) continue
    const serialized = JSON.stringify(key)
    if (keys.has(serialized)) return true
    keys.add(serialized)
  }
  return false
}

export function snapshotWeapon(weapon: Record<string, any>): Record<string, any> {
  const { id, createdAt, updatedAt, mods, image, ...rest } = weapon
  return { ...rest, ...(relationId(image) ? { image: Number(relationId(image)) } : {}) }
}

export function snapshotArmor(armor: Record<string, any>): Record<string, any> {
  const { id, createdAt, updatedAt, mods, set, image, ...rest } = armor
  return {
    ...rest,
    ...(relationId(set) ? { set: Number(relationId(set)) } : {}),
    ...(relationId(image) ? { image: Number(relationId(image)) } : {}),
  }
}

export function atelierCost(basePrice: unknown, modificationPrices: unknown[]): number {
  const base = readShopPrice(basePrice as number | string | null | undefined)
  if (base === null) throw new Error('Le modèle source doit avoir un prix valide pour être personnalisé.')
  return modificationPrices.reduce<number>((total, value) => {
    const price = readShopPrice(value as number | string | null | undefined)
    if (price === null) throw new Error('Une modification Atelier a un prix invalide.')
    return exactAdd(total, price)
  }, base)
}

export function atelierPointsForPersonalItem(
  kind: 'arme' | 'armure',
  item: { nom?: unknown; categorie?: unknown; type?: unknown; rang?: unknown; set?: unknown },
): number | null {
  let rank: number | null = null
  if (kind === 'arme') {
    const types = Array.isArray(item.type) ? item.type : []
    const supportedType = types.length > 0 && types.every((type) => type === 'thermique' || type === 'cinetique')
    if (item.categorie === 'lourde' || !supportedType || !/\balliance\b/i.test(String(item.nom ?? ''))) return null
    rank = weaponMinimumRank(item.nom)
  } else {
    const set = item.set && typeof item.set === 'object' ? item.set as { nom?: unknown } : null
    if (!String(set?.nom ?? '').toLocaleLowerCase('fr').includes('starlancer')) return null
    const parsed = Number(item.rang)
    rank = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return rank === null ? null : rank * 10
}

export function atelierPointsForShip(shipClass: unknown): number | null {
  const points: Record<string, number> = { alpha: 100, beta: 200, gamma: 300, delta: 400 }
  return typeof shipClass === 'string' ? points[shipClass] ?? null : null
}

export function atelierPurchasePrice(compatibility: AtelierCompatibility, quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > Number(compatibility.maximum)) {
    throw new Error('La quantité de modifications dépasse la limite autorisée.')
  }
  const basePrice = readShopPrice(compatibility.prix)
  if (basePrice === null) throw new Error('Une modification Atelier a un prix invalide.')
  const multiplier = compatibility.multiplicateurRachat == null ? 1 : Number(compatibility.multiplicateurRachat)
  if (!Number.isSafeInteger(multiplier) || multiplier < 1) throw new Error('Le multiplicateur de rachat doit être un entier positif.')
  let unitPrice = basePrice
  let total = 0
  for (let purchase = 0; purchase < quantity; purchase += 1) {
    total = exactAdd(total, unitPrice)
    if (!Number.isFinite(total)) throw new Error('Le prix de cette configuration dépasse la limite autorisée.')
    if (purchase + 1 < quantity) unitPrice = exactMultiply(unitPrice, multiplier)
    if (!Number.isFinite(unitPrice)) throw new Error('Le prix de cette configuration dépasse la limite autorisée.')
  }
  return total
}

export function atelierNextPurchasePrice(compatibility: AtelierCompatibility, quantityAlreadyPurchased: number): number {
  if (!Number.isSafeInteger(quantityAlreadyPurchased) || quantityAlreadyPurchased < 0) {
    throw new Error('La quantité de modifications déjà achetées est invalide.')
  }
  const basePrice = readShopPrice(compatibility.prix)
  if (basePrice === null) throw new Error('Une modification Atelier a un prix invalide.')
  const multiplier = compatibility.multiplicateurRachat == null ? 1 : Number(compatibility.multiplicateurRachat)
  if (!Number.isSafeInteger(multiplier) || multiplier < 1) throw new Error('Le multiplicateur de rachat doit être un entier positif.')
  let nextPrice = basePrice
  for (let purchase = 0; purchase < quantityAlreadyPurchased; purchase += 1) {
    nextPrice = exactMultiply(nextPrice, multiplier)
    if (!Number.isFinite(nextPrice)) throw new Error('Le prix de cette configuration dépasse la limite autorisée.')
  }
  return nextPrice
}

export function atelierModificationPoints(compatibility: AtelierCompatibility, quantity: number): number {
  if (compatibility.points === null || compatibility.points === undefined) {
    throw new Error('Le coût en points de cette modification est invalide.')
  }
  const perPurchase = Number(compatibility.points)
  if (!Number.isSafeInteger(perPurchase) || perPurchase < 0 || !Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('Le coût en points de cette modification est invalide.')
  }
  const total = perPurchase * quantity
  if (!Number.isSafeInteger(total)) throw new Error('Le total des points de modification dépasse la limite autorisée.')
  return total
}

export function atelierRelationId(value: unknown): number | null {
  const id = relationId(value)
  return id && /^\d+$/.test(id) ? Number(id) : null
}

export function reconcileCustomEquipmentInventory(
  inventory: unknown[],
  currentlyEquippedIds: unknown[],
  nextEquippedIds: unknown[],
): number[] {
  const nextEquipped = new Set(nextEquippedIds.map(atelierRelationId).filter((id): id is number => id !== null))
  const result = [...new Set(inventory.map(atelierRelationId).filter((id): id is number => id !== null))]
    .filter((id) => !nextEquipped.has(id))
  for (const id of currentlyEquippedIds.map(atelierRelationId)) {
    if (id !== null && !nextEquipped.has(id) && !result.includes(id)) result.push(id)
  }
  return result
}
