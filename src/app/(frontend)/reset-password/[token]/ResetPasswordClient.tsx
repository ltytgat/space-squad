'use client'

import Link from 'next/link'
import { useState } from 'react'

export function ResetPasswordClient({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (password !== confirmation) {
      setStatus('error')
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 12) {
      setStatus('error')
      setError('Choisissez un mot de passe de 12 caractères minimum.')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (response.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setError('Ce lien est invalide ou a expiré. Demandez un nouveau lien depuis la page de connexion.')
      }
    } catch {
      setStatus('error')
      setError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (status === 'success') {
    return (
      <div className="login-form">
        <p className="login-feedback login-feedback-success" role="status">
          Votre mot de passe a été modifié. Vous pouvez maintenant accéder à votre espace.
        </p>
        <Link href="/" className="ss-btn ss-btn-primary login-submit">
          Continuer
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="login-form" noValidate>
      <div className="login-field">
        <label htmlFor="new-password">Nouveau mot de passe</label>
        <input
          id="new-password"
          type="password"
          className="login-input"
          value={password}
          onChange={(event) => { setPassword(event.target.value); setStatus('idle') }}
          autoComplete="new-password"
          minLength={12}
          required
          autoFocus
        />
      </div>
      <div className="login-field">
        <label htmlFor="confirm-password">Confirmer le mot de passe</label>
        <input
          id="confirm-password"
          type="password"
          className="login-input"
          value={confirmation}
          onChange={(event) => { setConfirmation(event.target.value); setStatus('idle') }}
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      {status === 'error' && (
        <p className="login-feedback login-feedback-error" role="alert">{error}</p>
      )}

      <button
        type="submit"
        className={`ss-btn ss-btn-primary login-submit${status === 'loading' ? ' ss-btn-disabled' : ''}`}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Modification…' : 'Modifier le mot de passe'}
      </button>
    </form>
  )
}
