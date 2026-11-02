import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPayload: vi.fn(),
  headers: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@/payload.config', () => ({ default: {} }))
vi.mock('next/headers.js', () => ({ headers: mocks.headers }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { applySessionRewards } from '@/app/(frontend)/characters/session-rewards-actions'

type FindArgs = { collection: string; where?: unknown }

function createPayloadHarness(options: {
  character: Record<string, unknown>
  characters?: Record<number, Record<string, unknown>>
  factions?: Record<number, Record<string, unknown>>
  sets?: Record<number, number>
  armorBySet?: Record<number, number[]>
}) {
  let batchWasCreated = false
  let logData: { perCharacter?: unknown } | null = null
  let updatedData: Record<string, unknown> | null = null

  const payload = {
    auth: vi.fn().mockResolvedValue({ user: { id: 42, role: 'admin' } }),
    find: vi.fn(async ({ collection, where }: FindArgs) => {
      if (collection === 'session-rewards') {
        return { docs: batchWasCreated ? [{ id: 1 }] : [] }
      }
      if (collection === 'armor-sets') {
        const rank = (where as { rang?: { equals: number } } | undefined)?.rang?.equals
        const setId = rank == null ? undefined : options.sets?.[rank]
        return { docs: setId == null ? [] : [{ id: setId, rang: rank }] }
      }
      if (collection === 'armors') {
        const setId = (where as { set?: { equals: number } } | undefined)?.set?.equals
        return { docs: (options.armorBySet?.[setId ?? -1] ?? []).map((id) => ({ id })) }
      }
      return { docs: [] }
    }),
    findByID: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
      if (collection === 'factions') return options.factions?.[id] ?? null
      return options.characters?.[id] ?? options.character
    }),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updatedData = data
      return { id: 1 }
    }),
    create: vi.fn(async ({ data }: { data: { perCharacter?: unknown } }) => {
      batchWasCreated = true
      logData = data
      return { id: 1 }
    }),
    db: {
      beginTransaction: vi.fn().mockResolvedValue('test-transaction'),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    },
  }

  mocks.getPayload.mockResolvedValue(payload)
  mocks.headers.mockResolvedValue({})
  return {
    payload,
    get logData() { return logData },
    get updatedData() { return updatedData },
  }
}

const input = {
  batchId: 'rank-up-test-batch',
  scopeType: 'selection' as const,
  characterIds: [7],
  apply: { konis: false, pr: true, pointsDeCompetence: false, reputation: false, faction: false },
  values: {
    konisTotal: 0,
    pr: 11,
    factionId: null,
    commanditaireId: null,
    ciblesAbattues: 0,
    ciblesCapturees: 0,
    horsConfederation: false,
  },
  perCharacter: { '7': { konis: 0, pointsDeCompetence: 0, reputation: 0 } },
}

describe('mission session rank-up application', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies every crossed rank, adds its set pieces, audits rolls, and stays idempotent', async () => {
    const harness = createPayloadHarness({
      character: {
        id: 7,
        nom: 'Test',
        origine: 'Vada',
        pointsDeRang: 4,
        pointsDeCompetence: 3,
        bonusPointsDeBlessures: 2,
        inventaireArmures: [],
      },
      sets: { 2: 22, 3: 33 },
      armorBySet: { 22: [101, 102], 33: [103] },
    })
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0).mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0).mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0).mockReturnValueOnce(0.99)

    await expect(applySessionRewards(input)).resolves.toMatchObject({ success: true, alreadyApplied: false })

    expect(harness.updatedData).toMatchObject({
      pointsDeRang: 15,
      pointsDeCompetence: 15,
      bonusPointsDeBlessures: 18,
      inventaireArmures: [
        { item: 101, mods: [] },
        { item: 102, mods: [] },
        { item: 103, mods: [] },
      ],
    })
    const perCharacter = harness.logData?.perCharacter as {
      delta: { progressionRang: { rang: number; armuresAjoutees: number[] }[] }
    }[]
    expect(perCharacter[0]?.delta.progressionRang).toEqual([
      expect.objectContaining({ rang: 2, bonusBlessures: 8, pointsDeCompetence: 6, armuresAjoutees: [101, 102] }),
      expect.objectContaining({ rang: 3, bonusBlessures: 8, pointsDeCompetence: 6, armuresAjoutees: [103] }),
    ])

    await expect(applySessionRewards(input)).resolves.toMatchObject({ success: true, alreadyApplied: true })
    expect(harness.payload.update).toHaveBeenCalledTimes(1)
    expect(harness.payload.create).toHaveBeenCalledTimes(1)
  })

  it('continues the rank-up and records the missing set when one is not configured', async () => {
    const harness = createPayloadHarness({
      character: {
        id: 7,
        origine: 'Humain',
        pointsDeRang: 4,
        pointsDeCompetence: 0,
        bonusPointsDeBlessures: 0,
        inventaireArmures: [],
      },
    })
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.5).mockReturnValueOnce(0.99)

    await applySessionRewards({
      ...input,
      batchId: 'missing-set-test-batch',
      values: { ...input.values, pr: 1 },
    })

    expect(harness.updatedData).toMatchObject({ pointsDeRang: 5, pointsDeCompetence: 6, bonusPointsDeBlessures: 6 })
    const perCharacter = harness.logData?.perCharacter as {
      delta: { progressionRang: { armureManquante: boolean; armureSetId: number | null }[] }
    }[]
    expect(perCharacter[0]?.delta.progressionRang[0]).toMatchObject({ armureManquante: true, armureSetId: null })
  })

  it('applies and audits different reputation gains per character', async () => {
    const harness = createPayloadHarness({
      character: {},
      characters: {
        7: { id: 7, nom: 'Ada', reputation: [{ categorie: 'Alliance', valeur: 2 }] },
        8: { id: 8, nom: 'Bex', reputation: [] },
      },
      factions: { 9: { id: 9, nom: 'Alliance' } },
    })

    await applySessionRewards({
      ...input,
      batchId: 'individual-reputation-test-batch',
      characterIds: [7, 8],
      apply: { ...input.apply, pr: false, reputation: true },
      values: { ...input.values, pr: 0, factionId: 9 },
      perCharacter: {
        '7': { konis: 0, pointsDeCompetence: 0, reputation: 3 },
        '8': { konis: 0, pointsDeCompetence: 0, reputation: 5 },
      },
    })

    expect(harness.payload.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'characters',
        id: 7,
        data: { reputation: [{ categorie: 'Alliance', valeur: 5 }] },
      }),
    )
    expect(harness.payload.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'characters',
        id: 8,
        data: { reputation: [{ categorie: 'Alliance', valeur: 5 }] },
      }),
    )
    expect(harness.logData?.perCharacter).toMatchObject([
      { id: 7, delta: { reputation: { categorie: 'Alliance', delta: 3 } } },
      { id: 8, delta: { reputation: { categorie: 'Alliance', delta: 5 } } },
    ])
  })

  it('does not update reputation for a zero gain or when reputation is disabled', async () => {
    const harness = createPayloadHarness({
      character: { id: 7, nom: 'Ada', reputation: [{ categorie: 'Alliance', valeur: 2 }] },
      factions: { 9: { id: 9, nom: 'Alliance' } },
    })

    await applySessionRewards({
      ...input,
      batchId: 'zero-reputation-test-batch',
      apply: { ...input.apply, pr: false, reputation: true },
      values: { ...input.values, pr: 0, factionId: 9 },
      perCharacter: { '7': { konis: 0, pointsDeCompetence: 0, reputation: 0 } },
    })

    await applySessionRewards({
      ...input,
      batchId: 'disabled-reputation-test-batch',
      apply: { ...input.apply, pr: false, reputation: false },
      values: { ...input.values, pr: 0, factionId: 9 },
      perCharacter: { '7': { konis: 0, pointsDeCompetence: 0, reputation: 8 } },
    })

    expect(harness.payload.update).not.toHaveBeenCalled()
  })
})
