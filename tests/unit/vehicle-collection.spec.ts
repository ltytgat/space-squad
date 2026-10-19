import { describe, expect, it, vi } from 'vitest'
import { Vehicles } from '@/collections/Vehicles'

const beforeChange = Vehicles.hooks?.beforeChange?.[0] as unknown as (
  args: unknown,
) => Promise<Record<string, unknown>>

const runBeforeChange = async ({
  model,
  weapon,
  data,
  originalDoc = {},
  operation = 'create',
}: {
  model: Record<string, unknown>
  weapon?: Record<string, unknown>
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  operation?: string
}) => {
  const findByID = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === 'vehicle-sale-models') return model
    if (collection === 'ship-weapons' && weapon) return weapon
    throw new Error(`Unexpected lookup: ${collection}`)
  })

  return beforeChange({
    data,
    originalDoc,
    operation,
    req: { payload: { findByID } },
  } as never)
}

describe('vehicle collection state', () => {
  it('initializes current armor from the selected sale model', async () => {
    const result = await runBeforeChange({
      model: { id: 1, blindageMax: 24 },
      data: { modele: 1 },
    })

    expect(result.blindageActuel).toBe(24)
  })

  it('rejects armor above the model maximum', async () => {
    await expect(
      runBeforeChange({
        model: { id: 1, blindageMax: 24 },
        data: { modele: 1, blindageActuel: 25 },
      }),
    ).rejects.toThrow('Le blindage actuel ne peut pas dépasser')
  })

  it('allows only ship weapons at or below the turret class', async () => {
    const model = { id: 1, blindageMax: 24, tourelleClasseMax: 'alpha' }

    await expect(
      runBeforeChange({
        model,
        weapon: { id: 3, taille: '2' },
        data: { modele: 1, armeTourelle: 3 },
      }),
    ).rejects.toThrow('ne peut pas accueillir cette arme')

    const result = await runBeforeChange({
      model: { ...model, tourelleClasseMax: 'beta' },
      weapon: { id: 3, taille: '2' },
      data: { modele: 1, armeTourelle: 3 },
    })

    expect(result.armeTourelle).toBe(3)

    const gammaResult = await runBeforeChange({
      model: { ...model, tourelleClasseMax: 'gamma' },
      weapon: { id: 4, taille: '3' },
      data: { modele: 1, armeTourelle: 4 },
    })
    expect(gammaResult.armeTourelle).toBe(4)

    await expect(
      runBeforeChange({
        model: { ...model, tourelleClasseMax: 'gamma' },
        weapon: { id: 5, taille: '4' },
        data: { modele: 1, armeTourelle: 5 },
      }),
    ).rejects.toThrow('ne peut pas accueillir cette arme')
  })

  it('requires a turret weapon before recording a loaded magazine', async () => {
    await expect(
      runBeforeChange({
        model: { id: 1, blindageMax: 24 },
        data: { modele: 1, chargeurRelie: 5 },
      }),
    ).rejects.toThrow('Un chargeur ne peut être chargé que si une arme est équipée')
  })
})
