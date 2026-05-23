'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AccountClientProps {
  userId: string
  userEmail: string
  userRole: string
  userCreatedAt: string
}

export function AccountClient({ userId, userEmail, userRole, userCreatedAt }: AccountClientProps) {
  const router = useRouter()

  // ── Email ──
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [emailError, setEmailError] = useState('')

  // ── Mot de passe ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  // ── Suppression ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState('')

  const roleLabel = userRole === 'admin' ? 'Administrateur' : 'Joueur'
  const memberSince = userCreatedAt
    ? new Date(userCreatedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setEmailStatus('loading')
    setEmailError('')

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.errors?.[0]?.message ?? "Impossible de mettre à jour l'adresse e-mail.")
      }

      setEmailStatus('success')
      setNewEmail('')
      router.refresh()
    } catch (err: unknown) {
      setEmailStatus('error')
      setEmailError(err instanceof Error ? err.message : "Une erreur est survenue.")
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordStatus('loading')
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordStatus('error')
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordStatus('error')
      setPasswordError('Le mot de passe doit comporter au moins 8 caractères.')
      return
    }

    // Vérifie le mot de passe actuel via l'endpoint de connexion
    try {
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: currentPassword }),
      })

      if (!loginRes.ok) {
        setPasswordStatus('error')
        setPasswordError('Mot de passe actuel incorrect.')
        return
      }
    } catch {
      setPasswordStatus('error')
      setPasswordError('Impossible de vérifier le mot de passe actuel.')
      return
    }

    // Met à jour le mot de passe
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.errors?.[0]?.message ?? 'Impossible de mettre à jour le mot de passe.')
      }

      setPasswordStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setPasswordStatus('error')
      setPasswordError(err instanceof Error ? err.message : "Une erreur est survenue.")
    }
  }

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== userEmail) {
      setDeleteError('Veuillez saisir exactement votre adresse e-mail pour confirmer.')
      return
    }

    setDeleteStatus('loading')
    setDeleteError('')

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.errors?.[0]?.message ?? 'Impossible de supprimer le compte.')
      }

      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setDeleteStatus('error')
      setDeleteError(err instanceof Error ? err.message : "Une erreur est survenue.")
    }
  }

  return (
    <div className="account-content ss-container">

      {/* ── Informations du compte ── */}
      <section className="account-section">
        <div className="account-card">
          <div className="account-card-header">
            <h2>Informations du compte</h2>
          </div>
          <dl className="account-info-grid">
            <div className="account-info-item">
              <dt className="account-info-label">Adresse e-mail</dt>
              <dd className="account-info-value">{userEmail}</dd>
            </div>
            <div className="account-info-item">
              <dt className="account-info-label">Rôle</dt>
              <dd className="account-info-value">
                <span className={`account-role-badge account-role-${userRole}`}>{roleLabel}</span>
              </dd>
            </div>
            <div className="account-info-item">
              <dt className="account-info-label">Membre depuis</dt>
              <dd className="account-info-value">{memberSince}</dd>
            </div>
          </dl>
          <div className="account-logout-row">
            <button type="button" className="ss-btn ss-btn-ghost" onClick={handleLogout}>
              Se déconnecter
            </button>
          </div>
        </div>
      </section>

      {/* ── Changer l'adresse e-mail ── */}
      <section className="account-section">
        <div className="account-card">
          <div className="account-card-header">
            <h2>Changer l&apos;adresse e-mail</h2>
            <p>Votre nouvelle adresse sera utilisée pour vous connecter.</p>
          </div>
          <form onSubmit={handleEmailChange} className="account-form" noValidate>
            <div className="account-field">
              <label htmlFor="new-email">Nouvelle adresse e-mail</label>
              <input
                id="new-email"
                type="email"
                className="account-input"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailStatus('idle') }}
                placeholder="nouvelle@adresse.fr"
                required
                autoComplete="email"
              />
            </div>
            {emailStatus === 'error' && (
              <p className="account-feedback account-feedback-error" role="alert">{emailError}</p>
            )}
            {emailStatus === 'success' && (
              <p className="account-feedback account-feedback-success" role="status">
                Adresse e-mail mise à jour.
              </p>
            )}
            <button
              type="submit"
              className={`ss-btn ss-btn-primary${emailStatus === 'loading' ? ' ss-btn-disabled' : ''}`}
              disabled={emailStatus === 'loading'}
            >
              {emailStatus === 'loading' ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Changer le mot de passe ── */}
      <section className="account-section">
        <div className="account-card">
          <div className="account-card-header">
            <h2>Changer le mot de passe</h2>
            <p>Choisissez un mot de passe robuste d&apos;au moins 8 caractères.</p>
          </div>
          <form onSubmit={handlePasswordChange} className="account-form" noValidate>
            <div className="account-field">
              <label htmlFor="current-password">Mot de passe actuel</label>
              <input
                id="current-password"
                type="password"
                className="account-input"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordStatus('idle') }}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="account-field">
              <label htmlFor="new-password">Nouveau mot de passe</label>
              <input
                id="new-password"
                type="password"
                className="account-input"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordStatus('idle') }}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="account-field">
              <label htmlFor="confirm-password">Confirmer le nouveau mot de passe</label>
              <input
                id="confirm-password"
                type="password"
                className="account-input"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordStatus('idle') }}
                required
                autoComplete="new-password"
              />
            </div>
            {passwordStatus === 'error' && (
              <p className="account-feedback account-feedback-error" role="alert">{passwordError}</p>
            )}
            {passwordStatus === 'success' && (
              <p className="account-feedback account-feedback-success" role="status">
                Mot de passe mis à jour.
              </p>
            )}
            <button
              type="submit"
              className={`ss-btn ss-btn-primary${passwordStatus === 'loading' ? ' ss-btn-disabled' : ''}`}
              disabled={passwordStatus === 'loading'}
            >
              {passwordStatus === 'loading' ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Zone de danger ── */}
      <section className="account-section">
        <div className="account-card account-danger-card">
          <div className="account-card-header">
            <h2 className="account-danger-title">Zone de danger</h2>
            <p>
              La suppression est <strong>irréversible</strong>. Toutes vos données seront
              définitivement effacées.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="ss-btn account-btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="account-delete-confirm">
              <p className="account-delete-warning">
                Pour confirmer, saisissez votre adresse e-mail :{' '}
                <strong>{userEmail}</strong>
              </p>
              <div className="account-field">
                <label htmlFor="delete-confirm">Adresse e-mail</label>
                <input
                  id="delete-confirm"
                  type="text"
                  className="account-input account-input-danger"
                  value={deleteConfirm}
                  onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError('') }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {deleteError && (
                <p className="account-feedback account-feedback-error" role="alert">{deleteError}</p>
              )}
              <div className="account-delete-actions">
                <button
                  type="button"
                  className="ss-btn ss-btn-ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirm('')
                    setDeleteError('')
                    setDeleteStatus('idle')
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={`ss-btn account-btn-danger${deleteStatus === 'loading' ? ' ss-btn-disabled' : ''}`}
                  onClick={handleDeleteAccount}
                  disabled={deleteStatus === 'loading'}
                >
                  {deleteStatus === 'loading' ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
