import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  count: vi.fn(),
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
    payloadMocks.count.mockResolvedValue({ totalDocs: 0 })
    payloadMocks.getPayload.mockResolvedValue({ find: payloadMocks.find, count: payloadMocks.count, create: payloadMocks.create })
  })

  it('creates a player account and ignores privilege fields supplied by the caller', async () => {
    const response = await POST(registrationRequest({
      email: '  PLAYER@EXAMPLE.FR ',
      password: '1234567890',
      passwordConfirmation: '1234567890',
      role: 'admin',
      isMJ: true,
    }))

    expect(response.status).toBe(201)
    expect(payloadMocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      data: {
        email: 'player@example.fr',
        password: '1234567890',
        role: 'player',
        isMJ: false,
      },
      overrideAccess: true,
    }))
  })

  it.each([
    { email: 'player@example.fr', password: '123456789', passwordConfirmation: '123456789' },
    { email: 'player@example.fr', password: 'a-secure-password', passwordConfirmation: 'different-password' },
    { email: 'invalid-email', password: 'a-secure-password', passwordConfirmation: 'a-secure-password' },
    { email: `${'a'.repeat(250)}@example.fr`, password: 'a-secure-password', passwordConfirmation: 'a-secure-password' },
    { email: 'player@example.fr', password: 'a'.repeat(257), passwordConfirmation: 'a'.repeat(257) },
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

  it('pretends to succeed without creating anything when the honeypot is filled', async () => {
    const response = await POST(registrationRequest({
      email: 'bot@example.fr',
      password: 'a-secure-password',
      passwordConfirmation: 'a-secure-password',
      website: 'https://spam.example',
    }))

    expect(response.status).toBe(201)
    expect(payloadMocks.getPayload).not.toHaveBeenCalled()
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })

  it('closes registration once the total account cap is reached', async () => {
    payloadMocks.count.mockResolvedValueOnce({ totalDocs: 200 })

    const response = await POST(registrationRequest({
      email: 'player@example.fr',
      password: 'a-secure-password',
      passwordConfirmation: 'a-secure-password',
    }))

    expect(response.status).toBe(403)
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })

  it('throttles registration once the hourly cap is reached', async () => {
    payloadMocks.count
      .mockResolvedValueOnce({ totalDocs: 20 })
      .mockResolvedValueOnce({ totalDocs: 10 })

    const response = await POST(registrationRequest({
      email: 'player@example.fr',
      password: 'a-secure-password',
      passwordConfirmation: 'a-secure-password',
    }))

    expect(response.status).toBe(429)
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })
})
