import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import type { LoreArticle } from '@/payload-types'
import '../lore/lore.css'

const CATEGORIES: { value: LoreArticle['category']; label: string; icon: string }[] = [
  { value: 'chronologies',       label: 'Chronologies',        icon: '📅' },
  { value: 'especes-non-humaines', label: 'Espèces non-humaines', icon: '👽' },
  { value: 'politique',          label: 'Politique',           icon: '⚡' },
  { value: 'technologie',        label: 'Technologie',         icon: '🔬' },
  { value: 'culture',            label: 'Culture',             icon: '🎭' },
  { value: 'stardash',           label: 'Stardash',            icon: '🚀' },
]

export default async function LorePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const where =
    categorie && CATEGORIES.some((c) => c.value === categorie)
      ? {
          and: [
            { _status: { equals: 'published' } },
            { category: { equals: categorie } },
          ],
        }
      : { _status: { equals: 'published' } }

  const { docs: articles } = await payload.find({
    collection: 'lore-articles',
    where,
    sort: 'title',
    limit: 200,
    depth: 0,
  })

  const activeCategory = CATEGORIES.find((c) => c.value === categorie)

  return (
    <div className="ss-root lore-root">
      <SiteHeader activePage="lore" />

      <div className="lore-layout">
        {/* ── En-tête de page ── */}
        <div className="lore-page-header">
          <div className="ss-container">
            <nav className="lore-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Lore</span>
              {activeCategory && (
                <>
                  <span aria-hidden="true">›</span>
                  <span>{activeCategory.label}</span>
                </>
              )}
            </nav>

            <h1 className="lore-page-title">
              {activeCategory ? (
                <>
                  <span className="lore-page-title-icon" aria-hidden="true">
                    {activeCategory.icon}
                  </span>
                  {activeCategory.label}
                </>
              ) : (
                'Encyclopédie'
              )}
            </h1>

            {!activeCategory && (
              <p className="lore-page-desc">
                Explorez l&apos;univers de Space Squad — histoire, espèces, politique,
                technologie et culture.
              </p>
            )}
          </div>
        </div>

        {/* ── Filtre par catégorie ── */}
        <div className="lore-filter-bar">
          <div className="ss-container">
            <div className="lore-filters" role="navigation" aria-label="Filtrer par catégorie">
              <a
                href="/lore"
                className={`lore-filter-btn${!categorie ? ' lore-filter-btn-active' : ''}`}
              >
                Tout
              </a>
              {CATEGORIES.map((cat) => (
                <a
                  key={cat.value}
                  href={`/lore?categorie=${cat.value}`}
                  className={`lore-filter-btn${categorie === cat.value ? ' lore-filter-btn-active' : ''}`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Liste des articles ── */}
        <main className="lore-main">
          <div className="ss-container">
            {articles.length === 0 ? (
              <div className="lore-empty">
                <span aria-hidden="true">📭</span>
                <p>Aucun article disponible dans cette catégorie pour le moment.</p>
                <a href="/lore" className="ss-btn ss-btn-outline">
                  Voir tout le lore
                </a>
              </div>
            ) : (
              <div className="lore-grid">
                {articles.map((article) => {
                  const cat = CATEGORIES.find((c) => c.value === article.category)
                  return (
                    <a
                      key={article.id}
                      href={`/lore/${article.slug ?? article.id}`}
                      className="lore-card"
                    >
                      <div className="lore-card-top">
                        <span className="lore-card-category">
                          <span aria-hidden="true">{cat?.icon}</span>
                          {cat?.label}
                        </span>
                      </div>
                      <h2 className="lore-card-title">{article.title}</h2>
                      {article.excerpt && (
                        <p className="lore-card-excerpt">{article.excerpt}</p>
                      )}
                      <span className="lore-card-cta" aria-hidden="true">
                        Lire l&apos;article →
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}
