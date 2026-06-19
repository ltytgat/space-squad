import React from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactForm } from '@/components/ContactForm'
import './contact.css'

export const metadata = {
  title: 'Contact — Space Squad',
  description: 'Contactez l\'équipe de Space Squad pour toute question ou suggestion.',
}

export default function ContactPage() {
  return (
    <div className="ss-root contact-root">
      <SiteHeader />

      <div className="contact-layout">
        <div className="contact-page-header">
          <div className="ss-container">
            <nav className="contact-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Contact</span>
            </nav>

            <h1 className="contact-page-title">
              <span className="contact-page-title-icon" aria-hidden="true">✉️</span>
              Contact
            </h1>
            <p className="contact-page-desc">
              Une question sur l&apos;univers, le jeu de rôle ou un problème technique ?
              Envoyez-nous un message et nous vous répondrons dès que possible.
            </p>
          </div>
        </div>

        <div className="contact-content ss-container">
          <ContactForm />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
