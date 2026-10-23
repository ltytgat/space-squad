'use client'

import { useState } from 'react'
import { submitContactMessage } from './actions'

const MAX_SUBJECT_LENGTH = 150
const MAX_GUEST_MESSAGE_LENGTH = 2000
const MAX_USER_MESSAGE_LENGTH = 5000

type Status = 'idle' | 'loading' | 'sent' | 'error'

export function ContactClient({ accountEmail, startedAt }: { accountEmail: string | null; startedAt: number }) {
  const [email, setEmail] = useState(accountEmail ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  // Champ leurre : invisible pour un humain, souvent rempli par les robots.
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const maxMessageLength = accountEmail ? MAX_USER_MESSAGE_LENGTH : MAX_GUEST_MESSAGE_LENGTH

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const result = await submitContactMessage({ email, subject, message, website, startedAt })
      if (result.success) {
        setStatus('sent')
      } else {
        setStatus('error')
        setError(result.error)
      }
    } catch {
      setStatus('error')
      setError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (status === 'sent') {
    return (
      <p className="login-feedback login-feedback-success" role="status">
        Message envoyé. Nous vous répondrons à l’adresse {email}.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label htmlFor="contact-email">Adresse e-mail</label>
        <input
          id="contact-email"
          type="email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!!accountEmail}
          required
          maxLength={254}
          autoComplete="email"
          placeholder="vous@exemple.fr"
        />
        {accountEmail && <p className="contact-hint">Adresse de votre compte, utilisée pour la réponse.</p>}
      </div>
      <div className="login-field">
        <label htmlFor="contact-subject">Sujet</label>
        <input
          id="contact-subject"
          type="text"
          className="login-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={MAX_SUBJECT_LENGTH}
        />
      </div>
      <div className="login-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          className="login-input contact-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={maxMessageLength}
          rows={8}
        />
        <p className="contact-hint contact-counter">{message.length} / {maxMessageLength}</p>
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="contact-website">Ne pas remplir ce champ</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
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
        {status === 'loading' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  )
}
