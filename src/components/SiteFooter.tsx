import React from 'react'

export function SiteFooter() {
  return (
    <footer className="ss-footer">
      <div className="ss-container">
        <div className="ss-footer-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Space Squad" className="ss-footer-logo-img" />
        </div>
        <nav className="ss-footer-nav" aria-label="Liens du pied de page">
          <a href="/contact">Contact</a>
        </nav>
        <p className="ss-footer-legal">
          © {new Date().getFullYear()} Space Squad — Marque déposée. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
