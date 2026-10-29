import { exactAdd, exactMultiply, readShopPrice, relationId } from './shop'
import { weaponMinimumRank } from './factionRewards'

export type AtelierEquipmentKind = 'arme' | 'armure' | 'vaisseau'
export type AtelierOperation = 'add' | 'dice-count-add' | 'dice-size-step' | 'slot-add'

export type AtelierEffect = {
  cible: string
  operation: AtelierOperation
  valeur: string
  turretIndex?: number
}

export type AtelierPurchase = {
  modificationId: number
  quantity: number
  turretAssignments?: (number | null)[]
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
    'modificateur', 'caracteristiqueBonus', 'mods', 'rang', 'prix', 'stockage', 'set', 'image',
  ]),
  vaisseau: new Set([
    'nom', 'classe', 'categorie', 'tourelles', 'pointsEmportPilote', 'pointsEmportTourelles',
    'blindage', 'modulesSupplementaires', 'consommables', 'esquiveBase', 'image', 'specializationCombat',
    'specializationExploration', 'specializationTransport',
  ]),
}

const SHIP_INCREASE_ONLY = new Set([
  'tourelles', 'pointsEmportPilote', 'blindage', 'consommables', 'esquiveBase',
])

const DAMAGE_DIE_SIZES = [2, 3, 4, 6, 8, 10, 12, 15, 18, 20] as const
const SHIP_SPECIALIZATIONS: Record<string, string> = {
  specializationCombat: 'combat',
  specializationExploration: 'exploration',
  specializationTransport: 'transport',
}

export function atelierCustomChassisName(sourceName: unknown): string {
  const name = String(sourceName ?? '').trim()
  if (!name) throw new Error('Le châssis source doit avoir un nom.')
  return `${name} - Custom`
}

export function atelierSpecializationTagForTarget(target: string): string | null {
  return SHIP_SPECIALIZATIONS[target] ?? null
}

export function atelierShipSpecializationTags(properties: Record<string, unknown>): string[] {
  const tags = new Set<string>()
  const valid = new Set(Object.values(SHIP_SPECIALIZATIONS))
  for (const value of Array.isArray(properties.specialisations) ? properties.specialisations : []) {
    const tag = String(value).toLocaleLowerCase('fr')
    if (valid.has(tag)) tags.add(tag)
  }
  const category = String(properties.categorie ?? '').toLocaleLowerCase('fr')
  if (valid.has(category)) tags.add(category)
  return ['combat', 'exploration', 'transport'].filter((tag) => tags.has(tag))
}

export function atelierTurretCapacities(value: unknown, turretCount: number): number[] {
  if (!Number.isSafeInteger(turretCount) || turretCount < 0) throw new Error('Le nombre de tourelles du châssis est invalide.')
  let slots: number[]
  if (value === null || value === undefined || value === '') slots = []
  else if (typeof value === 'string' && /^\d+(?:\+\d+)*$/.test(value)) slots = value.split('+').map(Number)
  else throw new Error('Les points d’emport des tourelles doivent utiliser le format nombre+nombre.')
  if (slots.some((slot) => !Number.isSafeInteger(slot))) throw new Error('Chaque point d’emport de tourelle doit être un entier valide.')
  if (slots.length > turretCount) throw new Error('Le nombre de valeurs de points d’emport dépasse celui des tourelles.')
  while (slots.length < turretCount) slots.push(0)
  return slots
}

export function atelierTurretPointIncrease(effects: AtelierEffect[]): number {
  return effects.filter((effect) => effect.cible === 'pointsEmportTourelles').reduce((total, effect) => {
    const value = Number(effect.valeur)
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('Les points d’emport ajoutés doivent être un entier positif.')
    const nextTotal = total + value
    if (!Number.isSafeInteger(nextTotal)) throw new Error('Le nombre de points d’emport ajoutés dépasse la limite autorisée.')
    return nextTotal
  }, 0)
}

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

export function atelierOptionalModuleSlotIncrease(value: unknown): number | null {
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value.trim())
    } catch {
      parsed = value.trim()
    }
  }

  if (typeof parsed === 'string' && /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+]?[\d]+)?$/.test(parsed.trim())) {
    parsed = Number(parsed)
  }
  return typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function parseOptionalModuleSlots(current: unknown): number[] | null {
  if (current === null || current === undefined) return []

  const parseSlotValue = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null
    if (typeof value === 'string' && /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+]?[\d]+)?$/.test(value.trim())) {
      const parsed = Number(value.trim())
      return Number.isSafeInteger(parsed) ? parsed : null
    }
    return null
  }
  const parseJsonSlots = (value: unknown): number[] | null => {
    if (Array.isArray(value)) {
      const slots = value.map(parseSlotValue)
      return slots.every((slot): slot is number => slot !== null) ? slots : null
    }
    const slot = parseSlotValue(value)
    return slot === null ? null : [slot]
  }

  if (typeof current === 'number' || Array.isArray(current)) return parseJsonSlots(current)
  if (typeof current !== 'string') return null

  const normalizedValue = current.trim()
  if (!normalizedValue) return []
  if (/^\d+(?:\s*\+\s*\d+)*$/.test(normalizedValue)) return normalizedValue.split(/\s*\+\s*/).map(Number)
  const scalarSlot = parseSlotValue(normalizedValue)
  if (scalarSlot !== null) return [scalarSlot]

  // Accept a chassis value stored as a JSON scalar or list as well as the legacy n+n text.
  try {
    return parseJsonSlots(JSON.parse(normalizedValue))
  } catch {
    // Invalid JSON is handled by the caller with the standard capacity error.
  }
  return null
}

function invalidOptionalModuleSlots(current: unknown): Error {
  const type = Array.isArray(current) ? 'array' : current === null ? 'null' : typeof current
  const value = typeof current === 'string' ? JSON.stringify(current) : String(current)
  return new Error(`Le nombre d’emplacements de modules optionnels doit être un entier valide (valeur reçue : ${value}, type : ${type}).`)
}

function addOptionalModuleSlots(current: unknown, value: string): string {
  const increment = atelierOptionalModuleSlotIncrease(value)
  if (increment === null) {
    throw new Error('L’augmentation des emplacements de modules optionnels doit être un entier positif.')
  }

  const slots = parseOptionalModuleSlots(current)
  if (!slots) throw invalidOptionalModuleSlots(current)
  if (slots.length === 0) slots.push(0)

  if (slots.some((slot) => !Number.isSafeInteger(slot))) {
    throw invalidOptionalModuleSlots(current)
  }
  // The first entry is the chassis base capacity; keep every turret entry intact.
  const nextBaseSlots = slots[0] + increment
  if (!Number.isSafeInteger(nextBaseSlots)) throw new Error('Le nombre d’emplacements de modules optionnels dépasse la limite autorisée.')
  slots[0] = nextBaseSlots
  return slots.join('+')
}

function addTurretModuleSlots(current: unknown, previousTurretCount: number, nextTurretCount: number): string {
  const slots = parseOptionalModuleSlots(current)
  if (!slots) throw invalidOptionalModuleSlots(current)

  if (slots.some((slot) => !Number.isSafeInteger(slot))) {
    throw new Error('Chaque emplacement de module optionnel doit être un entier valide.')
  }
  if (slots.length > previousTurretCount + 1) {
    throw new Error('Les emplacements de modules optionnels ne correspondent pas au nombre de tourelles du châssis.')
  }

  // The first value belongs to optional ship modules; each later value belongs to a turret.
  if (slots.length === 0) slots.push(0)
  while (slots.length < previousTurretCount + 1) slots.push(0)
  for (let index = previousTurretCount; index < nextTurretCount; index += 1) slots.push(1)
  return slots.join('+')
}

export function applyAtelierEffects<T extends Record<string, any>>(
  properties: T,
  effects: AtelierEffect[],
  kind: AtelierEquipmentKind,
): T {
  const result: Record<string, any> = { ...properties }
  const orderedEffects = effects.map((effect, index) => ({ effect, index })).sort((left, right) => {
    const leftPriority = kind === 'vaisseau' && left.effect.cible === 'tourelles' ? 0 : 1
    const rightPriority = kind === 'vaisseau' && right.effect.cible === 'tourelles' ? 0 : 1
    return leftPriority - rightPriority || left.index - right.index
  }).map(({ effect }) => effect)
  for (const effect of orderedEffects) {
    if (!TARGETS[kind].has(effect.cible)) throw new Error(`La propriété « ${effect.cible} » ne peut pas être personnalisée sur cet équipement.`)
    if (!['add', 'dice-count-add', 'dice-size-step', 'slot-add'].includes(effect.operation)) throw new Error('Opération Atelier inconnue.')
    const specializationTag = kind === 'vaisseau' ? atelierSpecializationTagForTarget(effect.cible) : null
    if (specializationTag) {
      if (effect.operation !== 'add') throw new Error('Une spécialisation doit utiliser l’opération d’ajout numérique.')
      const tags = atelierShipSpecializationTags(result)
      result.specialisations = [...new Set([...tags.filter((tag) => tag !== result.categorie), specializationTag])]
      continue
    }
    const current = result[effect.cible] ?? (kind === 'arme' && effect.cible === 'weaponHeatSegment' ? 100 : undefined)
    if (kind === 'vaisseau') {
      if (effect.operation === 'dice-count-add' || effect.operation === 'dice-size-step') {
        throw new Error('Les propriétés d’un châssis Atelier ne peuvent être qu’augmentées.')
      }
      if (SHIP_INCREASE_ONLY.has(effect.cible) && finiteValue(effect.valeur, 'La valeur Atelier') < 0) {
        throw new Error('Une modification de châssis ne peut pas diminuer cette propriété.')
      }
    }

    if (kind === 'vaisseau' && effect.cible === 'pointsEmportTourelles') {
      if (effect.operation !== 'slot-add') throw new Error('Les points d’emport des tourelles doivent utiliser l’opération d’emplacements.')
      const turretCount = Number(result.tourelles)
      const turretIndex = effect.turretIndex
      if (!Number.isSafeInteger(turretIndex) || Number(turretIndex) < 1 || Number(turretIndex) > turretCount) {
        throw new Error('Sélectionnez une tourelle disponible pour chaque achat de points d’emport.')
      }
      const increment = Number(effect.valeur)
      if (!Number.isSafeInteger(increment) || increment < 1) throw new Error('Les points d’emport ajoutés doivent être un entier positif.')
      const slots = atelierTurretCapacities(current, turretCount)
      const index = Number(turretIndex) - 1
      if (slots[index] + increment > 4) throw new Error('Une tourelle ne peut pas dépasser 4 points d’emport.')
      slots[index] += increment
      result[effect.cible] = slots.join('+')
    } else if (effect.operation === 'slot-add') {
      if (effect.cible !== 'modulesSupplementaires') throw new Error('Cette propriété ne peut pas recevoir des emplacements de modules optionnels.')
      result[effect.cible] = addOptionalModuleSlots(current, effect.valeur)
    } else if (effect.operation === 'add') {
      const increment = finiteValue(effect.valeur, 'La valeur ajoutée')
      if (kind === 'armure' && effect.cible === 'caracteristiqueBonus') {
        const armorModifier = result.modificateur
        if (typeof armorModifier !== 'string' || !armorModifier.trim()) continue
        const match = armorModifier.match(/^(.*?)([+-])\s*(\d+)\s*$/)
        if (!match || !match[1].trim()) {
          throw new Error('Le modificateur de cette armure doit utiliser le format caractéristique+N.')
        }
        const previousValue = Number(`${match[2]}${match[3]}`)
        const nextValue = exactAdd(previousValue, increment)
        if (!Number.isSafeInteger(nextValue)) throw new Error('Le bonus de caractéristique doit rester un entier valide.')
        result.modificateur = `${match[1]}${nextValue < 0 ? '-' : '+'}${Math.abs(nextValue)}`
        continue
      }
      if (kind === 'armure' && effect.cible === 'mods') {
        if (increment !== 1) throw new Error('Chaque achat de cette modification doit ajouter exactement un emplacement de mods.')
        const nextValue = exactAdd(Number(current ?? 1), 1)
        if (!Number.isSafeInteger(nextValue) || nextValue < 1) throw new Error('La capacité d’emplacements de mods est invalide.')
        result.mods = nextValue
        continue
      }
      if (kind === 'arme' && effect.cible === 'modMoyennePortee' && result.categorie === 'sniper') {
        const stages = result.paliersSniper
        if (!Array.isArray(stages) || !stages[1] || typeof stages[1].modificateur !== 'number') {
          throw new Error('Le Palier 02 du sniper est introuvable ou ne possède pas de modificateur numérique.')
        }
        result.paliersSniper = stages.map((stage: any, index: number) => index === 1
          ? { ...stage, modificateur: exactAdd(stage.modificateur, increment) }
          : stage)
        continue
      }
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
      if (kind === 'vaisseau' && effect.cible === 'tourelles') {
        if (!Number.isSafeInteger(nextValue) || nextValue < 0) throw new Error('Le nombre de tourelles doit rester un entier positif.')
        const previousCount = Number(current)
        const capacities = atelierTurretCapacities(result.pointsEmportTourelles, nextValue)
        for (let index = previousCount; index < nextValue; index += 1) capacities[index] = Math.max(1, capacities[index])
        result.pointsEmportTourelles = capacities.join('+')
      }
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
  if (kind === 'vaisseau' && effects.some((effect) => effect.cible === 'tourelles' || effect.cible === 'pointsEmportTourelles')) {
    const initialTurretCount = Number(properties.tourelles)
    const finalTurretCount = Number(result.tourelles)
    const capacities = atelierTurretCapacities(result.pointsEmportTourelles, finalTurretCount)
    if (Number.isSafeInteger(initialTurretCount) && initialTurretCount >= 0) {
      for (let index = initialTurretCount; index < finalTurretCount; index += 1) capacities[index] = Math.max(1, capacities[index])
      if (finalTurretCount > initialTurretCount) {
        result.modulesSupplementaires = addTurretModuleSlots(
          result.modulesSupplementaires,
          initialTurretCount,
          finalTurretCount,
        )
      }
    }
    result.pointsEmportTourelles = capacities.join('+')
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
