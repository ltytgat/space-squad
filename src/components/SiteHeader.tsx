import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { findGroupShipIds } from '@/lib/shipAccess'

import config from '@/payload.config'

type ActivePage =
  | 'lore'
  | 'jdr'
  | 'jeux'
  | 'character'
  | 'ship'
  | 'characters'
  | 'ships'
  | 'shop'
  | undefined

export async function SiteHeader({ activePage }: { activePage?: ActivePage }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const isAdmin = user && (user as { role?: string }).role === 'admin'

  let character: any = null
  let characterId: string | number | null = null
  let ships: { id: number; nom: string }[] = []
  if (user && !isAdmin) {
    const { docs } = await payload.find({
      collection: 'characters',
      where: { user: { equals: user.id } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    character = docs[0] ?? null
    if (character) {
      characterId = character.id
      const shipIds = new Set(await findGroupShipIds(payload, character))
      const { docs: ownedShips } = await payload.find({
        collection: 'ships',
        where: { proprietaire: { equals: character.id } },
        depth: 0,
        limit: 200,
        select: { nom: true },
        overrideAccess: true,
      })
      for (const ship of ownedShips) shipIds.add(Number(ship.id))
      if (shipIds.size) {
        const result = await payload.find({
          collection: 'ships',
          where: { id: { in: [...shipIds] } },
          depth: 0,
          limit: 200,
          sort: 'nom',
          select: { nom: true },
          overrideAccess: true,
        })
        ships = result.docs.map((ship) => ({ id: Number(ship.id), nom: ship.nom ?? `Vaisseau ${ship.id}` }))
      }
    }
  }

  return (
    <header className="ss-header">
      <div className="ss-header-inner">
        <Link href="/" className="ss-logo" aria-label="Space Squad — Accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Space Squad" className="ss-logo-img" />
        </Link>

        <nav className="ss-nav" aria-label="Navigation principale">
          <Link
            href="/lore"
            className={`ss-nav-link${activePage === 'lore' ? ' ss-nav-link-active' : ''}`}
          >
            Lore
          </Link>
          <Link
            href="/#jdr"
            className={`ss-nav-link${activePage === 'jdr' ? ' ss-nav-link-active' : ''}`}
          >
            Jeu de Rôle
          </Link>
          <Link
            href="/#jeux"
            className={`ss-nav-link${activePage === 'jeux' ? ' ss-nav-link-active' : ''}`}
          >
            Jeux de Plateau
          </Link>

          {/* ── Liens conditionnels selon rôle ── */}
          {user && isAdmin && (
            <>
              <Link
                href="/characters"
                className={`ss-nav-link${activePage === 'characters' ? ' ss-nav-link-active' : ''}`}
              >
                Personnages
              </Link>
              <Link
                href="/ships"
                className={`ss-nav-link${activePage === 'ships' ? ' ss-nav-link-active' : ''}`}
              >
                Vaisseaux
              </Link>
            </>
          )}
          {user && !isAdmin && (
            <>
              <Link
                href={characterId ? `/characters/${characterId}` : '/character'}
                className={`ss-nav-link${activePage === 'character' ? ' ss-nav-link-active' : ''}`}
              >
                Mon personnage
              </Link>
              {ships.length > 1 ? (
                <details className="ss-nav-ships">
                  <summary className={`ss-nav-link${activePage === 'ship' ? ' ss-nav-link-active' : ''}`}>
                    Mes vaisseaux
                  </summary>
                  <div className="ss-nav-ship-menu">
                    {ships.map((ship) => (
                      <Link key={ship.id} href={`/ship/${ship.id}`} className="ss-nav-ship-option">
                        {ship.nom}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  href={ships[0] ? `/ship/${ships[0].id}` : '/ship'}
                  className={`ss-nav-link${activePage === 'ship' ? ' ss-nav-link-active' : ''}`}
                >
                  Mes vaisseaux
                </Link>
              )}
            </>
          )}
          {user && characterId && (
            <Link href="/shop" className={`ss-nav-link${activePage === 'shop' ? ' ss-nav-link-active' : ''}`}>
              Boutique
            </Link>
          )}
        </nav>

        <div className="ss-header-cta">
          {user ? (
            <Link href="/account" className="ss-btn ss-btn-primary">
              Mon compte
            </Link>
          ) : (
            <Link href="/login" className="ss-btn ss-btn-primary">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
