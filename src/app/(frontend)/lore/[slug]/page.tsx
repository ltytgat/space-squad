import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LexicalRenderer } from '@/components/LexicalRenderer'
import { LoreToc } from '@/components/LoreToc'
import { extractHeadings } from '@/components/lexical-utils'
import { CATEGORY_META, DEFAULT_CATEGORY } from '@/components/LoreClient'
import type { Media } from '@/payload-types'
import '../lore.css'

export default async function LoreArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'lore-articles',
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
    depth: 1,
    limit: 1,
  })

  const article = docs[0]
  if (!article) return notFound()

  const cat = CATEGORY_META[article.category] || DEFAULT_CATEGORY
  const cover =
    typeof article.cover === 'object' && article.cover !== null
      ? (article.cover as Media)
      : null

  // Extraire les headings côté serveur pour les passer au composant TOC client
  const tocEntries = extractHeadings(article.content.root)

  // Autres articles de la même catégorie (hors article courant)
  const { docs: relatedDocs } = await payload.find({
    collection: 'lore-articles',
    where: {
      and: [
        { category: { equals: article.category } },
        { slug: { not_equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
    depth: 0,
    limit: 8,
    select: { title: true, slug: true },
  })
  const relatedArticles = relatedDocs

  return (
    <div className="ss-root lore-root">
      <SiteHeader activePage="lore" />

      <div className="lore-layout">
        {/* ── En-tête de l'article ── */}
        <div className="lore-article-header">
          <div className="ss-container">
            <nav className="lore-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <a href="/lore">Lore</a>
              <span aria-hidden="true">›</span>
              <a href={`/lore?categorie=${article.category}`}>{cat.label}</a>
              <span aria-hidden="true">›</span>
              <span>{article.title}</span>
            </nav>

            <div className="lore-article-meta">
              <span className="lore-article-category">
                <span aria-hidden="true">{cat.icon}</span>
                {cat.label}
              </span>
              <time className="lore-article-date" dateTime={article.updatedAt}>
                Mis à jour le{' '}
                {new Date(article.updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            <h1 className="lore-article-title">{article.title}</h1>

            {article.excerpt && (
              <p className="lore-article-excerpt">{article.excerpt}</p>
            )}
          </div>

          {cover?.url && (
            <div className="lore-article-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover.url}
                alt={cover.alt ?? article.title}
                className="lore-article-cover-img"
              />
            </div>
          )}
        </div>

        {/* ── Corps de l'article ── */}
        <main className="lore-main">
          <div className="ss-container">
            <div className="lore-article-layout">
              <article className="lore-content">
                <LexicalRenderer content={article.content} />
              </article>

              <aside className="lore-aside">
                {/* Table des matières */}
                {tocEntries.length > 0 && (
                  <LoreToc entries={tocEntries} />
                )}

                {/* Catégorie et articles liés */}
                <div className="lore-aside-card">
                  <h3>Dans la même catégorie</h3>
                  <a
                    href={`/lore?categorie=${article.category}`}
                    className="lore-aside-category"
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.label}
                  </a>

                  {relatedArticles.length > 0 && (
                    <ul className="lore-aside-related">
                      {relatedArticles.map((rel) => (
                        <li key={rel.id}>
                          <a href={`/lore/${rel.slug ?? rel.id}`}>{rel.title}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <a href="/lore" className="lore-aside-back ss-btn ss-btn-outline">
                  ← Retour au lore
                </a>
              </aside>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}
