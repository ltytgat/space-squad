import { getPayload } from 'payload'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { LoreClient } from '@/components/LoreClient'
import './lore.css'

export default async function LorePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: articles } = await payload.find({
    collection: 'lore-articles',
    where: { _status: { equals: 'published' } },
    sort: 'title',
    limit: 500,
    depth: 0,
  })

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
            </nav>

            <h1 className="lore-page-title">
              <span className="lore-page-title-icon" aria-hidden="true">📖</span>
              Encyclopédie
            </h1>
            <p className="lore-page-desc">
              Explorez l&apos;univers de Space Squad — histoire, espèces, politique, technologie et
              culture.
            </p>
          </div>
        </div>

        {/* ── Filtres + grille (client) ── */}
        <LoreClient articles={articles} initialCategory={categorie ?? null} />
      </div>

      <SiteFooter />
    </div>
  )
}
