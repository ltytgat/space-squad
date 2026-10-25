import { exactAdd, readShopPrice, relationId } from './shop'

export type AtelierEquipmentKind = 'arme' | 'armure' | 'vaisseau'
export type AtelierOperation = 'add' | 'dice-count-add' | 'dice-size-step' | 'slot-add'

export type AtelierEffect = {
  cible: string
  operation: AtelierOperation
  valeur: string
}

export type AtelierCompatibility = {
  categorieEquipement?: AtelierEquipmentKind
  sousCategorie?: string | null
  typeArme?: string | null
  classeVaisseau?: string | null
  prix?: number | string | null
  maximum?: number | null
  multiplicateurRachat?: number | null
}

const TARGETS: Record<AtelierEquipmentKind, ReadonlySet<string>> = {
  arme: new Set([
    'nom', 'fabricant', 'categorie', 'type', 'poids', 'prix', 'forceMinimum', 'valeurDegats', 'zoneEffet',
    'projectilesParTir', 'tempsRechargement', 'porteeFixe', 'courtePortee', 'modCourtePortee',
    'moyennePortee', 'modMoyennePortee', 'paliersSniper', 'trancheMalusLonguePortee', 'malusParTranche',
    'tailleChargeur', 'valeurChauffe', 'tempsRefroidissement', 'zoneEffet',
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

function parseDamageExpression(current: unknown): { count: number; size: number; flatBonus: string } {
  if (typeof current !== 'string') throw new Error('Les dés ne peuvent être modifiés qu’avec une expression de dégâts au format kdn±x.')
  const match = current.trim().match(/^(\d+)\s*[dD]\s*(\d+)\s*((?:[+-]\s*\d+))?$/)
  if (!match) throw new Error('Les dés ne peuvent être modifiés qu’avec une expression de dégâts au format kdn±x.')
  const count = Number(match[1])
  const size = Number(match[2])
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(size)) {
    throw new Error('Le nombre ou la taille des dés de dégâts est invalide.')
  }
  return { count, size, flatBonus: (match[3] ?? '').replace(/\s+/g, '') }
}

function addDamageDice(current: unknown, value: string): string {
  const damage = parseDamageExpression(current)
  const increment = finiteValue(value, 'Le nombre de dés à ajouter')
  if (!Number.isSafeInteger(increment) || increment <= 0) {
    throw new Error('Le nombre de dés à ajouter doit être un entier positif.')
  }
  const count = damage.count + increment
  if (!Number.isSafeInteger(count)) throw new Error('Le nombre de dés de dégâts dépasse la limite autorisée.')
  return `${count}d${damage.size}${damage.flatBonus}`
}

function increaseDamageDieSize(current: unknown, value: string): string {
  const damage = parseDamageExpression(current)
  const increment = finiteValue(value, 'L’augmentation de taille du dé')
  if (increment !== 1) throw new Error('L’augmentation de la taille du dé doit valoir 1 rang.')
  const sizeIndex = DAMAGE_DIE_SIZES.indexOf(damage.size as (typeof DAMAGE_DIE_SIZES)[number])
  if (sizeIndex === -1) throw new Error('La taille du dé de dégâts ne figure pas dans la progression Atelier.')
  if (sizeIndex === DAMAGE_DIE_SIZES.length - 1) throw new Error('La taille du dé de dégâts est déjà au maximum (d20).')
  return `${damage.count}d${DAMAGE_DIE_SIZES[sizeIndex + 1]}${damage.flatBonus}`
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
    const current = result[effect.cible]
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
      if (typeof current !== 'number') throw new Error(`La propriété « ${effect.cible} » n’est pas numérique et n’accepte pas un ajout.`)
      result[effect.cible] = exactAdd(current, finiteValue(effect.valeur, 'La valeur ajoutée'))
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
  item: { kind: AtelierEquipmentKind; categorie?: string; type?: string[]; classe?: string },
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
  item: { kind: AtelierEquipmentKind; categorie?: string; type?: string[]; classe?: string },
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
