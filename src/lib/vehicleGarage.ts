import { exactMultiply, readShopPrice, type ShopPrice } from './shop'

export const vehicleCatalogClasses = [
  { value: 'alpha', label: 'Légers' },
  { value: 'beta', label: 'Intermédiaires' },
  { value: 'gamma', label: 'Poids Lourds' },
  { value: 'delta', label: 'Blindés' },
] as const

const VEHICLE_CLASS_MINIMUM_RANK: Record<string, number> = {
  alpha: 1,
  beta: 3,
  gamma: 5,
  delta: 7,
}

export function minimumRankForVehicleClass(vehicleClass: string | null | undefined): number | null {
  return vehicleClass ? VEHICLE_CLASS_MINIMUM_RANK[vehicleClass] ?? null : null
}

export type VehicleCatalogEntry = {
  id: number
  nom: string
  prix: ShopPrice
  classe: string | null
  varianteId: number | null
  variante: string | null
  position: string | null
}

/** Group vehicle models by class and vehicle type, sorting each type by price. */
export function groupVehicleCatalog<T extends VehicleCatalogEntry>(models: T[]) {
  return vehicleCatalogClasses.map((vehicleClass) => {
    const variants = new Map<string, { id: number | null; value: string; label: string; position: string | null; models: T[] }>()
    for (const model of models) {
      if (model.classe !== vehicleClass.value) continue
      const key = model.varianteId === null ? `name:${model.variante ?? ''}` : `id:${model.varianteId}`
      const variant = variants.get(key) ?? {
        id: model.varianteId,
        value: key,
        label: model.variante ?? 'Autres véhicules',
        position: model.position,
        models: [],
      }
      variant.models.push(model)
      variants.set(key, variant)
    }

    return {
      ...vehicleClass,
      variants: [...variants.values()]
        .sort((left, right) => {
          const leftPosition = Number(left.position)
          const rightPosition = Number(right.position)
          if (Number.isFinite(leftPosition) && Number.isFinite(rightPosition) && leftPosition !== rightPosition) {
            return leftPosition - rightPosition
          }
          return left.label.localeCompare(right.label, 'fr')
        })
        .map((variant) => ({
          ...variant,
          models: variant.models.sort((left, right) => {
            const leftPrice = readShopPrice(left.prix)
            const rightPrice = readShopPrice(right.prix)
            if (leftPrice === null) return rightPrice === null ? left.nom.localeCompare(right.nom, 'fr') : 1
            if (rightPrice === null) return -1
            return leftPrice - rightPrice || left.nom.localeCompare(right.nom, 'fr') || left.id - right.id
          }),
        })),
    }
  })
}

export function vehiclePurchasePrice(modelPrice: ShopPrice): number | null {
  return readShopPrice(modelPrice)
}

/** Vehicles are resold for one quarter of the sale-model price. */
export function vehicleSalePrice(modelPrice: ShopPrice): number | null {
  const price = readShopPrice(modelPrice)
  return price === null ? null : exactMultiply(price, 0.25)
}

export function vehicleGarageFingerprint(input: {
  action: 'buy' | 'sell'
  saleModelId?: number
  vehicleId?: number
  vehicleName?: string
}): string {
  return JSON.stringify([
    input.action,
    input.saleModelId ?? null,
    input.vehicleId ?? null,
    input.vehicleName?.trim() ?? null,
  ])
}
