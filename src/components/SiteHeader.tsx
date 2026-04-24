import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

type ActivePage = 'lore' | 'jdr' | 'jeux' | undefined

export async function SiteHeader({ activePage }: { activePage?: ActivePage }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <header className="ss-header">
      <div className="ss-header-inner">
        <a href="/" className="ss-logo" aria-label="Space Squad — Accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Space Squad" className="ss-logo-img" />
        </a>

        <nav className="ss-nav" aria-label="Navigation principale">
          <a
            href="/lore"
            className={`ss-nav-link${activePage === 'lore' ? ' ss-nav-link-active' : ''}`}
          >
            Lore
          </a>
          <a
            href="/#jdr"
            className={`ss-nav-link${activePage === 'jdr' ? ' ss-nav-link-active' : ''}`}
          >
            Jeu de Rôle
          </a>
          <a
            href="/#jeux"
            className={`ss-nav-link${activePage === 'jeux' ? ' ss-nav-link-active' : ''}`}
          >
            Jeux de Plateau
          </a>
        </nav>

        <div className="ss-header-cta">
          {user ? (
            <a href="/account" className="ss-btn ss-btn-primary">
              Mon compte
            </a>
          ) : (
            <a href="/login" className="ss-btn ss-btn-primary">
              Connexion
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
