import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  create: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: payloadMocks.getPayload }))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))

import { POST } from '@/app/api/auth/register/route'

function registrationRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMocks.find.mockResolvedValue({ docs: [] })
    payloadMocks.create.mockResolvedValue({ id: 1 })
    payloadMocks.getPayload.mockResolvedValue({ find: payloadMocks.find, create: payloadMocks.create })
  })

  it('creates a player account and ignores privilege fields supplied by the caller', async () => {
    const response = await POST(registrationRequest({
      email: '  PLAYER@EXAMPLE.FR ',
      password: 'a-secure-password',
      passwordConfirmation: 'a-secure-password',
      role: 'admin',
      isMJ: true,
    }))

    expect(response.status).toBe(201)
    expect(payloadMocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      data: {
        email: 'player@example.fr',
        password: 'a-secure-password',
        role: 'player',
        isMJ: false,
      },
      overrideAccess: true,
    }))
  })

  it.each([
    { email: 'player@example.fr', password: 'short', passwordConfirmation: 'short' },
    { email: 'player@example.fr', password: 'a-secure-password', passwordConfirmation: 'different-password' },
    { email: 'invalid-email', password: 'a-secure-password', passwordConfirmation: 'a-secure-password' },
  ])('rejects invalid registration data', async (body) => {
    const response = await POST(registrationRequest(body))

    expect(response.status).toBe(400)
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })

  it('rejects an email address that already has an account', async () => {
    payloadMocks.find.mockResolvedValue({ docs: [{ id: 1 }] })

    const response = await POST(registrationRequest({
      email: 'player@example.fr',
      password: 'a-secure-password',
      passwordConfirmation: 'a-secure-password',
    }))

    expect(response.status).toBe(409)
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })
})
