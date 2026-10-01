import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './home.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  let characterId: string | number | null = null
  if (user) {
    const { docs } = await payload.find({
      collection: 'characters',
      where: { user: { equals: user.id } },
      depth: 0,
      limit: 1,
    })
    if (docs[0]) characterId = docs[0].id
  }

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
            Un univers original de science-fiction dure.
            <br />
            Lore, jeu de rôle, jeux de plateau.
          </p>
          <div className="ss-hero-actions">
            <a href="/lore" className="ss-btn ss-btn-primary ss-btn-lg">
              Découvrir l&apos;univers
            </a>
            <a href="/#jdr" className="ss-btn ss-btn-ghost ss-btn-lg">
              Jeu de Rôle
            </a>
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
                <a href="/lore?categorie=chronologies" className="ss-card-cta">Explorer →</a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">⚡</div>
                <h3>Factions &amp; Politique</h3>
                <p>
                  Les grandes puissances, alliances et conflits qui façonnent
                  le futur de l&apos;humanité.
                </p>
                <a href="/lore?categorie=politique" className="ss-card-cta">Découvrir →</a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🔬</div>
                <h3>Technologie</h3>
                <p>
                  Des technologies ancrées dans la physique et la
                  science contemporaine.
                </p>
                <a href="/lore?categorie=technologie" className="ss-card-cta">Lire →</a>
              </article>
            </div>

            <div className="ss-section-cta">
              <a href="/lore" className="ss-btn ss-btn-outline">
                Toutes les catégories →
              </a>
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
                    : 'Créez et gérez vos personnages directement en ligne. Connexion requise.'}
                </p>
                <a
                  href={user ? (characterId ? `/characters/${characterId}` : '/character') : '/login'}
                  className="ss-btn ss-btn-outline"
                >
                  {user ? 'Accéder à ma fiche' : 'Se connecter'}
                </a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🗺️</div>
                <h3>Scénarios &amp; Campagnes</h3>
                <p>
                  Des aventures prêtes à jouer dans l&apos;univers Space Squad.
                </p>
                <span className="ss-btn ss-btn-outline ss-btn-disabled">
                  Bientôt disponible
                </span>
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
                    <div className="ss-progress-fill" style={{ width: '40%' }} />
                  </div>
                </div>
                <a href="/lore?categorie=stardash" className="ss-card-cta">Contexte univers →</a>
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
