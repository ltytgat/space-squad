import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  update: vi.fn(),
  cookies: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`) }),
}))
vi.mock('payload', () => ({ getPayload: async () => ({ auth: mocks.auth, update: mocks.update }) }))
vi.mock('@/payload.config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: mocks.cookies }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/components/SiteHeader', () => ({ SiteHeader: () => null }))
vi.mock('@/components/SiteFooter', () => ({ SiteFooter: () => null }))

import { becomeMJ } from '@/app/(frontend)/role-actions'
import MJHelpPage from '@/app/(frontend)/mj/aide/page'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: 7, role: 'player', isMJ: false } })
  mocks.update.mockResolvedValue({ id: 7, role: 'player', isMJ: true })
})
afterEach(cleanup)

describe('MJ activation', () => {
  it('rejects unauthenticated requests without updating any account', async () => {
    mocks.auth.mockResolvedValue({ user: null })
    expect(await becomeMJ()).toEqual({ success: false, error: 'Connectez-vous pour devenir MJ.' })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('grants only the MJ flag to the authenticated account and preserves the mode', async () => {
    expect(await becomeMJ()).toEqual({ success: true })
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
      collection: 'users', id: 7, data: { isMJ: true }, overrideAccess: true,
    })
    expect(mocks.cookies).not.toHaveBeenCalled()
  })

  it.each([
    { id: 7, role: 'player', isMJ: true },
    { id: 8, role: 'admin', isMJ: false },
  ])('does not alter an already privileged account: %j', async (user) => {
    mocks.auth.mockResolvedValue({ user })
    expect(await becomeMJ()).toEqual({ success: true })
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.cookies).not.toHaveBeenCalled()
  })

  it('handles repeated activation using the persisted flag', async () => {
    mocks.update.mockImplementationOnce(async () => {
      mocks.auth.mockResolvedValue({ user: { id: 7, role: 'player', isMJ: true } })
    })
    expect(await becomeMJ()).toEqual({ success: true })
    expect(await becomeMJ()).toEqual({ success: true })
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })

  it('returns a retryable error when persistence fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      mocks.update.mockRejectedValueOnce(new Error('database unavailable'))
      expect(await becomeMJ()).toEqual({ success: false, error: 'Impossible d’activer les droits MJ. Réessayez.' })
    } finally {
      log.mockRestore()
    }
  })
})

describe('MJ help access', () => {
  it.each([
    { user: null, target: '/login' },
    { user: { id: 7, role: 'player', isMJ: false }, target: '/account' },
  ])('redirects an unauthorized visitor to $target', async ({ user, target }) => {
    mocks.auth.mockResolvedValue({ user })
    await expect(MJHelpPage()).rejects.toThrow(`redirect:${target}`)
  })

  it.each([
    { id: 7, role: 'player', isMJ: true },
    { id: 8, role: 'admin', isMJ: false },
  ])('renders help for a privileged account without requiring MJ mode: %j', async (user) => {
    mocks.auth.mockResolvedValue({ user })
    render(await MJHelpPage())
    expect(screen.getByRole('heading', { name: 'Aide MJ', level: 1 })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Retour à mon compte' }).getAttribute('href')).toBe('/account')
    expect(mocks.cookies).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})
