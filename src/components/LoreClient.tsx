'use client'

import { useState, useMemo } from 'react'
import type { LoreArticle } from '@/payload-types'

export const CATEGORY_META: Record<
  LoreArticle['category'],
  { label: string; icon: string }
> = {
  chronologies:           { label: 'Chronologies',         icon: '📅' },
  'especes-non-humaines': { label: 'Espèces non-humaines', icon: '👽' },
  politique:              { label: 'Politique',            icon: '⚡' },
  technologie:            { label: 'Technologie',          icon: '🔬' },
  chroniques:             { label: 'Chroniques',           icon: '📜' },
  culture:                { label: 'Culture',              icon: '🎭' },
  stardash:               { label: 'Stardash',             icon: '🚀' },
}

export const DEFAULT_CATEGORY = { label: 'Général', icon: '📁' }

const CATEGORY_ORDER: LoreArticle['category'][] = [
  'chronologies',
  'especes-non-humaines',
  'politique',
  'technologie',
  'chroniques',
  'culture',
  'stardash',
]

type ArticlePreview = Pick<LoreArticle, 'id' | 'title' | 'slug' | 'category' | 'excerpt'>

export function LoreClient({
  articles,
  initialCategory,
}: {
  articles: ArticlePreview[]
  initialCategory?: string | null
}) {
  const [category, setCategory] = useState<LoreArticle['category'] | null>(
    (initialCategory as LoreArticle['category']) ?? null,
  )
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return articles.filter((article) => {
      if (category && article.category !== category) return false
      if (q) {
        const inTitle = article.title.toLowerCase().includes(q)
        const inExcerpt = (article.excerpt ?? '').toLowerCase().includes(q)
        if (!inTitle && !inExcerpt) return false
      }
      return true
    })
  }, [articles, category, search])

  return (
    <>
      {/* ── Barre de filtres ── */}
      <div className="lore-filter-bar">
        <div className="ss-container">
          <div className="lore-filters">
            {/* Champ de recherche */}
            <div className="lore-search-wrap">
              <svg
                className="lore-search-icon"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="13"
                height="13"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="lore-search-input"
                aria-label="Rechercher dans le lore"
              />
            </div>

            <span className="lore-filters-sep" aria-hidden="true" />

            {/* Filtres par catégorie */}
            <button
              type="button"
              className={`lore-filter-btn${!category ? ' lore-filter-btn-active' : ''}`}
              onClick={() => setCategory(null)}
            >
              Tout
            </button>

            {CATEGORY_ORDER.map((value) => {
              const cat = CATEGORY_META[value] || DEFAULT_CATEGORY
              const { label, icon } = cat
              return (
                <button
                  key={value}
                  type="button"
                  className={`lore-filter-btn${category === value ? ' lore-filter-btn-active' : ''}`}
                  onClick={() => setCategory(category === value ? null : value)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grille d'articles ── */}
      <main className="lore-main">
        <div className="ss-container">
          {filtered.length === 0 ? (
            <div className="lore-empty">
              <span aria-hidden="true">🔭</span>
              <p>
                {search.trim()
                  ? `Aucun article ne correspond à « ${search.trim()} »${category ? ' dans cette catégorie' : ''}.`
                  : 'Aucun article disponible dans cette catégorie pour le moment.'}
              </p>
              {(search || category) && (
                <button
                  type="button"
                  className="ss-btn ss-btn-outline"
                  onClick={() => {
                    setSearch('')
                    setCategory(null)
                  }}
                >
                  Voir tout le lore
                </button>
              )}
            </div>
          ) : (
            <div className="lore-grid">
              {filtered.map((article) => {
                const cat = CATEGORY_META[article.category] || DEFAULT_CATEGORY
                return (
                  <a
                    key={article.id}
                    href={`/lore/${article.slug ?? article.id}`}
                    className="lore-card"
                  >
                    <div className="lore-card-top">
                      <span className="lore-card-category">
                        <span aria-hidden="true">{cat.icon}</span>
                        {cat.label}
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
    </>
  )
}
