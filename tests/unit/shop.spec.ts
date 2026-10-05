import { describe, expect, it } from 'vitest'
import { canCommercialize, exactAdd, exactMultiply, exactSubtract, isArmorModCompatible, isWeaponModCompatible, readShopPrice, resalePrice, shopRequestFingerprint, weaponModPrice } from '@/lib/shop'

describe('shop price rules', () => {
  it('distinguishes a missing price from an explicit zero price', () => {
    expect(readShopPrice(null)).toBeNull()
    expect(readShopPrice(undefined)).toBeNull()
    expect(canCommercialize(null)).toBe(false)
    expect(readShopPrice(0)).toBe(0)
    expect(canCommercialize(0)).toBe(true)
  })

  it('accepts only digit-only prices from spatial text catalogs', () => {
    expect(readShopPrice('125000')).toBe(125000)
    expect(readShopPrice('0')).toBe(0)
    expect(readShopPrice('100 k')).toBeNull()
    expect(readShopPrice('')).toBeNull()
  })

  it('calculates half-price resale without rounding away fractional Konis', () => {
    expect(resalePrice(101)).toBe(50.5)
    expect(resalePrice(10_001.5)).toBe(5_000.75)
    expect(exactAdd(0.1, 0.2)).toBe(0.3)
    expect(exactSubtract(1, 0.1)).toBe(0.9)
    expect(exactMultiply(100_000, 0.15)).toBe(15_000)
  })
})

describe('shop Mod rules', () => {
  it('calculates weapon Mods as a factor of the selected weapon, including factors over 100%', () => {
    expect(weaponModPrice(100_000, 0.5)).toBe(50_000)
    expect(weaponModPrice(100_000, 4)).toBe(400_000)
    expect(resalePrice(100_000 + weaponModPrice(100_000, 4))).toBe(250_000)
  })

  it('reuses the personal weapon category rules for Mod compatibility', () => {
    expect(isWeaponModCompatible({ categorie: 'shotgun' }, { categoriePrincipale: 'armes', sousCategorieArme: 'fusils-pistolets' })).toBe(true)
    expect(isWeaponModCompatible({ categorie: 'melee' }, { categoriePrincipale: 'armes', sousCategorieArme: 'fusils-pistolets' })).toBe(false)
    expect(isWeaponModCompatible({ categorie: 'melee' }, { categoriePrincipale: 'armes', sousCategorieArme: 'melee' })).toBe(true)
    expect(isWeaponModCompatible({ categorie: 'shotgun' }, { categoriePrincipale: 'armures', sousCategorieArme: 'toutes' })).toBe(false)
  })

  it('matches armor Mods to their armor slot or the all-slots category', () => {
    expect(isArmorModCompatible({ categorie: 'tete' }, { categoriePrincipale: 'armures', sousCategorieArmure: 'tete' })).toBe(true)
    expect(isArmorModCompatible({ categorie: 'bras' }, { categoriePrincipale: 'armures', sousCategorieArmure: 'toutes' })).toBe(true)
    expect(isArmorModCompatible({ categorie: 'bras' }, { categoriePrincipale: 'armes', sousCategorieArmure: 'bras' })).toBe(false)
  })
})

describe('shop idempotency request identity', () => {
  it('keeps retries equivalent and separates requests with different transaction effects', () => {
    const first = { action: 'sell', kind: 'consumable', itemId: 12, quantity: 3, shipId: 4 }
    expect(shopRequestFingerprint(first)).toBe(shopRequestFingerprint({ ...first }))
    expect(shopRequestFingerprint(first)).not.toBe(shopRequestFingerprint({ ...first, quantity: 2 }))
    expect(shopRequestFingerprint(first)).not.toBe(shopRequestFingerprint({ ...first, shipId: 5 }))
  })
})
