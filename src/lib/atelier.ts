import { exactAdd, exactMultiply, readShopPrice, relationId } from './shop'

export type AtelierEquipmentKind = 'arme' | 'armure' | 'vaisseau'
export type AtelierOperation = 'percent' | 'add' | 'replace' | 'dice-bonus' | 'slot-add'

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

function finiteValue(value: string, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} doit être un nombre valide.`)
  return parsed
}

function replacementValue(value: string, current: unknown): unknown {
  if (typeof current === 'number') return finiteValue(value, 'La valeur de remplacement')
  if (typeof current === 'boolean') {
    if (value !== 'true' && value !== 'false') throw new Error('La valeur de remplacement doit être true ou false.')
    return value === 'true'
  }
  if (Array.isArray(current) || (current !== null && typeof current === 'object')) {
    try { return JSON.parse(value) } catch { throw new Error('La valeur de remplacement structurée doit être du JSON valide.') }
  }
  return value
}

function diceBonus(current: unknown, value: string): string {
  if (typeof current !== 'string' || !/^\s*\d+[dD]\d+(?:\s*[+-]\s*\d+)?\s*$/.test(current)) {
    throw new Error('Le bonus de dés ne peut être appliqué qu’à une expression de dégâts au format NdN±N.')
  }
  const bonus = finiteValue(value, 'Le bonus aux dégâts')
  if (!Number.isInteger(bonus)) throw new Error('Le bonus aux dégâts doit être un entier.')
  if (bonus === 0) return current.trim()
  return `${current.trim()}${bonus > 0 ? '+' : ''}${bonus}`
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
    if (!['percent', 'add', 'replace', 'dice-bonus', 'slot-add'].includes(effect.operation)) throw new Error('Opération Atelier inconnue.')
    const current = result[effect.cible]
    if (kind === 'vaisseau') {
      if (effect.operation === 'replace' || effect.operation === 'dice-bonus') {
        throw new Error('Les propriétés d’un châssis Atelier ne peuvent être qu’augmentées.')
      }
      if (SHIP_INCREASE_ONLY.has(effect.cible) && finiteValue(effect.valeur, 'La valeur Atelier') < 0) {
        throw new Error('Une modification de châssis ne peut pas diminuer cette propriété.')
      }
      if (!SHIP_INCREASE_ONLY.has(effect.cible) && effect.operation === 'percent') {
        throw new Error('Cette propriété du châssis n’accepte pas de pourcentage.')
      }
    }

    if (effect.operation === 'slot-add') {
      if (!['modulesSupplementaires', 'pointsEmportTourelles'].includes(effect.cible)) throw new Error('Cette propriété ne représente pas des emplacements codés.')
      result[effect.cible] = addEncodedSlots(current, effect.valeur, kind === 'vaisseau')
    } else if (effect.operation === 'percent') {
      if (typeof current !== 'number') throw new Error(`La propriété « ${effect.cible} » n’est pas numérique et n’accepte pas un pourcentage.`)
      result[effect.cible] = exactMultiply(current, 1 + finiteValue(effect.valeur, 'Le pourcentage') / 100)
    } else if (effect.operation === 'add') {
      if (typeof current !== 'number') throw new Error(`La propriété « ${effect.cible} » n’est pas numérique et n’accepte pas un ajout.`)
      result[effect.cible] = exactAdd(current, finiteValue(effect.valeur, 'La valeur ajoutée'))
    } else if (effect.operation === 'dice-bonus') {
      if (kind !== 'arme' || effect.cible !== 'valeurDegats') throw new Error('Le bonus de dés est réservé aux dégâts des armes.')
      result[effect.cible] = diceBonus(current, effect.valeur)
    } else {
      result[effect.cible] = replacementValue(effect.valeur, current)
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

export function atelierModificationMatches(
  modification: { compatibilites?: AtelierCompatibility[]; active?: boolean },
  item: { kind: AtelierEquipmentKind; categorie?: string; type?: string[]; classe?: string },
): boolean {
  if (modification.active === false) return false
  return (modification.compatibilites ?? []).some((compatibility) => {
    if (compatibility.categorieEquipement !== item.kind) return false
    if (item.kind === 'arme') {
      return compatibility.sousCategorie === item.categorie &&
        (compatibility.typeArme === 'thermique' || compatibility.typeArme === 'cinetique') &&
        item.type?.includes(compatibility.typeArme) === true
    }
    if (item.kind === 'armure') return compatibility.sousCategorie === item.categorie
    return compatibility.classeVaisseau === item.classe
  })
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
