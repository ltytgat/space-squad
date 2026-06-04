'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginClient() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

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

      // Redirige selon le rôle
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
    </form>
  )
}
