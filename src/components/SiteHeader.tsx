import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { findGroupShipIds } from '@/lib/shipAccess'
import { getActiveMode } from '@/lib/activeMode'
import { getActiveCharacter } from '@/lib/activeCharacter'
import { RoleModeSwitch } from '@/components/RoleModeSwitch'

import config from '@/payload.config'

type ActivePage =
  | 'lore'
  | 'jdr'
  | 'jeux'
  | 'character'
  | 'myCharacters'
  | 'ship'
  | 'characters'
  | 'ships'
  | 'vehicles'
  | 'shop'
  | 'squad'
  | undefined

export async function SiteHeader({ activePage }: { activePage?: ActivePage }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const isAdmin = user && (user as { role?: string }).role === 'admin'
  const activeMode = user ? await getActiveMode(user) : 'player'
  const isAdminView = Boolean(isAdmin || activeMode === 'mj')
  const canSwitchMode = Boolean(user && user.role === 'player' && (user as any).isMJ === true)

  let character: any = null
  let characterId: string | number | null = null
  let ships: { id: number; nom: string }[] = []
  if (user && !isAdminView) {
    character = await getActiveCharacter(payload, user)
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
          {/* ── Liens conditionnels selon rôle ── */}
          {user && isAdminView && (
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
              <Link
                href="/vehicles"
                className={`ss-nav-link${activePage === 'vehicles' ? ' ss-nav-link-active' : ''}`}
              >
                Véhicules
              </Link>
            </>
          )}
          {user && !isAdminView && (
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
              <Link href="/vehicles" className={`ss-nav-link${activePage === 'vehicles' ? ' ss-nav-link-active' : ''}`}>
                Véhicules
              </Link>
            </>
          )}
          {user && !isAdmin && (
            <Link href="/escouade" className={`ss-nav-link${activePage === 'squad' ? ' ss-nav-link-active' : ''}`}>
              {activeMode === 'mj' ? 'Mes escouades' : 'Mon escouade'}
            </Link>
          )}
          {user && characterId && (
            <Link href="/shop" className={`ss-nav-link${activePage === 'shop' ? ' ss-nav-link-active' : ''}`}>
              Boutique
            </Link>
          )}
          {user && (
            <Link href="/mes-personnages" className={`ss-nav-link${activePage === 'myCharacters' ? ' ss-nav-link-active' : ''}`}>
              Mes personnages
            </Link>
          )}
        </nav>

        <div className="ss-header-cta">
          {user ? (
            <>
              {canSwitchMode && <RoleModeSwitch activeMode={activeMode === 'mj' ? 'mj' : 'player'} />}
              <Link href="/account" className="ss-btn ss-btn-primary">Mon compte</Link>
            </>
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
