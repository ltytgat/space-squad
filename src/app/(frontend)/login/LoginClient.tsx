'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ForgotStatus = 'idle' | 'loading' | 'sent' | 'error'

export function LoginClient() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStatus, setForgotStatus] = useState<ForgotStatus>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setStatus('error')
        setError('Adresse e-mail ou mot de passe incorrect.')
        return
      }

      const data = await res.json()
      const role = data?.user?.role

      if (role === 'admin') {
        router.push('/characters')
      } else {
        router.push('/')
      }
      router.refresh()
    } catch {
      setStatus('error')
      setError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotStatus('loading')

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Keep this response the same whether the email exists or a quota was hit.
      if (res.ok || res.status === 429) {
        setForgotStatus('sent')
      } else {
        setForgotStatus('error')
      }
    } catch {
      setForgotStatus('error')
    }
  }

  function returnToLogin() {
    setShowForgotPassword(false)
    setForgotStatus('idle')
  }

  if (showForgotPassword) {
    return (
      <div className="login-form">
        <h2 className="login-form-title">Mot de passe oublié</h2>
        {forgotStatus === 'sent' ? (
          <>
            <p className="login-feedback login-feedback-success" role="status">
              Si un compte correspond à cette adresse, un lien de réinitialisation vient de lui être envoyé.
            </p>
            <button type="button" className="login-text-button" onClick={returnToLogin}>
              Retour à la connexion
            </button>
          </>
        ) : (
          <form onSubmit={handleForgotPassword} className="login-form" noValidate>
            <p className="login-subtitle">
              Saisissez l’adresse associée à votre compte pour recevoir un lien de réinitialisation.
            </p>
            <div className="login-field">
              <label htmlFor="forgot-email">Adresse e-mail</label>
              <input
                id="forgot-email"
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setForgotStatus('idle') }}
                placeholder="vous@exemple.fr"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {forgotStatus === 'error' && (
              <p className="login-feedback login-feedback-error" role="alert">
                La demande n’a pas pu être envoyée. Veuillez réessayer plus tard.
              </p>
            )}

            <button
              type="submit"
              className={`ss-btn ss-btn-primary login-submit${forgotStatus === 'loading' ? ' ss-btn-disabled' : ''}`}
              disabled={forgotStatus === 'loading'}
            >
              {forgotStatus === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button type="button" className="login-text-button" onClick={returnToLogin}>
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="login-form" noValidate>
      <div className="login-field">
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          className="login-input"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
          placeholder="vous@exemple.fr"
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      <div className="login-field">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          className="login-input"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setStatus('idle') }}
          required
          autoComplete="current-password"
        />
      </div>

      {status === 'error' && (
        <p className="login-feedback login-feedback-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className={`ss-btn ss-btn-primary login-submit${status === 'loading' ? ' ss-btn-disabled' : ''}`}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Connexion…' : 'Se connecter'}
      </button>
      <button type="button" className="login-text-button" onClick={() => setShowForgotPassword(true)}>
        Mot de passe oublié ?
      </button>
    </form>
  )
}
