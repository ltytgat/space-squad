import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const routerMocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }))

import { LoginClient } from '@/app/(frontend)/login/LoginClient'

describe('login registration flow', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('registers, signs in, and redirects to character creation', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ message: 'Compte créé.' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ user: { role: 'player' } }) })

    render(createElement(LoginClient))
    fireEvent.click(screen.getByRole('button', { name: 'Créer un compte' }))
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: '  Joueur@Example.fr ' } })
    fireEvent.change(screen.getByLabelText('Mot de passe (12 caractères minimum)'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => expect(routerMocks.push).toHaveBeenCalledWith('/character'))
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        email: 'joueur@example.fr',
        password: 'a-secure-password',
        passwordConfirmation: 'a-secure-password',
        website: '',
      }),
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/users/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'joueur@example.fr', password: 'a-secure-password' }),
    }))
  })
})
