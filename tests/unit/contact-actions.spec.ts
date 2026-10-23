import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  sendEmail: vi.fn(),
  getPayload: vi.fn(),
  getActiveCharacter: vi.fn(),
  getRequestIPHash: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers.js', () => ({ headers: async () => new Headers() }))
vi.mock('@/lib/activeCharacter', () => ({ getActiveCharacter: mocks.getActiveCharacter }))
vi.mock('@/lib/requestIP', () => ({ getRequestIPHash: mocks.getRequestIPHash }))

import { submitContactMessage } from '@/app/(frontend)/contact/actions'

const validMessage = (overrides: Record<string, unknown> = {}) => ({
  email: 'invite@example.fr',
  subject: 'Une question',
  message: 'Bonjour, j’ai une question sur le jeu.',
  website: '',
  startedAt: Date.now() - 10_000,
  ...overrides,
})

describe('submitContactMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CONTACT_TO_EMAIL = 'admin@example.fr'
    mocks.auth.mockResolvedValue({ user: null })
    mocks.count.mockResolvedValue({ totalDocs: 0 })
    mocks.create.mockResolvedValue({ id: 7 })
    mocks.update.mockResolvedValue({ id: 7 })
    mocks.sendEmail.mockResolvedValue(undefined)
    mocks.getActiveCharacter.mockResolvedValue(null)
    mocks.getRequestIPHash.mockResolvedValue('ip-hash')
    mocks.getPayload.mockResolvedValue({
      auth: mocks.auth,
      count: mocks.count,
      create: mocks.create,
      update: mocks.update,
      sendEmail: mocks.sendEmail,
    })
  })

  it('stores and forwards a guest message with a reply-to header', async () => {
    const result = await submitContactMessage(validMessage({ email: '  INVITE@Example.fr ' }))

    expect(result).toEqual({ success: true })
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'contact-messages',
      data: expect.objectContaining({ kind: 'guest', email: 'invite@example.fr', user: null, ipHash: 'ip-hash' }),
      overrideAccess: true,
    }))
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'admin@example.fr',
      replyTo: 'invite@example.fr',
      subject: '[Contact Space Squad] Une question',
    }))
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: 7, data: { emailSent: true } }))
  })

  it('uses the account email and active character for a signed-in user', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 3, email: 'joueur@example.fr' } })
    mocks.getActiveCharacter.mockResolvedValue({ id: 12, nom: 'Kira' })

    const result = await submitContactMessage(validMessage({ email: 'autre@example.fr' }))

    expect(result).toEqual({ success: true })
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ kind: 'user', email: 'joueur@example.fr', user: 3, character: 12 }),
    }))
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ replyTo: 'joueur@example.fr' }))
  })

  it.each([
    { website: 'https://spam.example' },
    { startedAt: Date.now() },
  ])('silently drops bot submissions', async (overrides) => {
    const result = await submitContactMessage(validMessage(overrides))

    expect(result).toEqual({ success: true })
    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it.each([
    { email: '' },
    { email: 'pas-une-adresse' },
    { subject: '' },
    { subject: 'Ligne 1\nLigne 2' },
    { message: 'court' },
    { message: 'a'.repeat(2001) },
    { message: 'Voir http://a.example http://b.example http://c.example' },
  ])('rejects invalid guest input', async (overrides) => {
    const result = await submitContactMessage(validMessage(overrides))

    expect(result.success).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('refuses a guest whose IP cannot be determined', async () => {
    mocks.getRequestIPHash.mockResolvedValue(null)

    const result = await submitContactMessage(validMessage())

    expect(result.success).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('throttles a guest once the hourly per-IP limit is reached', async () => {
    mocks.count
      .mockResolvedValueOnce({ totalDocs: 0 })
      .mockResolvedValueOnce({ totalDocs: 2 })

    const result = await submitContactMessage(validMessage())

    expect(result.success).toBe(false)
    expect(mocks.count).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ipHash: { equals: 'ip-hash' } }),
    }))
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('throttles a user once the hourly per-account limit is reached', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 3, email: 'joueur@example.fr' } })
    mocks.count
      .mockResolvedValueOnce({ totalDocs: 0 })
      .mockResolvedValueOnce({ totalDocs: 5 })

    const result = await submitContactMessage(validMessage())

    expect(result.success).toBe(false)
    expect(mocks.count).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ user: { equals: 3 } }),
    }))
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('closes the form once the global daily cap is reached', async () => {
    mocks.count.mockResolvedValueOnce({ totalDocs: 100 })

    const result = await submitContactMessage(validMessage())

    expect(result.success).toBe(false)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('keeps the stored message and reports success when the email fails', async () => {
    mocks.sendEmail.mockRejectedValue(new Error('SMTP down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await submitContactMessage(validMessage())

    expect(result).toEqual({ success: true })
    expect(mocks.create).toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('escapes user content in the email body', async () => {
    await submitContactMessage(validMessage({ subject: '<b>Salut</b>', message: '<script>alert(1)</script>\nFin' }))

    const { html } = mocks.sendEmail.mock.calls[0][0]
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>Fin')
    expect(html).toContain('&lt;b&gt;Salut&lt;/b&gt;')
  })
})
