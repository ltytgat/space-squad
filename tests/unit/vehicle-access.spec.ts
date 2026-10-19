import { describe, expect, it, vi } from 'vitest'
import { getVehicleAccess, vehicleReadAccess } from '@/lib/vehicleAccess'

describe('vehicle squad access', () => {
  it('limits collection reads to the viewer and their squad owners', async () => {
    const payload = {
      find: vi.fn(async ({ where }: any) => where.user
        ? { docs: [{ id: 10, groupe: 4 }] }
        : { docs: [{ id: 10 }, { id: 11 }, { id: 12 }] }),
    }
    const result = await vehicleReadAccess({ req: { user: { id: 2 }, payload } })
    expect(result).toEqual({ proprietaire: { in: [10, 11, 12] } })
  })

  it('lets the owner and squad members read, but only the owner edit', async () => {
    const viewer = { id: 11, groupe: 4 }
    const payload = {
      findByID: vi.fn(async () => ({ id: 30, proprietaire: 10 })),
      find: vi.fn(async ({ where }: any) => where.user
        ? { docs: [viewer] }
        : { docs: [{ id: 10 }, { id: 11 }, { id: 12 }] }),
    }
    const memberAccess = await getVehicleAccess(payload, { id: 2 }, 30)
    expect(memberAccess).toMatchObject({ canRead: true, canEdit: false, isOwner: false })

    payload.find.mockImplementation(async ({ where }: any) => where.user
      ? { docs: [{ id: 10, groupe: 4 }] }
      : { docs: [{ id: 10 }, { id: 11 }] })
    const ownerAccess = await getVehicleAccess(payload, { id: 3 }, 30)
    expect(ownerAccess).toMatchObject({ canRead: true, canEdit: true, isOwner: true })
  })

  it('denies a character outside the owner’s squad', async () => {
    const payload = {
      findByID: vi.fn(async () => ({ id: 30, proprietaire: 10 })),
      find: vi.fn(async ({ where }: any) => where.user
        ? { docs: [{ id: 20, groupe: 9 }] }
        : { docs: [{ id: 20 }, { id: 21 }] }),
    }
    const access = await getVehicleAccess(payload, { id: 4 }, 30)
    expect(access).toMatchObject({ canRead: false, canEdit: false, isOwner: false })
  })

  it('denies unauthenticated collection reads', async () => {
    await expect(vehicleReadAccess({ req: { user: null, payload: {} } })).resolves.toBe(false)
  })
})
