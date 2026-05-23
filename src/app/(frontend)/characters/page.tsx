import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { CharactersClient } from './CharactersClient'
import './characters.css'

export const metadata = {
  title: 'Personnages — Space Squad',
}

export default async function CharactersPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  // Réservé aux admins
  if ((user as { role?: string }).role !== 'admin') redirect('/')

  const [{ docs: characters }, { docs: groups }] = await Promise.all([
    payload.find({
      collection: 'characters',
      depth: 1,
      limit: 500,
      sort: 'nom',
    }),
    payload.find({
      collection: 'groups',
      depth: 0,
      limit: 100,
      sort: 'nom',
    }),
  ])

  return (
    <div className="ss-root chars-root">
      <SiteHeader activePage="characters" />

      <div className="chars-layout">
        {/* ── En-tête ── */}
        <div className="chars-page-header">
          <div className="ss-container">
            <nav className="chars-breadcrumb" aria-label="Fil d'Ariane">
              <a href="/">Accueil</a>
              <span aria-hidden="true">›</span>
              <span>Personnages</span>
            </nav>
            <h1 className="chars-page-title">
              Personnages
              <span className="chars-page-count">{characters.length}</span>
            </h1>
          </div>
        </div>

        {/* ── Liste + filtre (client) ── */}
        <div className="chars-content ss-container">
          <CharactersClient
            characters={characters as Parameters<typeof CharactersClient>[0]['characters']}
            groups={groups as Parameters<typeof CharactersClient>[0]['groups']}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
