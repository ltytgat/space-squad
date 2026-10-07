export type ShopPrice = number | string | null | undefined

export function shopRequestFingerprint(input: {
  action: string
  kind: string
  itemId: number
  quantity: number
  shipId?: number
  ownedIndex?: number
  discountRewardId?: string
  weaponTarget?: { location?: string; index?: number; slot?: string }
}): string {
  return JSON.stringify([
    input.action, input.kind, input.itemId, input.quantity, input.shipId ?? null,
    input.ownedIndex ?? null, input.discountRewardId ?? null, input.weaponTarget?.location ?? null,
    input.weaponTarget?.index ?? null, input.weaponTarget?.slot ?? null,
  ])
}

type Decimal = { integer: bigint; scale: number }
function decimal(value: number | string): Decimal {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(String(value).trim())
  if (!match) throw new Error('Montant décimal invalide.')
  const integer = BigInt(`${match[2]}${match[3] ?? ''}`) * (match[1] === '-' ? -1n : 1n)
  const scale = (match[3] ?? '').length - Number(match[4] ?? 0)
  if (scale < 0) return { integer: integer * 10n ** BigInt(-scale), scale: 0 }
  return { integer, scale }
}

function decimalNumber(value: Decimal): number {
  const negative = value.integer < 0
  const digits = (negative ? -value.integer : value.integer).toString().padStart(value.scale + 1, '0')
  const formatted = value.scale === 0 ? digits : `${digits.slice(0, -value.scale)}.${digits.slice(-value.scale)}`
  return Number(`${negative ? '-' : ''}${formatted}`)
}

export function exactAdd(left: number, right: number): number {
  const a = decimal(left); const b = decimal(right)
  const scale = Math.max(a.scale, b.scale)
  const integer = a.integer * 10n ** BigInt(scale - a.scale) + b.integer * 10n ** BigInt(scale - b.scale)
  return decimalNumber({ integer, scale })
}

export function exactSubtract(left: number, right: number): number { return exactAdd(left, -right) }

export function exactMultiply(left: number, right: number): number {
  const a = decimal(left); const b = decimal(right)
  return decimalNumber({ integer: a.integer * b.integer, scale: a.scale + b.scale })
}

export function exactHalf(value: number): number {
  const a = decimal(value)
  return decimalNumber({ integer: a.integer * 5n, scale: a.scale + 1 })
}

/** Prices stored as text in ship catalogs are accepted only as unsigned decimal integers. */
export function readShopPrice(value: ShopPrice): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function resalePrice(value: number): number {
  return exactHalf(value)
}

export function weaponModPrice(weaponPrice: number, modFactor: number): number {
  return exactMultiply(weaponPrice, modFactor)
}

export function relationId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    const id = (value as { id?: unknown }).id
    return id === null || id === undefined ? null : String(id)
  }
  return String(value)
}

export function isWeaponModCompatible(weapon: { categorie?: string }, mod: {
  categoriePrincipale?: string
  sousCategorieArme?: string
}): boolean {
  if (mod.categoriePrincipale !== 'armes') return false
  const category = mod.sousCategorieArme
  if (category === 'toutes') return true
  if (category === 'fusils-pistolets')
    return ['fusil-assaut', 'shotgun', 'sniper', 'pistolet', 'lourde'].includes(weapon.categorie ?? '')
  if (category === 'shotgun') return weapon.categorie === 'shotgun'
  if (category === 'snipers') return weapon.categorie === 'sniper'
  if (category === 'melee') return weapon.categorie === 'melee'
  return false
}

export function isArmorModCompatible(armor: { categorie?: string }, mod: {
  categoriePrincipale?: string
  sousCategorieArmure?: string
}): boolean {
  return mod.categoriePrincipale === 'armures' &&
    (mod.sousCategorieArmure === 'toutes' || mod.sousCategorieArmure === armor.categorie)
}

export function canCommercialize(price: ShopPrice): boolean {
  return readShopPrice(price) !== null
}
