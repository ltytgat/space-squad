'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MIN_PASSWORD_LENGTH } from '@/lib/passwordPolicy'

type ForgotStatus = 'idle' | 'loading' | 'sent' | 'error'

export function LoginClient({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(initialMode === 'register')
  const [forgotStatus, setForgotStatus] = useState<ForgotStatus>('idle')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [registrationError, setRegistrationError] = useState('')
  // Champ leurre : invisible pour un humain, souvent rempli par les robots.
  const [website, setWebsite] = useState('')

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegistrationStatus('loading')
    setRegistrationError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (password.length < MIN_PASSWORD_LENGTH) {
      setRegistrationStatus('error')
      setRegistrationError(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`)
      return
    }
    if (password !== passwordConfirmation) {
      setRegistrationStatus('error')
      setRegistrationError('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, passwordConfirmation, website }),
      })

      if (!registerResponse.ok) {
        const data = await registerResponse.json().catch(() => null)
        setRegistrationStatus('error')
        setRegistrationError(data?.error ?? 'La création du compte a échoué. Veuillez réessayer.')
        return
      }
      const registrationData = await registerResponse.json().catch(() => null)

      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      if (!loginResponse.ok) {
        setRegistrationStatus('error')
        setRegistrationError('Votre compte est créé, mais la connexion automatique a échoué. Vous pouvez vous connecter avec vos identifiants.')
        return
      }

      router.push(registrationData?.hasTemporaryCharacter ? '/character/temporary-choice' : '/character')
      router.refresh()
    } catch {
      setRegistrationStatus('error')
      setRegistrationError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  function returnToLogin() {
    setShowForgotPassword(false)
    setShowRegister(false)
    setForgotStatus('idle')
    setRegistrationStatus('idle')
    setRegistrationError('')
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

  if (showRegister) {
    return (
      <form onSubmit={handleRegister} className="login-form" noValidate>
        <h2 className="login-form-title">Créer un compte</h2>
        <div className="login-field">
          <label htmlFor="register-email">Adresse e-mail</label>
          <input
            id="register-email"
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setRegistrationStatus('idle') }}
            placeholder="vous@exemple.fr"
            required
            autoComplete="email"
            autoFocus
          />
        </div>
        <div className="login-field">
          <label htmlFor="register-password">Mot de passe ({MIN_PASSWORD_LENGTH} caractères minimum)</label>
          <input
            id="register-password"
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setRegistrationStatus('idle') }}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </div>
        <div className="login-field">
          <label htmlFor="register-password-confirmation">Confirmer le mot de passe</label>
          <input
            id="register-password-confirmation"
            type="password"
            className="login-input"
            value={passwordConfirmation}
            onChange={(e) => { setPasswordConfirmation(e.target.value); setRegistrationStatus('idle') }}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label htmlFor="register-website">Ne pas remplir ce champ</label>
          <input
            id="register-website"
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {registrationStatus === 'error' && (
          <p className="login-feedback login-feedback-error" role="alert">{registrationError}</p>
        )}

        <button
          type="submit"
          className={`ss-btn ss-btn-primary login-submit${registrationStatus === 'loading' ? ' ss-btn-disabled' : ''}`}
          disabled={registrationStatus === 'loading'}
        >
          {registrationStatus === 'loading' ? 'Création…' : 'Créer mon compte'}
        </button>
        <button type="button" className="login-text-button" onClick={returnToLogin}>
          Déjà un compte ? Se connecter
        </button>
      </form>
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
      <button
        type="button"
        className="login-text-button"
        onClick={() => {
          setShowRegister(true)
          setStatus('idle')
          setError('')
          setRegistrationStatus('idle')
          setRegistrationError('')
        }}
      >
        Créer un compte
      </button>
    </form>
  )
}
