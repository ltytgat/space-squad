export const CHIP_PURCHASE_PRICES = { active: 75_000, passive: 100_000 } as const
export const CHIP_DRAW_PRICES = { active: 30_000, passive: 50_000 } as const
export const CHIP_RECYCLE_PRICE = 10_000

export type ChipCategory = keyof typeof CHIP_PURCHASE_PRICES
