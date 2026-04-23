import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './home.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="ss-root">
      {/* ── Header ── */}
      <header className="ss-header">
        <div className="ss-header-inner">
          <a href="/" className="ss-logo" aria-label="Space Squad — Accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Space Squad" className="ss-logo-img" />
          </a>

          <nav className="ss-nav" aria-label="Navigation principale">
            <a href="#lore" className="ss-nav-link">Lore</a>
            <a href="#jdr" className="ss-nav-link">Jeu de Rôle</a>
            <a href="#jeux" className="ss-nav-link">Jeux de Plateau</a>
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

      {/* ── Hero ── */}
      <section className="ss-hero" aria-label="Présentation">
        <div className="ss-hero-bg" aria-hidden="true" />
        <div className="ss-hero-grid" aria-hidden="true" />

        <div className="ss-hero-content">
          <div className="ss-eyebrow">Univers de Hard-SF</div>
          <img src="/logo.svg" alt="Space Squad"/>
          <p className="ss-hero-sub">
            Un univers original de science-fiction dure.
            <br />
            Lore, jeu de rôle, jeux de plateau.
          </p>
          <div className="ss-hero-actions">
            <a href="#lore" className="ss-btn ss-btn-primary ss-btn-lg">
              Découvrir l&apos;univers
            </a>
            <a href="#jdr" className="ss-btn ss-btn-ghost ss-btn-lg">
              Jeu de Rôle
            </a>
          </div>
        </div>

        <a href="#lore" className="ss-scroll-hint" aria-label="Défiler vers le contenu">
          <span className="ss-scroll-line" aria-hidden="true" />
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      {/* ── Main content ── */}
      <main>
        {/* LORE */}
        <section id="lore" className="ss-section">
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
                <div className="ss-card-icon" aria-hidden="true">🌌</div>
                <h3>L&apos;Univers</h3>
                <p>
                  Cosmographie, systèmes stellaires et corps célestes
                  explorés par l&apos;humanité.
                </p>
                <a href="#" className="ss-card-cta">Explorer →</a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">⚡</div>
                <h3>Factions &amp; Politique</h3>
                <p>
                  Les grandes puissances, alliances et conflits qui façonnent
                  le futur de l&apos;humanité.
                </p>
                <a href="#" className="ss-card-cta">Découvrir →</a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🔬</div>
                <h3>Technologie</h3>
                <p>
                  Des technologies ancrées dans la physique et la
                  science contemporaine.
                </p>
                <a href="#" className="ss-card-cta">Lire →</a>
              </article>
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
                <a href="#" className="ss-btn ss-btn-primary">
                  Accéder au livre →
                </a>
              </article>

              <article className="ss-card">
                <div className="ss-card-icon" aria-hidden="true">🧑‍🚀</div>
                <h3>Fiches de Personnage</h3>
                <p>
                  Créez et gérez vos personnages directement en ligne.
                  Connexion requise.
                </p>
                <a href="/login" className="ss-btn ss-btn-outline">
                  {user ? 'Mes personnages →' : 'Se connecter'}
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
                  <h3>Prototype #1</h3>
                </div>
                <p>
                  Le premier jeu de plateau dans l&apos;univers Space Squad.
                  Mécaniques de gestion et de déplacement spatial.
                </p>
                <div className="ss-progress">
                  <div className="ss-progress-label">
                    <span>Avancement</span>
                    <span>40%</span>
                  </div>
                  <div className="ss-progress-track">
                    <div className="ss-progress-fill" style={{ width: '40%' }} />
                  </div>
                </div>
                <a href="#" className="ss-card-cta">En savoir plus →</a>
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

      {/* ── Footer ── */}
      <footer className="ss-footer">
        <div className="ss-container">
          <div className="ss-footer-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Space Squad" className="ss-footer-logo-img" />
          </div>
          <p className="ss-footer-legal">
            © {new Date().getFullYear()} Space Squad — Marque déposée. Tous droits réservés.
          </p>
          <nav className="ss-footer-nav" aria-label="Liens légaux">
            <a href="#">Mentions légales</a>
            <a href={payloadConfig.routes.admin} target="_blank" rel="noopener noreferrer">
              Administration
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
