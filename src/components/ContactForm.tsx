'use client'

import React, { useState } from 'react'
import { sendContactEmail } from '@/lib/actions'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const result = await sendContactEmail(formData)

    setIsSubmitting(false)
    if (result.success) {
      setMessage({ type: 'success', text: result.success })
      ;(event.target as HTMLFormElement).reset()
    } else if (result.error) {
      setMessage({ type: 'error', text: result.error })
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-group">
        <label htmlFor="name">Nom</label>
        <input type="text" id="name" name="name" required placeholder="Votre nom" />
      </div>

      <div className="contact-form-group">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="votre@email.com" />
      </div>

      <div className="contact-form-group">
        <label htmlFor="subject">Sujet</label>
        <input type="text" id="subject" name="subject" required placeholder="Sujet de votre message" />
      </div>

      <div className="contact-form-group">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required rows={6} placeholder="Votre message..."></textarea>
      </div>

      <button type="submit" className="ss-btn ss-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
      </button>

      {message && (
        <div className={`contact-form-message contact-form-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </form>
  )
}
