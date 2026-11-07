import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ becomeMJ: vi.fn(), refresh: vi.fn(), push: vi.fn() }))
vi.mock('@/app/(frontend)/role-actions', () => ({ becomeMJ: mocks.becomeMJ }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }))

import { AccountClient } from '@/app/(frontend)/account/AccountClient'

const player = { userId: '7', userEmail: 'player@example.fr', userRole: 'player', isMJ: false, userCreatedAt: '' }
beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('account MJ controls', () => {
  it.each([
    { ...player, isMJ: true },
    { ...player, userRole: 'admin' },
  ])('shows the help link for a privileged account: %j', (user) => {
    render(createElement(AccountClient, user))
    expect(screen.getByRole('link', { name: 'Aide MJ' }).getAttribute('href')).toBe('/mj/aide')
    expect(screen.queryByRole('button', { name: 'Devenir MJ' })).toBeNull()
  })

  it('disables activation while saving, refreshes the account and displays the persisted role', async () => {
    let complete!: (result: { success: true }) => void
    mocks.becomeMJ.mockReturnValueOnce(new Promise((resolve) => { complete = resolve }))
    const view = render(createElement(AccountClient, player))
    fireEvent.click(screen.getByRole('button', { name: 'Devenir MJ' }))
    const pending = screen.getByRole('button', { name: 'Activation…' })
    expect(pending).toHaveProperty('disabled', true)
    fireEvent.click(pending)
    expect(mocks.becomeMJ).toHaveBeenCalledTimes(1)
    await act(async () => complete({ success: true }))
    expect(mocks.refresh).toHaveBeenCalledTimes(1)
    view.rerender(createElement(AccountClient, { ...player, isMJ: true }))
    expect(screen.getByText('Joueur · MJ')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Aide MJ' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Devenir MJ' })).toBeNull()
  })

  it.each(['returned', 'thrown'])('allows retry after a %s error', async (kind) => {
    if (kind === 'returned') mocks.becomeMJ.mockResolvedValueOnce({ success: false, error: 'Activation impossible.' })
    else mocks.becomeMJ.mockRejectedValueOnce(new Error('network error'))
    mocks.becomeMJ.mockResolvedValueOnce({ success: true })
    render(createElement(AccountClient, player))
    fireEvent.click(screen.getByRole('button', { name: 'Devenir MJ' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(mocks.refresh).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Devenir MJ' }))
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
