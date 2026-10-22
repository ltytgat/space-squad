import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import { startTemporaryCharacterWorkspace } from './temporary-character/actions'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getActiveCharacter } from '@/lib/activeCharacter'
import './home.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const activeCharacter = user ? await getActiveCharacter(payload, user) : null
  const characterId: string | number | null = activeCharacter?.id ?? null

  return (
    <div className="ss-root">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="ss-hero" aria-label="Présentation">
        <div className="ss-hero-bg" aria-hidden="true" />
        <div className="ss-hero-grid" aria-hidden="true" />

        <div className="ss-hero-content">
          <div className="ss-eyebrow">Univers de Hard-SF</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Space Squad" className="ss-hero-logo" />
          <p className="ss-hero-sub">
            Un univers original de Hard-SF.
            <br />
            Lore, jeu de rôle, jeux de plateau.
          </p>
          <div className="ss-hero-actions">
            <Link href="/lore/chronologie-humaine" className="ss-btn ss-btn-primary ss-btn-lg">
              Découvrir l&apos;univers
            </Link>
            <Link href="/#jdr" className="ss-btn ss-btn-ghost ss-btn-lg">
              Jeu de Rôle
            </Link>
          </div>
        </div>

        <a href="#lore-teaser" className="ss-scroll-hint" aria-label="Défiler vers le contenu">
          <span className="ss-scroll-line" aria-hidden="true" />
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      {/* ── Main content ── */}
      <main>
        {/* LORE */}
        <section id="lore-teaser" className="ss-section">
          <div className="ss-container">
            <div className="ss-section-head">
              <span className="ss-tag">Explorer</span>
              <h2>Le Lore</h2>
              <p>
                Plongez dans un univers de science-fiction rigoureusement construit
                autour des lois de la physique. Découvrez les factions,
                les technologies et les mondes de Space Squad.
              </p>
            </div>

            <div className="ss-grid-3">
              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">📅</div>
                <h3>Chronologies</h3>
                <p>
                  Le point d&apos;entrée pour les nouveaux lecteurs.
                  L&apos;histoire de l&apos;univers Space Squad de ses origines à aujourd&apos;hui.
                </p>
                <Link href="/lore?categorie=chronologies" className="ss-card-cta">Explorer →</Link>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">⚡</div>
                <h3>Factions &amp; Politique</h3>
                <p>
                  Les grandes puissances, alliances et conflits qui façonnent
                  le futur de l&apos;humanité.
                </p>
                <Link href="/lore?categorie=politique" className="ss-card-cta">Découvrir →</Link>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🔬</div>
                <h3>Technologie</h3>
                <p>
                  Des technologies ancrées dans la physique et la
                  science contemporaine.
                </p>
                <Link href="/lore?categorie=technologie" className="ss-card-cta">Lire →</Link>
              </article>
            </div>

            <div className="ss-section-cta">
              <Link href="/lore" className="ss-btn ss-btn-outline">
                Toutes les catégories →
              </Link>
            </div>
          </div>
        </section>

        {/* JDR */}
        <section id="jdr" className="ss-section ss-section-alt">
          <div className="ss-container">
            <div className="ss-section-head">
              <span className="ss-tag">Jouer</span>
              <h2>Jeu de Rôle</h2>
              <p>
                Incarnez vos personnages dans l&apos;univers Space Squad.
                Retrouvez les règles, les campagnes et gérez vos fiches de
                personnage directement en ligne.
              </p>
            </div>

            <div className="ss-grid-jdr">
              <article className="ss-card ss-card-featured">
                <div className="ss-card-icon" aria-hidden="true">📖</div>
                <h3>Livre de Règles</h3>
                <p>
                  Le système de jeu complet, adapté à l&apos;univers Hard-SF
                  de Space Squad.
                </p>
                <a href="/docs/R%C3%A8gles.pdf" target="_blank" rel="noreferrer" className="ss-btn ss-btn-primary">
                  Lire le livre (PDF) →
                </a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🧑‍🚀</div>
                <h3>Fiches de Personnage</h3>
                <p>
                  {user
                    ? 'Consultez et gérez votre fiche de personnage directement en ligne.'
                    : 'Créez une fiche temporaire sans compte et reprenez-la depuis ce navigateur pendant 24 heures d’inactivité.'}
                </p>
                {user ? (
                  <Link href={characterId ? `/characters/${characterId}` : '/character'} className="ss-btn ss-btn-outline">
                    Accéder à ma fiche
                  </Link>
                ) : (
                  <>
                    <form action={startTemporaryCharacterWorkspace}>
                      <button type="submit" className="ss-btn ss-btn-outline">Créer ma fiche temporaire</button>
                    </form>
                    <a href="/docs/Fiche_de_Personnage.ods" download="Fiche_de_Personnage.ods" className="ss-card-cta">
                      Télécharger la fiche originale (.ods)
                    </a>
                  </>
                )}
              </article>

            </div>

            <div className="ss-section-cta">
              <a href="/docs/Tableaux.zip" download="Tableaux.zip" className="ss-btn ss-btn-outline">
                Télécharger les documents complémentaires (.zip)
              </a>
            </div>
          </div>
        </section>

        {/* JEUX DE PLATEAU */}
        <section id="jeux" className="ss-section">
          <div className="ss-container">
            <div className="ss-section-head">
              <span className="ss-tag">Prototypes</span>
              <h2>Jeux de Plateau</h2>
              <p>
                Des jeux de plateau en cours de développement dans l&apos;univers
                Space Squad. Suivez l&apos;avancement des prototypes et
                participez aux playtests.
              </p>
            </div>

            <div className="ss-grid-proto">
              <article className="ss-proto-card">
                <div className="ss-proto-head">
                  <span className="ss-status ss-status-wip">En développement</span>
                  <h3>Stardash</h3>
                </div>
                <p>
                  Le premier jeu de plateau dans l&apos;univers Space Squad.
                  Mécaniques de gestion et de déplacement spatial.
                </p>
                <div className="ss-progress">
                  <div className="ss-progress-label">
                    <span>Avancement</span>
                    <span>99%</span>
                  </div>
                  <div className="ss-progress-track">
                    <div className="ss-progress-fill" style={{ width: '99%' }} />
                  </div>
                </div>
                <Link href="/lore?categorie=stardash" className="ss-card-cta">Contexte univers →</Link>
              </article>

              <div className="ss-proto-card ss-proto-coming">
                <span className="ss-plus" aria-hidden="true">+</span>
                <p>Prochain prototype</p>
                <span className="ss-coming-label">À venir</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
