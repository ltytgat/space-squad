import { describe, expect, it } from 'vitest'
import { groupVehicleCatalog, minimumRankForVehicleClass, vehicleSalePrice } from '@/lib/vehicleGarage'

describe('vehicle garage pricing', () => {
  it('resells a vehicle for one quarter of its model price', () => {
    expect(vehicleSalePrice(100_000)).toBe(25_000)
    expect(vehicleSalePrice(101)).toBe(25.25)
    expect(vehicleSalePrice(null)).toBeNull()
  })

  it('uses the same minimum ranks as the shipyard classes', () => {
    expect(['alpha', 'beta', 'gamma', 'delta'].map(minimumRankForVehicleClass)).toEqual([1, 3, 5, 7])
    expect(minimumRankForVehicleClass('unknown')).toBeNull()
  })
})

describe('vehicle catalog grouping', () => {
  it('groups models by class, then variant, and sorts models by price', () => {
    const sections = groupVehicleCatalog([
      { id: 1, nom: 'Buggy cher', prix: 300, classe: 'alpha', varianteId: 1, variante: 'Buggy', position: '1' },
      { id: 2, nom: 'Buggy abordable', prix: 100, classe: 'alpha', varianteId: 1, variante: 'Buggy', position: '1' },
      { id: 3, nom: 'Moto', prix: 50, classe: 'alpha', varianteId: 2, variante: 'Moto', position: '2' },
      { id: 4, nom: 'Blindé', prix: 500, classe: 'delta', varianteId: 4, variante: '4x4', position: '1' },
    ])

    expect(sections.map(({ value }) => value)).toEqual(['alpha', 'beta', 'gamma', 'delta'])
    expect(sections[0].variants.map(({ label }) => label)).toEqual(['Buggy', 'Moto'])
    expect(sections[0].variants[0].models.map(({ id }) => id)).toEqual([2, 1])
    expect(sections[3].variants[0].models.map(({ id }) => id)).toEqual([4])
  })
})
