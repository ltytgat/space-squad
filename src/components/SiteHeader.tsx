import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

type ActivePage =
  | 'lore'
  | 'jdr'
  | 'jeux'
  | 'character'
  | 'ship'
  | 'characters'
  | 'ships'
  | undefined

export async function SiteHeader({ activePage }: { activePage?: ActivePage }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const isAdmin = user && (user as { role?: string }).role === 'admin'

  let characterId: string | number | null = null
  if (user && !isAdmin) {
    const { docs } = await payload.find({
      collection: 'characters',
      where: { user: { equals: user.id } },
      depth: 0,
      limit: 1,
    })
    if (docs[0]) characterId = docs[0].id
  }

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

          {/* ── Liens conditionnels selon rôle ── */}
          {user && isAdmin && (
            <>
              <a
                href="/characters"
                className={`ss-nav-link${activePage === 'characters' ? ' ss-nav-link-active' : ''}`}
              >
                Personnages
              </a>
              <a
                href="/ships"
                className={`ss-nav-link${activePage === 'ships' ? ' ss-nav-link-active' : ''}`}
              >
                Vaisseaux
              </a>
            </>
          )}
          {user && !isAdmin && (
            <>
              <a
                href={characterId ? `/characters/${characterId}` : '/character'}
                className={`ss-nav-link${activePage === 'character' ? ' ss-nav-link-active' : ''}`}
              >
                Mon personnage
              </a>
              <a
                href="/ship"
                className={`ss-nav-link${activePage === 'ship' ? ' ss-nav-link-active' : ''}`}
              >
                Mon vaisseau
              </a>
            </>
          )}
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
